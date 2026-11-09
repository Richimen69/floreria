'use client'

import Link from 'next/link'
import { useCarrito } from '@/lib/carrito'

export function IconoCarrito() {
  const { items } = useCarrito()
  const total = items.reduce((suma, i) => suma + i.cantidad, 0)

  return (
    <Link
      href="/carrito"
      aria-label={total > 0 ? `Carrito, ${total} artículo(s)` : 'Carrito'}
      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-borde text-texto hover:border-primario hover:text-primario"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden>
        <path d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {total > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-primario px-1 text-[11px] font-semibold text-sobre-primario">
          {total}
        </span>
      )}
    </Link>
  )
}