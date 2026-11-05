import { notFound } from 'next/navigation'
import { FormProducto } from '@/components/admin/FormProducto'
import { listarCategorias } from '@/server/consultas/categorias'
import { obtenerProducto } from '@/server/consultas/productos'

export default async function EditarProductoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  const [producto, categorias] = await Promise.all([obtenerProducto(numero), listarCategorias()])
  if (!producto) notFound()

  return <FormProducto producto={producto} categorias={categorias} />
}