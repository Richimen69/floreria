import Form from 'next/form'
import Link from 'next/link'
import { Suspense } from 'react'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { claseInput } from '@/components/ui/Campo'
import { fechaLarga, sumarDias } from '@/lib/fechas'
import { LUGARES } from '@/lib/lugares'
import { ESTADOS_PAGO, ESTADOS_TRABAJO } from '@/lib/pedidos'
import { formatearPrecio } from '@/lib/utils'
import { ahoraEnAcapulco } from '@/server/calendario'
import { listarPedidosAdmin, type FiltroPedidos } from '@/server/consultas/pedidos-admin'

type Params = { filtro?: string; q?: string }
type Props = { searchParams: Promise<Params> }

const PESTANAS: Record<FiltroPedidos, string> = {
  'por-atender': 'Por atender',
  'pendiente-pago': 'Pendientes de pago',
  pagados: 'Pagados',
  historial: 'Historial',
}

function Etiqueta({ clase, children }: { clase: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${clase}`}>{children}</span>
}

async function Contenido({ searchParams }: Props) {
  const sp = await searchParams
  const filtro: FiltroPedidos = sp.filtro && sp.filtro in PESTANAS ? (sp.filtro as FiltroPedidos) : 'por-atender'
  const q = (sp.q ?? '').trim().slice(0, 60)

  const [{ fecha: hoy }, lista] = await Promise.all([ahoraEnAcapulco(), listarPedidosAdmin({ filtro, q })])
  const manana = sumarDias(hoy, 1)

  function url(cambios: Partial<Params>) {
    const v = { filtro: filtro === 'por-atender' ? '' : filtro, q, ...cambios }
    const p = new URLSearchParams(Object.entries(v).filter(([, x]) => x) as [string, string][])
    return `/admin/pedidos${p.size ? `?${p}` : ''}`
  }

  function tituloDia(fecha: string) {
    if (filtro !== 'historial' && fecha < hoy) return `Atrasados · ${fechaLarga(fecha)}`
    if (fecha === hoy) return `Hoy · ${fechaLarga(fecha)}`
    if (fecha === manana) return `Mañana · ${fechaLarga(fecha)}`
    return fechaLarga(fecha)
  }

  const porDia = Object.groupBy(lista, (p) => p.fechaEntrega)

  return (
    <div className="space-y-4">
      {/* Pestañas */}
      <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-borde px-4 sm:mx-0 sm:px-0">
        {(Object.keys(PESTANAS) as FiltroPedidos[]).map((f) => (
          <Link
            key={f}
            href={url({ filtro: f === 'por-atender' ? '' : f, q: '' })}
            className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors ${
              filtro === f ? 'border-primario font-semibold text-primario-oscuro' : 'border-transparent text-texto-suave hover:text-texto'
            }`}
          >
            {PESTANAS[f]}
          </Link>
        ))}
      </nav>

      <Form action="/admin/pedidos" className="flex gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar por folio, nombre o teléfono…" className={claseInput} />
        {filtro !== 'por-atender' && <input type="hidden" name="filtro" value={filtro} />}
        <button type="submit" className="shrink-0 rounded-xl border border-borde bg-superficie px-4 text-sm font-medium text-texto hover:border-primario">
          Buscar
        </button>
      </Form>

      <p className="text-sm text-texto-suave">
        {lista.length} pedido(s)
        {q && (
          <> que coinciden con “{q}” · <Link href={url({ q: '' })} className="text-primario hover:underline">Quitar búsqueda</Link></>
        )}
      </p>

      {lista.length === 0 ? (
        <div className="rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
          <p className="font-titulos text-lg text-texto">
            {filtro === 'por-atender' && !q ? 'No hay pedidos por atender' : 'No hay pedidos aquí'}
          </p>
        </div>
      ) : (
        Object.entries(porDia).map(([fecha, delDia]) => {
          const atrasado = filtro !== 'historial' && fecha < hoy
          return (
            <section key={fecha} className="space-y-2">
              <h2 className={`text-base font-semibold capitalize ${atrasado ? 'text-red-700' : 'text-texto'}`}>
                {tituloDia(fecha)}
                <span className="ml-2 text-sm font-normal text-texto-suave">{delDia!.length}</span>
              </h2>

              <ul className={`divide-y divide-borde overflow-hidden rounded-tarjeta border bg-superficie ${atrasado ? 'border-red-200' : 'border-borde'}`}>
                {delDia!.map((p) => (
                  <li key={p.id}>
                    <Link href={`/admin/pedidos/${p.id}`} className="flex gap-3 p-4 hover:bg-fondo/60">
                      <span className="w-14 shrink-0 text-sm font-semibold tabular-nums text-texto">{p.bloqueInicio}</span>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-texto">{p.folio}</span>
                          <Etiqueta clase={ESTADOS_TRABAJO[p.estadoTrabajo].clase}>{ESTADOS_TRABAJO[p.estadoTrabajo].texto}</Etiqueta>
                          <Etiqueta clase={ESTADOS_PAGO[p.estadoPago].clase}>{ESTADOS_PAGO[p.estadoPago].texto}</Etiqueta>
                          {p.origen !== 'web' && <Etiqueta clase="bg-fondo text-texto-suave">{p.origen}</Etiqueta>}
                        </div>
                        <p className="truncate text-sm text-texto">{p.productos}</p>
                        <p className="truncate text-xs text-texto-suave">
                          {p.bloqueInicio}–{p.bloqueFin} · Para {p.destinatarioNombre} · {p.coloniaNombre}
                          {p.tipoLugar !== 'casa' && ` · ${LUGARES[p.tipoLugar].texto}: ${p.nombreLugar}`}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-texto">{formatearPrecio(p.totalCentavos)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )
        })
      )}
    </div>
  )
}

export default function PedidosPage({ searchParams }: Props) {
  return (
    <div>
      <EncabezadoPagina titulo="Pedidos" descripcion="Todo lo que falta por entregar, del más próximo al más lejano." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-tarjeta bg-borde" />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}