'use client'

import { useRef, useState, useTransition } from 'react'
import { subirImagen } from '@/server/acciones/imagenes'

const MAXIMO = 8

export function GaleriaImagenes({ valorInicial, error }: { valorInicial: string[]; error?: string }) {
  const [urls, setUrls] = useState(valorInicial)
  const [errorSubida, setErrorSubida] = useState<string | null>(null)
  const [subiendo, iniciar] = useTransition()
  const input = useRef<HTMLInputElement>(null)

  function subir(archivos: FileList | null) {
    if (!archivos?.length) return
    const disponibles = MAXIMO - urls.length
    const lista = Array.from(archivos).slice(0, disponibles)
    setErrorSubida(null)

    iniciar(async () => {
      for (const archivo of lista) {
        const datos = new FormData()
        datos.append('archivo', archivo)
        datos.append('carpeta', 'productos')
        const r = await subirImagen(datos)
        if (r.ok) setUrls((actual) => [...actual, r.url])
        else setErrorSubida(r.error)
      }
      if (input.current) input.current.value = ''
    })
  }

  function quitar(url: string) {
    setUrls((actual) => actual.filter((u) => u !== url))
  }

  function hacerPrincipal(url: string) {
    setUrls((actual) => [url, ...actual.filter((u) => u !== url)])
  }

  const mensaje = errorSubida ?? error

  return (
    <div className="space-y-3 md:col-span-2">
      {urls.map((url) => (
        <input key={url} type="hidden" name="imagenes" value={url} />
      ))}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {urls.map((url, i) => (
          <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-borde bg-fondo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute top-2 left-2 rounded-full bg-primario px-2 py-0.5 text-[10px] font-semibold text-sobre-primario">
                Principal
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-linear-to-t from-black/70 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
              {i !== 0 ? (
                <button type="button" onClick={() => hacerPrincipal(url)} className="text-xs font-medium text-white hover:underline">
                  Hacer principal
                </button>
              ) : <span />}
              <button type="button" onClick={() => quitar(url)} className="text-xs font-medium text-white hover:underline">
                Quitar
              </button>
            </div>
          </div>
        ))}

        {urls.length < MAXIMO && (
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-borde bg-fondo text-center hover:border-primario/50">
            <span className="text-2xl text-primario">+</span>
            <span className="px-2 text-xs text-texto-suave">{subiendo ? 'Subiendo…' : 'Agregar fotos'}</span>
            <input
              ref={input}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              disabled={subiendo}
              onChange={(e) => subir(e.target.files)}
              className="sr-only"
            />
          </label>
        )}
      </div>

      {mensaje ? (
        <p className="text-xs text-red-700">{mensaje}</p>
      ) : (
        <p className="text-xs text-texto-suave">Hasta {MAXIMO} fotos. La primera es la que se muestra en el catálogo.</p>
      )}
    </div>
  )
}