import { z } from 'zod'

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Hora no válida')
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida')

export const esquemaBloque = z
  .object({
    inicio: hora,
    fin: hora,
    minutosCierre: z.coerce.number().int('Usa minutos enteros').min(0).max(720, 'Máximo 12 horas'),
    capacidad: z.coerce.number().int('Usa un número entero').min(1, 'Mínimo 1 pedido').max(999),
  })
  .refine((b) => b.fin > b.inicio, { path: ['fin'], message: 'Debe terminar después de empezar' })

// Se permiten traslapes, pero no dos bloques con el mismo horario exacto
const listaBloques = z
  .array(esquemaBloque)
  .refine((bs) => new Set(bs.map((b) => `${b.inicio}-${b.fin}`)).size === bs.length, 'Hay dos bloques con el mismo horario')

export const esquemaSemana = z.object({
  horizonteDias: z.coerce.number().int().min(1, 'Mínimo 1 día').max(365, 'Máximo 365 días'),
  semana: z.record(z.string().regex(/^[0-6]$/), listaBloques),
})

export const esquemaExcepcion = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
    fechaInicio: fecha,
    fechaFin: fecha,
    tipo: z.enum(['cerrado', 'no_disponible', 'especial']),
    nota: z.string().trim().max(300).transform((v) => (v === '' ? null : v)),
    bloques: listaBloques,
  })
  .refine((d) => d.fechaFin >= d.fechaInicio, { path: ['fechaFin'], message: 'Debe ser igual o posterior al inicio' })
  .refine((d) => d.tipo !== 'especial' || d.bloques.length > 0, {
    path: ['bloques'],
    message: 'Agrega al menos un bloque para el horario especial',
  })

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Convierte el primer error en un mensaje entendible: "Lunes, bloque 2: Debe terminar después de empezar"
export function describirError(error: z.ZodError) {
  const issue = error.issues[0]
  if (!issue) return 'Revisa los datos'
  const [raiz, a, b] = issue.path
  if (raiz === 'semana' && typeof a === 'string') {
    const dia = DIAS[Number(a)]
    return typeof b === 'number' ? `${dia}, bloque ${b + 1}: ${issue.message}` : `${dia}: ${issue.message}`
  }
  if (raiz === 'bloques' && typeof a === 'number') return `Bloque ${a + 1}: ${issue.message}`
  return issue.message
}

export function leerJson(valor: FormDataEntryValue | null) {
  try {
    return JSON.parse(String(valor ?? ''))
  } catch {
    return null
  }
}