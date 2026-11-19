'use server'

import { and, eq, gt, sql } from 'drizzle-orm'
import { db } from '@/db'
import { pedidos } from '@/db/schema'
import { crearPreferencia } from '@/lib/mercadopago'

// Genera un enlace de pago nuevo para un pedido pendiente (si el cliente cerró la página de pago)
export async function enlacePagoMercadoPago(token: string): Promise<{ ok: true; url: string } | { ok: false; mensaje: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { ok: false, mensaje: 'Pedido no válido' }

  const [p] = await db
    .select()
    .from(pedidos)
    .where(
      and(
        eq(pedidos.token, token),
        eq(pedidos.estadoPago, 'pendiente'),
        eq(pedidos.metodoPago, 'mercadopago'),
        gt(pedidos.pagoVenceEn, sql`now()`),
      ),
    )
    .limit(1)

  if (!p || !p.pagoVenceEn) return { ok: false, mensaje: 'Este pedido ya no se puede pagar' }

  try {
    const { preferenciaId, urlPago } = await crearPreferencia({
      pedidoId: p.id,
      folio: p.folio,
      token: p.token,
      totalCentavos: p.totalCentavos,
      venceEn: p.pagoVenceEn,
      compradorEmail: p.compradorEmail,
      compradorNombre: p.compradorNombre,
    })
    await db.update(pedidos).set({ mpPreferenciaId: preferenciaId }).where(eq(pedidos.id, p.id))
    return { ok: true, url: urlPago }
  } catch (error) {
    console.error('No se pudo crear la preferencia de Mercado Pago:', error)
    return { ok: false, mensaje: 'Mercado Pago no respondió. Intenta de nuevo en un momento.' }
  }
}