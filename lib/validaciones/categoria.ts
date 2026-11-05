import { z } from 'zod'
import { generarSlug } from '@/lib/utils'

export const esquemaCategoria = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
    slug: z.string().trim().max(80),
    descripcion: z.string().trim().max(500).transform((v) => (v === '' ? null : v)),
    imagenUrl: z
      .string()
      .trim()
      .refine((v) => v === '' || URL.canParse(v), 'URL no válida')
      .transform((v) => (v === '' ? null : v)),
    orden: z.coerce.number().int('Debe ser un número entero').min(0).max(999),
    // Un checkbox marcado envía "on"; desmarcado no envía nada
    activa: z.string().optional().transform((v) => v === 'on'),
  })
  .transform((datos) => ({
    ...datos,
    slug: generarSlug(datos.slug || datos.nombre),
  }))
  .refine((datos) => datos.slug.length > 0, {
    path: ['slug'],
    message: 'No se pudo generar un identificador válido',
  })