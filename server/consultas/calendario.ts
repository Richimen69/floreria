import 'server-only'
import { cacheTag } from 'next/cache'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { ajustesSitio, bloquesExcepcion, bloquesSemana, excepcionesCalendario, temporadas } from '@/db/schema'
import type { BloqueConfig, ConfigCalendario } from '@/lib/calendario'

const camposBloque = {
  inicio: true,
  fin: true,
  minutosCierre: true,
  capacidad: true,
} as const

function soloBloque<T extends BloqueConfig>(b: T): BloqueConfig {
  return { inicio: b.inicio, fin: b.fin, minutosCierre: b.minutosCierre, capacidad: b.capacidad }
}

export async function obtenerConfigCalendario(): Promise<ConfigCalendario> {
  'use cache'
  cacheTag('calendario', 'ajustes', 'temporadas')

  const [semana, excepciones, bloquesExc, [ajustes], cerradas] = await Promise.all([
    db.select().from(bloquesSemana).orderBy(asc(bloquesSemana.diaSemana), asc(bloquesSemana.inicio)),
    db.select().from(excepcionesCalendario).orderBy(asc(excepcionesCalendario.fechaInicio)),
    db.select().from(bloquesExcepcion),
    db.select({ horizonteDias: ajustesSitio.horizonteDias }).from(ajustesSitio).where(eq(ajustesSitio.id, 1)),
    db
      .select({ nombre: temporadas.nombre, fechaInicio: temporadas.fechaInicio, fechaFin: temporadas.fechaFin })
      .from(temporadas)
      .where(eq(temporadas.reservasAbiertas, false)),
  ])

  const porDia: Record<number, BloqueConfig[]> = {}
  for (const b of semana) (porDia[b.diaSemana] ??= []).push(soloBloque(b))

  return {
    horizonteDias: ajustes?.horizonteDias ?? 60,
    semana: porDia,
    excepciones: excepciones.map((e) => ({
      nombre: e.nombre,
      fechaInicio: e.fechaInicio,
      fechaFin: e.fechaFin,
      tipo: e.tipo,
      nota: e.nota,
      bloques: bloquesExc.filter((b) => b.excepcionId === e.id).map(soloBloque),
    })),
    temporadasCerradas: cerradas,
  }
}

export async function listarExcepciones() {
  'use cache'
  cacheTag('calendario')
  return db.select().from(excepcionesCalendario).orderBy(asc(excepcionesCalendario.fechaInicio))
}

export async function obtenerExcepcion(id: number) {
  'use cache'
  cacheTag('calendario')

  const [fila] = await db.select().from(excepcionesCalendario).where(eq(excepcionesCalendario.id, id)).limit(1)
  if (!fila) return null

  const bloques = await db
    .select()
    .from(bloquesExcepcion)
    .where(eq(bloquesExcepcion.excepcionId, id))
    .orderBy(asc(bloquesExcepcion.inicio))

  return { ...fila, bloques: bloques.map(soloBloque) }
}

export type ExcepcionAdmin = NonNullable<Awaited<ReturnType<typeof obtenerExcepcion>>>