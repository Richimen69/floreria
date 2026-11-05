export function enlaceWhatsapp(numero: string | null, mensaje?: string) {
  if (!numero) return null
  const texto = mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''
  return `https://wa.me/${numero}${texto}`
}