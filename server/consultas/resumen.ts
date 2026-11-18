import 'server-only'
import { and, count, eq, isNotNull, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import { insumos, pedidos, productos } from '@/db/schema'
import { sumarDias } from '@/lib/fechas'

export async function indicadoresPedidos(hoy: string) {
  const manana = sumarDias(hoy, 1)

  // Varios conteos en una sola consulta
  const [fila] = await db
    .select({
      hoy: sql<number>`count(*) FILTER (WHERE ${pedidos.fechaEntrega} = ${hoy} AND ${pedidos.estadoTrabajo} <> 'cancelado')`.mapWith(Number),
      porEntregarHoy: sql<number>`count(*) FILTER (WHERE ${pedidos.fechaEntrega} = ${hoy} AND ${pedidos.estadoTrabajo} NOT IN ('entregado', 'cancelado'))`.mapWith(Number),
      manana: sql<number>`count(*) FILTER (WHERE ${pedidos.fechaEntrega} = ${manana} AND ${pedidos.estadoTrabajo} <> 'cancelado')`.mapWith(Number),
      pendientesPago: sql<number>`count(*) FILTER (WHERE ${pedidos.estadoPago} = 'pendiente' AND ${pedidos.fechaEntrega} >= ${hoy} AND ${pedidos.estadoTrabajo} <> 'cancelado')`.mapWith(Number),
      reembolsos: sql<number>`count(*) FILTER (WHERE ${pedidos.estadoTrabajo} = 'cancelado' AND ${pedidos.estadoPago} = 'pagado')`.mapWith(Number),
      cobradoHoy: sql<number>`coalesce(sum(${pedidos.totalCentavos}) FILTER (WHERE ${pedidos.fechaEntrega} = ${hoy} AND ${pedidos.estadoPago} = 'pagado'), 0)`.mapWith(Number),
      porRevisar: sql<number>`count(*) FILTER (WHERE ${pedidos.estadoPago} = 'en_revision')`.mapWith(Number),
    })
    .from(pedidos)

  return fila
}

export async function alertasCatalogo() {
  const [[agotados], [sinExistencias], [insumosBajos]] = await Promise.all([
    db.select({ total: count() }).from(productos).where(and(eq(productos.activo, true), eq(productos.disponible, false))),
    db
      .select({ total: count() })
      .from(productos)
      .where(and(eq(productos.activo, true), eq(productos.controlarExistencias, true), lte(productos.existencias, 0))),
    db
      .select({ total: count() })
      .from(insumos)
      .where(and(eq(insumos.activo, true), isNotNull(insumos.minimo), sql`${insumos.existencia} <= ${insumos.minimo}`)),
  ])

  return { agotados: agotados.total, sinExistencias: sinExistencias.total, insumosBajos: insumosBajos.total }
}