'use server'

import { and, asc, eq, ilike, or } from 'drizzle-orm'
import { db } from '@/db'
import { colonias, zonasEnvio } from '@/db/schema'

export type ColoniaEncontrada = {
  id: number
  nombre: string
  tipo: string | null
  cp: string
  conCobertura: boolean
  costoCentavos: number | null
  latitud: number | null
  longitud: number | null
}

export async function buscarColonias(texto: string): Promise<ColoniaEncontrada[]> {
  const q = String(texto ?? '').trim().slice(0, 60)
  if (q.length < 2) return []

  const patron = `%${q.replace(/[%_\\]/g, '\\$&')}%`

  const filas = await db
    .select({
      id: colonias.id,
      nombre: colonias.nombre,
      tipo: colonias.tipo,
      cp: colonias.cp,
      costoCentavos: zonasEnvio.costoCentavos,
      zonaActiva: zonasEnvio.activa,
      latitud: colonias.latitud,
      longitud: colonias.longitud,
    })
    .from(colonias)
    .leftJoin(zonasEnvio, eq(colonias.zonaId, zonasEnvio.id))
    .where(or(ilike(colonias.nombre, patron), ilike(colonias.cp, `${q}%`)))
    .orderBy(asc(colonias.nombre))
    .limit(15)

  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    tipo: f.tipo,
    cp: f.cp,
    conCobertura: f.zonaActiva === true,
    costoCentavos: f.zonaActiva ? f.costoCentavos : null,
    latitud: f.latitud,
    longitud: f.longitud,
  }))
}