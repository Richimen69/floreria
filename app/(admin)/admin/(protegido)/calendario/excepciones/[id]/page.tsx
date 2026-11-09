import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { FormExcepcion } from '@/components/admin/FormExcepcion'
import { EsqueletoFormulario } from '@/components/admin/EsqueletoFormulario'
import { obtenerExcepcion } from '@/server/consultas/calendario'

type Props = { params: Promise<{ id: string }> }

async function Contenido({ params }: Props) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  const excepcion = await obtenerExcepcion(numero)
  if (!excepcion) notFound()

  return <FormExcepcion excepcion={excepcion} />
}

export default function EditarExcepcionPage({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoFormulario />}>
      <Contenido params={params} />
    </Suspense>
  )
}