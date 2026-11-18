'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { paginasLegales } from '@/db/schema'
import { esSlugLegal } from '@/lib/legales'
import { requireAdmin } from '@/lib/permisos'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

const esquema = z.object({
  titulo: z.string().trim().min(3, 'Escribe el título').max(100),
  contenido: z.string().trim().max(50_000, 'El texto es demasiado largo'),
  publicada: z.string().optional().transform((v) => v === 'on'),
})

export async function guardarPaginaLegal(
  slug: string,
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin()
  if (!esSlugLegal(slug)) return { ok: false, mensaje: 'Página no válida' }

  const r = esquema.safeParse(Object.fromEntries(formData))
  if (!r.success) return { ok: false, mensaje: 'Revisa los campos marcados', errores: z.flattenError(r.error).fieldErrors }

  if (r.data.publicada && r.data.contenido.length < 50) {
    return { ok: false, mensaje: 'Escribe el contenido antes de publicar', errores: { contenido: ['Muy corto para publicarse'] } }
  }

  const [actual] = await db.select().from(paginasLegales).where(eq(paginasLegales.slug, slug)).limit(1)

  // La versión sube solo si cambia el texto de una página publicada
  const cambioContenido = actual && actual.contenido !== r.data.contenido
  const version = actual ? (cambioContenido && actual.publicada ? actual.version + 1 : actual.version) : 1

  await db
    .insert(paginasLegales)
    .values({ slug, ...r.data, version })
    .onConflictDoUpdate({ target: paginasLegales.slug, set: { ...r.data, version } })

  updateTag('legales')
  return {
    ok: true,
    mensaje: r.data.publicada ? `Guardado y publicado (versión ${version})` : 'Guardado como borrador',
  }
}