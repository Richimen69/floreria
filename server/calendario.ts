import 'server-only'
import { and, count, gte, lte, ne, notInArray, sql, gt, isNull, or } from 'drizzle-orm'
import { connection } from 'next/server'
import { db } from '@/db'
import { pedidos } from '@/db/schema'
import { claveBloque, ConfigCalendario, PedidoAfectado, revisarBloqueEnConfig, evaluarFecha, proximasFechasDisponibles, type Ahora } from '@/lib/calendario'
import { horaEnAcapulco, hoyEnAcapulco, sumarDias } from '@/lib/fechas'
import { PAGOS_INACTIVOS } from '@/lib/pedidos'
import { obtenerConfigCalendario } from '@/server/consultas/calendario'

// Un pedido ocupa cupo mientras no esté cancelado, rechazado o reembolsado
export const pedidoOcupaCupo = and(
  ne(pedidos.estadoTrabajo, 'cancelado'),
  notInArray(pedidos.estadoPago, PAGOS_INACTIVOS),
  or(ne(pedidos.estadoPago, 'pendiente'), isNull(pedidos.pagoVenceEn), gt(pedidos.pagoVenceEn, sql`now()`)),
)

export async function ahoraEnAcapulco(): Promise<Ahora> {
  await connection()
  const ahora = new Date()
  return { fecha: hoyEnAcapulco(ahora), hora: horaEnAcapulco(ahora) }
}

// Pedidos por fecha y bloque: { '2027-05-10': { '08:00-15:00': 23 } }
export async function ocupacionRango(desde: string, hasta: string) {
  const filas = await db
    .select({ fecha: pedidos.fechaEntrega, inicio: pedidos.bloqueInicio, fin: pedidos.bloqueFin, total: count() })
    .from(pedidos)
    .where(and(gte(pedidos.fechaEntrega, desde), lte(pedidos.fechaEntrega, hasta), pedidoOcupaCupo))
    .groupBy(pedidos.fechaEntrega, pedidos.bloqueInicio, pedidos.bloqueFin)

  const resultado: Record<string, Record<string, number>> = {}
  for (const f of filas) {
    ; (resultado[f.fecha] ??= {})[claveBloque(f)] = f.total
  }
  return resultado
}

export async function diaDeEntrega(fecha: string, fechaMinima?: string) {
  const [config, ahora, ocupacion] = await Promise.all([
    obtenerConfigCalendario(),
    ahoraEnAcapulco(),
    ocupacionRango(fecha, fecha),
  ])
  return evaluarFecha(config, fecha, ahora, ocupacion[fecha] ?? {}, fechaMinima)
}

export async function proximosDias(cantidad: number) {
  const [config, ahora] = await Promise.all([obtenerConfigCalendario(), ahoraEnAcapulco()])
  const ocupacion = await ocupacionRango(ahora.fecha, sumarDias(ahora.fecha, cantidad))
  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = sumarDias(ahora.fecha, i)
    return evaluarFecha(config, fecha, ahora, ocupacion[fecha] ?? {})
  })
}

export async function siguientesFechasDisponibles(cantidad: number, fechaMinima?: string) {
  const [config, ahora] = await Promise.all([obtenerConfigCalendario(), ahoraEnAcapulco()])
  const ocupacionPorFecha = await ocupacionRango(ahora.fecha, sumarDias(ahora.fecha, config.horizonteDias))
  return proximasFechasDisponibles(config, ahora, cantidad, { fechaMinima, ocupacionPorFecha })
}

// Pedidos activos de hoy en adelante que no encajarían con una configuración nueva
export async function pedidosAfectados(config: ConfigCalendario): Promise<PedidoAfectado[]> {
  const { fecha: hoy } = await ahoraEnAcapulco()

  const filas = await db
    .select({
      fecha: pedidos.fechaEntrega,
      inicio: pedidos.bloqueInicio,
      fin: pedidos.bloqueFin,
      total: count(),
      ids: sql<number[]>`array_agg(${pedidos.id} ORDER BY ${pedidos.folio})`,
      folios: sql<string[]>`array_agg(${pedidos.folio} ORDER BY ${pedidos.folio})`,
    })
    .from(pedidos)
    .where(and(gte(pedidos.fechaEntrega, hoy), pedidoOcupaCupo))
    .groupBy(pedidos.fechaEntrega, pedidos.bloqueInicio, pedidos.bloqueFin)
    .orderBy(pedidos.fechaEntrega, pedidos.bloqueInicio)

  return filas.flatMap((f) => {
    const motivo = revisarBloqueEnConfig(config, f.fecha, f.inicio, f.fin, f.total)
    if (!motivo) return []
    return [
      {
        fecha: f.fecha,
        bloque: `${f.inicio}–${f.fin}`,
        total: f.total,
        pedidos: f.ids.map((id, i) => ({ id, folio: f.folios[i] })),
        motivo,
      },
    ]
  })
}