import { z } from 'zod'
import type { PedidoAfectado } from '@/lib/calendario'

// Dígito verificador de la CLABE (pesos 3, 7, 1)
export function clabeValida(clabe: string) {
  if (!/^\d{18}$/.test(clabe)) return false
  const pesos = [3, 7, 1]
  let suma = 0
  for (let i = 0; i < 17; i++) suma += (Number(clabe[i]) * pesos[i % 3]) % 10
  return (10 - (suma % 10)) % 10 === Number(clabe[17])
}

// Convierte '' en null para guardar campos vacíos como NULL
const opcional = (max = 500) =>
  z.string().trim().max(max, `Máximo ${max} caracteres`).transform((v) => (v === '' ? null : v))
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Color no válido')
const urlOpcional = z
  .string()
  .trim()
  .refine((v) => v === '' || URL.canParse(v), 'URL no válida (debe empezar con https://)')
  .transform((v) => (v === '' ? null : v))

const coordenadas = z
  .string()
  .trim()
  .transform((v, ctx) => {
    if (v === '') return null
    const partes = v.split(',').map((p) => Number(p.trim()))
    const [lat, lng] = partes
    if (
      partes.length !== 2 ||
      !Number.isFinite(lat) || !Number.isFinite(lng) ||
      Math.abs(lat) > 90 || Math.abs(lng) > 180
    ) {
      ctx.addIssue({ code: 'custom', message: 'Formato esperado: 16.8531, -99.8237' })
      return z.NEVER
    }
    return { lat, lng }
  })

export const esquemaAjustes = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  mercadoPagoActivo: z.string().optional().transform((v) => v === 'on'),
  correoAvisos: z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Correo no válido')
    .transform((v) => (v === '' ? null : v)),
  eslogan: opcional(150),
  logoUrl: urlOpcional,
  colorPrimario: color,
  colorAcento: color,
  colorFondo: color,
  coordenadas,
  tituloPortada: opcional(150),
  textoPortada: opcional(1000),
  imagenPortadaUrl: urlOpcional,
  quienesSomos: opcional(3000),
  transferenciaActiva: z.string().optional().transform((v) => v === 'on'),
  banco: opcional(60),
  titularCuenta: opcional(100),
  clabe: z.string().optional().transform((v) => (v ? v.replace(/\D/g, '') : null) || null),
  plazoPagoMinutos: z.coerce.number().int().min(15, 'Mínimo 15 minutos').max(1440, 'Máximo 24 horas'),

  whatsapp: z
    .string()
    .trim()
    .refine((v) => v === '' || /^\d{10,15}$/.test(v), 'Solo números, con lada (ej. 527441234567)')
    .transform((v) => (v === '' ? null : v)),
  telefono: opcional(20),
  email: z
    .string()
    .trim()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Correo no válido')
    .transform((v) => (v === '' ? null : v)),
  direccion: opcional(300),
  mapaUrl: urlOpcional,
  horario: opcional(300),

  facebookUrl: urlOpcional,
  instagramUrl: urlOpcional,
  tiktokUrl: urlOpcional,

})
  .transform(({ coordenadas, ...resto }) => ({
    ...resto,
    latitud: coordenadas?.lat ?? null,
    longitud: coordenadas?.lng ?? null,
  }))

export type EstadoFormulario = {
  ok: boolean
  mensaje: string
  errores?: Record<string, string[] | undefined>
  afectados?: PedidoAfectado[]
}