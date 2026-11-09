'use client'

import Link from 'next/link'
import { startTransition, useActionState, useState } from 'react'
import { duplicarTemporada, eliminarTemporada, guardarTemporada } from '@/server/acciones/temporadas'
import { Campo, Seccion } from '@/components/admin/Formulario'
import { Boton } from '@/components/ui/Boton'
import { Ayuda, Etiqueta, claseInput } from '@/components/ui/Campo'
import { centavosATexto, formatearPrecio } from '@/lib/utils'
import { redondear } from '@/lib/precios'
import { REDONDEOS } from '@/lib/validaciones/temporada'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'
import type { TemporadaAdmin } from '@/server/consultas/temporadas'
import type { OpcionComplemento } from '@/components/admin/SelectorComplementos'

const estadoInicial: EstadoFormulario = { ok: false, mensaje: '' }

type Props = { temporada?: TemporadaAdmin; productos: OpcionComplemento[] }

export function FormTemporada({ temporada, productos }: Props) {
  const accionGuardar = guardarTemporada.bind(null, temporada?.id ?? null)
  const [estado, accion, guardando] = useActionState(accionGuardar, estadoInicial)
  const [ajuste, setAjuste] = useState(temporada?.ajustePorcentaje ?? 0)
  const [redondeo, setRedondeo] = useState(temporada?.redondeoCentavos ?? 1000)
  const [busqueda, setBusqueda] = useState('')
  const err = (campo: string) => estado.errores?.[campo]?.[0]

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    startTransition(() => accion(datos))
  }

  async function eliminar() {
    if (!temporada || !confirm(`¿Eliminar "${temporada.nombre}" y sus precios especiales?`)) return
    await eliminarTemporada(temporada.id)
  }

  async function duplicar() {
    if (!temporada || !confirm('Se creará una copia para el año siguiente, con las reservas cerradas. ¿Continuar?')) return
    await duplicarTemporada(temporada.id)
  }

  const texto = busqueda.trim().toLowerCase()

  return (
    <form onSubmit={enviar}>
      <div className="sticky top-0 z-10 -mx-8 mb-8 flex items-center justify-between gap-4 border-b border-borde bg-fondo/85 px-8 py-4 backdrop-blur">
        <div>
          <Link href="/admin/temporadas" className="text-sm text-texto-suave hover:text-primario">← Temporadas</Link>
          <h1 className="font-titulos text-2xl font-semibold text-texto">{temporada ? temporada.nombre : 'Nueva temporada'}</h1>
          {estado.mensaje && !estado.ok && <p className="text-sm text-red-700">{estado.mensaje}</p>}
        </div>
        <div className="flex gap-2">
          {temporada && (
            <>
              <Boton type="button" variante="peligro" onClick={eliminar}>Eliminar</Boton>
              <Boton type="button" variante="secundario" onClick={duplicar}>Duplicar al siguiente año</Boton>
            </>
          )}
          <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
        </div>
      </div>

      <div className="max-w-5xl space-y-6">
        <Seccion titulo="Fechas" descripcion="Fechas de entrega que cubre esta temporada.">
          <Campo nombre="nombre" etiqueta="Nombre" valor={temporada?.nombre ?? ''} error={err('nombre')} placeholder="Ej. Día de las Madres 2027" ancho />
          <Campo nombre="fechaInicio" etiqueta="Desde" tipo="date" valor={temporada?.fechaInicio ?? ''} error={err('fechaInicio')} />
          <Campo nombre="fechaFin" etiqueta="Hasta" tipo="date" valor={temporada?.fechaFin ?? ''} error={err('fechaFin')} />
        </Seccion>

        <Seccion titulo="Precio general" descripcion="Se aplica a todo producto sin precio especial.">
          <div className="space-y-1.5">
            <Etiqueta htmlFor="ajustePorcentaje">Ajuste (%)</Etiqueta>
            <input
              id="ajustePorcentaje"
              name="ajustePorcentaje"
              type="number"
              value={ajuste}
              onChange={(e) => setAjuste(Number(e.target.value))}
              className={claseInput}
            />
            <Ayuda error={err('ajustePorcentaje')} texto="20 = +20%, -10 = 10% de descuento, 0 = sin ajuste" />
          </div>
          <div className="space-y-1.5">
            <Etiqueta htmlFor="redondeoCentavos">Redondeo</Etiqueta>
            <select
              id="redondeoCentavos"
              name="redondeoCentavos"
              value={redondeo}
              onChange={(e) => setRedondeo(Number(e.target.value))}
              className={claseInput}
            >
              {REDONDEOS.map((r) => <option key={r.valor} value={r.valor}>{r.texto}</option>)}
            </select>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-4 hover:border-primario/40 md:col-span-2">
            <input type="checkbox" name="permiteOfertas" defaultChecked={temporada?.permiteOfertas ?? false} className="mt-0.5 h-4 w-4 accent-primario" />
            <span>
              <span className="block text-sm font-medium text-texto">Permitir ofertas</span>
              <span className="block text-xs text-texto-suave">Si una oferta vigente es más barata que el precio de temporada, se respeta la oferta</span>
            </span>
          </label>
        </Seccion>

        <Seccion titulo="Reservas" descripcion="Controla si los clientes ya pueden pedir para estas fechas.">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-4 hover:border-primario/40 md:col-span-2">
            <input type="checkbox" name="reservasAbiertas" defaultChecked={temporada?.reservasAbiertas ?? false} className="mt-0.5 h-4 w-4 accent-primario" />
            <span>
              <span className="block text-sm font-medium text-texto">Reservas abiertas</span>
              <span className="block text-xs text-texto-suave">
                Mientras esté apagado, el sitio mostrará “Reservas para esta fecha aún no disponibles”. Ábrelas cuando termines de revisar los precios.
              </span>
            </span>
          </label>
        </Seccion>

        <section className="rounded-tarjeta border border-borde bg-superficie shadow-sm">
          <header className="flex flex-wrap items-end justify-between gap-4 border-b border-borde px-6 py-4">
            <div>
              <h2 className="font-titulos text-lg font-semibold text-texto">Precios por producto</h2>
              <p className="text-sm text-texto-suave">Opcional. Déjalo vacío para usar el precio con ajuste.</p>
            </div>
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar producto…"
              className={`${claseInput} max-w-xs`}
            />
          </header>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
                <tr>
                  <th className="px-5 py-3 font-semibold">Producto</th>
                  <th className="px-5 py-3 font-semibold">Normal</th>
                  <th className="px-5 py-3 font-semibold">Con ajuste</th>
                  <th className="px-5 py-3 font-semibold">Precio especial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borde">
                {productos.map((p) => {
                  const visible = p.nombre.toLowerCase().includes(texto)
                  const conAjuste = ajuste !== 0 ? redondear(p.precioCentavos * (1 + ajuste / 100), redondeo) : p.precioCentavos
                  const clave = `precio_${p.id}`
                  return (
                    // Las filas filtradas se ocultan pero siguen en el formulario, para no perder sus precios
                    <tr key={p.id} className={visible ? 'hover:bg-fondo/60' : 'hidden'}>
                      <td className="px-5 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
                            {p.imagen && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.imagen} alt="" className="h-full w-full object-cover" />
                            )}
                          </span>
                          <span className="text-texto">{p.nombre}</span>
                        </div>
                      </td>
                      <td className="px-5 py-2.5 text-texto-suave">{formatearPrecio(p.precioCentavos)}</td>
                      <td className="px-5 py-2.5 text-texto">{formatearPrecio(conAjuste)}</td>
                      <td className="px-5 py-2.5">
                        <input
                          name={clave}
                          defaultValue={centavosATexto(temporada?.precios[p.id] ?? null)}
                          placeholder={centavosATexto(conAjuste)}
                          inputMode="decimal"
                          className={`${claseInput} w-32`}
                        />
                        {err(clave) && <p className="mt-1 text-xs text-red-700">{err(clave)}</p>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </form>
  )
}