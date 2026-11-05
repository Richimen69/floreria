export function generarSlug(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const formatoMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })

export function formatearPrecio(centavos: number) {
  return formatoMXN.format(centavos / 100)
}

export function centavosATexto(centavos: number | null) {
  return centavos == null ? '' : (centavos / 100).toFixed(2)
}