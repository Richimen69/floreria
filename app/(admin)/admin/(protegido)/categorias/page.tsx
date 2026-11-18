import Link from 'next/link'
import { listarCategorias } from '@/server/consultas/categorias'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { ListaCategorias } from '@/components/admin/ListaCategorias'


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
        <ListaCategorias categorias={lista} />
      )}
    </div>
  )
}