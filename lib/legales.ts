export const PAGINAS_LEGALES = [
  { slug: 'aviso-de-privacidad', titulo: 'Aviso de privacidad', descripcion: 'Qué datos personales recaban y para qué los usan' },
  { slug: 'terminos', titulo: 'Términos y condiciones', descripcion: 'Reglas de compra, precios, entregas y pagos' },
  { slug: 'cancelaciones', titulo: 'Cancelaciones y reembolsos', descripcion: 'Cuándo se puede cancelar y cómo se reembolsa' },
] as const

export type SlugLegal = (typeof PAGINAS_LEGALES)[number]['slug']

export function esSlugLegal(valor: string): valor is SlugLegal {
  return PAGINAS_LEGALES.some((p) => p.slug === valor)
}