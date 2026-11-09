import Link from 'next/link'
import { listarCategorias } from '@/server/consultas/categorias'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'

export default async function CategoriasPage() {
  const lista = await listarCategorias()

  return (
    <div>
      <EncabezadoPagina
        titulo="Categorías"
        descripcion="Organizan los productos del catálogo."
        acciones={
          <Link
            href="/admin/categorias/nueva"
            className="rounded-full bg-primario px-5 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro"
          >
            Nueva categoría
          </Link>
        }
      />
      {lista.length === 0 ? (
        <div className="rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
          <p className="font-titulos text-lg text-texto">Aún no hay categorías</p>
          <p className="mt-1 text-sm text-texto-suave">Crea la primera, por ejemplo "Ramos" o "Arreglos".</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
              <tr>
                <th className="px-5 py-3 font-semibold">Categoría</th>
                <th className="px-5 py-3 font-semibold">URL</th>
                <th className="px-5 py-3 font-semibold">Orden</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {lista.map((c) => (
                <tr key={c.id} className="hover:bg-fondo/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
                        {c.imagenUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={c.imagenUrl} alt="" className="h-full w-full object-cover" />
                        )}
                      </div>
                      <span className="font-medium text-texto">{c.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-texto-suave">/catalogo/{c.slug}</td>
                  <td className="px-5 py-3 text-texto-suave">{c.orden}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        c.activa ? 'bg-acento-suave text-acento' : 'bg-fondo text-texto-suave'
                      }`}
                    >
                      {c.activa ? 'Visible' : 'Oculta'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link href={`/admin/categorias/${c.id}`} className="font-medium text-primario hover:underline">
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}