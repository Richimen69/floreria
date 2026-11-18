import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { fechaLarga } from '@/lib/fechas'
import { ESTADOS_PAGO, ESTADOS_TRABAJO } from '@/lib/pedidos'
import { obtenerSesion } from '@/lib/permisos'
import { formatearPrecio } from '@/lib/utils'
import { ahoraEnAcapulco } from '@/server/calendario'
import { listarPedidosDeUsuario } from '@/server/consultas/pedidos'

export const metadata: Metadata = { title: 'Mis pedidos', robots: { index: false } }

type Pedido = Awaited<ReturnType<typeof listarPedidosDeUsuario>>[number]

function TarjetaPedido({ p }: { p: Pedido }) {
  const trabajo = ESTADOS_TRABAJO[p.estadoTrabajo]
  const pago = ESTADOS_PAGO[p.estadoPago]

  return (
    <Link href={`/pedido/${p.token}`} className="flex gap-4 rounded-tarjeta border border-borde bg-superficie p-4 transition-shadow hover:shadow-md">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-primario-suave">
        {p.imagen && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imagen} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-semibold text-texto">{p.folio}</span>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${trabajo.clase}`}>{trabajo.texto}</span>
          {p.estadoPago !== 'pagado' && (
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${pago.clase}`}>{pago.texto}</span>
          )}
        </div>
        <p className="truncate text-sm text-texto">{p.productos}</p>
        <p className="text-xs capitalize text-texto-suave">
          {fechaLarga(p.fechaEntrega)}, {p.bloqueInicio} a {p.bloqueFin} · Para {p.destinatarioNombre}
        </p>
      </div>
      <span className="shrink-0 text-sm font-semibold text-texto">{formatearPrecio(p.totalCentavos)}</span>
    </Link>
  )
}

async function Contenido() {
  const sesion = await obtenerSesion()
  if (!sesion) redirect('/cuenta/entrar?volver=/cuenta/pedidos')

  const [lista, ahora] = await Promise.all([listarPedidosDeUsuario(sesion.user.id), ahoraEnAcapulco()])

  // Próximos: entregas de hoy en adelante que no están canceladas
  const proximos = lista
    .filter((p) => p.fechaEntrega >= ahora.fecha && p.estadoTrabajo !== 'cancelado' && p.estadoTrabajo !== 'entregado')
    .reverse() // el más cercano primero
  const anteriores = lista.filter((p) => !proximos.includes(p))

  if (lista.length === 0) {
    return (
      <div className="rounded-tarjeta border-2 border-dashed border-borde px-6 py-16 text-center">
        <p className="font-titulos text-2xl text-texto">Aún no tienes pedidos</p>
        <Link href="/catalogo" className="mt-6 inline-block rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario">
          Ver catálogo
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {proximos.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-titulos text-xl font-semibold text-texto">Próximas entregas</h2>
          {proximos.map((p) => <TarjetaPedido key={p.folio} p={p} />)}
        </section>
      )}
      {anteriores.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-titulos text-xl font-semibold text-texto">Anteriores</h2>
          {anteriores.map((p) => <TarjetaPedido key={p.folio} p={p} />)}
        </section>
      )}
    </div>
  )
}

export default function MisPedidosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-10">
      <h1 className="mb-6 font-titulos text-3xl font-semibold text-texto sm:text-4xl">Mis pedidos</h1>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-tarjeta bg-borde" />}>
        <Contenido />
      </Suspense>
    </div>
  )
}