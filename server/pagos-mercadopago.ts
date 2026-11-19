import 'server-only'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { pedidoEventos, pedidos } from '@/db/schema'
import { obtenerPago } from '@/lib/mercadopago'
import { formatearPrecio } from '@/lib/utils'

export type ResultadoPago = 'aprobado' | 'revisar' | 'duplicado' | 'contracargo' | 'reembolso' | null

const MARGEN_MS = 5 * 60_000 // tolerancia por diferencias de reloj

export async function procesarPagoMercadoPago(pagoId: string): Promise<{ pedidoId: number; resultado: ResultadoPago } | null> {
  // Siempre se consulta a Mercado Pago: el aviso solo dice "revisa este pago"
  let pago
  try {
    pago = await obtenerPago(pagoId)
  } catch (error) {
    // Pago inexistente (por ejemplo, la simulación del panel de Mercado Pago): no hay nada que hacer
    const status = (error as { status?: number; cause?: { status?: number } })?.status ?? (error as { cause?: { status?: number } })?.cause?.status
    if (status === 404) {
      console.warn(`Mercado Pago: el pago ${pagoId} no existe; se ignora el aviso`)
      return null
    }
    throw error // otros errores (red, Mercado Pago caído): que reintente
  }

  const pedidoId = Number(pago.external_reference)
  if (!Number.isInteger(pedidoId) || pedidoId <= 0) return null

  const idPago = String(pago.id)
  const estado = pago.status ?? 'desconocido'
  const detalle = pago.status_detail ?? null
  const montoCentavos = Math.round((pago.transaction_amount ?? 0) * 100)
  const aprobadoEn = pago.date_approved ? new Date(pago.date_approved) : null

  const resultado = await db.transaction(async (tx): Promise<ResultadoPago> => {
    const [p] = await tx
      .select({
        estadoPago: pedidos.estadoPago,
        estadoTrabajo: pedidos.estadoTrabajo,
        metodoPago: pedidos.metodoPago,
        totalCentavos: pedidos.totalCentavos,
        pagoVenceEn: pedidos.pagoVenceEn,
        mpPagoId: pedidos.mpPagoId,
        mpEstado: pedidos.mpEstado,
      })
      .from(pedidos)
      .where(eq(pedidos.id, pedidoId))
      .for('update') // si llegan dos avisos a la vez, se procesan uno tras otro

    if (!p || p.metodoPago !== 'mercadopago') return null

    const anotar = (extra: Partial<typeof pedidos.$inferInsert> = {}) =>
      tx.update(pedidos).set({ mpPagoId: idPago, mpEstado: estado, mpDetalle: detalle, ...extra }).where(eq(pedidos.id, pedidoId))
    const evento = (de: string, a: string, nota: string) =>
      tx.insert(pedidoEventos).values({ pedidoId, tipo: 'pago', de, a, nota })

    // ───────── Pago aprobado ─────────
    if (estado === 'approved') {
      if (p.estadoPago === 'pagado') {
        if (p.mpPagoId === idPago) return null // aviso repetido
        await tx.update(pedidos).set({ pagoTardio: true }).where(eq(pedidos.id, pedidoId))
        await evento('pagado', 'pagado', `Mercado Pago aprobó un segundo pago (#${idPago}). Reembolsa uno de los dos.`)
        return 'duplicado'
      }

      const montoCorrecto = montoCentavos === p.totalCentavos && pago.currency_id === 'MXN'
      const vigente =
        (p.estadoPago === 'pendiente' || p.estadoPago === 'en_revision') &&
        p.estadoTrabajo !== 'cancelado' &&
        (!p.pagoVenceEn || !aprobadoEn || aprobadoEn.getTime() <= p.pagoVenceEn.getTime() + MARGEN_MS)

      if (montoCorrecto && vigente) {
        await anotar({ estadoPago: 'pagado', pagoTardio: false })
        await evento(p.estadoPago, 'pagado', `Pago aprobado por Mercado Pago (#${idPago})`)
        return 'aprobado'
      }

      if (p.mpPagoId === idPago && p.mpEstado === 'approved') return null // ya se marcó para revisión antes
      await anotar({ pagoTardio: true })
      await evento(
        p.estadoPago,
        p.estadoPago,
        montoCorrecto
          ? `Mercado Pago aprobó el pago (#${idPago}) cuando el pedido ya no estaba vigente. Decide si reprogramas o reembolsas.`
          : `El pago de Mercado Pago (#${idPago}) por ${formatearPrecio(montoCentavos)} no coincide con el total. Revísalo.`,
      )
      return 'revisar'
    }

    // ───────── Reembolso o contracargo de un pago que ya teníamos ─────────
    if (estado === 'refunded' || estado === 'charged_back') {
      if (p.mpPagoId !== idPago || p.mpEstado === estado) return null
      const marcarReembolsado = estado === 'refunded' && p.estadoPago === 'pagado' && p.estadoTrabajo === 'cancelado'
      await anotar(marcarReembolsado ? { estadoPago: 'reembolsado' } : {})
      await evento(
        p.estadoPago,
        marcarReembolsado ? 'reembolsado' : p.estadoPago,
        estado === 'refunded' ? 'Mercado Pago registró un reembolso' : 'El cliente desconoció el cargo con su banco (contracargo)',
      )
      return estado === 'refunded' ? 'reembolso' : 'contracargo'
    }

    // ───────── Pendiente, en proceso, rechazado, cancelado ─────────
    // Solo se anota si el pedido sigue esperando pago; nunca se "baja" un pedido ya pagado
    if (p.estadoPago === 'pendiente') await anotar()
    return null
  })

  return { pedidoId, resultado }
}