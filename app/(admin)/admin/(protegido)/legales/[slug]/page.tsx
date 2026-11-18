import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { EsqueletoFormulario } from '@/components/admin/EsqueletoFormulario'
import { FormPaginaLegal } from '@/components/admin/FormPaginaLegal'
import { PAGINAS_LEGALES, esSlugLegal } from '@/lib/legales'
import { obtenerPaginaLegal } from '@/server/consultas/legales'

type Props = { params: Promise<{ slug: string }> }

async function Contenido({ params }: Props) {
  const { slug } = await params
  if (!esSlugLegal(slug)) notFound()

  const config = PAGINAS_LEGALES.find((p) => p.slug === slug)!
  const pagina = await obtenerPaginaLegal(slug)

  return (
    <FormPaginaLegal
      slug={slug}
      titulo={pagina?.titulo ?? config.titulo}
      contenido={pagina?.contenido ?? ''}
      publicada={pagina?.publicada ?? false}
      version={pagina?.version ?? 1}
    />
  )
}

export default function EditarLegalPage({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoFormulario />}>
      <Contenido params={params} />
    </Suspense>
  )
}