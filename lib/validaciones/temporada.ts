import { z } from 'zod'

const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida')
const checkbox = z.string().optional().transform((v) => v === 'on')

export const REDONDEOS = [
  { valor: 0, texto: 'Sin redondeo' },
  { valor: 100, texto: 'Al peso ($1)' },
  { valor: 500, texto: 'A $5' },
  { valor: 1000, texto: 'A la decena ($10)' },
]

export const esquemaTemporada = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
    fechaInicio: fecha,
    fechaFin: fecha,
    ajustePorcentaje: z.coerce.number().int('Usa un número entero').min(-90, 'Mínimo -90%').max(300, 'Máximo 300%'),
    redondeoCentavos: z.coerce.number().refine((v) => REDONDEOS.some((r) => r.valor === v), 'Redondeo no válido'),
    permiteOfertas: checkbox,
    reservasAbiertas: checkbox,
  })
  .refine((d) => d.fechaFin >= d.fechaInicio, {
    path: ['fechaFin'],
    message: 'Debe ser igual o posterior a la fecha de inicio',
  })

// Los precios llegan como precio_<productoId>; los vacíos se ignoran
export function leerPreciosTemporada(formData: FormData) {
  const precios: { productoId: number; precioCentavos: number }[] = []
  const errores: Record<string, string[]> = {}

  for (const [clave, valor] of formData.entries()) {
    if (!clave.startsWith('precio_')) continue
    const texto = String(valor).trim()
    if (texto === '') continue

    if (!/^\d+(\.\d{1,2})?$/.test(texto) || Number(texto) <= 0) {
      errores[clave] = ['Precio no válido']
      continue
    }
    precios.push({ productoId: Number(clave.slice(7)), precioCentavos: Math.round(Number(texto) * 100) })
  }

  return { precios, errores }
}