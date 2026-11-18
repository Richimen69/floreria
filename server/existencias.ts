import 'server-only'
import { and, eq, gte, inArray, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { pedidoItems, pedidos, productos } from '@/db/schema'

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export class ErrorExistencias extends Error {}

// Descuenta solo productos con control de existencias; falla si no alcanza
export async function descontarExistencias(tx: Tx, lineas: { productoId: number; cantidad: number }[]) {
  const ids = [...new Set(lineas.map((l) => l.productoId))]
  if (ids.length === 0) return false

  const controlados = await tx
    .select({ id: productos.id, nombre: productos.nombre })
    .from(productos)
    .where(and(inArray(productos.id, ids), eq(productos.controlarExistencias, true)))

  for (const c of controlados) {
    const cantidad = lineas.filter((l) => l.productoId === c.id).reduce((s, l) => s + l.cantidad, 0)
    const actualizado = await tx
      .update(productos)
      .set({ existencias: sql`${productos.existencias} - ${cantidad}` })
      .where(and(eq(productos.id, c.id), gte(productos.existencias, cantidad)))
      .returning({ id: productos.id })
    if (actualizado.length === 0) throw new ErrorExistencias(c.nombre)
  }
  return controlados.length > 0
}

// Regresa las existencias de un pedido una sola vez
export async function devolverExistencias(tx: Tx, pedidoId: number) {
  const [p] = await tx
    .select({ devueltas: pedidos.existenciasDevueltas })
    .from(pedidos)
    .where(eq(pedidos.id, pedidoId))
    .for('update')
  if (!p || p.devueltas) return

  const items = await tx
    .select({ productoId: pedidoItems.productoId, cantidad: pedidoItems.cantidad })
    .from(pedidoItems)
    .where(and(eq(pedidoItems.pedidoId, pedidoId), isNotNull(pedidoItems.productoId)))

  for (const i of items) {
    await tx
      .update(productos)
      .set({ existencias: sql`${productos.existencias} + ${i.cantidad}` })
      .where(and(eq(productos.id, i.productoId!), eq(productos.controlarExistencias, true)))
  }
  await tx.update(pedidos).set({ existenciasDevueltas: true }).where(eq(pedidos.id, pedidoId))
}