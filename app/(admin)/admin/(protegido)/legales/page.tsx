import Link from 'next/link'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { listarPaginasLegales } from '@/server/consultas/legales'

const formatoFecha = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeZone: 'America/Mexico_City' })

export default async function LegalesPage() {
  const paginas = await listarPaginasLegales()

  return (
    <div>
      <EncabezadoPagina titulo="Textos legales" descripcion="Se muestran en el pie del sitio. Pide a tu asesor legal que los revise antes de publicarlos." />

      <ul className="max-w-3xl divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie">
        {paginas.map((p) => (
          <li key={p.slug}>
            <Link href={`/admin/legales/${p.slug}`} className="flex items-center justify-between gap-4 p-4 hover:bg-fondo/60 sm:p-5">
              <div className="min-w-0">
                <p className="font-medium text-texto">{p.titulo}</p>
                <p className="text-sm text-texto-suave">{p.descripcion}</p>
                {p.existe && p.actualizadoEn && (
                  <p className="mt-1 text-xs text-texto-suave">
                    Versión {p.version} · actualizada {formatoFecha.format(p.actualizadoEn)}
                  </p>
                )}
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  p.publicada ? 'bg-acento-suave text-acento' : 'bg-amber-50 text-amber-900'
                }`}
              >
                {p.publicada ? 'Publicada' : p.existe ? 'Borrador' : 'Sin crear'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}