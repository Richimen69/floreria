'use client'

import { useRouter } from 'next/navigation'
import { carrito } from '@/lib/carrito'

export function VolverAPedir({ items }: { items: { productoId: number | null; cantidad: number }[] }) {
  const router = useRouter()

  function volver() {
    carrito.vaciar()
    for (const i of items) if (i.productoId) carrito.agregar(i.productoId, i.cantidad)
    router.push('/carrito')
  }

  return (
    <button type="button" onClick={volver} className="rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">
      Volver a pedir y elegir otro horario
    </button>
  )
}