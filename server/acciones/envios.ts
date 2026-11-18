'use server'

import { eq, inArray } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { colonias, zonasEnvio } from '@/db/schema'
import { requireAdmin } from '@/lib/permisos'
import { esquemaColonia, esquemaZona } from '@/lib/validaciones/envios'

type Resultado = { ok: boolean; mensaje: string }

export async function guardarZona(id: number | null, formData: FormData): Promise<Resultado> {
  await requireAdmin()
  const r = esquemaZona.safeParse(Object.fromEntries(formData))
  if (!r.success) return { ok: false, mensaje: r.error.issues[0]?.message ?? 'Datos no válidos' }

  const { costo, ...resto } = r.data
  const datos = { ...resto, costoCentavos: costo }

  if (id) await db.update(zonasEnvio).set(datos).where(eq(zonasEnvio.id, id))
  else await db.insert(zonasEnvio).values(datos)

  updateTag('envios')
  return { ok: true, mensaje: 'Zona guardada' }
}

export async function eliminarZona(id: number): Promise<Resultado> {
  await requireAdmin()
  // Sus colonias quedan sin cobertura (onDelete: set null)
  await db.delete(zonasEnvio).where(eq(zonasEnvio.id, id))
  updateTag('envios')
  return { ok: true, mensaje: 'Zona eliminada; sus colonias quedaron sin cobertura' }
}

export async function asignarZona(coloniaIds: number[], zonaId: number | null): Promise<Resultado> {
  await requireAdmin()
  const ids = z.array(z.number().int().positive()).min(1).max(2000).safeParse(coloniaIds)
  if (!ids.success || (zonaId !== null && !Number.isInteger(zonaId))) return { ok: false, mensaje: 'Datos no válidos' }

  await db.update(colonias).set({ zonaId }).where(inArray(colonias.id, ids.data))
  updateTag('envios')
  return {
    ok: true,
    mensaje: `${ids.data.length} colonia(s) ${zonaId ? 'asignadas a la zona' : 'marcadas sin cobertura'}`,
  }
}

export async function agregarColonia(formData: FormData): Promise<Resultado> {
  await requireAdmin()
  const r = esquemaColonia.safeParse(Object.fromEntries(formData))
  if (!r.success) return { ok: false, mensaje: r.error.issues[0]?.message ?? 'Datos no válidos' }

  const [nueva] = await db.insert(colonias).values(r.data).onConflictDoNothing().returning({ id: colonias.id })
  if (!nueva) return { ok: false, mensaje: 'Esa colonia con ese código postal ya existe' }

  updateTag('envios')
  return { ok: true, mensaje: 'Colonia agregada' }
}