'use client'

import { useRef, useState, useTransition } from 'react'
import { Boton } from '@/components/ui/Boton'
import { claseInput } from '@/components/ui/Campo'
import { centavosATexto } from '@/lib/utils'
import { eliminarZona, guardarZona } from '@/server/acciones/envios'
import type { ZonaListada } from '@/server/consultas/envios'

export function DialogoZona({ zona }: { zona?: ZonaListada }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciar] = useTransition()

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    iniciar(async () => {
      const r = await guardarZona(zona?.id ?? null, datos)
      if (r.ok) dialogo.current?.close()
      else setError(r.mensaje)
    })
  }

  function eliminar() {
    if (!zona) return
    if (!confirm(`¿Eliminar "${zona.nombre}"? Sus ${zona.totalColonias} colonia(s) quedarán sin cobertura.`)) return
    iniciar(async () => {
      await eliminarZona(zona.id)
      dialogo.current?.close()
    })
  }

  return (
    <>
      {zona ? (
        <button type="button" onClick={() => { setError(null); dialogo.current?.showModal() }} className="text-sm font-medium text-primario hover:underline">
          Editar
        </button>
      ) : (
        <Boton type="button" onClick={() => { setError(null); dialogo.current?.showModal() }}>Nueva zona</Boton>
      )}

      <dialog ref={dialogo} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-tarjeta border border-borde bg-superficie p-0 text-left text-texto shadow-xl backdrop:bg-black/40">
        <form onSubmit={enviar} className="space-y-4 p-5">
          <h2 className="font-titulos text-lg font-semibold">{zona ? `Editar ${zona.nombre}` : 'Nueva zona'}</h2>

          <div className="space-y-1.5">
            <label htmlFor="zona-nombre" className="block text-sm font-medium">Nombre</label>
            <input id="zona-nombre" name="nombre" defaultValue={zona?.nombre} required placeholder="Ej. Zona Dorada" className={claseInput} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="zona-costo" className="block text-sm font-medium">Costo de envío</label>
            <input id="zona-costo" name="costo" inputMode="decimal" defaultValue={centavosATexto(zona?.costoCentavos ?? null)} required placeholder="80.00" className={claseInput} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="zona-nota" className="block text-sm font-medium">Nota interna</label>
            <input id="zona-nota" name="notaInterna" defaultValue={zona?.notaInterna ?? ''} placeholder="Solo la ve el panel" className={claseInput} />
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-3">
            <input type="checkbox" name="activa" defaultChecked={zona?.activa ?? true} className="mt-0.5 h-4 w-4 accent-primario" />
            <span>
              <span className="block text-sm font-medium">Activa</span>
              <span className="block text-xs text-texto-suave">Si la apagas, todas sus colonias quedan sin cobertura temporalmente</span>
            </span>
          </label>

          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

          <div className="flex items-center justify-between gap-2">
            {zona ? <Boton type="button" variante="peligro" onClick={eliminar}>Eliminar</Boton> : <span />}
            <div className="flex gap-2">
              <Boton type="button" variante="secundario" onClick={() => dialogo.current?.close()}>Cancelar</Boton>
              <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
            </div>
          </div>
        </form>
      </dialog>
    </>
  )
}