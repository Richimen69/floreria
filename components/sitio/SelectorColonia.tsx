'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { buscarColonias, type ColoniaEncontrada } from '@/server/acciones/colonias-publico'
import { formatearPrecio } from '@/lib/utils'

type Props = {
  seleccionada: ColoniaEncontrada | null
  onSeleccionar: (c: ColoniaEncontrada | null) => void
  error?: string
}

export function SelectorColonia({ seleccionada, onSeleccionar, error }: Props) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState<ColoniaEncontrada[]>([])
  const [abierto, setAbierto] = useState(false)
  const [buscando, iniciar] = useTransition()
  const ultima = useRef(0)

  // Espera a que deje de escribir 250 ms antes de buscar
  useEffect(() => {
    if (texto.trim().length < 2) return
    const id = ++ultima.current
    const espera = setTimeout(() => {
      iniciar(async () => {
        const r = await buscarColonias(texto)
        if (id === ultima.current) setResultados(r)
      })
    }, 250)
    return () => clearTimeout(espera)
  }, [texto])

  if (seleccionada) {
    return (
      <div className="space-y-1.5">
        <span className="block text-sm font-medium text-texto">Colonia</span>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-borde bg-superficie px-3.5 py-2.5">
          <span className="text-sm text-texto">
            {seleccionada.nombre} <span className="text-texto-suave">· C.P. {seleccionada.cp}</span>
          </span>
          <button
            type="button"
            onClick={() => { onSeleccionar(null); setTexto('') }}
            className="text-sm font-medium text-primario hover:underline"
          >
            Cambiar
          </button>
        </div>
        <input type="hidden" name="coloniaId" value={seleccionada.id} />
      </div>
    )
  }

  return (
    <div className="relative space-y-1.5">
      <label htmlFor="buscar-colonia" className="block text-sm font-medium text-texto">Colonia</label>
      <input
        id="buscar-colonia"
        type="search"
        autoComplete="off"
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setAbierto(true) }}
        onFocus={() => setAbierto(true)}
        placeholder="Escribe tu colonia o código postal"
        className="w-full rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-base text-texto outline-none focus:border-primario focus:ring-4 focus:ring-primario/15 sm:text-sm"
      />
      <input type="hidden" name="coloniaId" value="" />
      {error && <p className="text-xs text-red-700">{error}</p>}

      {abierto && texto.trim().length >= 2 && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded-xl border border-borde bg-superficie shadow-lg" role="listbox">
          {buscando && resultados.length === 0 && <li className="px-3.5 py-3 text-sm text-texto-suave">Buscando…</li>}
          {!buscando && resultados.length === 0 && (
            <li className="px-3.5 py-3 text-sm text-texto-suave">No encontramos esa colonia. Prueba con el código postal.</li>
          )}
          {resultados.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => { onSeleccionar(c); setAbierto(false) }}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm hover:bg-fondo"
              >
                <span>
                  <span className="text-texto">{c.nombre}</span>
                  <span className="block text-xs text-texto-suave">{c.tipo} · C.P. {c.cp}</span>
                </span>
                <span className={`shrink-0 text-xs ${c.conCobertura ? 'text-texto-suave' : 'text-red-700'}`}>
                  {c.conCobertura ? (c.costoCentavos ? `Envío ${formatearPrecio(c.costoCentavos)}` : 'Envío gratis') : 'Sin cobertura'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}