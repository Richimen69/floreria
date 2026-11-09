import 'server-only'
import { cacheTag } from 'next/cache'
import { and, asc, desc, eq, gte, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import { preciosTemporada, temporadas } from '@/db/schema'
import type { ReglasTemporada } from '@/lib/precios'

export async function listarTemporadas() {
  'use cache'
  cacheTag('temporadas')

  return db
    .select({
      id: temporadas.id,
      nombre: temporadas.nombre,
      fechaInicio: temporadas.fechaInicio,
      fechaFin: temporadas.fechaFin,
      ajustePorcentaje: temporadas.ajustePorcentaje,
      reservasAbiertas: temporadas.reservasAbiertas,
      totalPrecios: sql<number>`(SELECT count(*)::int FROM precios_temporada pt WHERE pt.temporada_id = ${temporadas.id})`,
    })
    .from(temporadas)
    .orderBy(desc(temporadas.fechaInicio))
}

export async function obtenerTemporada(id: number) {
  'use cache'
  cacheTag('temporadas')

  const [fila] = await db.select().from(temporadas).where(eq(temporadas.id, id)).limit(1)
  if (!fila) return null

  const precios = await db.select().from(preciosTemporada).where(eq(preciosTemporada.temporadaId, id))
  return { ...fila, precios: Object.fromEntries(precios.map((p) => [p.productoId, p.precioCentavos])) as Record<number, number> }
}

export type TemporadaAdmin = NonNullable<Awaited<ReturnType<typeof obtenerTemporada>>>

// La temporada que cubre una fecha de entrega, si existe
export async function temporadaParaFecha(fecha: string) {
  'use cache'
  cacheTag('temporadas')

  const [fila] = await db
    .select()
    .from(temporadas)
    .where(and(lte(temporadas.fechaInicio, fecha), gte(temporadas.fechaFin, fecha)))
    .orderBy(asc(temporadas.fechaInicio))
    .limit(1)
  if (!fila) return null

  const precios = await db.select().from(preciosTemporada).where(eq(preciosTemporada.temporadaId, fila.id))

  return {
    id: fila.id,
    nombre: fila.nombre,
    reservasAbiertas: fila.reservasAbiertas,
    ajustePorcentaje: fila.ajustePorcentaje,
    redondeoCentavos: fila.redondeoCentavos,
    permiteOfertas: fila.permiteOfertas,
    precios: Object.fromEntries(precios.map((p) => [p.productoId, p.precioCentavos])),
  } satisfies ReglasTemporada & { id: number; nombre: string; reservasAbiertas: boolean }
}