'use client'

import { useEffect, useRef, useState } from 'react'
import type { ItemCarrito } from '@/lib/carrito'
import { calendarioMes, type DiaCalendario } from '@/server/acciones/carrito'

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const nombreMes = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' })

function moverMes(mes: string, delta: number) {
  const [a, m] = mes.split('-').map(Number)
  const f = new Date(Date.UTC(a, m - 1 + delta, 1))
  return `${f.getUTCFullYear()}-${String(f.getUTCMonth() + 1).padStart(2, '0')}`
}

type Datos = { mes: string; dias: DiaCalendario[]; fechaMinima: string; fechaMaxima: string; hoy: string }

type Props = { items: ItemCarrito[]; seleccionada: string | null; onElegir: (fecha: string) => void }

export function CalendarioEntrega({ items, seleccionada, onElegir }: Props) {
  const [mes, setMes] = useState<string | null>(seleccionada?.slice(0, 7) ?? null)
  const [datos, setDatos] = useState<Datos | null>(null)
  const ultima = useRef(0)

  useEffect(() => {
    const id = ++ultima.current
    calendarioMes({ items, mes }).then((r) => {
      if (id === ultima.current) setDatos(r)
    })
  }, [items, mes])

  const fechaMinimaActual = datos?.fechaMinima
  useEffect(() => {
    // Si la nueva fecha mínima queda después del mes visible, mover el calendario a ese mes
    if (fechaMinimaActual && mes && mes < fechaMinimaActual.slice(0, 7)) {
      setMes(fechaMinimaActual.slice(0, 7))
    }
  }, [fechaMinimaActual, mes])

  if (!datos) return <div className="h-80 animate-pulse rounded-xl bg-fondo" />

  const [anio, numMes] = datos.mes.split('-').map(Number)
  const primerDia = new Date(Date.UTC(anio, numMes - 1, 1)).getUTCDay() // 0 = domingo
  const huecos = (primerDia + 6) % 7 // semana empieza en lunes
  const puedeAtras = datos.mes > datos.fechaMinima.slice(0, 7)
  const puedeAdelante = datos.mes < datos.fechaMaxima.slice(0, 7)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMes(moverMes(datos.mes, -1))}
          disabled={!puedeAtras}
          aria-label="Mes anterior"
          className="rounded-full p-2 text-texto hover:bg-fondo disabled:opacity-30"
        >
          ‹
        </button>
        <p className="text-lg font-semibold capitalize text-texto">{nombreMes.format(new Date(Date.UTC(anio, numMes - 1, 1)))}</p>
        <button
          type="button"
          onClick={() => setMes(moverMes(datos.mes, 1))}
          disabled={!puedeAdelante}
          aria-label="Mes siguiente"
          className="rounded-full p-2 text-texto hover:bg-fondo disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center">
        {DIAS_SEMANA.map((d, i) => (
          <span key={i} className="py-1 text-xs font-medium text-texto-suave">{d}</span>
        ))}
        {Array.from({ length: huecos }, (_, i) => <span key={`h${i}`} />)}
        {datos.dias.map((d) => {
          const elegido = d.fecha === seleccionada
          return (
            <button
              key={d.fecha}
              type="button"
              disabled={!d.disponible}
              onClick={() => onElegir(d.fecha)}
              title={d.motivo ?? undefined}
              aria-pressed={elegido}
              className={`mx-auto flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors sm:h-11 sm:w-11 ${elegido
                  ? 'bg-primario font-semibold text-sobre-primario'
                  : d.disponible
                    ? 'text-texto hover:bg-primario-suave'
                    : 'cursor-not-allowed text-texto-suave/40'
                } ${d.fecha === datos.hoy && !elegido ? 'ring-1 ring-borde' : ''}`}
            >
              {Number(d.fecha.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}