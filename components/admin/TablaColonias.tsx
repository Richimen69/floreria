'use client'

import { useState, useTransition } from 'react'
import { claseInput } from '@/components/ui/Campo'
import { asignarZona } from '@/server/acciones/envios'
import type { FilaColonia } from '@/server/consultas/envios'

type Props = { colonias: FilaColonia[]; zonas: { id: number; nombre: string; activa: boolean }[] }

export function TablaColonias({ colonias, zonas }: Props) {
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const [zonaLote, setZonaLote] = useState('')
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, iniciar] = useTransition()

  function asignar(ids: number[], zona: string) {
    iniciar(async () => {
      const r = await asignarZona(ids, zona ? Number(zona) : null)
      setMensaje({ ok: r.ok, texto: r.mensaje })
      if (r.ok) setSeleccion(new Set())
    })
  }

  function alternar(id: number) {
    setSeleccion((s) => {
      const nueva = new Set(s)
      if (nueva.has(id)) nueva.delete(id)
      else nueva.add(id)
      return nueva
    })
  }

  const todasMarcadas = colonias.length > 0 && colonias.every((c) => seleccion.has(c.id))

  return (
    <div className="space-y-3">
      {mensaje && (
        <p aria-live="polite" className={`text-sm ${mensaje.ok ? 'text-green-700' : 'text-red-700'}`}>{mensaje.texto}</p>
      )}

      <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
            <tr>
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas"
                  checked={todasMarcadas}
                  onChange={() => setSeleccion(todasMarcadas ? new Set() : new Set(colonias.map((c) => c.id)))}
                  className="h-4 w-4 accent-primario"
                />
              </th>
              <th className="px-3 py-3 font-semibold">Colonia</th>
              <th className="hidden px-3 py-3 font-semibold sm:table-cell">C.P.</th>
              <th className="px-3 py-3 font-semibold">Zona</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde">
            {colonias.map((c) => (
              <tr key={c.id} className={seleccion.has(c.id) ? 'bg-primario-suave/50' : 'hover:bg-fondo/60'}>
                <td className="px-3 py-2">
                  <input type="checkbox" aria-label={`Seleccionar ${c.nombre}`} checked={seleccion.has(c.id)} onChange={() => alternar(c.id)} className="h-4 w-4 accent-primario" />
                </td>
                <td className="px-3 py-2">
                  <p className="font-medium text-texto">{c.nombre}</p>
                  <p className="text-xs text-texto-suave">{c.tipo}<span className="sm:hidden"> · {c.cp}</span></p>
                </td>
                <td className="hidden px-3 py-2 tabular-nums text-texto-suave sm:table-cell">{c.cp}</td>
                <td className="px-3 py-2">
                  <select
                    key={`${c.id}-${c.zonaId}`}
                    defaultValue={c.zonaId ?? ''}
                    disabled={guardando}
                    onChange={(e) => asignar([c.id], e.target.value)}
                    aria-label={`Zona de ${c.nombre}`}
                    className={`${claseInput} min-w-36 py-1.5 ${c.zonaId ? '' : 'text-red-700'}`}
                  >
                    <option value="">Sin cobertura</option>
                    {zonas.map((z) => (
                      <option key={z.id} value={z.id}>{z.nombre}{!z.activa ? ' (inactiva)' : ''}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Barra para asignar en lote */}
      {seleccion.size > 0 && (
        <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-tarjeta border border-borde bg-superficie p-3 shadow-lg">
          <span className="text-sm font-medium text-texto">{seleccion.size} seleccionada(s)</span>
          <select value={zonaLote} onChange={(e) => setZonaLote(e.target.value)} className={`${claseInput} w-auto flex-1 py-1.5`}>
            <option value="">Sin cobertura</option>
            {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
          </select>
          <button
            type="button"
            disabled={guardando}
            onClick={() => asignar([...seleccion], zonaLote)}
            className="rounded-full bg-primario px-4 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro disabled:opacity-60"
          >
            {guardando ? 'Aplicando…' : 'Aplicar'}
          </button>
          <button type="button" onClick={() => setSeleccion(new Set())} className="text-sm text-texto-suave hover:text-texto">Cancelar</button>
        </div>
      )}
    </div>
  )
}