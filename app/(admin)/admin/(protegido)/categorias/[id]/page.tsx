import { notFound } from 'next/navigation'
import { FormCategoria } from '@/components/admin/FormCategoria'
import { obtenerCategoria } from '@/server/consultas/categorias'

export default async function EditarCategoriaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  const categoria = await obtenerCategoria(numero)
  if (!categoria) notFound()

  return <FormCategoria categoria={categoria} />
}