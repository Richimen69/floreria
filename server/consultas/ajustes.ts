import 'server-only'
import { cacheTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { ajustesSitio } from '@/db/schema'

export async function obtenerAjustes() {
  'use cache'
  cacheTag('ajustes')

  const [fila] = await db.select().from(ajustesSitio).where(eq(ajustesSitio.id, 1)).limit(1)

  if (!fila) {
    throw new Error('No existen los ajustes del sitio. Ejecuta: npm run db:seed')
  }
  return fila
}