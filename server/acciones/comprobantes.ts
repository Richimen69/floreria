'use server'

import { randomUUID } from 'node:crypto'
import { and, eq, gt, sql } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { after } from 'next/server' // ← NUEVO
import { db } from '@/db'
import { pedidoEventos, pedidos } from '@/db/schema'
import { subirArchivoPrivadoR2 } from '@/lib/r2'
import { notificarComprobanteSubido } from '@/server/notificaciones' // ← NUEVO

const TIPOS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}
const MAXIMO = 5 * 1024 * 1024

export async function subirComprobante(token: string, formData: FormData): Promise<{ ok: boolean; mensaje: string }> {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return { ok: false, mensaje: 'Pedido no válido' }

  const archivo = formData.get('comprobante')
  if (!(archivo instanceof File) || archivo.size === 0) return { ok: false, mensaje: 'Elige una imagen o PDF de tu comprobante' }
  if (!TIPOS[archivo.type]) return { ok: false, mensaje: 'Sube una foto (JPG, PNG, WebP) o un PDF' }
  if (archivo.size > MAXIMO) return { ok: false, mensaje: 'El archivo no debe pesar más de 5 MB' }

  const [pedido] = await db
    .select({ id: pedidos.id, estadoPago: pedidos.estadoPago, pagoVenceEn: pedidos.pagoVenceEn })
    .from(pedidos)
    .where(eq(pedidos.token, token))
    .limit(1)

  if (!pedido) return { ok: false, mensaje: 'Pedido no encontrado' }
  if (pedido.estadoPago !== 'pendiente') return { ok: false, mensaje: 'Este pedido ya no acepta comprobantes' }
  if (pedido.pagoVenceEn && pedido.pagoVenceEn < new Date()) return { ok: false, mensaje: 'El plazo para pagar ya venció' }

  const clave = `comprobantes/${pedido.id}/${randomUUID()}.${TIPOS[archivo.type]}`
  await subirArchivoPrivadoR2(clave, Buffer.from(await archivo.arrayBuffer()), archivo.type)

  const actualizado = await db.transaction(async (tx) => {
    const filas = await tx
      .update(pedidos)
      .set({ estadoPago: 'en_revision', comprobanteKey: clave, comprobanteTipo: archivo.type, comprobanteSubidoEn: new Date() })
      .where(and(eq(pedidos.id, pedido.id), eq(pedidos.estadoPago, 'pendiente'), gt(pedidos.pagoVenceEn, sql`now()`)))
      .returning({ id: pedidos.id })
    if (filas.length === 0) return false

    await tx.insert(pedidoEventos).values({
      pedidoId: pedido.id,
      tipo: 'pago',
      de: 'pendiente',
      a: 'en_revision',
      nota: 'Comprobante subido por el cliente',
    })
    return true
  })

  if (!actualizado) return { ok: false, mensaje: 'El plazo para pagar ya venció' }

  updateTag('pedidos')
  after(() => notificarComprobanteSubido(pedido.id)) // ← NUEVO: correo al cliente y a la florería
  return { ok: true, mensaje: 'Recibimos tu comprobante' }
}