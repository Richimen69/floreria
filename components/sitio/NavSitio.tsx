'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const enlaces = [
  { href: '/', texto: 'Inicio' },
  { href: '/catalogo', texto: 'Catálogo' },
]

export function NavSitio() {
  const pathname = usePathname()

  return (
    <nav className="flex items-center gap-1">
      {enlaces.map((e) => {
        const activo = e.href === '/' ? pathname === '/' : pathname.startsWith(e.href)
        return (
          <Link
            key={e.href}
            href={e.href}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors sm:px-4 ${
              activo ? 'bg-primario-suave font-semibold text-primario-oscuro' : 'text-texto-suave hover:text-texto'
            }`}
          >
            {e.texto}
          </Link>
        )
      })}
    </nav>
  )
}