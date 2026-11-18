'use server'

import { and, count, eq, sql } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { after } from 'next/server' // ← NUEVO
import { db } from '@/db'
import { colonias, pedidoEventos, pedidoItems, pedidos, user, zonasEnvio } from '@/db/schema'
import { instanteAcapulco, restarMinutos } from '@/lib/fechas'
import { obtenerSesion } from '@/lib/permisos'
import { validarCheckout } from '@/lib/validaciones/checkout'
import { leerJson } from '@/lib/validaciones/calendario'
import { cotizarCarrito } from '@/server/acciones/carrito'
import { pedidoOcupaCupo } from '@/server/calendario'
import { obtenerAjustes } from '@/server/consultas/ajustes'
import { ErrorExistencias, descontarExistencias } from '@/server/existencias'
import { notificarPedidoCreado } from '@/server/notificaciones' // ← NUEVO
import { vencerPedidosExpirados } from '@/server/vencimientos'
import { legalesPublicadas } from '@/server/consultas/legales'

export type ResultadoPedido =
  | { ok: true; token: string }
  | { ok: false; mensaje: string; errores?: Record<string, string[] | undefined>; volverAlCarrito?: boolean; requiereCuenta?: boolean }

class ErrorCupoLleno extends Error { }

export async function crearPedido(formData: FormData): Promise<ResultadoPedido> {
  const sesion = await obtenerSesion()
  if (!sesion) return { ok: false, mensaje: 'Inicia sesión para hacer tu pedido.', requiereCuenta: true }

  const ajustes = await obtenerAjustes()
  if (!ajustes.transferenciaActiva) {
    return { ok: false, mensaje: 'Por el momento no estamos recibiendo pedidos en línea. Escríbenos por WhatsApp.' }
  }

  const validacion = validarCheckout(Object.fromEntries(formData))
  if (!validacion.ok) return { ok: false, mensaje: 'Revisa los campos marcados', errores: validacion.errores }
  const datos = validacion.datos

  const legales = await legalesPublicadas()
  if (legales.length > 0 && !datos.aceptaLegales) {
    return { ok: false, mensaje: 'Para continuar, acepta los términos.', errores: { aceptaLegales: ['Obligatorio'] } }
  }
  const version = (slug: string) => legales.find((l) => l.slug === slug)?.version ?? null

  await vencerPedidosExpirados()

  let cotizacion
  try {
    cotizacion = await cotizarCarrito(leerJson(formData.get('carrito')))
  } catch {
    return { ok: false, mensaje: 'Tu carrito no es válido. Revísalo de nuevo.', volverAlCarrito: true }
  }

  if (!cotizacion.listo || !cotizacion.dia || !cotizacion.bloqueElegido) {
    return {
      ok: false,
      mensaje: 'Algo cambió en tu carrito (precio, disponibilidad u horario). Revísalo antes de continuar.',
      volverAlCarrito: true,
    }
  }

  const [colonia] = await db
    .select({ nombre: colonias.nombre, cp: colonias.cp, zona: zonasEnvio.nombre, costo: zonasEnvio.costoCentavos, activa: zonasEnvio.activa })
    .from(colonias)
    .leftJoin(zonasEnvio, eq(colonias.zonaId, zonasEnvio.id))
    .where(eq(colonias.id, datos.coloniaId))
    .limit(1)

  if (!colonia || !colonia.activa || colonia.costo == null || !colonia.zona) {
    return { ok: false, mensaje: 'Por el momento no tenemos entregas en esa colonia.', errores: { coloniaId: ['Sin cobertura'] } }
  }

  const fecha = cotizacion.dia.fecha
  const bloque = cotizacion.bloqueElegido
  const subtotal = cotizacion.total
  const envio = colonia.costo

  const cierreBloque = Date.parse(instanteAcapulco(fecha, restarMinutos(bloque.inicio, bloque.minutosCierre)))
  const pagoVenceEn = new Date(Math.min(Date.now() + ajustes.plazoPagoMinutos * 60_000, cierreBloque))

  try {
    // ← NUEVO: ahora también sale el "id"
    const { id, token, descontoExistencias } = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`${fecha}|${bloque.clave}`}))`)

      const [{ ocupados }] = await tx
        .select({ ocupados: count() })
        .from(pedidos)
        .where(and(eq(pedidos.fechaEntrega, fecha), eq(pedidos.bloqueInicio, bloque.inicio), eq(pedidos.bloqueFin, bloque.fin), pedidoOcupaCupo))
      if (ocupados >= bloque.capacidad) throw new ErrorCupoLleno()

      const descontoExistencias = await descontarExistencias(
        tx,
        cotizacion.lineas.map((l) => ({ productoId: l.productoId, cantidad: l.cantidad })),
      )

      const [pedido] = await tx
        .insert(pedidos)
        .values({
          usuarioId: sesion.user.id,
          compradorNombre: sesion.user.name,
          compradorTelefono: datos.compradorTelefono,
          compradorEmail: sesion.user.email,
          tipoEntrega: 'envio',
          fechaEntrega: fecha,
          bloqueInicio: bloque.inicio,
          bloqueFin: bloque.fin,
          destinatarioNombre: datos.destinatarioNombre,
          destinatarioTelefono: datos.destinatarioTelefono,
          coloniaId: datos.coloniaId,
          coloniaNombre: colonia.nombre,
          cp: colonia.cp,
          zonaNombre: colonia.zona,
          calle: datos.calle,
          referencias: datos.referencias,
          entregaLatitud: datos.entregaLatitud,
          entregaLongitud: datos.entregaLongitud,
          tipoLugar: datos.tipoLugar,
          nombreLugar: datos.nombreLugar,
          detalleLugar: datos.detalleLugar,
          relacionLugar: datos.relacionLugar,
          paraTarjeta: datos.paraTarjeta,
          mensajeTarjeta: datos.mensajeTarjeta,
          firmaTarjeta: datos.firmaTarjeta,
          anonimo: datos.anonimo,
          tarjetaEnBlanco: datos.tarjetaEnBlanco,
          notas: datos.notas,
          subtotalCentavos: subtotal,
          envioCentavos: envio,
          totalCentavos: subtotal + envio,
          metodoPago: 'transferencia',
          pagoVenceEn,
          versionPrivacidad: version('aviso-de-privacidad'),
          versionTerminos: version('terminos'),
          versionCancelaciones: version('cancelaciones'),
          legalesAceptadosEn: legales.length > 0 ? new Date() : null,
        })
        .returning({ id: pedidos.id, token: pedidos.token })

      await tx.insert(pedidoItems).values(
        cotizacion.lineas.map((l) => ({
          pedidoId: pedido.id,
          productoId: l.productoId,
          nombre: l.nombre ?? 'Producto',
          imagen: l.imagen,
          cantidad: l.cantidad,
          precioUnitarioCentavos: l.precioUnitario,
          subtotalCentavos: l.subtotal,
          enOferta: l.enOferta,
          deTemporada: l.deTemporada,
        })),
      )

      await tx.insert(pedidoEventos).values({ pedidoId: pedido.id, tipo: 'creado', a: 'nuevo', usuarioId: sesion.user.id })
      await tx.update(user).set({ telefono: datos.compradorTelefono }).where(eq(user.id, sesion.user.id))

      return { id: pedido.id, token: pedido.token, descontoExistencias } // ← NUEVO: se agrega id
    })

    updateTag('pedidos')
    if (descontoExistencias) updateTag('productos')
    after(() => notificarPedidoCreado(id)) // ← NUEVO: correo al cliente y a la florería
    return { ok: true, token }
  } catch (error) {
    if (error instanceof ErrorCupoLleno) {
      return {
        ok: false,
        mensaje: 'Se acaba de llenar el horario que elegiste. Por favor elige otra franja o fecha.',
        errores: { fecha: ['Horario lleno'] },
      }
    }
    if (error instanceof ErrorExistencias) {
      return { ok: false, mensaje: `Ya no hay existencias suficientes de “${error.message}”.`, volverAlCarrito: true }
    }
    throw error
  }
}