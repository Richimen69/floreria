import 'server-only'
import { and, asc, desc, eq, gt, ilike, lt, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@/db'
import { pedidoItems, pedidos, pedidoEventos, user } from '@/db/schema'
import { sumarDias } from '@/lib/fechas'

export type FiltroPedidos = 'por-atender' | 'pendiente-pago' | 'pagados' | 'historial'

export async function listarPedidosAdmin({ filtro, q }: { filtro: FiltroPedidos; q: string }) {
    const condiciones: SQL[] = []
    const activo = sql`${pedidos.estadoTrabajo} NOT IN ('entregado', 'cancelado')`

    if (filtro === 'por-atender') condiciones.push(activo)
    if (filtro === 'pendiente-pago') condiciones.push(activo, sql`${pedidos.estadoPago} IN ('pendiente', 'en_revision')`)
    if (filtro === 'pagados') condiciones.push(activo, eq(pedidos.estadoPago, 'pagado'))
    if (filtro === 'historial') condiciones.push(sql`${pedidos.estadoTrabajo} IN ('entregado', 'cancelado')`)

    if (q) {
        const patron = `%${q.replace(/[%_\\]/g, '\\$&')}%`
        condiciones.push(
            or(
                ilike(pedidos.folio, patron),
                ilike(pedidos.compradorNombre, patron),
                ilike(pedidos.destinatarioNombre, patron),
                ilike(pedidos.compradorTelefono, patron),
            )!,
        )
    }

    // Lo pendiente, del más próximo al más lejano; el historial, del más reciente al más antiguo
    const orden =
        filtro === 'historial'
            ? [desc(pedidos.fechaEntrega), desc(pedidos.bloqueInicio)]
            : [asc(pedidos.fechaEntrega), asc(pedidos.bloqueInicio), asc(pedidos.creadoEn)]

    return db
        .select({
            id: pedidos.id,
            folio: pedidos.folio,
            origen: pedidos.origen,
            estadoPago: pedidos.estadoPago,
            estadoTrabajo: pedidos.estadoTrabajo,
            fechaEntrega: pedidos.fechaEntrega,
            bloqueInicio: pedidos.bloqueInicio,
            bloqueFin: pedidos.bloqueFin,
            destinatarioNombre: pedidos.destinatarioNombre,
            coloniaNombre: pedidos.coloniaNombre,
            zonaNombre: pedidos.zonaNombre,
            tipoLugar: pedidos.tipoLugar,
            nombreLugar: pedidos.nombreLugar,
            totalCentavos: pedidos.totalCentavos,
            productos: sql<string>`coalesce((
        SELECT string_agg(pi.cantidad || ' × ' || pi.nombre, ', ' ORDER BY pi.id)
        FROM pedido_items pi WHERE pi.pedido_id = pedidos.id
      ), '')`,
        })
        .from(pedidos)
        .where(condiciones.length ? and(...condiciones) : undefined)
        .orderBy(...orden)
        .limit(filtro === 'historial' ? 100 : 500)
}

export type FilaPedidoAdmin = Awaited<ReturnType<typeof listarPedidosAdmin>>[number]

export async function obtenerPedidoAdmin(id: number) {
    const [pedido] = await db.select().from(pedidos).where(eq(pedidos.id, id)).limit(1)
    if (!pedido) return null

    const [items, eventos] = await Promise.all([
        db.select().from(pedidoItems).where(eq(pedidoItems.pedidoId, id)).orderBy(asc(pedidoItems.id)),
        db
            .select({
                id: pedidoEventos.id,
                tipo: pedidoEventos.tipo,
                de: pedidoEventos.de,
                a: pedidoEventos.a,
                nota: pedidoEventos.nota,
                creadoEn: pedidoEventos.creadoEn,
                usuario: user.name,
            })
            .from(pedidoEventos)
            .leftJoin(user, eq(pedidoEventos.usuarioId, user.id))
            .where(eq(pedidoEventos.pedidoId, id))
            .orderBy(desc(pedidoEventos.creadoEn)),
    ])

    return { ...pedido, items, eventos }
}