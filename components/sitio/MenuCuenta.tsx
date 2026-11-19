'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function MenuCuenta() {
  const router = useRouter()
  const { data: sesion, isPending } = authClient.useSession()
  const [abierto, setAbierto] = useState(false)
  const contenedorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return

    function manejarToqueFuera(e: PointerEvent) {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target as Node)) {
        setAbierto(false)
      }
    }

    function manejarEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setAbierto(false)
    }

    document.addEventListener('pointerdown', manejarToqueFuera)
    document.addEventListener('keydown', manejarEscape)

    return () => {
      document.removeEventListener('pointerdown', manejarToqueFuera)
      document.removeEventListener('keydown', manejarEscape)
    }
  }, [abierto])

  const claseBoton =
    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-borde text-texto transition-colors hover:border-primario hover:text-primario sm:h-10 sm:w-10'

  const icono = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" strokeLinecap="round" />
    </svg>
  )

  if (isPending) {
    return <span className={`${claseBoton} opacity-50`}>{icono}</span>
  }

  if (!sesion) {
    return (
      <Link href="/cuenta/entrar" aria-label="Iniciar sesión" className={claseBoton}>
        {icono}
      </Link>
    )
  }

  async function salir() {
    setAbierto(false)
    await authClient.signOut()
    router.refresh()
  }

  const inicial = (sesion.user.name?.trim().charAt(0) || '?').toUpperCase()

  return (
    <div ref={contenedorRef} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        aria-label="Mi cuenta"
        aria-expanded={abierto}
        aria-haspopup="menu"
        className={`${claseBoton} cursor-pointer`}
      >
        <span className="text-sm font-semibold">{inicial}</span>
      </button>

      {abierto && (
        <div
          role="menu"
          className="absolute right-0 z-30 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-tarjeta border border-borde bg-superficie p-2 shadow-lg"
        >
          <p className="truncate border-b border-borde px-3 py-2 text-sm font-medium text-texto-suave">
            {sesion.user.name}
          </p>
          <div className="mt-1 space-y-0.5">
            <Link
              href="/cuenta/pedidos"
              role="menuitem"
              onClick={() => setAbierto(false)}
              className="block rounded-xl px-3 py-2 text-sm text-texto hover:bg-fondo"
            >
              Mis pedidos
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={salir}
              className="block w-full rounded-xl px-3 py-2 text-left text-sm text-texto hover:bg-fondo"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}