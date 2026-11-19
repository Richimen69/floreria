import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { EsqueletoFormulario } from '@/components/admin/EsqueletoFormulario'
import { fechaLarga } from '@/lib/fechas'
import { LUGARES } from '@/lib/lugares'
import { whatsappMexico } from '@/lib/pedidos'
import { formatearPrecio } from '@/lib/utils'
import { obtenerPedidoAdmin } from '@/server/consultas/pedidos-admin'
import { AccionesPedido } from '@/components/admin/AccionesPedido'
import { ESTADOS_PAGO, ESTADOS_TRABAJO, DETALLES_MERCADO_PAGO } from '@/lib/pedidos'
import { urlTemporalPrivada } from '@/lib/r2'
import { MapaInteractivo } from '@/components/sitio/MapaInteractivo'
import { obtenerAjustes } from '@/server/consultas/ajustes'
import { ResolverPagoMP } from '@/components/admin/ResolverPagoMP'
import { ESTADOS_MERCADO_PAGO } from '@/lib/pedidos'

type Props = { params: Promise<{ id: string }> }

const formatoFechaHora = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' })

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <section className="space-y-3 rounded-tarjeta border border-borde bg-superficie p-4 text-sm sm:p-5">
            <h2 className="font-titulos text-lg font-semibold text-texto">{titulo}</h2>
            {children}
        </section>
    )
}

function BotonWhatsapp({ href, texto }: { href: string | null; texto: string }) {
    if (!href) return null
    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-full bg-[#25d366] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90">
            {texto}
        </a>
    )
}

async function Contenido({ params }: Props) {
    await connection()
    const { id } = await params
    const numero = Number(id)
    if (!Number.isInteger(numero)) notFound()

    const p = await obtenerPedidoAdmin(numero)
    if (!p) notFound()
    const urlComprobante = p.comprobanteKey ? await urlTemporalPrivada(p.comprobanteKey) : null

    const lugar = LUGARES[p.tipoLugar]

    const ajustes = await obtenerAjustes()
    const hayUbicacion = p.entregaLatitud != null && p.entregaLongitud != null

    return (
        <div>
            <EncabezadoPagina
                titulo={`Pedido ${p.folio}`}
                volver={{ href: '/admin/pedidos', texto: 'Pedidos' }}
                descripcion={`Recibido ${formatoFechaHora.format(p.creadoEn)} · origen: ${p.origen}`}
            />

            <div className="grid max-w-5xl gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                    <Seccion titulo="Entrega">
                        <p className="text-base font-semibold capitalize text-texto">{fechaLarga(p.fechaEntrega)} · {p.bloqueInicio} a {p.bloqueFin}</p>
                        <div className="space-y-1 text-texto">
                            <p><span className="text-texto-suave">Recibe:</span> {p.destinatarioNombre} · {p.destinatarioTelefono}</p>
                            <p><span className="text-texto-suave">Dirección:</span> {p.calle}, {p.coloniaNombre}, C.P. {p.cp}</p>
                            {p.referencias && <p><span className="text-texto-suave">Referencias:</span> {p.referencias}</p>}
                            <p><span className="text-texto-suave">Zona:</span> {p.zonaNombre}</p>
                            {p.tipoLugar !== 'casa' && (
                                <p className="rounded-xl bg-amber-50 p-2 text-amber-900">
                                    <strong>{lugar.texto}:</strong> {p.nombreLugar}
                                    {p.detalleLugar && ` · ${p.detalleLugar}`}
                                    {p.relacionLugar && ` · ${lugar.relaciones?.[p.relacionLugar] ?? ''}`}
                                </p>
                            )}
                        </div>
                        <BotonWhatsapp href={whatsappMexico(p.destinatarioTelefono)} texto="WhatsApp a quien recibe" />
                        {p.legalesAceptadosEn && (
                            <p className="text-xs text-texto-suave">
                                Aceptó términos v{p.versionTerminos ?? '–'}, cancelaciones v{p.versionCancelaciones ?? '–'} y
                                privacidad v{p.versionPrivacidad ?? '–'} el {formatoFechaHora.format(p.legalesAceptadosEn)}
                            </p>
                        )}

                        {hayUbicacion ? (
                            <div className="space-y-2">
                                <MapaInteractivo
                                    latitud={p.entregaLatitud!}
                                    longitud={p.entregaLongitud!}
                                    nombre={`Entrega para ${p.destinatarioNombre ?? ''}`}
                                    direccion={`${p.calle ?? ''}, ${p.coloniaNombre ?? ''}`}
                                    colores={{ primario: ajustes.colorPrimario, acento: ajustes.colorAcento, fondo: ajustes.colorFondo }}
                                />
                                <div className="flex flex-wrap gap-2">
                                    <a
                                        href={`https://www.google.com/maps/dir/?api=1&destination=${p.entregaLatitud},${p.entregaLongitud}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-borde px-3 py-1.5 text-xs font-semibold text-texto hover:border-primario"
                                    >
                                        Ruta en Google Maps
                                    </a>
                                    <a
                                        href={`https://waze.com/ul?ll=${p.entregaLatitud},${p.entregaLongitud}&navigate=yes`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="rounded-full border border-borde px-3 py-1.5 text-xs font-semibold text-texto hover:border-primario"
                                    >
                                        Abrir en Waze
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-texto-suave">El cliente no marcó ubicación en el mapa; guíate por la dirección y referencias.</p>
                        )}
                        <a
                            href={`/admin/pedidos/${p.id}/hoja`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-texto px-4 py-2 text-xs font-semibold text-fondo hover:opacity-90"
                        >
                            🖨 Imprimir hoja de entrega
                        </a>
                    </Seccion>

                    <Seccion titulo="Productos">
                        <ul className="space-y-2">
                            {p.items.map((i) => (
                                <li key={i.id} className="flex items-center gap-3">
                                    <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
                                        {i.imagen && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={i.imagen} alt="" className="h-full w-full object-cover" />
                                        )}
                                    </span>
                                    <span className="flex-1 text-texto"><strong>{i.cantidad} ×</strong> {i.nombre}</span>
                                    <span className="text-texto">{formatearPrecio(i.subtotalCentavos)}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="space-y-1 border-t border-borde pt-3">
                            <div className="flex justify-between text-texto-suave"><span>Productos</span><span>{formatearPrecio(p.subtotalCentavos)}</span></div>
                            <div className="flex justify-between text-texto-suave"><span>Envío</span><span>{formatearPrecio(p.envioCentavos)}</span></div>
                            <div className="flex justify-between text-base font-semibold text-texto"><span>Total</span><span>{formatearPrecio(p.totalCentavos)}</span></div>
                        </div>
                    </Seccion>

                    <Seccion titulo="Tarjeta">
                        {p.tarjetaEnBlanco ? (
                            <p className="text-texto-suave">Tarjeta en blanco</p>
                        ) : p.mensajeTarjeta ? (
                            <div className="rounded-xl bg-amber-50 p-4 text-stone-800">
                                {p.paraTarjeta && <p className="text-xs text-stone-600">Para: {p.paraTarjeta}</p>}
                                <p className="mt-1 whitespace-pre-line font-titulos text-lg">{p.mensajeTarjeta}</p>
                                <p className="mt-2 text-sm text-stone-600">{p.anonimo ? '— Anónimo' : p.firmaTarjeta && `— ${p.firmaTarjeta}`}</p>
                            </div>
                        ) : (
                            <p className="text-texto-suave">Sin mensaje</p>
                        )}
                        {p.notas && <p className="rounded-xl bg-fondo p-3 text-texto"><strong>Notas del cliente:</strong> {p.notas}</p>}
                    </Seccion>
                </div>

                <div className="space-y-5">
                    {p.metodoPago === 'mercadopago' ? (
                        <Seccion titulo="Pago con Mercado Pago">
                            <dl className="space-y-1.5 text-sm">
                                <div className="flex justify-between gap-3">
                                    <dt className="text-texto-suave">Monto</dt>
                                    <dd className="font-semibold text-texto">{formatearPrecio(p.totalCentavos)}</dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-texto-suave">Estado en Mercado Pago</dt>
                                    <dd className="text-texto">{p.mpEstado ? (ESTADOS_MERCADO_PAGO[p.mpEstado] ?? p.mpEstado) : 'Sin intentos de pago'}</dd>
                                </div>
                                {p.mpPagoId && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-texto-suave">Operación</dt>
                                        <dd className="font-mono text-texto">#{p.mpPagoId}</dd>
                                    </div>
                                )}
                                {p.mpDetalle && (
                                    <div className="flex justify-between gap-3">
                                        <dt className="text-texto-suave">Detalle</dt>
                                        <dd className="text-right text-xs text-texto-suave">{DETALLES_MERCADO_PAGO[p.mpDetalle] ?? p.mpDetalle}</dd>
                                    </div>
                                )}
                            </dl>

                            <p className="mt-3 text-xs text-texto-suave">
                                Se confirma solo. Para ver el pago o devolver el dinero, búscalo en Mercado Pago → Actividad con el número de operación.
                            </p>

                            {p.pagoTardio && (
                                <div className="mt-4 space-y-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">
                                    <p className="font-semibold">Este pago necesita revisión</p>
                                    <p className="text-xs">
                                        Revisa el historial: puede ser un pago que llegó cuando el pedido ya había vencido, un pago duplicado, un monto que no coincide o un contracargo.
                                        Decide si reprogramas el pedido o devuelves el dinero desde Mercado Pago, y después márcalo como resuelto.
                                    </p>
                                    <ResolverPagoMP id={p.id} />
                                </div>
                            )}
                        </Seccion>
                    ) : (
                        <Seccion titulo="Pago por transferencia">
                            <div className="space-y-1">
                                <p><span className="text-texto-suave">Monto esperado:</span> <strong>{formatearPrecio(p.totalCentavos)}</strong></p>
                                <p><span className="text-texto-suave">Concepto:</span> <span className="font-mono">{p.folio}</span></p>
                                {p.pagoVenceEn && p.estadoPago === 'pendiente' && (
                                    <p><span className="text-texto-suave">Plazo hasta:</span> {formatoFechaHora.format(p.pagoVenceEn)}</p>
                                )}
                                {p.motivoRechazo && <p className="text-red-700">Rechazado: {p.motivoRechazo}</p>}
                            </div>

                            {urlComprobante ? (
                                <div className="space-y-2">
                                    {p.comprobanteTipo?.startsWith('image/') ? (
                                        <a href={urlComprobante} target="_blank" rel="noopener noreferrer">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={urlComprobante} alt="Comprobante de pago" className="max-h-96 w-full rounded-xl border border-borde object-contain" />
                                        </a>
                                    ) : (
                                        <a href={urlComprobante} target="_blank" rel="noopener noreferrer" className="font-medium text-primario hover:underline">
                                            Abrir comprobante (PDF)
                                        </a>
                                    )}
                                    {p.comprobanteSubidoEn && <p className="text-xs text-texto-suave">Subido {formatoFechaHora.format(p.comprobanteSubidoEn)}</p>}
                                    {p.estadoPago === 'en_revision' && (
                                        <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-900">
                                            Antes de registrar el pago, confirma en tu banca en línea que llegó el monto exacto con este folio. Los comprobantes pueden alterarse.
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-texto-suave">{p.estadoPago === 'pendiente' ? 'El cliente aún no sube su comprobante.' : 'Sin comprobante.'}</p>
                            )}
                        </Seccion>
                    )}

                    <Seccion titulo="Estado">
                        <AccionesPedido pedidoId={p.id} estadoPago={p.estadoPago} estadoTrabajo={p.estadoTrabajo} />
                    </Seccion>
                    <Seccion titulo="Cliente">
                        <p className="text-texto">{p.compradorNombre}</p>
                        <p className="text-texto-suave">{p.compradorTelefono}{p.compradorEmail && ` · ${p.compradorEmail}`}</p>
                        <BotonWhatsapp
                            href={whatsappMexico(p.compradorTelefono, `Hola ${p.compradorNombre}, te escribimos de la florería sobre tu pedido ${p.folio}.`)}
                            texto="WhatsApp al cliente"
                        />
                    </Seccion>
                    <Seccion titulo="Historial">
                        <ol className="space-y-3">
                            {p.eventos.map((e) => {
                                const nombre = (valor: string | null) =>
                                    valor ? ((ESTADOS_TRABAJO as Record<string, { texto: string }>)[valor] ?? (ESTADOS_PAGO as Record<string, { texto: string }>)[valor])?.texto ?? valor : ''
                                const texto =
                                    e.tipo === 'creado' ? 'Pedido recibido'
                                        : e.tipo === 'cancelado' ? 'Pedido cancelado'
                                            : `${e.tipo === 'pago' ? 'Pago' : 'Trabajo'}: ${nombre(e.de)} → ${nombre(e.a)}`
                                return (
                                    <li key={e.id} className="text-xs">
                                        <p className="font-medium text-texto">{texto}</p>
                                        {e.nota && <p className="text-texto-suave">Motivo: {e.nota}</p>}
                                        <p className="text-texto-suave">{formatoFechaHora.format(e.creadoEn)}{e.usuario && ` · ${e.usuario}`}</p>
                                    </li>
                                )
                            })}
                        </ol>
                    </Seccion>
                </div>
            </div>
        </div>
    )
}

export default function PedidoAdminPage({ params }: Props) {
    return (
        <Suspense fallback={<EsqueletoFormulario />}>
            <Contenido params={params} />
        </Suspense>
    )
}