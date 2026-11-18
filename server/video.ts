import 'server-only'
import { randomUUID } from 'node:crypto'
import { execFile } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import { db } from '@/db'
import { productos } from '@/db/schema'
import { claveDesdeUrlPublica, descargarPrivadoR2, eliminarArchivoR2, eliminarPrivadoR2, subirArchivoR2 } from '@/lib/r2'

const ejecutar = promisify(execFile)
export const DURACION_MAXIMA = 20 // segundos

// Una conversión a la vez, para no saturar el servidor
let cola: Promise<unknown> = Promise.resolve()
export function encolarConversion(productoId: number, claveOriginal: string) {
  cola = cola.then(() => convertirVideo(productoId, claveOriginal)).catch(() => {})
}

async function convertirVideo(productoId: number, claveOriginal: string) {
  const carpeta = await mkdtemp(join(tmpdir(), 'video-'))
  const original = join(carpeta, 'original')
  const salida = join(carpeta, 'salida.mp4')
  const miniatura = join(carpeta, 'miniatura.jpg')

  try {
    await descargarPrivadoR2(claveOriginal, original)

    // Lado más largo a 720 px, dimensiones pares (H.264 lo requiere), 30 fps
    const escala =
      "scale='if(gt(iw,ih),min(720,iw),-2)':'if(gt(iw,ih),-2,min(720,ih))',scale=trunc(iw/2)*2:trunc(ih/2)*2,fps=30"

    await ejecutar('ffmpeg', [
      '-y', '-i', original,
      '-t', String(DURACION_MAXIMA), // solo los primeros 20 segundos
      '-an',                          // sin audio
      '-vf', escala,
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
      '-profile:v', 'main', '-pix_fmt', 'yuv420p',
      '-movflags', '+faststart',      // empieza a reproducirse antes de descargarse completo
      '-threads', '2',                // deja CPU libre para el sitio
      salida,
    ], { timeout: 5 * 60_000 })

    // Miniatura a partir del medio segundo
    await ejecutar('ffmpeg', ['-y', '-ss', '0.5', '-i', salida, '-frames:v', '1', '-q:v', '3', miniatura])

    const id = randomUUID()
    const [urlVideo, urlPoster] = await Promise.all([
      readFile(salida).then((b) => subirArchivoR2(`videos/${id}.mp4`, b, 'video/mp4')),
      readFile(miniatura)
        .then((b) => sharp(b).webp({ quality: 75 }).toBuffer())
        .then((b) => subirArchivoR2(`videos/${id}.webp`, b, 'image/webp')),
    ])

    // Si ya tenía un video, se borra el anterior
    const [anterior] = await db
      .select({ video: productos.videoUrl, poster: productos.videoPosterUrl })
      .from(productos)
      .where(eq(productos.id, productoId))

    await db
      .update(productos)
      .set({ videoUrl: urlVideo, videoPosterUrl: urlPoster, videoEstado: 'listo', videoError: null })
      .where(eq(productos.id, productoId))

    for (const url of [anterior?.video, anterior?.poster]) {
      const clave = claveDesdeUrlPublica(url ?? null)
      if (clave && clave !== `videos/${id}.mp4` && clave !== `videos/${id}.webp`) {
        await eliminarArchivoR2(clave).catch(() => {})
      }
    }
  } catch (error) {
    console.error('Error al convertir video:', error)
    await db
      .update(productos)
      .set({ videoEstado: 'error', videoError: 'No se pudo procesar el video. Prueba con otro archivo.' })
      .where(eq(productos.id, productoId))
  } finally {
    await eliminarPrivadoR2(claveOriginal).catch(() => {})
    await rm(carpeta, { recursive: true, force: true })
  }
}