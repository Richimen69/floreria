'use client'

import { useState } from 'react'
import { claseInput } from '@/components/ui/Campo'
import { formatearPrecio } from '@/lib/utils'

export type OpcionComplemento = { id: number; nombre: string; imagen: string | null; precioCentavos: number }

type Props = { opciones: OpcionComplemento[]; seleccionInicial: number[]; excluirId?: number; error?: string }

export function SelectorComplementos({ opciones, seleccionInicial, excluirId, error }: Props) {
  const [seleccion, setSeleccion] = useState(seleccionInicial)
  const [busqueda, setBusqueda] = useState('')

  const disponibles = opciones.filter((o) => o.id !== excluirId)
  const porId = new Map(disponibles.map((o) => [o.id, o]))
  const texto = busqueda.trim().toLowerCase()
  const filtradas = disponibles.filter((o) => o.nombre.toLowerCase().includes(texto))

  function alternar(id: number) {
    setSeleccion((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))
  }

  return (
    <div className="space-y-3 md:col-span-2">
      {seleccion.map((id) => (
        <input key={id} type="hidden" name="complementoIds" value={id} />
      ))}

      {seleccion.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {seleccion.map((id) => {
            const o = porId.get(id)
            if (!o) return null
            return (
              <span key={id} className="inline-flex items-center gap-2 rounded-full bg-primario-suave py-1 pr-2 pl-1 text-sm text-primario-oscuro">
                {o.imagen ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imagen} alt="" className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="h-6 w-6 rounded-full bg-borde" />
                )}
                {o.nombre}
                <button type="button" onClick={() => alternar(id)} aria-label={`Quitar ${o.nombre}`} className="font-semibold hover:text-red-700">
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}

      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar productos para sugerir…"
        className={claseInput}
      />

      <div className="max-h-72 divide-y divide-borde overflow-y-auto rounded-xl border border-borde">
        {filtradas.length === 0 ? (
          <p className="p-4 text-center text-sm text-texto-suave">No hay productos que coincidan.</p>
        ) : (
          filtradas.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-3 px-3 py-2 hover:bg-fondo">
              <input type="checkbox" checked={seleccion.includes(o.id)} onChange={() => alternar(o.id)} className="h-4 w-4 accent-primario" />
              <span className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
                {o.imagen && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.imagen} alt="" className="h-full w-full object-cover" />
                )}
              </span>
              <span className="flex-1 text-sm text-texto">{o.nombre}</span>
              <span className="text-sm text-texto-suave">{formatearPrecio(o.precioCentavos)}</span>
            </label>
          ))
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-700">{error}</p>
      ) : (
        <p className="text-xs text-texto-suave">Se mostrarán en la página del producto como "Acompáñalo con…".</p>
      )}
    </div>
  )
}