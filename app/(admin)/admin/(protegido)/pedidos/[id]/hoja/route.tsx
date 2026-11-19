import { renderToBuffer } from '@react-pdf/renderer'
import { DocumentoEntregas } from '@/components/pdf/HojaEntrega'
import { requireAdmin } from '@/lib/permisos'
import { obtenerAjustes } from '@/server/consultas/ajustes'
import { obtenerPedidoAdmin } from '@/server/consultas/pedidos-admin'
import { datosHojaEntrega } from '@/server/hojas-entrega'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  // Las rutas no pasan por el layout del panel: la protección va aquí
  await requireAdmin()

  const { id } = await params
  const pedido = await obtenerPedidoAdmin(Number(id))
  if (!pedido) return new Response('Pedido no encontrado', { status: 404 })

  const ajustes = await obtenerAjustes()
  const hoja = await datosHojaEntrega(pedido, ajustes)
  const pdf = await renderToBuffer(<DocumentoEntregas hojas={[hoja]} />)

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="entrega-${pedido.folio}.pdf"`,
      'Cache-Control': 'no-store',
    },
  })
}