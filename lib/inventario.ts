export const UNIDADES = ['pieza', 'tallo', 'manojo', 'caja', 'paquete', 'metro', 'rollo', 'kg', 'litro'] as const

export const TIPOS_MOVIMIENTO = {
  entrada: { texto: 'Entrada', ayuda: 'Llegó mercancía' },
  salida: { texto: 'Salida', ayuda: 'Se usó en arreglos' },
  merma: { texto: 'Merma', ayuda: 'Se marchitó o se dañó' },
  ajuste: { texto: 'Ajuste por conteo', ayuda: 'Captura cuánto hay físicamente' },
} as const

export type TipoMovimiento = keyof typeof TIPOS_MOVIMIENTO

const formato = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 2 })

export function formatearCantidad(n: number) {
  return formato.format(n)
}

export function redondear2(n: number) {
  return Math.round(n * 100) / 100
}

export function bajoMinimo(i: { existencia: number; minimo: number | null }) {
  return i.minimo != null && i.existencia <= i.minimo
}

// Lo que falta para llegar al mínimo
export function faltante(i: { existencia: number; minimo: number | null }) {
  return i.minimo != null && i.existencia < i.minimo ? redondear2(i.minimo - i.existencia) : null
}