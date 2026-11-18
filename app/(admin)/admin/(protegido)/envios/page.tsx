import Form from 'next/form'
import Link from 'next/link'
import { Suspense } from 'react'
import { DialogoColonia } from '@/components/admin/DialogoColonia'
import { DialogoZona } from '@/components/admin/DialogoZona'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { TablaColonias } from '@/components/admin/TablaColonias'
import { claseInput } from '@/components/ui/Campo'
import { formatearPrecio } from '@/lib/utils'
import { listarColoniasAdmin, listarZonas } from '@/server/consultas/envios'

type Params = { q?: string; zona?: string; pagina?: string }
type Props = { searchParams: Promise<Params> }

async function Contenido({ searchParams }: Props) {
  const sp = await searchParams
  const q = (sp.q ?? '').trim().slice(0, 60)
  const zona = sp.zona ?? ''
  const pagina = Math.max(1, Math.floor(Number(sp.pagina)) || 1)

  const [zonas, { filas, total, sinCobertura, totalPaginas }] = await Promise.all([
    listarZonas(),
    listarColoniasAdmin({ q, zona, pagina }),
  ])

  function url(cambios: Partial<Params>) {
    const v = { q, zona, pagina: '', ...cambios }
    const p = new URLSearchParams(Object.entries(v).filter(([, x]) => x) as [string, string][])
    return `/admin/envios${p.size ? `?${p}` : ''}`
  }
  const ficha = (activa: boolean) =>
    `shrink-0 rounded-full border px-3 py-1.5 text-sm ${activa ? 'border-primario bg-primario-suave font-semibold text-primario-oscuro' : 'border-borde bg-superficie text-texto-suave hover:text-texto'}`

  return (
    <div className="space-y-8">
      {/* Zonas */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-titulos text-xl font-semibold text-texto">Zonas</h2>
          <DialogoZona />
        </div>
        {zonas.length === 0 ? (
          <p className="rounded-tarjeta border-2 border-dashed border-borde p-6 text-center text-sm text-texto-suave">
            Crea tus zonas de entrega y después asígnales colonias.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zonas.map((z) => (
              <div key={z.id} className={`rounded-tarjeta border border-borde bg-superficie p-4 ${z.activa ? '' : 'opacity-60'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-texto">{z.nombre}</p>
                    <p className="text-lg font-semibold text-primario">
                      {z.costoCentavos === 0 ? 'Envío gratis' : formatearPrecio(z.costoCentavos)}
                    </p>
                  </div>
                  <DialogoZona zona={z} />
                </div>
                <p className="mt-2 text-sm text-texto-suave">
                  <Link href={url({ zona: String(z.id) })} className="hover:text-primario">{z.totalColonias} colonia(s) →</Link>
                  {!z.activa && <span className="ml-2 font-semibold">Inactiva</span>}
                </p>
                {z.notaInterna && <p className="mt-1 text-xs text-texto-suave">Nota: {z.notaInterna}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Colonias */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-titulos text-xl font-semibold text-texto">Colonias</h2>
            <p className="text-sm text-texto-suave">
              Las colonias sin zona aparecen al cliente como “sin cobertura”. {sinCobertura} sin cobertura.
            </p>
          </div>
          <DialogoColonia zonas={zonas} />
        </div>

        <Form action="/admin/envios" className="flex gap-2">
          <input type="search" name="q" defaultValue={q} placeholder="Buscar por colonia o código postal…" className={claseInput} />
          {zona && <input type="hidden" name="zona" value={zona} />}
          <button type="submit" className="shrink-0 rounded-xl border border-borde bg-superficie px-4 text-sm font-medium text-texto hover:border-primario">Buscar</button>
        </Form>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          <Link href={url({ zona: '' })} className={ficha(!zona)}>Todas</Link>
          <Link href={url({ zona: 'sin-cobertura' })} className={ficha(zona === 'sin-cobertura')}>Sin cobertura</Link>
          {zonas.map((z) => (
            <Link key={z.id} href={url({ zona: String(z.id) })} className={ficha(zona === String(z.id))}>{z.nombre}</Link>
          ))}
        </div>

        <p className="text-sm text-texto-suave">{total} colonia(s)</p>

        {filas.length === 0 ? (
          <p className="rounded-tarjeta border-2 border-dashed border-borde p-6 text-center text-sm text-texto-suave">
            {total === 0 && !q && !zona ? 'Aún no hay colonias. Impórtalas desde el catálogo de Correos de México.' : 'No hay colonias con estos filtros.'}
          </p>
        ) : (
          <TablaColonias colonias={filas} zonas={zonas} />
        )}

        {totalPaginas > 1 && (
          <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Paginación">
            {pagina > 1 ? <Link href={url({ pagina: String(pagina - 1) })} className="rounded-full border border-borde px-4 py-2 hover:border-primario">← Anterior</Link> : <span />}
            <span className="text-texto-suave">Página {pagina} de {totalPaginas}</span>
            {pagina < totalPaginas ? <Link href={url({ pagina: String(pagina + 1) })} className="rounded-full border border-borde px-4 py-2 hover:border-primario">Siguiente →</Link> : <span />}
          </nav>
        )}
      </section>
    </div>
  )
}

export default function EnviosPage({ searchParams }: Props) {
  return (
    <div>
      <EncabezadoPagina titulo="Zonas de envío" descripcion="A qué colonias entregan y cuánto cuesta." />
      <Suspense fallback={<div className="h-96 animate-pulse rounded-tarjeta bg-borde" />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}