import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { DialogoMovimiento } from '@/components/admin/DialogoMovimiento'
import { EsqueletoFormulario } from '@/components/admin/EsqueletoFormulario'
import { FormInsumo } from '@/components/admin/FormInsumo'
import { TIPOS_MOVIMIENTO, formatearCantidad } from '@/lib/inventario'
import { formatearPrecio } from '@/lib/utils'
import { listarCategoriasInsumo, obtenerInsumo } from '@/server/consultas/inventario'

type Props = { params: Promise<{ id: string }> }

const formatoFecha = new Intl.DateTimeFormat('es-MX', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/Mexico_City',
})

async function Contenido({ params }: Props) {
  const { id } = await params
  const numero = Number(id)
  if (!Number.isInteger(numero)) notFound()

  const [insumo, categorias] = await Promise.all([obtenerInsumo(numero), listarCategoriasInsumo()])
  if (!insumo) notFound()

  return (
    <div className="space-y-8">
      <FormInsumo insumo={insumo} categorias={categorias} />

      <section className="max-w-3xl rounded-tarjeta border border-borde bg-superficie shadow-sm">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-borde px-4 py-4 sm:px-6">
          <div>
            <h2 className="font-titulos text-lg font-semibold text-texto">Movimientos</h2>
            <p className="text-sm text-texto-suave">
              Existencia actual: <strong className="text-texto">{formatearCantidad(insumo.existencia)} {insumo.unidad}(s)</strong>
            </p>
          </div>
          <DialogoMovimiento insumo={insumo} textoBoton="Registrar movimiento" />
        </header>

        {insumo.movimientos.length === 0 ? (
          <p className="p-6 text-sm text-texto-suave">Sin movimientos todavía.</p>
        ) : (
          <ul className="divide-y divide-borde">
            {insumo.movimientos.map((m) => (
              <li key={m.id} className="flex items-start justify-between gap-4 px-4 py-3 text-sm sm:px-6">
                <div className="min-w-0">
                  <p className="font-medium text-texto">
                    {TIPOS_MOVIMIENTO[m.tipo].texto}
                    {m.costoUnitarioCentavos != null && (
                      <span className="font-normal text-texto-suave"> · {formatearPrecio(m.costoUnitarioCentavos)} c/u</span>
                    )}
                  </p>
                  {m.nota && <p className="text-texto-suave">{m.nota}</p>}
                  <p className="text-xs text-texto-suave">
                    {formatoFecha.format(m.creadoEn)}{m.usuario && ` · ${m.usuario}`}
                  </p>
                </div>
                <div className="shrink-0 text-right tabular-nums">
                  <p className={`font-semibold ${m.cambio >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {m.cambio >= 0 ? '+' : ''}{formatearCantidad(m.cambio)}
                  </p>
                  <p className="text-xs text-texto-suave">Quedó en {formatearCantidad(m.existenciaResultante)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default function InsumoPage({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoFormulario />}>
      <Contenido params={params} />
    </Suspense>
  )
}