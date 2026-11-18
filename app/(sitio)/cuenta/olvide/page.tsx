import type { Metadata } from 'next'
import { FormPedirEnlace } from '@/components/sitio/FormRecuperar'

export const metadata: Metadata = { title: 'Recuperar contraseña', robots: { index: false } }

export default function OlvidePage() {
  return (
    <div className="mx-auto max-w-sm px-4 pt-10 sm:pt-16">
      <h1 className="font-titulos text-3xl font-semibold text-texto">¿Olvidaste tu contraseña?</h1>
      <p className="mt-1 mb-6 text-sm text-texto-suave">Escribe tu correo y te enviaremos un enlace para crear una nueva.</p>
      <FormPedirEnlace />
    </div>
  )
}