'use client'

import Image from 'next/image'
import { ViewTransition, useState } from 'react'

type Elemento = { tipo: 'imagen'; url: string } | { tipo: 'video'; url: string; poster: string | null }

type Props = {
  id: number
  imagenes: string[]
  nombre: string
  video?: { url: string; poster: string | null } | null
}

export function GaleriaProducto({ id, imagenes, nombre, video }: Props) {
  const elementos: Elemento[] = [
    ...imagenes.map((url) => ({ tipo: 'imagen' as const, url })),
    ...(video ? [{ tipo: 'video' as const, url: video.url, poster: video.poster }] : []),
  ]
  const [actual, setActual] = useState(0)

  if (elementos.length === 0) {
    return <div className="aspect-square rounded-tarjeta bg-primario-suave" />
  }

  const seleccionado = elementos[Math.min(actual, elementos.length - 1)]

  return (
    <div className="space-y-3">
      <div className="relative aspect-square overflow-hidden rounded-tarjeta bg-primario-suave">
        {seleccionado.tipo === 'imagen' ? (
          <ViewTransition name={`foto-producto-${id}`} share="foto-producto">
            <Image src={seleccionado.url} alt={nombre} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
          </ViewTransition>
        ) : (
          <video
            key={seleccionado.url}
            src={seleccionado.url}
            poster={seleccionado.poster ?? undefined}
            autoPlay
            muted
            loop
            playsInline
            aria-label={`Video de ${nombre}`}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {elementos.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {elementos.map((el, i) => (
            <button
              key={el.url}
              type="button"
              onClick={() => setActual(i)}
              aria-label={el.tipo === 'video' ? 'Ver video' : `Ver foto ${i + 1}`}
              className={`relative aspect-square overflow-hidden rounded-xl ring-2 transition ${
                i === actual ? 'ring-primario' : 'ring-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {el.tipo === 'imagen' ? (
                <Image src={el.url} alt="" fill sizes="20vw" className="object-cover" />
              ) : (
                <>
                  {el.poster ? (
                    <Image src={el.poster} alt="" fill sizes="20vw" className="object-cover" />
                  ) : (
                    <span className="absolute inset-0 bg-texto/20" />
                  )}
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/55 text-white">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 h-4 w-4" aria-hidden>
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </span>
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}