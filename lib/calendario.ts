import { diaSemana, restarMinutos, sumarDias } from '@/lib/fechas'

export type BloqueConfig = { inicio: string; fin: string; minutosCierre: number; capacidad: number }

export type ConfigCalendario = {
  horizonteDias: number
  semana: Record<number, BloqueConfig[]>
  excepciones: {
    id: number
    nombre: string
    fechaInicio: string
    fechaFin: string
    tipo: 'cerrado' | 'no_disponible' | 'especial'
    nota: string | null
    bloques: BloqueConfig[]
  }[]
  temporadasCerradas: { nombre: string; fechaInicio: string; fechaFin: string }[]
}

export type EstadoBloque = BloqueConfig & {
  clave: string        // 'HH:MM-HH:MM', identifica el bloque dentro de su fecha
  ocupados: number
  disponible: boolean
  motivo: string | null
}

export type DiaEntrega = {
  fecha: string
  disponible: boolean
  motivo: string | null
  nota: string | null
  bloques: EstadoBloque[]
}

export type Ahora = { fecha: string; hora: string }

export const NO_DISPONIBLE = 'Reservas para esta fecha aún no disponibles'

export function claveBloque(b: { inicio: string; fin: string }) {
  return `${b.inicio}-${b.fin}`
}

function diaCerrado(fecha: string, motivo: string, nota: string | null = null): DiaEntrega {
  return { fecha, disponible: false, motivo, nota, bloques: [] }
}

/**
 * Evalúa una fecha de entrega.
 * ocupacion: pedidos ya registrados por clave de bloque en esa fecha.
 * fechaMinima: la que exige la anticipación de los productos del carrito.
 */
export function evaluarFecha(
  config: ConfigCalendario,
  fecha: string,
  ahora: Ahora,
  ocupacion: Record<string, number> = {},
  fechaMinima?: string,
): DiaEntrega {
  if (fecha < ahora.fecha) return diaCerrado(fecha, 'Esta fecha ya pasó')
  if (fechaMinima && fecha < fechaMinima) {
    return diaCerrado(fecha, 'Tu pedido requiere más días de anticipación')
  }
  if (fecha > sumarDias(ahora.fecha, config.horizonteDias)) {
    return diaCerrado(fecha, 'Aún no recibimos pedidos para esta fecha')
  }

  const temporada = config.temporadasCerradas.find((t) => t.fechaInicio <= fecha && fecha <= t.fechaFin)
  if (temporada) return diaCerrado(fecha, NO_DISPONIBLE)

  const excepcion = config.excepciones.find((e) => e.fechaInicio <= fecha && fecha <= e.fechaFin)
  let bloques: BloqueConfig[]

  if (excepcion?.tipo === 'cerrado') return diaCerrado(fecha, 'No hay entregas este día', excepcion.nota)
  if (excepcion?.tipo === 'no_disponible') return diaCerrado(fecha, NO_DISPONIBLE, excepcion.nota)

  if (excepcion?.tipo === 'especial') {
    bloques = excepcion.bloques
  } else {
    bloques = config.semana[diaSemana(fecha)] ?? []
  }

  if (bloques.length === 0) return diaCerrado(fecha, 'No hay entregas este día')

  const estados: EstadoBloque[] = [...bloques]
    .sort((a, b) => a.inicio.localeCompare(b.inicio) || a.fin.localeCompare(b.fin))
    .map((b) => {
      const clave = claveBloque(b)
      const ocupados = ocupacion[clave] ?? 0
      let motivo: string | null = null

      if (fecha === ahora.fecha && ahora.hora >= restarMinutos(b.inicio, b.minutosCierre)) {
        motivo = 'Cerrado para hoy'
      } else if (ocupados >= b.capacidad) {
        motivo = 'Cupo lleno'
      }

      return { ...b, clave, ocupados, disponible: motivo === null, motivo }
    })

  const disponible = estados.some((b) => b.disponible)
  return {
    fecha,
    disponible,
    motivo: disponible ? null : 'Todos los horarios de este día están cerrados o llenos',
    nota: excepcion?.nota ?? null,
    bloques: estados,
  }
}

// Siguientes fechas con al menos un bloque disponible
export function proximasFechasDisponibles(
  config: ConfigCalendario,
  ahora: Ahora,
  cantidad: number,
  opciones: { desde?: string; fechaMinima?: string; ocupacionPorFecha?: Record<string, Record<string, number>> } = {},
) {
  const resultado: DiaEntrega[] = []
  let fecha = opciones.desde ?? ahora.fecha
  const limite = sumarDias(ahora.fecha, config.horizonteDias)

  while (fecha <= limite && resultado.length < cantidad) {
    const dia = evaluarFecha(config, fecha, ahora, opciones.ocupacionPorFecha?.[fecha], opciones.fechaMinima)
    if (dia.disponible) resultado.push(dia)
    fecha = sumarDias(fecha, 1)
  }
  return resultado
}

export type PedidoAfectado = {
  fecha: string
  bloque: string
  total: number
  pedidos: { id: number; folio: string }[]
  motivo: string
}

/**
 * ¿Un bloque con pedidos seguiría existiendo con esta configuración?
 * Solo revisa la estructura (días, horarios y cupos); no la hora actual ni el horizonte.
 */
export function revisarBloqueEnConfig(
  config: ConfigCalendario,
  fecha: string,
  inicio: string,
  fin: string,
  total: number,
): string | null {
  const excepcion = config.excepciones.find((e) => e.fechaInicio <= fecha && fecha <= e.fechaFin)

  if (excepcion?.tipo === 'cerrado') return 'El día quedaría cerrado'
  if (excepcion?.tipo === 'no_disponible') return 'El día quedaría como “reservas no disponibles”'

  const bloques = excepcion?.tipo === 'especial' ? excepcion.bloques : (config.semana[diaSemana(fecha)] ?? [])
  if (bloques.length === 0) return 'Ese día ya no tendría entregas'

  const bloque = bloques.find((b) => b.inicio === inicio && b.fin === fin)
  if (!bloque) return `El horario ${inicio}–${fin} ya no existiría ese día`
  if (bloque.capacidad < total) return `El cupo bajaría a ${bloque.capacidad} y ya hay ${total} pedido(s)`

  return null
}