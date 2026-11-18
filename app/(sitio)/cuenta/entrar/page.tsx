import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { FormCuenta } from '@/components/sitio/FormCuenta'
import { destinoSeguro } from '@/lib/destino'
import { obtenerSesion } from '@/lib/permisos'

export const metadata: Metadata = { title: 'Iniciar sesión', robots: { index: false } }

type Props = { searchParams: Promise<{ volver?: string; restablecida?: string }> }


async function Contenido({ searchParams }: Props) {
  const sp = await searchParams
  const volver = destinoSeguro(sp.volver)
  if (await obtenerSesion()) redirect(volver)

  return (
    <div className="mx-auto max-w-sm px-4 pt-10 sm:pt-16">
      {sp.restablecida && (
        <p className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">Tu contraseña se cambió. Ya puedes iniciar sesión.</p>
      )}
      <h1 className="font-titulos text-3xl font-semibold text-texto">Inicia sesión</h1>
      <p className="mt-1 mb-6 text-sm text-texto-suave">Para hacer tu pedido y darle seguimiento.</p>
      <FormCuenta modo="entrar" volver={volver} />
    </div>
  )
}

export default function EntrarPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto mt-16 h-80 max-w-sm animate-pulse rounded-tarjeta bg-borde" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  )
}