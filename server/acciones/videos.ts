'use server'

import { randomUUID } from 'node:crypto'
import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { db } from '@/db'
import { productos } from '@/db/schema'
import { requireAdmin } from '@/lib/permisos'
import { claveDesdeUrlPublica, eliminarArchivoR2, urlSubidaPrivada } from '@/lib/r2'
import { encolarConversion } from '@/server/video'

const TIPOS: Record<string, string> = { 'video/mp4': 'mp4', 'video/quicktime': 'mov', 'video/webm': 'webm' }
const TAMANO_MAXIMO = 150 * 1024 * 1024 // 150 MB

// Paso 1: el panel pide un enlace para subir el original directo a R2
export async function prepararSubidaVideo(productoId: number, tipo: string, tamano: number) {
  await requireAdmin()
  if (!Number.isInteger(productoId)) return { ok: false as const, mensaje: 'Producto no válido' }
  if (!TIPOS[tipo]) return { ok: false as const, mensaje: 'Sube un video MP4, MOV o WebM' }
  if (tamano > TAMANO_MAXIMO) return { ok: false as const, mensaje: 'El video no debe pesar más de 150 MB' }

  const clave = `videos-originales/${productoId}/${randomUUID()}.${TIPOS[tipo]}`
  return { ok: true as const, clave, url: await urlSubidaPrivada(clave, tipo) }
}

// Paso 2: ya subido, se manda a convertir
export async function procesarVideo(productoId: number, clave: string) {
  await requireAdmin()
  if (!Number.isInteger(productoId) || !clave.startsWith(`videos-originales/${productoId}/`)) {
    return { ok: false, mensaje: 'Datos no válidos' }
  }

  await db
    .update(productos)
    .set({ videoEstado: 'procesando', videoError: null, videoIniciadoEn: new Date() })
    .where(eq(productos.id, productoId))

  encolarConversion(productoId, clave)
  return { ok: true, mensaje: 'Procesando video…' }
}

// El panel consulta el avance; sin caché para ver el estado real
export async function estadoVideo(productoId: number) {
  await requireAdmin()
  const [p] = await db
    .select({
      estado: productos.videoEstado,
      error: productos.videoError,
      url: productos.videoUrl,
      poster: productos.videoPosterUrl,
      iniciado: productos.videoIniciadoEn,
    })
    .from(productos)
    .where(eq(productos.id, productoId))
  if (!p) return null

  // Si el servidor se reinició a media conversión, no quedarse "procesando" para siempre
  if (p.estado === 'procesando' && p.iniciado && Date.now() - p.iniciado.getTime() > 10 * 60_000) {
    return { ...p, estado: 'error', error: 'La conversión tardó demasiado. Vuelve a subir el video.' }
  }
  return p
}

// Cuando el video quedó listo, el panel avisa para refrescar el catálogo
export async function confirmarVideoListo() {
  await requireAdmin()
  updateTag('productos')
}

export async function quitarVideo(productoId: number) {
  await requireAdmin()
  const [p] = await db
    .select({ video: productos.videoUrl, poster: productos.videoPosterUrl })
    .from(productos)
    .where(eq(productos.id, productoId))

  await db
    .update(productos)
    .set({ videoUrl: null, videoPosterUrl: null, videoEstado: null, videoError: null })
    .where(eq(productos.id, productoId))

  for (const url of [p?.video, p?.poster]) {
    const clave = claveDesdeUrlPublica(url ?? null)
    if (clave) await eliminarArchivoR2(clave).catch(() => {})
  }

  updateTag('productos')
  return { ok: true, mensaje: 'Video eliminado' }
}