export const ESTADOS_PRODUCTO = {
  todos: 'Todos',
  visibles: 'Visibles',
  ocultos: 'Ocultos',
  agotados: 'Agotados hoy',
  'sin-existencias': 'Sin existencias',
  top: 'Top',
  oferta: 'En oferta',
} as const

export type EstadoProducto = keyof typeof ESTADOS_PRODUCTO

export function esEstadoProducto(valor: string | undefined): valor is EstadoProducto {
  return valor !== undefined && valor in ESTADOS_PRODUCTO
}