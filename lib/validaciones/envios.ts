import { z } from 'zod'

export const esquemaZona = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(60),
  costo: z
    .string()
    .trim()
    .refine((v) => /^\d+(\.\d{1,2})?$/.test(v), 'Costo no válido, ej. 80 o 0 para envío gratis')
    .transform((v) => Math.round(Number(v) * 100)),
  notaInterna: z.string().trim().max(300).transform((v) => (v === '' ? null : v)),
  activa: z.string().optional().transform((v) => v === 'on'),
})

export const esquemaColonia = z.object({
  nombre: z.string().trim().min(2, 'El nombre es obligatorio').max(100),
  tipo: z.string().trim().max(40).transform((v) => (v === '' ? null : v)),
  cp: z.string().trim().regex(/^\d{5}$/, 'El código postal tiene 5 dígitos'),
  zonaId: z.union([z.literal('').transform(() => null), z.coerce.number().int().positive()]),
})