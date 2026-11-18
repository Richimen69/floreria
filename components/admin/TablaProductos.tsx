import Link from 'next/link'
import { EtiquetasProducto } from '@/components/admin/EtiquetasProducto'
import { fechaCorta } from '@/lib/fechas'
import { formatearPrecio } from '@/lib/utils'
import type { FilaProductoAdmin } from '@/server/consultas/productos'

export function TablaProductos({ filas }: { filas: FilaProductoAdmin[] }) {
  return (
    <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie shadow-sm">
      <table className="w-full text-sm">
        <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
          <tr>
            <th className="px-3 py-3 font-semibold sm:px-5">Producto</th>
            <th className="hidden px-3 py-3 font-semibold sm:table-cell sm:px-5">Categorías</th>
            <th className="px-3 py-3 font-semibold sm:px-5">Precio</th>
            <th className="hidden px-3 py-3 font-semibold md:table-cell md:px-5">Estado</th>
            <th className="px-3 py-3 sm:px-5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-borde">
          {filas.map((p) => (
            <tr key={p.id} className="hover:bg-fondo/60">
              <td className="px-3 py-3 sm:px-5">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
                    {p.imagenes[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imagenes[0]} alt="" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-texto">{p.nombre}</p>
                    {/* En celular, el estado va debajo del nombre */}
                    <div className="mt-1 md:hidden"><EtiquetasProducto p={p} /></div>
                  </div>
                </div>
              </td>
              <td className="hidden px-3 py-3 text-texto-suave sm:table-cell sm:px-5">{p.categorias}</td>
              <td className="px-3 py-3 sm:px-5">
                {p.precioOfertaCentavos ? (
                  <div>
                    <span className="font-semibold text-primario">{formatearPrecio(p.precioOfertaCentavos)}</span>
                    <span className="ml-2 text-xs text-texto-suave line-through">{formatearPrecio(p.precioCentavos)}</span>
                    {p.ofertaHasta && <p className="text-xs text-texto-suave">Vence {fechaCorta(p.ofertaHasta)}</p>}
                  </div>
                ) : (
                  <span className="font-medium text-texto">{formatearPrecio(p.precioCentavos)}</span>
                )}
              </td>
              <td className="hidden px-3 py-3 md:table-cell md:px-5"><EtiquetasProducto p={p} /></td>
              <td className="px-3 py-3 text-right sm:px-5">
                <Link href={`/admin/productos/${p.id}`} className="font-medium text-primario hover:underline">Editar</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}