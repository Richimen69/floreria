import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { FormCuenta } from '@/components/sitio/FormCuenta'
import { destinoSeguro } from '@/lib/destino'
import { obtenerSesion } from '@/lib/permisos'
import { legalesPublicadas } from '@/server/consultas/legales'

export const metadata: Metadata = { title: 'Crear cuenta', robots: { index: false } }

type Props = { searchParams: Promise<{ volver?: string }> }

async function Contenido({ searchParams }: Props) {
  const volver = destinoSeguro((await searchParams).volver)
  if (await obtenerSesion()) redirect(volver)
  const legales = await legalesPublicadas()


  return (
    <div className="mx-auto max-w-sm px-4 pt-10 sm:pt-16">
      <h1 className="font-titulos text-3xl font-semibold text-texto">Crea tu cuenta</h1>
      <p className="mt-1 mb-6 text-sm text-texto-suave">Te toma un minuto y podrás seguir tus pedidos.</p>
      <FormCuenta modo="registro" volver={volver} legales={legales} />
    </div>
  )
}

export default function RegistroPage({ searchParams }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto mt-16 h-96 max-w-sm animate-pulse rounded-tarjeta bg-borde" />}>
      <Contenido searchParams={searchParams} />
    </Suspense>
  )
}