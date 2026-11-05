// Luminancia relativa según WCAG
function luminancia(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

// Devuelve el color de texto que mejor se lee encima del color dado
export function textoSobre(hex: string) {
  return luminancia(hex) > 0.4 ? '#2b2420' : '#ffffff'
}

// Indica si un fondo es oscuro, para invertir los colores de texto
export function esOscuro(hex: string) {
  return luminancia(hex) < 0.2
}

function hexARgb(hex: string) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
}

// Mezcla dos colores; peso = proporción del primero (0 a 1)
export function mezclar(a: string, b: string, peso: number) {
  const [ra, ga, ba] = hexARgb(a)
  const [rb, gb, bb] = hexARgb(b)
  const canal = (x: number, y: number) =>
    Math.round(x * peso + y * (1 - peso)).toString(16).padStart(2, '0')
  return `#${canal(ra, rb)}${canal(ga, gb)}${canal(ba, bb)}`
}