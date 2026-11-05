'use client'

import { useRef, useState, useTransition } from 'react'
import { subirImagen } from '@/server/acciones/imagenes'

type Props = {
  nombre: string
  etiqueta: string
  carpeta: 'logos' | 'portada' | 'productos' | 'categorias'
  valorInicial: string | null
  forma?: 'cuadrada' | 'ancha'
  ayuda?: string
  error?: string
  onCambio?: (url: string) => void
}

export function SubirImagen({
  nombre, etiqueta, carpeta, valorInicial, forma = 'cuadrada', ayuda, error, onCambio,
}: Props) {
  const [url, setUrl] = useState(valorInicial ?? '')
  const [errorSubida, setErrorSubida] = useState<string | null>(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [subiendo, iniciarSubida] = useTransition()
  const input = useRef<HTMLInputElement>(null)

  function actualizar(nuevaUrl: string) {
    setUrl(nuevaUrl)
    onCambio?.(nuevaUrl)
  }

  function procesar(archivo: File | undefined) {
    if (!archivo) return
    setErrorSubida(null)
    const datos = new FormData()
    datos.append('archivo', archivo)
    datos.append('carpeta', carpeta)

    iniciarSubida(async () => {
      const r = await subirImagen(datos)
      if (r.ok) actualizar(r.url)
      else setErrorSubida(r.error)
      if (input.current) input.current.value = ''
    })
  }

  const mensajeError = errorSubida ?? error
  const proporcion = forma === 'ancha' ? 'aspect-[16/9]' : 'aspect-square max-w-40'

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-texto">{etiqueta}</span>
      <input type="hidden" name={nombre} value={url} />

      <label
        onDragOver={(e) => { e.preventDefault(); setArrastrando(true) }}
        onDragLeave={() => setArrastrando(false)}
        onDrop={(e) => { e.preventDefault(); setArrastrando(false); procesar(e.dataTransfer.files[0]) }}
        className={`group relative flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition-colors ${proporcion} ${
          arrastrando ? 'border-primario bg-primario-suave' : 'border-borde bg-fondo hover:border-primario/50'
        }`}
      >
        {url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className={`h-full w-full ${forma === 'ancha' ? 'object-cover' : 'object-contain p-3'}`} />
            <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              Cambiar imagen
            </span>
          </>
        ) : (
          <span className="px-4 text-center text-xs text-texto-suave">
            <span className="font-semibold text-primario">Sube una imagen</span>
            <br />o arrástrala aquí
          </span>
        )}

        {subiendo && (
          <span className="absolute inset-0 flex items-center justify-center bg-superficie/80 text-sm text-texto">
            Subiendo…
          </span>
        )}

        <input
          ref={input}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => procesar(e.target.files?.[0])}
          disabled={subiendo}
          className="sr-only"
        />
      </label>

      <div className="flex items-center justify-between gap-2">
        {mensajeError ? (
          <p className="text-xs text-red-700">{mensajeError}</p>
        ) : (
          <p className="text-xs text-texto-suave">{ayuda ?? 'JPG, PNG o WebP, máximo 5 MB'}</p>
        )}
        {url && !subiendo && (
          <button type="button" onClick={() => actualizar('')} className="shrink-0 text-xs font-medium text-red-700 hover:underline">
            Quitar
          </button>
        )}
      </div>
    </div>
  )
}