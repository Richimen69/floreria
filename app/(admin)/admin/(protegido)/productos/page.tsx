import Form from 'next/form'
import Link from 'next/link'
import { Suspense } from 'react'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { ListaProductosOrdenable } from '@/components/admin/ListaProductosOrdenable'
import { TablaProductos } from '@/components/admin/TablaProductos'
import { claseInput } from '@/components/ui/Campo'
import { ESTADOS_PRODUCTO, esEstadoProducto, type EstadoProducto } from '@/lib/filtros-productos'
import { contarProductosPorCategoria, listarProductosAdmin } from '@/server/consultas/productos'

const POR_PAGINA = 25

type Params = { q?: string; categoria?: string; estado?: string; pagina?: string }
type Props = { searchParams: Promise<Params> }

function Ficha({ href, activa, children }: { href: string; activa: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        activa ? 'border-primario bg-primario-suave font-semibold text-primario-oscuro' : 'border-borde bg-superficie text-texto-suave hover:border-primario/50 hover:text-texto'
      }`}
    >
      {children}
    </Link>
  )
}

async function Contenido({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 80)
  const categoriaId = Number(sp.categoria) > 0 ? Number(sp.categoria) : null
  const estado: EstadoProducto = esEstadoProducto(sp.estado) ? sp.estado : 'todos'
  const pagina = Math.max(1, Math.floor(Number(sp.pagina)) || 1)

  // Solo se puede reordenar viendo una categoría completa, sin otros filtros
  const modoOrden = categoriaId !== null && !q && estado === 'todos'

  const [conteos, { filas, total }] = await Promise.all([
    contarProductosPorCategoria(),
    listarProductosAdmin({
      q,
      categoriaId,
      estado,
      pagina: modoOrden ? 1 : pagina,
      porPagina: modoOrden ? 1000 : POR_PAGINA,
    }),
  ])

  // Construye la URL conservando los filtros actuales
  function url(cambios: Partial<Record<keyof Params, string>>) {
    const valores: Record<string, string> = {
      q,
      categoria: categoriaId ? String(categoriaId) : '',
      estado: estado === 'todos' ? '' : estado,
      pagina: '',
      ...cambios,
    }
    const params = new URLSearchParams()
    for (const [clave, valor] of Object.entries(valores)) if (valor) params.set(clave, valor)
    const texto = params.toString()
    return `/admin/productos${texto ? `?${texto}` : ''}`
  }

  const totalPaginas = Math.max(1, Math.ceil(total / POR_PAGINA))

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <Form action="/admin/productos" className="flex gap-2">
        <input type="search" name="q" defaultValue={q} placeholder="Buscar por nombre…" className={claseInput} />
        {categoriaId && <input type="hidden" name="categoria" value={categoriaId} />}
        {estado !== 'todos' && <input type="hidden" name="estado" value={estado} />}
        <button type="submit" className="shrink-0 rounded-xl border border-borde bg-superficie px-4 text-sm font-medium text-texto hover:border-primario">
          Buscar
        </button>
      </Form>

      {/* Categorías */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <Ficha href={url({ categoria: '' })} activa={categoriaId === null}>Todas</Ficha>
        {conteos.map((c) => (
          <Ficha key={c.id} href={url({ categoria: String(c.id) })} activa={categoriaId === c.id}>
            {c.nombre} <span className="text-xs opacity-70">({c.total})</span>
          </Ficha>
        ))}
      </div>

      {/* Estado */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {(Object.keys(ESTADOS_PRODUCTO) as EstadoProducto[]).map((e) => (
          <Ficha key={e} href={url({ estado: e === 'todos' ? '' : e })} activa={estado === e}>
            {ESTADOS_PRODUCTO[e]}
          </Ficha>
        ))}
      </div>

      {/* Resultados */}
      <p className="text-sm text-texto-suave">
        {total} producto(s)
        {q && <> que coinciden con “{q}”</>}
        {(q || categoriaId || estado !== 'todos') && (
          <> · <Link href="/admin/productos" className="text-primario hover:underline">Quitar filtros</Link></>
        )}
      </p>

      {filas.length === 0 ? (
        <div className="rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
          <p className="font-titulos text-lg text-texto">No hay productos con estos filtros</p>
        </div>
      ) : modoOrden ? (
        <ListaProductosOrdenable key={categoriaId} categoriaId={categoriaId} productos={filas} />
      ) : (
        <>
          {categoriaId && (
            <p className="text-xs text-texto-suave">Para reordenar esta categoría, quita la búsqueda y deja el estado en “Todos”.</p>
          )}
          <TablaProductos filas={filas} />

          {totalPaginas > 1 && (
            <nav className="flex items-center justify-between gap-3 pt-2 text-sm" aria-label="Paginación">
              {pagina > 1 ? (
                <Link href={url({ pagina: String(pagina - 1) })} className="rounded-full border border-borde px-4 py-2 text-texto hover:border-primario">← Anterior</Link>
              ) : <span />}
              <span className="text-texto-suave">Página {pagina} de {totalPaginas}</span>
              {pagina < totalPaginas ? (
                <Link href={url({ pagina: String(pagina + 1) })} className="rounded-full border border-borde px-4 py-2 text-texto hover:border-primario">Siguiente →</Link>
              ) : <span />}
            </nav>
          )}
        </>
      )}
    </div>
  )
}

function EsqueletoLista() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-11 rounded-xl bg-borde" />
      <div className="flex gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="h-8 w-24 rounded-full bg-borde" />)}</div>
      <div className="h-96 rounded-tarjeta bg-borde" />
    </div>
  )
}

export default function ProductosPage({ searchParams }: Props) {
  return (
    <div>
      <EncabezadoPagina
        titulo="Productos"
        descripcion="Busca, filtra y ordena el catálogo."
        acciones={
          <Link href="/admin/productos/nuevo" className="rounded-full bg-primario px-5 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">
            Nuevo producto
          </Link>
        }
      />
      <Suspense fallback={<EsqueletoLista />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}