'use client'

import { useRef, useState, useTransition } from 'react'
import { Boton } from '@/components/ui/Boton'
import { claseInput } from '@/components/ui/Campo'
import { agregarColonia } from '@/server/acciones/envios'

export function DialogoColonia({ zonas }: { zonas: { id: number; nombre: string }[] }) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [guardando, iniciar] = useTransition()

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formulario = e.currentTarget
    const datos = new FormData(formulario)
    iniciar(async () => {
      const r = await agregarColonia(datos)
      if (r.ok) {
        formulario.reset()
        dialogo.current?.close()
      } else setError(r.mensaje)
    })
  }

  return (
    <>
      <Boton type="button" variante="secundario" onClick={() => { setError(null); dialogo.current?.showModal() }}>
        Agregar colonia
      </Boton>

      <dialog ref={dialogo} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-tarjeta border border-borde bg-superficie p-0 text-left text-texto shadow-xl backdrop:bg-black/40">
        <form onSubmit={enviar} className="space-y-4 p-5">
          <h2 className="font-titulos text-lg font-semibold">Agregar colonia</h2>
          <div className="space-y-1.5">
            <label htmlFor="col-nombre" className="block text-sm font-medium">Nombre</label>
            <input id="col-nombre" name="nombre" required className={claseInput} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="col-tipo" className="block text-sm font-medium">Tipo</label>
              <input id="col-tipo" name="tipo" placeholder="Colonia" className={claseInput} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="col-cp" className="block text-sm font-medium">C.P.</label>
              <input id="col-cp" name="cp" inputMode="numeric" maxLength={5} required className={claseInput} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="col-zona" className="block text-sm font-medium">Zona</label>
            <select id="col-zona" name="zonaId" defaultValue="" className={claseInput}>
              <option value="">Sin cobertura</option>
              {zonas.map((z) => <option key={z.id} value={z.id}>{z.nombre}</option>)}
            </select>
          </div>
          {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
          <div className="flex justify-end gap-2">
            <Boton type="button" variante="secundario" onClick={() => dialogo.current?.close()}>Cancelar</Boton>
            <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Agregar'}</Boton>
          </div>
        </form>
      </dialog>
    </>
  )
}