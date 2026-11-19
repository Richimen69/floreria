import 'server-only'
import { asc, eq, and, count } from 'drizzle-orm'
import { db } from '@/db'
import { pedidoItems, pedidos, pedidoEventos } from '@/db/schema'
import { enviarCorreo } from '@/lib/correo'
import {
  avisoFloreria,
  comprobanteRecibido,
  pagoConfirmado,
  pedidoCancelado,
  pedidoRecibido,
  pedidoEnCamino,
  pedidoEntregado,
  pedidoRecibidoMercadoPago,
  type Marca,
  type PedidoCorreo,
} from '@/lib/correos/plantillas'
import { fechaLarga } from '@/lib/fechas'
import { obtenerAjustes } from '@/server/consultas/ajustes'

const SITIO = process.env.SITIO_URL ?? 'http://localhost:3000'
const ADMIN = process.env.ADMIN_URL ?? `${SITIO}/admin`

async function cargar(id: number) {
  const [[p], items, a] = await Promise.all([
    db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1),
    db.select({ nombre: pedidoItems.nombre, cantidad: pedidoItems.cantidad }).from(pedidoItems).where(eq(pedidoItems.pedidoId, id)).orderBy(asc(pedidoItems.id)),
    obtenerAjustes(),
  ])
  if (!p) return null

  const marca: Marca = { nombre: a.nombre, logoUrl: a.logoUrl, color: a.colorPrimario, sitioUrl: SITIO }
  const pedido: PedidoCorreo = {
    folio: p.folio,
    token: p.token,
    compradorNombre: p.compradorNombre,
    totalCentavos: p.totalCentavos,
    fechaTexto: fechaLarga(p.fechaEntrega),
    bloque: `${p.bloqueInicio} a ${p.bloqueFin}`,
    destinatarioNombre: p.destinatarioNombre,
    direccion: [p.calle, p.coloniaNombre].filter(Boolean).join(', '),
    productos: items,
  }
  return { p, a, marca, pedido }
}

export async function notificarPedidoCreado(id: number) {
  const d = await cargar(id)
  if (!d) return
  const { p, a, marca, pedido } = d

  const horaLimite = p.pagoVenceEn
    ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' }).format(p.pagoVenceEn)
    : ''

  if (p.compradorEmail) {
    if (p.metodoPago === 'mercadopago') {
      await enviarCorreo({ para: p.compradorEmail, responderA: a.email, ...pedidoRecibidoMercadoPago(marca, pedido, horaLimite) })
    } else if (a.clabe) {
      await enviarCorreo({
        para: p.compradorEmail,
        responderA: a.email,
        ...pedidoRecibido(marca, pedido, { banco: a.banco ?? '', titular: a.titularCuenta ?? '', clabe: a.clabe, horaLimite }),
      })
    }
  }
  if (a.correoAvisos) {
    await enviarCorreo({ para: a.correoAvisos, ...avisoFloreria(marca, 'Nuevo pedido', pedido, `${ADMIN}/pedidos/${id}`) })
  }
}

export async function notificarComprobanteSubido(id: number) {
  const d = await cargar(id)
  if (!d) return
  const { p, a, marca, pedido } = d

  if (p.compradorEmail) await enviarCorreo({ para: p.compradorEmail, responderA: a.email, ...comprobanteRecibido(marca, pedido) })
  if (a.correoAvisos) {
    await enviarCorreo({ para: a.correoAvisos, ...avisoFloreria(marca, 'Comprobante por revisar', pedido, `${ADMIN}/pedidos/${id}`) })
  }
}

export async function notificarPagoConfirmado(id: number) {
  const d = await cargar(id)
  if (!d?.p.compradorEmail) return
  await enviarCorreo({ para: d.p.compradorEmail, responderA: d.a.email, ...pagoConfirmado(d.marca, d.pedido) })
}

export async function notificarCancelacion(id: number, motivo: 'rechazado' | 'vencido' | 'cancelado', detalle: string | null = null) {
  const d = await cargar(id)
  if (!d?.p.compradorEmail) return
  await enviarCorreo({
    para: d.p.compradorEmail,
    responderA: d.a.email,
    ...pedidoCancelado(d.marca, d.pedido, motivo, detalle ?? d.p.motivoRechazo),
  })
}

async function primeraVezEn(id: number, estado: string) {
  const [{ veces }] = await db
    .select({ veces: count() })
    .from(pedidoEventos)
    .where(and(eq(pedidoEventos.pedidoId, id), eq(pedidoEventos.tipo, 'trabajo'), eq(pedidoEventos.a, estado)))
  return veces === 1
}

export async function notificarAvanceTrabajo(id: number, estado: 'en_camino' | 'entregado') {
  if (!(await primeraVezEn(id, estado))) return

  const d = await cargar(id)
  if (!d?.p.compradorEmail) return

  const correo = estado === 'en_camino' ? pedidoEnCamino(d.marca, d.pedido) : pedidoEntregado(d.marca, d.pedido)
  await enviarCorreo({ para: d.p.compradorEmail, responderA: d.a.email, ...correo })
}

export async function avisarFloreria(id: number, titulo: string) {
  const d = await cargar(id)
  if (!d?.a.correoAvisos) return
  await enviarCorreo({ para: d.a.correoAvisos, ...avisoFloreria(d.marca, titulo, d.pedido, `${ADMIN}/pedidos/${id}`) })
}