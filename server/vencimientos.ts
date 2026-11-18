import 'server-only'
import { and, eq, lt, sql } from 'drizzle-orm'
import { after, connection } from 'next/server' // ← NUEVO
import { db } from '@/db'
import { pedidoEventos, pedidos } from '@/db/schema'
import { devolverExistencias } from '@/server/existencias'
import { notificarCancelacion } from '@/server/notificaciones' // ← NUEVO

export async function vencerPedidosExpirados() {
  await connection()
  const ids = await db.transaction(async (tx) => {
    const vencidos = await tx
      .update(pedidos)
      .set({ estadoPago: 'vencido', estadoTrabajo: 'cancelado' })
      .where(and(eq(pedidos.estadoPago, 'pendiente'), lt(pedidos.pagoVenceEn, sql`now()`)))
      .returning({ id: pedidos.id })

    for (const v of vencidos) {
      await tx.insert(pedidoEventos).values({
        pedidoId: v.id,
        tipo: 'vencido',
        de: 'pendiente',
        a: 'vencido',
        nota: 'No se recibió el comprobante a tiempo',
      })
      await devolverExistencias(tx, v.id)
    }

    return vencidos.map((v) => v.id) // ← NUEVO: antes era vencidos.length
  })

  for (const id of ids) after(() => notificarCancelacion(id, 'vencido'))
  return ids.length
}