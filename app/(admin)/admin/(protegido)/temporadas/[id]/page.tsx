import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { FormTemporada } from '@/components/admin/FormTemporada'
import { EsqueletoFormulario } from '@/components/admin/EsqueletoFormulario'
import { listarOpcionesComplemento } from '@/server/consultas/productos'
import { obtenerTemporada } from '@/server/consultas/temporadas'

type Props = { params: Promise<{ id: string }> }

async function Contenido({ params }: Props) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  const [temporada, productos] = await Promise.all([obtenerTemporada(numero), listarOpcionesComplemento()])
  if (!temporada) notFound()

  return <FormTemporada temporada={temporada} productos={productos} />
}

export default function EditarTemporadaPage({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoFormulario />}>
      <Contenido params={params} />
    </Suspense>
  )
}