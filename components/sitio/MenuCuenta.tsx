'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function MenuCuenta() {
  const router = useRouter()
  const { data: sesion, isPending } = authClient.useSession()

  const claseBoton =
    'flex h-10 w-10 items-center justify-center rounded-full border border-borde text-texto hover:border-primario hover:text-primario'
  const icono = (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-5 w-5" aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0" strokeLinecap="round" />
    </svg>
  )

  if (isPending) return <span className={`${claseBoton} opacity-50`}>{icono}</span>

  if (!sesion) {
    return (
      <Link href="/cuenta/entrar" aria-label="Iniciar sesión" className={claseBoton}>
        {icono}
      </Link>
    )
  }

  async function salir() {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <details className="relative [&_summary::-webkit-details-marker]:hidden">
      <summary aria-label="Mi cuenta" className={`${claseBoton} cursor-pointer list-none`}>
        <span className="text-sm font-semibold">{sesion.user.name.charAt(0).toUpperCase()}</span>
      </summary>
      <div className="absolute right-0 z-30 mt-2 w-56 rounded-tarjeta border border-borde bg-superficie p-2 shadow-lg">
        <p className="truncate px-3 py-2 text-sm text-texto-suave">{sesion.user.name}</p>
        <Link href="/cuenta/pedidos" className="block rounded-xl px-3 py-2 text-sm text-texto hover:bg-fondo">
          Mis pedidos
        </Link>
        <button type="button" onClick={salir} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-texto hover:bg-fondo">
          Cerrar sesión
        </button>
      </div>
    </details>
  )
}