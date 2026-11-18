import Link from 'next/link'
import { Suspense } from 'react'
import { BotonImprimir } from '@/components/admin/BotonImprimir'
import { faltante, formatearCantidad } from '@/lib/inventario'
import { fechaLarga } from '@/lib/fechas'
import { ahoraEnAcapulco } from '@/server/calendario'
import { obtenerAjustes } from '@/server/consultas/ajustes'
import { listarCategoriasInsumo, listarInsumos } from '@/server/consultas/inventario'

type Params = { tipo?: string; categoria?: string }
type Props = { searchParams: Promise<Params> }

async function Contenido({ searchParams }: Props) {
  const sp = await searchParams
  const compras = sp.tipo === 'compras'
  const categoria = (sp.categoria ?? '').slice(0, 50)

  const [insumos, categorias, ajustes, ahora] = await Promise.all([
    listarInsumos({ categoria, filtro: compras ? 'bajo-minimo' : 'todos' }),
    listarCategoriasInsumo(),
    obtenerAjustes(),
    ahoraEnAcapulco(),
  ])

  const porCategoria = Object.groupBy(insumos, (i) => i.categoria)
  const url = (cambios: Params) => {
    const v = { tipo: compras ? 'compras' : '', categoria, ...cambios }
    const p = new URLSearchParams(Object.entries(v).filter(([, x]) => x) as [string, string][])
    return `/admin/inventario/lista${p.size ? `?${p}` : ''}`
  }
  const ficha = (activa: boolean) =>
    `rounded-full border px-3 py-1.5 text-sm ${activa ? 'border-primario bg-primario-suave font-semibold text-primario-oscuro' : 'border-borde bg-superficie text-texto-suave'}`

  return (
    <div className="space-y-6">
      {/* Controles: no se imprimen */}
      <div className="space-y-3 print:hidden">
        <Link href="/admin/inventario" className="text-sm text-texto-suave hover:text-primario">← Inventario</Link>
        <div className="flex flex-wrap gap-2">
          <Link href={url({ tipo: '' })} className={ficha(!compras)}>Inventario completo</Link>
          <Link href={url({ tipo: 'compras' })} className={ficha(compras)}>Lista de compras</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={url({ categoria: '' })} className={ficha(!categoria)}>Todas las categorías</Link>
          {categorias.map((c) => <Link key={c} href={url({ categoria: c })} className={ficha(categoria === c)}>{c}</Link>)}
        </div>
        <div className="flex flex-wrap gap-2">
          <BotonImprimir />
          <a
            href={`/admin/inventario/exportar?${new URLSearchParams({ tipo: compras ? 'compras' : '', categoria })}`}
            className="rounded-full border border-borde px-4 py-2 text-sm font-semibold text-texto hover:border-primario"
          >
            Descargar para Excel
          </a>
        </div>
      </div>

      {/* Documento */}
      <div className="rounded-tarjeta border border-borde bg-white p-6 text-black print:rounded-none print:border-0 print:p-0">
        <header className="mb-6 border-b border-gray-300 pb-4">
          <p className="text-sm text-gray-600">{ajustes.nombre}</p>
          <h1 className="font-titulos text-2xl font-semibold">
            {compras ? 'Lista de compras' : 'Inventario'}{categoria && ` · ${categoria}`}
          </h1>
          <p className="text-sm capitalize text-gray-600">{fechaLarga(ahora.fecha)}, {ahora.hora} h</p>
        </header>

        {insumos.length === 0 ? (
          <p className="text-sm text-gray-600">{compras ? 'No hay insumos por debajo de su mínimo.' : 'No hay insumos.'}</p>
        ) : (
          Object.entries(porCategoria).map(([cat, filas]) => (
            <section key={cat} className="mb-6 break-inside-avoid">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-700">{cat}</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-gray-400 text-left">
                    <th className="py-1.5 pr-3 font-semibold">Insumo</th>
                    <th className="py-1.5 pr-3 text-right font-semibold">Existencia</th>
                    <th className="py-1.5 pr-3 text-right font-semibold">Mínimo</th>
                    {compras ? (
                      <>
                        <th className="py-1.5 pr-3 text-right font-semibold">Faltan</th>
                        <th className="w-28 py-1.5 font-semibold">Comprar</th>
                      </>
                    ) : (
                      <th className="w-28 py-1.5 font-semibold">Conteo físico</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filas!.map((i) => (
                    <tr key={i.id} className="border-b border-gray-200">
                      <td className="py-1.5 pr-3">
                        {i.nombre}
                        {compras && i.proveedor && <span className="text-xs text-gray-500"> · {i.proveedor}</span>}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{formatearCantidad(i.existencia)} {i.unidad}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{i.minimo != null ? formatearCantidad(i.minimo) : '—'}</td>
                      {compras && (
                        <td className="py-1.5 pr-3 text-right font-semibold tabular-nums">{formatearCantidad(faltante(i) ?? 0)}</td>
                      )}
                      <td className="py-1.5"><span className="block border-b border-gray-400">&nbsp;</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

export default function ListaInventarioPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="h-96 animate-pulse rounded-tarjeta bg-borde" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  )
}