import { z } from 'zod'
import { TIPOS_MOVIMIENTO, UNIDADES, type TipoMovimiento } from '@/lib/inventario'

const decimal = /^\d+(\.\d{1,2})?$/
const cantidad = z.string().trim().refine((v) => decimal.test(v), 'Cantidad no válida (ej. 12 o 2.5)').transform(Number)
const cantidadOpcional = z.union([z.literal('').transform(() => null), cantidad])
const pesosOpcional = z.union([
  z.literal('').transform(() => null),
  z.string().trim().refine((v) => decimal.test(v), 'Costo no válido').transform((v) => Math.round(Number(v) * 100)),
])
const textoOpcional = (max: number) => z.string().trim().max(max).transform((v) => (v === '' ? null : v))
const checkbox = z.string().optional().transform((v) => v === 'on')

export const esquemaInsumo = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  categoria: z.string().trim().max(50).transform((v) => v || 'General'),
  unidad: z.enum(UNIDADES),
  minimo: cantidadOpcional,
  costo: pesosOpcional,
  proveedor: textoOpcional(100),
  notas: textoOpcional(500),
  activo: checkbox,
  existenciaInicial: cantidadOpcional.optional(),
})

export const esquemaMovimiento = z.object({
  insumoId: z.coerce.number().int().positive(),
  tipo: z.enum(Object.keys(TIPOS_MOVIMIENTO) as [TipoMovimiento, ...TipoMovimiento[]]),
  cantidad,
  costo: pesosOpcional.optional(),
  nota: textoOpcional(200),
})