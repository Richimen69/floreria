import Form from 'next/form'
import Link from 'next/link'
import { Suspense } from 'react'
import { DialogoMovimiento } from '@/components/admin/DialogoMovimiento'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { claseInput } from '@/components/ui/Campo'
import { bajoMinimo, formatearCantidad } from '@/lib/inventario'
import { listarCategoriasInsumo, listarInsumos, type FiltroInsumos } from '@/server/consultas/inventario'

type Params = { q?: string; categoria?: string; filtro?: string }
type Props = { searchParams: Promise<Params> }

const FILTROS: Record<FiltroInsumos, string> = { todos: 'Activos', 'bajo-minimo': 'Bajo mínimo', inactivos: 'Inactivos' }

function Ficha({ href, activa, children }: { href: string; activa: boolean; children: React.ReactNode }) {
  return (
    <Link href={href} scroll={false} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${activa ? 'border-primario bg-primario-suave font-semibold text-primario-oscuro' : 'border-borde bg-superficie text-texto-suave hover:text-texto'}`}>
      {children}
    </Link>
  )
}

async function Contenido({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const categoria = (sp.categoria ?? '').slice(0, 50)
  const filtro: FiltroInsumos = sp.filtro === 'bajo-minimo' || sp.filtro === 'inactivos' ? sp.filtro : 'todos'

  const [lista, categorias, alertas] = await Promise.all([
    listarInsumos({ q, categoria, filtro }),
    listarCategoriasInsumo(),
    listarInsumos({ filtro: 'bajo-minimo' }),
  ])

  function url(cambios: Partial<Params>) {
    const v = { q, categoria, filtro: filtro === 'todos' ? '' : filtro, ...cambios }
    const p = new URLSearchParams(Object.entries(v).filter(([, x]) => x) as [string, string][])
    return `/admin/inventario${p.size ? `?${p}` : ''}`
  }

  return (
    <div className="space-y-4">
      {alertas.length > 0 && filtro !== 'bajo-minimo' && (
        <Link href={url({ filtro: 'bajo-minimo' })} className="block rounded-xl bg-amber-50 p-3 text-sm text-amber-900 hover:bg-amber-100">
          <strong>{alertas.length} insumo(s)</strong> están en su mínimo o por debajo. Ver cuáles →
        </Link>
      )}

      <Form action="/admin/inventario" className="flex gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar insumo…" className={claseInput} />
        {categoria && <input type="hidden" name="categoria" value={categoria} />}
        {filtro !== 'todos' && <input type="hidden" name="filtro" value={filtro} />}
        <button type="submit" className="shrink-0 rounded-xl border border-borde bg-superficie px-4 text-sm font-medium text-texto hover:border-primario">Buscar</button>
      </Form>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Ficha href={url({ categoria: '' })} activa={!categoria}>Todas</Ficha>
        {categorias.map((c) => <Ficha key={c} href={url({ categoria: c })} activa={categoria === c}>{c}</Ficha>)}
      </div>
      <div className="flex gap-2">
        {(Object.keys(FILTROS) as FiltroInsumos[]).map((f) => (
          <Ficha key={f} href={url({ filtro: f === 'todos' ? '' : f })} activa={filtro === f}>{FILTROS[f]}</Ficha>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
          <p className="font-titulos text-lg text-texto">No hay insumos con estos filtros</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
              <tr>
                <th className="px-3 py-3 font-semibold sm:px-5">Insumo</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell sm:px-5">Categoría</th>
                <th className="px-3 py-3 text-right font-semibold sm:px-5">Existencia</th>
                <th className="hidden px-3 py-3 text-right font-semibold md:table-cell md:px-5">Mínimo</th>
                <th className="px-3 py-3 sm:px-5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {lista.map((i) => {
                const alerta = bajoMinimo(i)
                return (
                  <tr key={i.id} className="hover:bg-fondo/60">
                    <td className="px-3 py-3 sm:px-5">
                      <Link href={`/admin/inventario/${i.id}`} className="font-medium text-texto hover:text-primario">{i.nombre}</Link>
                      <p className="text-xs text-texto-suave sm:hidden">{i.categoria}</p>
                    </td>
                    <td className="hidden px-3 py-3 text-texto-suave sm:table-cell sm:px-5">{i.categoria}</td>
                    <td className={`px-3 py-3 text-right font-medium tabular-nums sm:px-5 ${alerta ? 'text-red-700' : 'text-texto'}`}>
                      {formatearCantidad(i.existencia)} <span className="text-xs font-normal text-texto-suave">{i.unidad}</span>
                    </td>
                    <td className="hidden px-3 py-3 text-right tabular-nums text-texto-suave md:table-cell md:px-5">
                      {i.minimo != null ? formatearCantidad(i.minimo) : '—'}
                    </td>
                    <td className="px-3 py-3 text-right sm:px-5">
                      <DialogoMovimiento insumo={i} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function InventarioPage({ searchParams }: Props) {
  return (
    <div>
      <EncabezadoPagina
        titulo="Inventario"
        descripcion="Insumos de la florería: flores, follajes, cintas y empaques."
        acciones={
          <>
            <Link href="/admin/inventario/lista" className="rounded-full border border-borde px-4 py-2 text-sm font-semibold text-texto hover:border-primario">Generar lista</Link>
            <Link href="/admin/inventario/nuevo" className="rounded-full bg-primario px-4 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">Nuevo insumo</Link>
          </>
        }
      />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-tarjeta bg-borde" />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}