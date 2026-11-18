import 'server-only'
import { cacheTag } from 'next/cache'
import { and, asc, desc, eq, ilike, isNotNull, sql } from 'drizzle-orm'
import { db } from '@/db'
import { insumos, movimientosInsumo, user } from '@/db/schema'

export type FiltroInsumos = 'todos' | 'bajo-minimo' | 'inactivos'

export async function listarInsumos({ q = '', categoria = '', filtro = 'todos' }: { q?: string; categoria?: string; filtro?: FiltroInsumos }) {
  'use cache'
  cacheTag('inventario')

  const condiciones = [eq(insumos.activo, filtro !== 'inactivos')]
  if (filtro === 'bajo-minimo') {
    condiciones.push(isNotNull(insumos.minimo), sql`${insumos.existencia} <= ${insumos.minimo}`)
  }
  if (q) condiciones.push(ilike(insumos.nombre, `%${q.replace(/[%_\\]/g, '\\$&')}%`))
  if (categoria) condiciones.push(eq(insumos.categoria, categoria))

  return db
    .select()
    .from(insumos)
    .where(and(...condiciones))
    .orderBy(asc(insumos.categoria), asc(insumos.nombre))
}

export async function listarCategoriasInsumo() {
  'use cache'
  cacheTag('inventario')
  const filas = await db.selectDistinct({ categoria: insumos.categoria }).from(insumos).orderBy(asc(insumos.categoria))
  return filas.map((f) => f.categoria)
}

export async function obtenerInsumo(id: number) {
  'use cache'
  cacheTag('inventario')

  const [insumo] = await db.select().from(insumos).where(eq(insumos.id, id)).limit(1)
  if (!insumo) return null

  const movimientos = await db
    .select({
      id: movimientosInsumo.id,
      tipo: movimientosInsumo.tipo,
      cambio: movimientosInsumo.cambio,
      existenciaResultante: movimientosInsumo.existenciaResultante,
      costoUnitarioCentavos: movimientosInsumo.costoUnitarioCentavos,
      nota: movimientosInsumo.nota,
      creadoEn: movimientosInsumo.creadoEn,
      usuario: user.name,
    })
    .from(movimientosInsumo)
    .leftJoin(user, eq(movimientosInsumo.usuarioId, user.id))
    .where(eq(movimientosInsumo.insumoId, id))
    .orderBy(desc(movimientosInsumo.creadoEn))
    .limit(100)

  return { ...insumo, movimientos }
}