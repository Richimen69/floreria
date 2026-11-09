import type { Metadata } from 'next'
import { VistaCarrito } from '@/components/sitio/VistaCarrito'

export const metadata: Metadata = { title: 'Carrito', robots: { index: false } }

export default function CarritoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
      <h1 className="mb-6 font-titulos text-3xl font-semibold text-texto sm:text-4xl">Tu carrito</h1>
      <VistaCarrito />
    </div>
  )
}