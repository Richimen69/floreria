'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { authClient } from '@/lib/auth-client'

const claseCampo =
  'w-full rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-base text-texto outline-none focus:border-primario focus:ring-4 focus:ring-primario/15 sm:text-sm'
const claseBoton =
  'w-full rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro disabled:opacity-60'

export function FormPedirEnlace() {
  const [enviado, setEnviado] = useState(false)
  const [cargando, iniciar] = useTransition()

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const email = String(new FormData(e.currentTarget).get('email'))
    iniciar(async () => {
      await authClient.requestPasswordReset({ email, redirectTo: '/cuenta/restablecer' })
      setEnviado(true) // siempre el mismo mensaje, exista o no la cuenta
    })
  }

  if (enviado) {
    return (
      <p className="rounded-xl bg-green-50 p-4 text-sm text-green-800">
        Si existe una cuenta con ese correo, te enviamos un enlace para crear una nueva contraseña. Revisa también tu carpeta de spam.
      </p>
    )
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-medium text-texto">Correo de tu cuenta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className={claseCampo} />
      </div>
      <button type="submit" disabled={cargando} className={claseBoton}>{cargando ? 'Enviando…' : 'Enviarme el enlace'}</button>
    </form>
  )
}

export function FormNuevaContrasena({ token }: { token: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [cargando, iniciar] = useTransition()

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const d = new FormData(e.currentTarget)
    const nueva = String(d.get('password'))
    if (nueva !== String(d.get('confirmar'))) return setError('Las contraseñas no coinciden')

    setError(null)
    iniciar(async () => {
      const r = await authClient.resetPassword({ newPassword: nueva, token })
      if (r.error) {
        setError('El enlace ya no es válido. Pide uno nuevo.')
        return
      }
      router.replace('/cuenta/entrar?restablecida=1')
    })
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-medium text-texto">Nueva contraseña</label>
        <input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required className={claseCampo} />
        <p className="text-xs text-texto-suave">Mínimo 8 caracteres</p>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="confirmar" className="block text-sm font-medium text-texto">Repítela</label>
        <input id="confirmar" name="confirmar" type="password" autoComplete="new-password" minLength={8} required className={claseCampo} />
      </div>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
          {error} <Link href="/cuenta/olvide" className="font-semibold underline">Pedir otro enlace</Link>
        </p>
      )}
      <button type="submit" disabled={cargando} className={claseBoton}>{cargando ? 'Guardando…' : 'Guardar contraseña'}</button>
    </form>
  )
}