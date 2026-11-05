import type { Metadata } from 'next'
import { TarjetaProducto } from '@/components/sitio/TarjetaProducto'
import { obtenerCatalogo } from '@/server/consultas/catalogo'

export const metadata: Metadata = { title: 'Catálogo' }

export default async function CatalogoPage() {
  const catalogo = await obtenerCatalogo()

  if (catalogo.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="font-titulos text-3xl font-semibold text-texto">Catálogo</h1>
        <p className="mt-2 text-texto-suave">Muy pronto tendremos nuestros arreglos aquí.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <h1 className="font-titulos text-4xl font-semibold text-texto">Catálogo</h1>
      <p className="mt-1 text-texto-suave">Elige el arreglo perfecto para cada ocasión.</p>

      {/* Accesos rápidos a cada categoría */}
      <nav className="sticky top-[61px] z-10 -mx-4 mt-6 overflow-x-auto border-b border-borde bg-fondo/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex gap-2">
          {catalogo.map((c) => (
            <a
              key={c.id}
              href={`#${c.slug}`}
              className="shrink-0 rounded-full border border-borde bg-superficie px-4 py-1.5 text-sm text-texto hover:border-primario hover:text-primario"
            >
              {c.nombre}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-14 pt-8">
        {catalogo.map((c) => (
          <section key={c.id} id={c.slug} className="scroll-mt-32">
            <div className="mb-5">
              <h2 className="font-titulos text-2xl font-semibold text-texto sm:text-3xl">{c.nombre}</h2>
              {c.descripcion && <p className="mt-1 text-sm text-texto-suave">{c.descripcion}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {c.productos.map((p) => (
                <TarjetaProducto key={p.id} producto={p} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}