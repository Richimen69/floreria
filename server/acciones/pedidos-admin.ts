'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { after } from 'next/server'
import { db } from '@/db'
import { pedidoEventos, pedidos } from '@/db/schema'
import { ESTADOS_PAGO, ESTADOS_TRABAJO, revisarCambio, revisarCancelacion } from '@/lib/pedidos'
import { requireAdmin } from '@/lib/permisos'
import { devolverExistencias } from '@/server/existencias'
import { notificarAvanceTrabajo, notificarCancelacion, notificarPagoConfirmado } from '@/server/notificaciones'

type Resultado = { ok: boolean; mensaje: string }

export async function cambiarEstado(id: number, tipo: 'pago' | 'trabajo', destino: string): Promise<Resultado> {
  const sesion = await requireAdmin()
  const validos = tipo === 'pago' ? ESTADOS_PAGO : ESTADOS_TRABAJO
  if (!Number.isInteger(id) || !(destino in validos)) return { ok: false, mensaje: 'Estado no válido' }
  if (tipo === 'pago' && destino === 'rechazado') return { ok: false, mensaje: 'Usa “Rechazar comprobante”' }

  const resultado = await db.transaction(async (tx): Promise<Resultado> => {
    const [p] = await tx
      .select({ estadoPago: pedidos.estadoPago, estadoTrabajo: pedidos.estadoTrabajo })
      .from(pedidos)
      .where(eq(pedidos.id, id))
      .for('update')
    if (!p) return { ok: false, mensaje: 'El pedido no existe' }

    const motivo = revisarCambio(p, tipo, destino)
    if (motivo) return { ok: false, mensaje: motivo }

    await tx
      .update(pedidos)
      .set(tipo === 'pago' ? { estadoPago: destino as never } : { estadoTrabajo: destino as never })
      .where(eq(pedidos.id, id))

    await tx.insert(pedidoEventos).values({
      pedidoId: id,
      tipo,
      de: tipo === 'pago' ? p.estadoPago : p.estadoTrabajo,
      a: destino,
      usuarioId: sesion.user.id,
    })

    return { ok: true, mensaje: 'Estado actualizado' }
  })

  if (resultado.ok) {
    updateTag('pedidos')
    if (tipo === 'pago' && destino === 'pagado') after(() => notificarPagoConfirmado(id))
    if (tipo === 'trabajo' && (destino === 'en_camino' || destino === 'entregado')) {
      after(() => notificarAvanceTrabajo(id, destino))
    }
  }
  return resultado
}

export async function cancelarPedido(id: number, motivo: string): Promise<Resultado> {
  const sesion = await requireAdmin()
  const nota = String(motivo ?? '').trim().slice(0, 300)
  if (!Number.isInteger(id)) return { ok: false, mensaje: 'Pedido no válido' }
  if (nota.length < 3) return { ok: false, mensaje: 'Escribe el motivo de la cancelación' }

  const resultado = await db.transaction(async (tx): Promise<Resultado> => {
    const [p] = await tx
      .select({ estadoPago: pedidos.estadoPago, estadoTrabajo: pedidos.estadoTrabajo })
      .from(pedidos)
      .where(eq(pedidos.id, id))
      .for('update')
    if (!p) return { ok: false, mensaje: 'El pedido no existe' }

    const impedimento = revisarCancelacion(p)
    if (impedimento) return { ok: false, mensaje: impedimento }

    const nuevoPago = p.estadoPago === 'pagado' ? 'pagado' : 'cancelado'

    await tx.update(pedidos).set({ estadoTrabajo: 'cancelado', estadoPago: nuevoPago }).where(eq(pedidos.id, id))
    await tx.insert(pedidoEventos).values({
      pedidoId: id,
      tipo: 'cancelado',
      de: p.estadoTrabajo,
      a: 'cancelado',
      nota,
      usuarioId: sesion.user.id,
    })
    await devolverExistencias(tx, id)

    return {
      ok: true,
      mensaje: nuevoPago === 'pagado' ? 'Pedido cancelado. Queda pendiente de reembolso.' : 'Pedido cancelado',
    }
  })

  if (resultado.ok) {
    updateTag('pedidos')
    updateTag('productos')
    after(() => notificarCancelacion(id, 'cancelado', nota)) // ← NUEVO
  }
  return resultado
}

export async function rechazarPago(id: number, motivo: string): Promise<Resultado> {
  const sesion = await requireAdmin()
  const nota = String(motivo ?? '').trim().slice(0, 300)
  if (!Number.isInteger(id)) return { ok: false, mensaje: 'Pedido no válido' }
  if (nota.length < 3) return { ok: false, mensaje: 'Escribe el motivo; el cliente lo verá' }

  const resultado = await db.transaction(async (tx): Promise<Resultado> => {
    const [p] = await tx.select({ estadoPago: pedidos.estadoPago }).from(pedidos).where(eq(pedidos.id, id)).for('update')
    if (!p) return { ok: false, mensaje: 'El pedido no existe' }
    if (p.estadoPago !== 'en_revision') return { ok: false, mensaje: 'Solo se puede rechazar un comprobante en revisión' }

    await tx
      .update(pedidos)
      .set({ estadoPago: 'rechazado', estadoTrabajo: 'cancelado', motivoRechazo: nota })
      .where(eq(pedidos.id, id))
    await tx.insert(pedidoEventos).values({ pedidoId: id, tipo: 'pago', de: 'en_revision', a: 'rechazado', nota, usuarioId: sesion.user.id })
    await devolverExistencias(tx, id)
    return { ok: true, mensaje: 'Comprobante rechazado; el pedido se canceló y el horario se liberó' }
  })

  if (resultado.ok) {
    updateTag('pedidos')
    updateTag('productos')
    after(() => notificarCancelacion(id, 'rechazado', nota)) // ← NUEVO
  }
  return resultado
}