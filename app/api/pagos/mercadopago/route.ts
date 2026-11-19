import { revalidateTag } from 'next/cache'
import { after } from 'next/server'
import { firmaWebhookValida } from '@/lib/mercadopago'
import { procesarPagoMercadoPago } from '@/server/pagos-mercadopago'
import { avisarFloreria, notificarPagoConfirmado } from '@/server/notificaciones'

const responder = (status: number) => new Response(null, { status })

export async function POST(request: Request) {
  const url = new URL(request.url)
  const tipo = url.searchParams.get('type')
  const dataId = url.searchParams.get('data.id')

  // Los avisos antiguos (topic=payment) y los de "merchant_order" se ignoran:
  // solo procesamos el webhook firmado de pagos
  if (tipo !== 'payment' || !dataId) return responder(200)

  if (!firmaWebhookValida(request.headers.get('x-signature'), request.headers.get('x-request-id'), dataId)) {
    console.warn('Webhook de Mercado Pago con firma inválida', { dataId })
    return responder(401)
  }

  try {
    const r = await procesarPagoMercadoPago(dataId)
    if (r?.resultado) {
      // Que el panel y los listados muestren el cambio de inmediato
      revalidateTag('pedidos', { expire: 0 })

      const { pedidoId, resultado } = r
      after(async () => {
        if (resultado === 'aprobado') {
          await notificarPagoConfirmado(pedidoId)
          await avisarFloreria(pedidoId, 'Pago confirmado con Mercado Pago')
        } else if (resultado === 'revisar') {
          await avisarFloreria(pedidoId, 'Pago de Mercado Pago por revisar')
        } else if (resultado === 'duplicado') {
          await avisarFloreria(pedidoId, 'Pago duplicado: reembolsa uno')
        } else if (resultado === 'contracargo') {
          await avisarFloreria(pedidoId, 'Contracargo en Mercado Pago')
        }
      })
    }
    return responder(200)
  } catch (error) {
    // Con un error, Mercado Pago reintentará más tarde
    console.error('Error al procesar webhook de Mercado Pago:', error)
    return responder(500)
  }
}