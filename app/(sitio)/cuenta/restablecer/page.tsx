import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { FormNuevaContrasena } from '@/components/sitio/FormRecuperar'

export const metadata: Metadata = { title: 'Nueva contraseña', robots: { index: false } }

type Props = { searchParams: Promise<{ token?: string; error?: string }> }

async function Contenido({ searchParams }: Props) {
  const { token, error } = await searchParams

  if (!token || error) {
    return (
      <p className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
        Este enlace no es válido o ya venció.{' '}
        <Link href="/cuenta/olvide" className="font-semibold underline">Pide uno nuevo</Link>
      </p>
    )
  }
  return <FormNuevaContrasena token={token} />
}

export default function RestablecerPage({ searchParams }: Props) {
  return (
    <div className="mx-auto max-w-sm px-4 pt-10 sm:pt-16">
      <h1 className="mb-6 font-titulos text-3xl font-semibold text-texto">Crea una nueva contraseña</h1>
      <Suspense fallback={<div className="h-48 animate-pulse rounded-tarjeta bg-borde" />}>
        <Contenido searchParams={searchParams} />
      </Suspense>
    </div>
  )
}