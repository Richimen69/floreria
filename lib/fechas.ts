const ZONA = 'America/Mexico_City' // hora de Acapulco

// Fecha de hoy en Acapulco como 'AAAA-MM-DD', sin importar la zona del servidor
export function hoyEnAcapulco(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA }).format(ahora)
}

const formatoCorto = new Intl.DateTimeFormat('es-MX', { day: 'numeric', month: 'short', timeZone: 'UTC' })

// '2027-04-30' → '30 abr'
export function fechaCorta(fecha: string) {
  return formatoCorto.format(new Date(`${fecha}T00:00:00Z`))
}
// Hora actual en Acapulco como 'HH:MM' (24 h)
export function horaEnAcapulco(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(ahora)
}

function aFechaUTC(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d))
}

export function sumarDias(fecha: string, dias: number) {
  const f = aFechaUTC(fecha)
  f.setUTCDate(f.getUTCDate() + dias)
  return f.toISOString().slice(0, 10)
}

// 0 = domingo … 6 = sábado
export function diaSemana(fecha: string) {
  return aFechaUTC(fecha).getUTCDay()
}

// '09:00' menos 30 → '08:30'
export function restarMinutos(hora: string, minutos: number) {
  const [h, m] = hora.split(':').map(Number)
  const total = Math.max(0, h * 60 + m - minutos)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const formatoLargo = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })

// '2027-05-10' → 'lunes, 10 de mayo'
export function fechaLarga(fecha: string) {
  return formatoLargo.format(aFechaUTC(fecha))
}