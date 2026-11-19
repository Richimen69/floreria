import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { VistaCheckout } from '@/components/sitio/VistaCheckout'
import { obtenerSesion } from '@/lib/permisos'
import { obtenerAjustes } from '@/server/consultas/ajustes'
import { validarCheckout } from '@/lib/validaciones/checkout'
import { legalesPublicadas } from '@/server/consultas/legales'
import { mercadoPagoDisponible } from '@/lib/mercadopago'

export const metadata: Metadata = { title: 'Finalizar pedido', robots: { index: false } }

async function Contenido() {
    const sesion = await obtenerSesion()
    if (!sesion) redirect('/cuenta/entrar?volver=/checkout')

    const [a, legales] = await Promise.all([obtenerAjustes(), legalesPublicadas()])

    return (
        <VistaCheckout
            whatsapp={a.whatsapp}
            usuario={{ nombre: sesion.user.name, email: sesion.user.email, telefono: sesion.user.telefono ?? '' }}
            pago={{
                transferencia: a.transferenciaActiva,
                mercadoPago: a.mercadoPagoActivo && mercadoPagoDisponible(),
                banco: a.banco,
                plazoMinutos: a.plazoPagoMinutos,
            }}
            legales={legales}
        />
    )
}

export default function CheckoutPage() {
    return (
        <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-tarjeta bg-borde" />}>
                <Contenido />
            </Suspense>
        </div>
    )
}