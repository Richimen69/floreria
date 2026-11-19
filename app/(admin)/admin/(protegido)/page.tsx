import Link from 'next/link'
import { Suspense } from 'react'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { fechaLarga } from '@/lib/fechas'
import { ESTADOS_PAGO, ESTADOS_TRABAJO } from '@/lib/pedidos'
import { formatearPrecio } from '@/lib/utils'
import { ahoraEnAcapulco, proximosDias } from '@/server/calendario'
import { listarPedidosAdmin } from '@/server/consultas/pedidos-admin'
import { alertasCatalogo, indicadoresPedidos, pagosMercadoPagoPorRevisar } from '@/server/consultas/resumen'
import { vencerPedidosExpirados } from '@/server/vencimientos'

function Indicador({ titulo, valor, detalle, href, tono = 'normal' }: {
  titulo: string
  valor: string | number
  detalle?: string
  href?: string
  tono?: 'normal' | 'alerta'
}) {
  const contenido = (
    <>
      <p className="text-sm text-texto-suave">{titulo}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${tono === 'alerta' ? 'text-amber-700' : 'text-texto'}`}>{valor}</p>
      {detalle && <p className="mt-1 text-xs text-texto-suave">{detalle}</p>}
    </>
  )
  const clase = 'block rounded-tarjeta border border-borde bg-superficie p-4 sm:p-5'
  return href ? <Link href={href} className={`${clase} transition-shadow hover:shadow-md`}>{contenido}</Link> : <div className={clase}>{contenido}</div>
}

function Seccion({ titulo, accion, children }: { titulo: string; accion?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-tarjeta border border-borde bg-superficie">
      <header className="flex items-center justify-between gap-3 border-b border-borde px-4 py-3 sm:px-5">
        <h2 className="font-titulos text-lg font-semibold text-texto">{titulo}</h2>
        {accion}
      </header>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  )
}

const claseAlerta = 'rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 hover:bg-amber-100'

async function Contenido() {
  const ahora = await ahoraEnAcapulco()
  await vencerPedidosExpirados()

  const [indicadores, alertas, dias, porAtender, pagosRevisar] = await Promise.all([
    indicadoresPedidos(ahora.fecha),
    alertasCatalogo(),
    proximosDias(2),
    listarPedidosAdmin({ filtro: 'por-atender', q: '' }),
    pagosMercadoPagoPorRevisar(),
  ])
  const entregasHoy = porAtender.filter((p) => p.fechaEntrega === ahora.fecha)

  const hayAlertas =
    alertas.agotados + alertas.sinExistencias + alertas.insumosBajos + indicadores.reembolsos + indicadores.porRevisar + pagosRevisar.length > 0

  return (
    <div className="space-y-6">
      {/* Indicadores */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Indicador
          titulo="Pedidos de hoy"
          valor={indicadores.hoy}
          detalle={indicadores.porEntregarHoy > 0 ? `${indicadores.porEntregarHoy} por entregar` : 'Todo entregado'}
          href="/admin/pedidos"
        />
        <Indicador titulo="Pedidos de mañana" valor={indicadores.manana} href="/admin/pedidos?vista=manana" />
        <Indicador
          titulo="Pendientes de pago"
          valor={indicadores.pendientesPago}
          href="/admin/pedidos?vista=proximos&filtro=pendiente-pago"
          tono={indicadores.pendientesPago > 0 ? 'alerta' : 'normal'}
        />
        <Indicador titulo="Cobrado de entregas de hoy" valor={formatearPrecio(indicadores.cobradoHoy)} />
      </div>

      {/* Alertas */}
      {hayAlertas && (
        <div className="flex flex-wrap gap-2">
          {/* Pagos de Mercado Pago que necesitan revisión: uno por pedido */}
          {pagosRevisar.map((p) => (
            <Link
              key={p.id}
              href={`/admin/pedidos/${p.id}`}
              className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-800 hover:bg-red-100"
            >
              Pago de Mercado Pago por revisar · {p.folio}
            </Link>
          ))}
          {indicadores.porRevisar > 0 && (
            <Link href="/admin/pedidos?filtro=pendiente-pago" className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-900 hover:bg-blue-100">
              {indicadores.porRevisar} comprobante(s) por revisar
            </Link>
          )}
          {indicadores.reembolsos > 0 && (
            <Link href="/admin/pedidos?filtro=historial" className={claseAlerta}>
              {indicadores.reembolsos} pedido(s) pendientes de reembolso
            </Link>
          )}
          {alertas.agotados > 0 && (
            <Link href="/admin/productos?estado=agotados" className={claseAlerta}>
              {alertas.agotados} producto(s) agotados hoy
            </Link>
          )}
          {alertas.sinExistencias > 0 && (
            <Link href="/admin/productos?estado=sin-existencias" className={claseAlerta}>
              {alertas.sinExistencias} producto(s) sin existencias
            </Link>
          )}
          {alertas.insumosBajos > 0 && (
            <Link href="/admin/inventario?filtro=bajo-minimo" className={claseAlerta}>
              {alertas.insumosBajos} insumo(s) bajo mínimo
            </Link>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Entregas de hoy */}
        <Seccion
          titulo="Entregas de hoy por atender"
          accion={<Link href="/admin/pedidos" className="text-sm font-medium text-primario hover:underline">Ver todos</Link>}
        >
          {entregasHoy.length === 0 ? (
            <p className="py-6 text-center text-sm text-texto-suave">No hay entregas pendientes para hoy.</p>
          ) : (
            <ul className="-my-2 divide-y divide-borde">
              {entregasHoy.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/pedidos/${p.id}`} className="flex items-center gap-3 py-3 hover:opacity-80">
                    <span className="w-24 shrink-0 text-sm font-semibold tabular-nums text-texto">{p.bloqueInicio}–{p.bloqueFin}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-texto">
                        <span className="font-mono font-semibold">{p.folio}</span> · {p.productos}
                      </p>
                      <p className="truncate text-xs text-texto-suave">Para {p.destinatarioNombre} · {p.coloniaNombre}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADOS_TRABAJO[p.estadoTrabajo].clase}`}>
                        {ESTADOS_TRABAJO[p.estadoTrabajo].texto}
                      </span>
                      {p.estadoPago !== 'pagado' && (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADOS_PAGO[p.estadoPago].clase}`}>
                          {ESTADOS_PAGO[p.estadoPago].texto}
                        </span>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        {/* Cupos */}
        <Seccion
          titulo="Cupos"
          accion={<Link href="/admin/calendario" className="text-sm font-medium text-primario hover:underline">Calendario</Link>}
        >
          <div className="space-y-5">
            {dias.map((d, i) => (
              <div key={d.fecha} className="space-y-2">
                <p className="text-sm font-semibold capitalize text-texto">
                  {i === 0 ? 'Hoy' : 'Mañana'} · {fechaLarga(d.fecha)}
                </p>
                {d.bloques.length === 0 ? (
                  <p className="text-sm text-texto-suave">{d.motivo}</p>
                ) : (
                  d.bloques.map((b) => {
                    const porcentaje = Math.min(100, Math.round((b.ocupados / Math.max(1, b.capacidad)) * 100))
                    const lleno = b.ocupados >= b.capacidad
                    return (
                      <div key={b.clave} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-texto">
                            {b.inicio}–{b.fin}
                            {b.motivo === 'Cerrado para hoy' && <span className="ml-1 text-texto-suave">(cerrado)</span>}
                          </span>
                          <span className={`tabular-nums ${lleno ? 'font-semibold text-red-700' : 'text-texto-suave'}`}>
                            {b.ocupados} / {b.capacidad}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-fondo" role="progressbar" aria-valuenow={b.ocupados} aria-valuemax={b.capacidad}>
                          <div
                            className={`h-full rounded-full ${lleno ? 'bg-red-600' : porcentaje >= 80 ? 'bg-amber-500' : 'bg-acento'}`}
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            ))}
          </div>
        </Seccion>
      </div>
    </div>
  )
}

function Esqueleto() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-tarjeta bg-borde" />)}
      </div>
      <div className="h-80 rounded-tarjeta bg-borde" />
    </div>
  )
}

export default function ResumenPage() {
  return (
    <div>
      <EncabezadoPagina titulo="Resumen" descripcion="Lo importante del día." />
      <Suspense fallback={<Esqueleto />}>
        <Contenido />
      </Suspense>
    </div>
  )
}