// Sin letras que se confunden (I, O, 0, 1)
const CARACTERES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// '2026-11-17' → '261117-K7QM'
export function generarFolio(hoy: string) {
  const aleatorio = Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => CARACTERES[b % CARACTERES.length]).join('')
  return `${hoy.slice(2).replaceAll('-', '')}-${aleatorio}`
}