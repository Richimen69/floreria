'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { authClient } from '@/lib/auth-client'
import { CasillaLegales } from '@/components/sitio/CasillaLegales'
import { registrarAceptacionLegal } from '@/server/acciones/cuenta'

const claseCampo =
  'w-full rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-base text-texto outline-none focus:border-primario focus:ring-4 focus:ring-primario/15 sm:text-sm'

export function FormCuenta({
  modo,
  volver,
  legales = [],
}: {
  modo: 'entrar' | 'registro'
  volver: string
  legales?: { slug: string; titulo: string }[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [cargando, iniciar] = useTransition()
  const registro = modo === 'registro'

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const email = String(d.get('email'))
    const password = String(d.get('password'))
    setError(null)

    iniciar(async () => {
      const r = registro
        ? await authClient.signUp.email({
          name: String(d.get('nombre')),
          email,
          password,
          telefono: String(d.get('telefono')).replace(/\D/g, ''),
        })
        : await authClient.signIn.email({ email, password })

      if (r.error) {
        setError(
          registro
            ? r.error.code === 'USER_ALREADY_EXISTS'
              ? 'Ya existe una cuenta con ese correo. Inicia sesión.'
              : 'No pudimos crear tu cuenta. Revisa los datos.'
            : 'Correo o contraseña incorrectos',
        )
        return
      }
      if (registro) await registrarAceptacionLegal()
      router.replace(volver)
      router.refresh()
    })
  }

  const otraRuta = `${registro ? '/cuenta/entrar' : '/cuenta/registro'}?volver=${encodeURIComponent(volver)}`

  return (
    <form onSubmit={enviar} className="space-y-4">
      {registro && (
        <>
          <div className="space-y-1.5">
            <label htmlFor="nombre" className="block text-sm font-medium text-texto">Nombre</label>
            <input id="nombre" name="nombre" autoComplete="name" required minLength={2} className={claseCampo} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="telefono" className="block text-sm font-medium text-texto">Celular</label>
            <input id="telefono" name="telefono" type="tel" inputMode="tel" autoComplete="tel" required pattern="[\d\s\-]{10,14}" className={claseCampo} />
          </div>
        </>
      )}
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-texto">Correo</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={claseCampo} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-texto">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={registro ? 'new-password' : 'current-password'}
          required
          minLength={8}
          className={claseCampo}
        />
        {registro && <p className="text-xs text-texto-suave">Mínimo 8 caracteres</p>}
      </div>
      {!registro && (
        <Link href="/cuenta/olvide" className="block text-right text-xs font-medium text-primario hover:underline">
          ¿Olvidaste tu contraseña?
        </Link>
      )}
      {registro && <CasillaLegales legales={legales} nombre="aceptaRegistro" />}

      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro disabled:opacity-60"
      >
        {cargando ? 'Un momento…' : registro ? 'Crear cuenta' : 'Entrar'}
      </button>

      <p className="text-center text-sm text-texto-suave">
        {registro ? '¿Ya tienes cuenta? ' : '¿Primera vez? '}
        <Link href={otraRuta} className="font-medium text-primario hover:underline">
          {registro ? 'Inicia sesión' : 'Crea tu cuenta'}
        </Link>
      </p>
    </form>
  )
}