import 'server-only'
import { cacheTag } from 'next/cache'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { categorias } from '@/db/schema'

export async function listarCategorias() {
  'use cache'
  cacheTag('categorias')
  return db.select().from(categorias).orderBy(asc(categorias.orden), asc(categorias.nombre))
}

export async function obtenerCategoria(id: number) {
  'use cache'
  cacheTag('categorias')
  const [fila] = await db.select().from(categorias).where(eq(categorias.id, id)).limit(1)
  return fila ?? null
}