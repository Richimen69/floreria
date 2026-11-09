'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

const iconos = {
  resumen: 'M3 12l9-8 9 8M5 10v10h14V10',
  categorias: 'M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v6H4zM14 15h6v6h-6z',
  productos: 'M12 3c-1.5 2-4 3-4 6a4 4 0 008 0c0-3-2.5-4-4-6zM12 13v8M8 17c-2 0-3-1-4-2M16 17c2 0 3-1 4-2',
  temporadas: 'M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 011 1v13a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z',
  calendario: 'M12 7v5l3 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  ajustes: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  externo: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
  salir: 'M15 4h4a1 1 0 011 1v14a1 1 0 01-1 1h-4M10 17l5-5-5-5M15 12H4',
  menu: 'M4 6h16M4 12h16M4 18h16',
  cerrar: 'M6 6l12 12M18 6L6 18',
}

function Icono({ d, clase = 'h-[18px] w-[18px]' }: { d: string; clase?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={`${clase} shrink-0`} aria-hidden>
      <path d={d} />
    </svg>
  )
}

const enlaces = [
  { href: '/admin', texto: 'Resumen', icono: iconos.resumen },
  { href: '/admin/categorias', texto: 'Categorías', icono: iconos.categorias },
  { href: '/admin/productos', texto: 'Productos', icono: iconos.productos },
  { href: '/admin/temporadas', texto: 'Temporadas', icono: iconos.temporadas },
  { href: '/admin/calendario', texto: 'Calendario', icono: iconos.calendario },
  { href: '/admin/ajustes', texto: 'Ajustes del sitio', icono: iconos.ajustes },
]

type Props = {
  nombre: string
  logoUrl: string | null
  usuario: { name: string; email: string }
}

function Marca({ nombre, logoUrl }: Pick<Props, 'nombre' | 'logoUrl'>) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-9 w-9 rounded-lg object-contain" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primario font-titulos text-lg font-semibold text-sobre-primario">
          {nombre.charAt(0)}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-titulos text-base font-semibold text-texto">{nombre}</p>
        <p className="text-xs text-texto-suave">Panel de administración</p>
      </div>
    </div>
  )
}

export function Sidebar({ nombre, logoUrl, usuario }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [abierto, setAbierto] = useState(false)

  // Cerrar con Escape y bloquear el scroll de la página mientras el menú está abierto
  useEffect(() => {
    if (!abierto) return
    const alPresionar = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false)
    document.addEventListener('keydown', alPresionar)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', alPresionar)
      document.body.style.overflow = ''
    }
  }, [abierto])

  async function cerrarSesion() {
    await authClient.signOut()
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <>
      {/* Barra superior, solo en celular y tableta */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-borde bg-superficie px-4 lg:hidden">
        <Marca nombre={nombre} logoUrl={logoUrl} />
        <button
          type="button"
          onClick={() => setAbierto(true)}
          aria-label="Abrir menú"
          aria-expanded={abierto}
          className="rounded-lg p-2 text-texto hover:bg-fondo"
        >
          <Icono d={iconos.menu} clase="h-6 w-6" />
        </button>
      </div>

      {/* Fondo oscuro detrás del menú */}
      <div
        onClick={() => setAbierto(false)}
        aria-hidden
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity lg:hidden ${abierto ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-borde bg-superficie transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:w-64 lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-2 px-5 py-5">
          <Marca nombre={nombre} logoUrl={logoUrl} />
          <button type="button" onClick={() => setAbierto(false)} aria-label="Cerrar menú" className="rounded-lg p-1.5 text-texto-suave hover:bg-fondo lg:hidden">
            <Icono d={iconos.cerrar} clase="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-texto-suave">General</p>
          {enlaces.map((e) => {
            const activo = e.href === '/admin' ? pathname === '/admin' : pathname.startsWith(e.href)
            return (
              <Link
                key={e.href}
                href={e.href}
                onClick={() => setAbierto(false)}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
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
          <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-texto-suave hover:bg-fondo hover:text-texto">
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
            <button onClick={cerrarSesion} title="Cerrar sesión" className="rounded-lg p-2 text-texto-suave hover:bg-fondo hover:text-red-700">
              <Icono d={iconos.salir} />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}