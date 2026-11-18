'use client'

import { useEffect, useState } from 'react'

const dos = (n: number) => String(n).padStart(2, '0')

function formatear(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000))
  const horas = Math.floor(total / 3600)
  const minutos = Math.floor((total % 3600) / 60)
  const segundos = total % 60
  return horas > 0 ? `${horas}:${dos(minutos)}:${dos(segundos)}` : `${minutos}:${dos(segundos)}`
}

type Props = {
  cierre: string      // ISO del cierre del bloque
  desfaseMs: number   // diferencia entre el reloj del servidor y el del teléfono
  inicio: string
  fin: string
  onVencido: () => void
}

export function CronometroBloque({ cierre, desfaseMs, inicio, fin, onVencido }: Props) {
  const [restante, setRestante] = useState(() => Date.parse(cierre) - (Date.now() + desfaseMs))

  useEffect(() => {
    const id = setInterval(() => {
      const r = Date.parse(cierre) - (Date.now() + desfaseMs)
      setRestante(r)
      if (r <= 0) {
        clearInterval(id)
        onVencido()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [cierre, desfaseMs, onVencido])

  if (restante <= 0) {
    return (
      <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
        El horario de {inicio} a {fin} acaba de cerrar para hoy. Elige otro horario o fecha.
      </div>
    )
  }

  const urgente = restante <= 5 * 60 * 1000

  return (
    <div
      role="timer"
      aria-live="off"
      className={`flex items-center gap-3 rounded-xl p-3 ${urgente ? 'bg-red-50 text-red-800' : 'bg-acento-suave text-texto'}`}
    >
      <span
        className={`font-mono text-2xl font-semibold tabular-nums ${urgente ? 'motion-safe:animate-pulse' : 'text-acento'}`}
      >
        {formatear(restante)}
      </span>
      <span className="text-sm leading-snug">
        para completar tu compra y recibirla <strong>hoy de {inicio} a {fin}</strong>.
      </span>
    </div>
  )
}