'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'

export function FormLogin() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setCargando(true)

    const datos = new FormData(e.currentTarget)
    const { data, error } = await authClient.signIn.email({
      email: String(datos.get('email')),
      password: String(datos.get('password')),
    })

    if (error) {
      setError('Correo o contraseña incorrectos')
      setCargando(false)
      return
    }

    if (data?.user.role !== 'admin') {
      await authClient.signOut()
      setError('Esta cuenta no tiene acceso al panel')
      setCargando(false)
      return
    }

    router.replace('/admin')
    router.refresh()
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-600 focus:ring-2 focus:ring-pink-600/20"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Contraseña
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-600 focus:ring-2 focus:ring-pink-600/20"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={cargando}
        className="w-full rounded-lg bg-pink-700 px-4 py-2 text-sm font-semibold text-white hover:bg-pink-800 disabled:opacity-60"
      >
        {cargando ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}