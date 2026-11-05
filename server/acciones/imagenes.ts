'use server'

import { randomUUID } from 'node:crypto'
import sharp from 'sharp'
import { requireAdmin } from '@/lib/permisos'
import { subirArchivoR2 } from '@/lib/r2'

const TIPOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANO_MAXIMO = 5 * 1024 * 1024 // 5 MB
const CARPETAS = ['logos', 'portada', 'productos', 'categorias'] as const

type ResultadoSubida = { ok: true; url: string } | { ok: false; error: string }

export async function subirImagen(formData: FormData): Promise<ResultadoSubida> {
  await requireAdmin()

  const archivo = formData.get('archivo')
  const carpeta = String(formData.get('carpeta'))

  if (!(archivo instanceof File) || archivo.size === 0) {
    return { ok: false, error: 'No se recibió ninguna imagen' }
  }
  if (!TIPOS_PERMITIDOS.includes(archivo.type)) {
    return { ok: false, error: 'Solo se permiten imágenes JPG, PNG o WebP' }
  }
  if (archivo.size > TAMANO_MAXIMO) {
    return { ok: false, error: 'La imagen no debe pesar más de 5 MB' }
  }
  if (!CARPETAS.includes(carpeta as (typeof CARPETAS)[number])) {
    return { ok: false, error: 'Destino no válido' }
  }

  try {
    const original = Buffer.from(await archivo.arrayBuffer())

    const procesada = await sharp(original)
      .rotate() // corrige la orientación de fotos tomadas con celular
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 }) // WebP conserva la transparencia de los logos PNG
      .toBuffer()

    const url = await subirArchivoR2(`${carpeta}/${randomUUID()}.webp`, procesada, 'image/webp')
    return { ok: true, url }
  } catch (error) {
    console.error('Error al subir imagen:', error)
    return { ok: false, error: 'No se pudo procesar la imagen. Intenta con otra.' }
  }
}