import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { fechaLarga } from '@/lib/fechas'
import { formatearPrecio } from '@/lib/utils'
import { obtenerPedidoPorToken } from '@/server/consultas/pedidos'
import { LUGARES } from '@/lib/lugares'
import { VolverAPedir } from '@/components/sitio/VolverAPedir'
import { obtenerAjustes } from '@/server/consultas/ajustes'
import { vencerPedidosExpirados } from '@/server/vencimientos'
import { PagoTransferencia } from '@/components/sitio/PagoTransferencia'
import { PagoMercadoPago } from '@/components/sitio/PagoMercadoPago'
import { ESTADOS_PAGO } from '@/lib/pedidos'
import { EsperarConfirmacion } from '@/components/sitio/EsperarConfirmacion'

export const metadata: Metadata = { title: 'Tu pedido', robots: { index: false, follow: false } }

type Props = {
    params: Promise<{ token: string }>
    searchParams: Promise<{ pago?: string }>
}

async function Detalle({ params, searchParams }: Props) {
    const { token } = await params
    const { pago: regreso } = await searchParams
    await vencerPedidosExpirados()

    const [p, ajustes] = await Promise.all([obtenerPedidoPorToken(token), obtenerAjustes()])
    if (!p) notFound()

    const pago = ESTADOS_PAGO[p.estadoPago]
    const esMercadoPago = p.metodoPago === 'mercadopago'

    return (
        <div className="mx-auto max-w-2xl space-y-6 px-4 pt-8 sm:px-6 sm:pt-12">
            <div className="text-center">
                <p className="text-sm text-texto-suave">Pedido</p>
                <h1 className="font-titulos text-4xl font-semibold tracking-wide text-texto">{p.folio}</h1>
                <span className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${pago.clase}`}>{pago.texto}</span>
            </div>

            {/* ───────── Pago por transferencia ───────── */}
            {p.estadoPago === 'pendiente' && p.metodoPago === 'transferencia' && p.pagoVenceEn && ajustes.clabe && (
                <PagoTransferencia
                    token={p.token}
                    folio={p.folio}
                    totalCentavos={p.totalCentavos}
                    venceEn={p.pagoVenceEn.toISOString()}
                    banco={ajustes.banco ?? ''}
                    titular={ajustes.titularCuenta ?? ''}
                    clabe={ajustes.clabe}
                />
            )}

            {p.estadoPago === 'en_revision' && (
                <p className="rounded-tarjeta bg-blue-50 p-4 text-center text-sm text-blue-900">
                    {esMercadoPago
                        ? 'Mercado Pago está revisando tu pago. Te avisaremos por correo en cuanto se confirme.'
                        : 'Recibimos tu comprobante. Lo estamos verificando y te avisaremos en cuanto se confirme el pago.'}
                </p>
            )}

            {/* ───────── Pago con Mercado Pago ───────── */}
            {p.estadoPago === 'pendiente' && regreso === 'aprobado' && (
                <>
                    <EsperarConfirmacion />
                    <p className="rounded-tarjeta bg-green-50 p-4 text-center text-sm text-green-800">
                        ¡Recibimos tu pago! Lo estamos confirmando con Mercado Pago; esta página se actualizará en unos segundos.
                    </p>
                </>
            )}
            {p.estadoPago === 'pendiente' && esMercadoPago && p.mpEstado === 'in_process' && regreso !== 'aprobado' && (
                <p className="rounded-tarjeta bg-blue-50 p-4 text-center text-sm text-blue-900">
                    Mercado Pago está revisando tu pago. Te avisaremos por correo en cuanto se confirme.
                </p>
            )}
            {p.estadoPago === 'pendiente' && regreso === 'pendiente' && (
                <p className="rounded-tarjeta bg-blue-50 p-4 text-center text-sm text-blue-900">
                    Tu pago está en proceso. Te avisaremos por correo en cuanto se confirme.
                </p>
            )}
            {p.estadoPago === 'pendiente' && regreso === 'fallido' && (
                <p className="rounded-tarjeta bg-red-50 p-4 text-center text-sm text-red-800">
                    El pago no se completó. Puedes intentarlo de nuevo con otra tarjeta.
                </p>
            )}

            {p.estadoPago === 'pendiente' && esMercadoPago && p.pagoVenceEn && regreso !== 'aprobado' && (
                <PagoMercadoPago token={p.token} totalCentavos={p.totalCentavos} venceEn={p.pagoVenceEn.toISOString()} />
            )}

            {/* ───────── Pedido cancelado por pago ───────── */}
            {(p.estadoPago === 'rechazado' || p.estadoPago === 'vencido') && (
                <div className="space-y-3 rounded-tarjeta bg-red-50 p-5 text-center text-sm text-red-900">
                    <p>
                        {p.estadoPago === 'vencido'
                            ? esMercadoPago
                                ? 'No se completó el pago a tiempo, así que el pedido se canceló y el horario se liberó.'
                                : 'No recibimos tu comprobante a tiempo, así que el pedido se canceló y el horario se liberó.'
                            : `No pudimos confirmar tu pago${p.motivoRechazo ? `: ${p.motivoRechazo}` : '.'} El pedido se canceló.`}
                    </p>
                    <VolverAPedir items={p.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad }))} />
                </div>
            )}

            <section className="space-y-3 rounded-tarjeta border border-borde bg-superficie p-5 text-sm">
                <h2 className="font-titulos text-lg font-semibold text-texto">Entrega</h2>
                <p className="capitalize text-texto">{fechaLarga(p.fechaEntrega)}, de {p.bloqueInicio} a {p.bloqueFin}</p>
                <p className="text-texto-suave">
                    Para {p.destinatarioNombre} · {p.destinatarioTelefono}
                    <br />
                    {p.calle}, {p.coloniaNombre}, C.P. {p.cp}
                    {p.referencias && <><br />{p.referencias}</>}
                </p>
                {p.tipoLugar !== 'casa' && (
                    <p className="text-texto-suave">
                        {LUGARES[p.tipoLugar].texto}: {p.nombreLugar}
                        {p.detalleLugar && ` · ${p.detalleLugar}`}
                        {p.relacionLugar && ` · ${LUGARES[p.tipoLugar].relaciones?.[p.relacionLugar] ?? ''}`}
                    </p>
                )}

                {p.tarjetaEnBlanco ? (
                    <p className="text-texto-suave">Tarjeta en blanco</p>
                ) : (
                    p.mensajeTarjeta && (
                        <div className="rounded-xl bg-amber-50 p-4 text-stone-800">
                            {p.paraTarjeta && <p className="text-xs text-stone-600">Para: {p.paraTarjeta}</p>}
                            <p className="mt-1 font-titulos text-lg">“{p.mensajeTarjeta}”</p>
                            <p className="mt-2 text-sm text-stone-600">
                                {p.anonimo ? '— Anónimo' : p.firmaTarjeta && `— ${p.firmaTarjeta}`}
                            </p>
                        </div>
                    )
                )}
            </section>

            <section className="space-y-3 rounded-tarjeta border border-borde bg-superficie p-5 text-sm">
                <h2 className="font-titulos text-lg font-semibold text-texto">Productos</h2>
                <ul className="space-y-2">
                    {p.items.map((i) => (
                        <li key={i.id} className="flex justify-between gap-3">
                            <span className="text-texto">{i.cantidad} × {i.nombre}</span>
                            <span className="text-texto">{formatearPrecio(i.subtotalCentavos)}</span>
                        </li>
                    ))}
                </ul>
                <div className="space-y-1 border-t border-borde pt-3">
                    <div className="flex justify-between text-texto-suave"><span>Productos</span><span>{formatearPrecio(p.subtotalCentavos)}</span></div>
                    <div className="flex justify-between text-texto-suave"><span>Envío</span><span>{p.envioCentavos ? formatearPrecio(p.envioCentavos) : 'Gratis'}</span></div>
                    <div className="flex justify-between text-base font-semibold text-texto"><span>Total</span><span>{formatearPrecio(p.totalCentavos)}</span></div>
                </div>
            </section>

            <p className="flex justify-center gap-6 text-sm">
                <Link href="/cuenta/pedidos" className="font-medium text-primario hover:underline">Ver mis pedidos</Link>
                <Link href="/catalogo" className="font-medium text-primario hover:underline">Seguir viendo el catálogo</Link>
            </p>
            <p className="text-center text-xs text-texto-suave">
                ¿Necesitas cancelar? Consulta nuestra{' '}
                <Link href="/cancelaciones" className="text-primario underline">política de cancelaciones y reembolsos</Link>.
            </p>
        </div>
    )
}

export default function PedidoPage({ params, searchParams }: Props) {
    return (
        <Suspense fallback={<div className="mx-auto mt-12 h-96 max-w-2xl animate-pulse rounded-tarjeta bg-borde" />}>
            <Detalle params={params} searchParams={searchParams} />
        </Suspense>
    )
}