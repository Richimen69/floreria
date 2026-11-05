import { z } from 'zod'
import { generarSlug } from '@/lib/utils'

const checkbox = z.string().optional().transform((v) => v === 'on')

const pesosACentavos = z
  .string()
  .trim()
  .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Escribe un precio válido, ej. 650 o 650.50')
  .transform((v) => Math.round(Number(v) * 100))

export const esquemaProducto = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
    slug: z.string().trim().max(120),
    descripcion: z.string().trim().max(2000).transform((v) => (v === '' ? null : v)),
    categoriaId: z.coerce.number().int().positive('Elige una categoría'),
    precio: pesosACentavos.refine((v) => v > 0, 'El precio debe ser mayor a 0'),
    precioOferta: z.union([z.literal('').transform(() => null), pesosACentavos]),
    imagenes: z.array(z.string().refine((v) => URL.canParse(v))).max(8, 'Máximo 8 imágenes'),
    orden: z.coerce.number().int().min(0).max(999),
    activo: checkbox,
    disponible: checkbox,
    destacado: checkbox,
  })
  .refine((d) => d.precioOferta == null || d.precioOferta < d.precio, {
    path: ['precioOferta'],
    message: 'El precio de oferta debe ser menor al precio normal',
  })
  .transform(({ precio, precioOferta, ...resto }) => ({
    ...resto,
    slug: generarSlug(resto.slug || resto.nombre),
    precioCentavos: precio,
    precioOfertaCentavos: precioOferta,
  }))

// FormData con campos repetidos (las imágenes) no cabe en Object.fromEntries
export function leerFormProducto(formData: FormData) {
  return {
    ...Object.fromEntries(formData),
    imagenes: formData.getAll('imagenes').map(String).filter(Boolean),
  }
}