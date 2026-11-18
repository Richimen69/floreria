import 'server-only'
import { cacheTag } from 'next/cache'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { paginasLegales } from '@/db/schema'
import { PAGINAS_LEGALES, type SlugLegal } from '@/lib/legales'

export async function listarPaginasLegales() {
    'use cache'
    cacheTag('legales')
    const filas = await db.select().from(paginasLegales)
    // Siempre las tres, aunque alguna aún no exista en la base
    return PAGINAS_LEGALES.map((config) => {
        const fila = filas.find((f) => f.slug === config.slug)
        return { ...config, ...fila, existe: Boolean(fila), publicada: fila?.publicada ?? false }
    })
}

export async function obtenerPaginaLegal(slug: SlugLegal) {
    'use cache'
    cacheTag('legales')
    const [fila] = await db.select().from(paginasLegales).where(eq(paginasLegales.slug, slug)).limit(1)
    return fila ?? null
}

export async function legalesPublicadas() {
    const paginas = await listarPaginasLegales()
    return paginas
        .filter((p) => p.publicada)
        .map((p) => ({ slug: p.slug, titulo: p.titulo ?? '', version: p.version ?? 1 }))
}

export type LegalPublicada = Awaited<ReturnType<typeof legalesPublicadas>>[number]