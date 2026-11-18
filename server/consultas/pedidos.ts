import 'server-only'
import { asc, desc, eq, sql } from 'drizzle-orm'
import { connection } from 'next/server'
import { db } from '@/db'
import { pedidoItems, pedidos } from '@/db/schema'

// Sin caché: el estado cambia y es información privada
export async function obtenerPedidoPorToken(token: string) {
    await connection()
    if (!/^[0-9a-f-]{36}$/i.test(token)) return null

    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.token, token)).limit(1)
    if (!pedido) return null

    const items = await db.select().from(pedidoItems).where(eq(pedidoItems.pedidoId, pedido.id)).orderBy(asc(pedidoItems.id))
    return { ...pedido, items }
}
export async function listarPedidosDeUsuario(usuarioId: string) {
    await connection()

    return db
        .select({
            token: pedidos.token,
            folio: pedidos.folio,
            fechaEntrega: pedidos.fechaEntrega,
            bloqueInicio: pedidos.bloqueInicio,
            bloqueFin: pedidos.bloqueFin,
            destinatarioNombre: pedidos.destinatarioNombre,
            estadoPago: pedidos.estadoPago,
            estadoTrabajo: pedidos.estadoTrabajo,
            totalCentavos: pedidos.totalCentavos,
            productos: sql<string>`coalesce((
        SELECT string_agg(pi.cantidad || ' × ' || pi.nombre, ', ' ORDER BY pi.id)
        FROM pedido_items pi WHERE pi.pedido_id = pedidos.id
      ), '')`,
            imagen: sql<string | null>`(SELECT pi.imagen FROM pedido_items pi WHERE pi.pedido_id = pedidos.id ORDER BY pi.id LIMIT 1)`,
        })
        .from(pedidos)
        .where(eq(pedidos.usuarioId, usuarioId))
        .orderBy(desc(pedidos.fechaEntrega), desc(pedidos.creadoEn))
        .limit(100)
}