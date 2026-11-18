import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ContenidoLegal } from '@/components/ContenidoLegal'
import { PAGINAS_LEGALES, type SlugLegal } from '@/lib/legales'
import { obtenerPaginaLegal } from '@/server/consultas/legales'

const formatoFecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'America/Mexico_City' })

export async function metadataLegal(slug: SlugLegal): Promise<Metadata> {
  const pagina = await obtenerPaginaLegal(slug)
  const titulo = pagina?.titulo ?? PAGINAS_LEGALES.find((p) => p.slug === slug)!.titulo
  return { title: titulo, robots: pagina?.publicada ? undefined : { index: false } }
}

export async function PaginaLegalPublica({ slug }: { slug: SlugLegal }) {
  const pagina = await obtenerPaginaLegal(slug)
  if (!pagina?.publicada) notFound()

  return (
    <article className="mx-auto max-w-3xl px-4 pt-10 pb-6 sm:px-6 sm:pt-14">
      <h1 className="font-titulos text-3xl font-semibold text-texto sm:text-4xl">{pagina.titulo}</h1>
      <p className="mt-2 mb-8 text-sm text-texto-suave">
        Última actualización: {formatoFecha.format(pagina.actualizadoEn)} · versión {pagina.version}
      </p>
      <ContenidoLegal contenido={pagina.contenido} />
    </article>
  )
}