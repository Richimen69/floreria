'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const iconos = {
  resumen: 'M3 12l9-8 9 8M5 10v10h14V10',
  ajustes: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  externo: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
  salir: 'M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H4',
  categorias: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z',
  productos: 'M12 3c-1.5 2-4 3-4 6a4 4 0 008 0c0-3-2.5-4-4-6zM12 13v8M8 17c-2 0-3-1-4-2M16 17c2 0 3-1 4-2',

}

function Icono({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-4.5 w-4.5 shrink-0" aria-hidden>
      <path d={d} />
    </svg>
  )
}

const enlaces = [
  { href: '/admin', texto: 'Resumen', icono: iconos.resumen },
  { href: '/admin/ajustes', texto: 'Ajustes del sitio', icono: iconos.ajustes },
  { href: '/admin/categorias', texto: 'Categorías', icono: iconos.categorias },
  { href: '/admin/productos', texto: 'Productos', icono: iconos.productos },
]

type Props = {
  nombre: string
  logoUrl: string | null
  usuario: { name: string; email: string }
}

export function Sidebar({ nombre, logoUrl, usuario }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  async function cerrarSesion() {
    await authClient.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-borde bg-superficie">
      <div className="flex items-center gap-3 px-5 py-5">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primario font-titulos text-lg font-semibold text-sobre-primario">
            {nombre.charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-titulos text-base font-semibold text-texto">{nombre}</p>
          <p className="text-xs text-texto-suave">Panel de administración</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-texto-suave">General</p>
        {enlaces.map((e) => {
          const activo = e.href === '/admin' ? pathname === '/admin' : pathname.startsWith(e.href)
          return (
            <Link
              key={e.href}
              href={e.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
                activo ? 'bg-primario-suave font-semibold text-primario-oscuro' : 'text-texto-suave hover:bg-fondo hover:text-texto'
              }`}
            >
              <Icono d={e.icono} />
              {e.texto}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-borde p-3">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-texto-suave hover:bg-fondo hover:text-texto">
          <Icono d={iconos.externo} />
          Ver sitio
        </a>
        <div className="flex items-center gap-3 rounded-xl px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-acento-suave text-xs font-semibold text-acento">
            {usuario.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-texto">{usuario.name}</p>
            <p className="truncate text-xs text-texto-suave">{usuario.email}</p>
          </div>
          <button onClick={cerrarSesion} title="Cerrar sesión" className="rounded-lg p-1.5 text-texto-suave hover:bg-fondo hover:text-red-700">
            <Icono d={iconos.salir} />
          </button>
        </div>
      </div>
    </aside>
  )
}