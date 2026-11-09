'use client'

import { useState } from 'react'
import { carrito } from '@/lib/carrito'

type Props = {
  productoId: number
  disponible: boolean
  textoNoDisponible?: string
  grande?: boolean
}

export function BotonAgregar({ productoId, disponible, textoNoDisponible = 'No disponible', grande = false }: Props) {
  const [agregado, setAgregado] = useState(false)

  function agregar() {
    carrito.agregar(productoId)
    setAgregado(true)
    setTimeout(() => setAgregado(false), 1500)
  }

  const texto = !disponible ? textoNoDisponible : agregado ? '✓ Agregado' : grande ? 'Agregar al carrito' : 'Agregar'

  return (
    <button
      type="button"
      disabled={!disponible}
      onClick={agregar}
      className={`rounded-full bg-primario text-sm font-semibold text-sobre-primario transition-colors  cursor-pointer hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-texto-suave ${
        grande ? 'flex-1 px-6 py-3' : 'mt-2 px-4 py-2'
      }`}
    >
      {texto}
    </button>
  )
}