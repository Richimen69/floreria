import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { FormCategoria } from '@/components/admin/FormCategoria'
import { EsqueletoFormulario } from '@/components/admin/EsqueletoFormulario'
import { obtenerCategoria } from '@/server/consultas/categorias'

type Props = { params: Promise<{ id: string }> }

async function Contenido({ params }: Props) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  const categoria = await obtenerCategoria(numero)
  if (!categoria) notFound()

  return <FormCategoria categoria={categoria} />
}

export default function EditarCategoriaPage({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoFormulario />}>
      <Contenido params={params} />
    </Suspense>
  )
}