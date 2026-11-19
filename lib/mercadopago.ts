import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { MercadoPagoConfig, Payment, Preference } from 'mercadopago'

const cliente = process.env.MP_ACCESS_TOKEN
  ? new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN, options: { timeout: 10_000 } })
  : null

export function mercadoPagoDisponible() {
  return cliente !== null
}

type DatosPreferencia = {
  pedidoId: number
  folio: string
  token: string
  totalCentavos: number
  venceEn: Date
  compradorEmail: string | null
  compradorNombre: string
}

// Crea el "enlace de pago" de Checkout Pro para un pedido
export async function crearPreferencia(d: DatosPreferencia) {
  if (!cliente) throw new Error('Mercado Pago no está configurado')

  const sitio = process.env.SITIO_URL!
  const urlPedido = `${sitio}/pedido/${d.token}`

  const preferencia = await new Preference(cliente).create({
    body: {
      // Un solo concepto con el total: así el monto cobrado es exactamente el del pedido
      items: [
        {
          id: d.folio,
          title: `Pedido ${d.folio}`,
          quantity: 1,
          unit_price: d.totalCentavos / 100,
          currency_id: 'MXN',
        },
      ],
      external_reference: String(d.pedidoId), // así sabemos a qué pedido pertenece cada pago
      notification_url: `${sitio}/api/pagos/mercadopago`,
      back_urls: {
        success: `${urlPedido}?pago=aprobado`,
        pending: `${urlPedido}?pago=pendiente`,
        failure: `${urlPedido}?pago=fallido`,
      },
      auto_return: 'approved',
      // El enlace deja de funcionar cuando vence nuestro plazo
      expires: true,
      expiration_date_from: new Date().toISOString(),
      expiration_date_to: d.venceEn.toISOString(),
      payment_methods: {
        excluded_payment_types: [{ id: 'ticket' }, { id: 'atm' }], // sin efectivo ni cajeros
        installments: 1, // de contado; si quieren meses sin intereses, se cambia aquí
      },
      payer: { email: d.compradorEmail ?? undefined, name: d.compradorNombre },
      statement_descriptor: 'FLORES ACAPULCO',
    },
  })

  if (!preferencia.id || !preferencia.init_point) throw new Error('Mercado Pago no devolvió el enlace de pago')
  return { preferenciaId: preferencia.id, urlPago: preferencia.init_point }
}

// Consulta un pago directamente a Mercado Pago (la única fuente confiable)
export async function obtenerPago(pagoId: string) {
  if (!cliente) throw new Error('Mercado Pago no está configurado')
  return new Payment(cliente).get({ id: pagoId })
}

// Comprueba que un aviso del webhook viene realmente de Mercado Pago
export function firmaWebhookValida(xSignature: string | null, xRequestId: string | null, dataId: string | null) {
  const secreto = process.env.MP_WEBHOOK_SECRET
  if (!secreto || !xSignature || !dataId) return false

  // El encabezado viene como "ts=...,v1=..."
  const partes = Object.fromEntries(
    xSignature.split(',').map((p) => p.trim().split('=') as [string, string]),
  )
  const ts = partes.ts
  const firma = partes.v1
  if (!ts || !firma) return false

  // Se omite cualquier par cuyo valor no venga en la notificación
  const manifiesto =
    `id:${dataId.toLowerCase()};` + (xRequestId ? `request-id:${xRequestId};` : '') + `ts:${ts};`

  const esperada = createHmac('sha256', secreto).update(manifiesto).digest('hex')
  const a = Buffer.from(esperada)
  const b = Buffer.from(firma)
  return a.length === b.length && timingSafeEqual(a, b)
}