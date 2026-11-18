'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { CalendarioEntrega } from '@/components/sitio/CalendarioEntrega'
import { CronometroBloque } from '@/components/sitio/CronometroBloque'
import { PasosCheckout } from '@/components/sitio/PasosCheckout'
import { SelectorColonia } from '@/components/sitio/SelectorColonia'
import { carrito, useCarrito, useMontado } from '@/lib/carrito'
import { fechaLarga } from '@/lib/fechas'
import { LUGARES, TIPOS_LUGAR, detalleObligatorio, type TipoLugar } from '@/lib/lugares'
import { formatearPrecio } from '@/lib/utils'
import { enlaceWhatsapp } from '@/lib/whatsapp'
import { esquemaDedicatoria, esquemaEntrega, esquemaFinal, erroresDe, type ErroresCampos } from '@/lib/validaciones/checkout'
import { cotizarCarrito, type Cotizacion } from '@/server/acciones/carrito'
import { crearPedido } from '@/server/acciones/pedidos'
import type { ColoniaEncontrada } from '@/server/acciones/colonias-publico'
import { AvisoAnticipacion } from '@/components/sitio/AvisoAnticipacion'
import { CasillaLegales } from '@/components/sitio/CasillaLegales'
import { SelectorUbicacion } from '@/components/sitio/SelectorUbicacion'

const claseCampo =
    'w-full rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-base text-texto outline-none focus:border-primario focus:ring-4 focus:ring-primario/15 disabled:opacity-50 sm:text-sm'

function Campo({
    id,
    etiqueta,
    error,
    ayuda,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { id: string; etiqueta: string; error?: string; ayuda?: string }) {
    return (
        <div className="space-y-1.5">
            <label htmlFor={id} className="block text-sm font-medium text-texto">{etiqueta}</label>
            <input id={id} name={id} className={claseCampo} {...props} />
            {error ? <p className="text-xs text-red-700">{error}</p> : ayuda && <p className="text-xs text-texto-suave">{ayuda}</p>}
        </div>
    )
}

function Bloque({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
    return (
        <section className="space-y-4 rounded-tarjeta border border-borde bg-superficie p-4 sm:p-6">
            <div>
                <h2 className="text-lg font-semibold text-texto">{titulo}</h2>
                {descripcion && <p className="text-sm text-texto-suave">{descripcion}</p>}
            </div>
            {children}
        </section>
    )
}

type Props = {
    whatsapp: string | null
    usuario: { nombre: string; email: string; telefono: string }
    pago: { activo: boolean; banco: string | null; plazoMinutos: number }
    legales: { slug: string; titulo: string }[]
}

type Paso = 1 | 2 | 3

const TITULOS: Record<Paso, string> = {
    1: '¿Quién recibe y cuándo?',
    2: 'Escribe tu dedicatoria',
    3: 'Finaliza tu pedido',
}

export function VistaCheckout({ whatsapp, usuario, pago, legales }: Props) {
    const router = useRouter()
    const montado = useMontado()
    const estado = useCarrito()
    const formulario = useRef<HTMLFormElement>(null)

    const [respuesta, setRespuesta] = useState<{ cotizacion: Cotizacion; desfaseMs: number } | null>(null)
    const [version, setVersion] = useState(0)
    const recotizar = useCallback(() => setVersion((v) => v + 1), [])
    const ultima = useRef(0)

    const [paso, setPaso] = useState<Paso>(1)
    const [resumen, setResumen] = useState<Record<string, string>>({})

    // Paso 1
    const [colonia, setColonia] = useState<ColoniaEncontrada | null>(null)
    const [tipoLugar, setTipoLugar] = useState<TipoLugar>('casa')
    const [relacion, setRelacion] = useState<string | null>(null)

    // Paso 2 (controlados para la vista previa)
    const [para, setPara] = useState('')
    const [mensajeTarjeta, setMensajeTarjeta] = useState('')
    const [firma, setFirma] = useState('')
    const [anonimo, setAnonimo] = useState(false)
    const [enBlanco, setEnBlanco] = useState(false)

    const [errores, setErrores] = useState<ErroresCampos>({})
    const [aviso, setAviso] = useState<{ texto: string; volverAlCarrito?: boolean } | null>(null)
    const [enviando, iniciar] = useTransition()

    useEffect(() => {
        if (estado.items.length === 0) return
        const id = ++ultima.current
        cotizarCarrito(estado).then((r) => {
            if (id === ultima.current) setRespuesta({ cotizacion: r, desfaseMs: Date.parse(r.ahoraServidor) - Date.now() })
        })
    }, [estado, version])

    if (!montado || (estado.items.length > 0 && !respuesta)) {
        return <div className="h-96 animate-pulse rounded-tarjeta bg-borde" />
    }

    if (estado.items.length === 0) {
        return (
            <div className="rounded-tarjeta border-2 border-dashed border-borde px-6 py-16 text-center">
                <p className="font-titulos text-2xl text-texto">Tu carrito está vacío</p>
                <Link href="/catalogo" className="mt-6 inline-block rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario">
                    Ver catálogo
                </Link>
            </div>
        )
    }

    const c = respuesta!.cotizacion
    const err = (campo: string) => errores[campo]?.[0]
    const lugar = LUGARES[tipoLugar]

    const sinCobertura = colonia !== null && !colonia.conCobertura
    const envio = colonia?.conCobertura ? (colonia.costoCentavos ?? 0) : 0
    const total = c.total + envio

    const whatsappSinCobertura = enlaceWhatsapp(
        whatsapp,
        `Hola, quiero hacer un pedido para entregar en la colonia ${colonia?.nombre ?? ''}:\n` +
        c.lineas.map((l) => `• ${l.cantidad} × ${l.nombre}`).join('\n'),
    )

    function leerFormulario() {
        return Object.fromEntries(new FormData(formulario.current!)) as Record<string, string>
    }

    // Valida solo el paso indicado
    // Valida solo el paso indicado
    function validarPaso(n: Paso) {
        const datos = leerFormulario()
        let nuevos: ErroresCampos = {}

        if (n === 1) {
            nuevos = erroresDe(esquemaEntrega.safeParse(datos))
            if (sinCobertura) nuevos.coloniaId = ['Por el momento no tenemos entregas en esta colonia']
            if (!c.dia?.disponible || !c.bloqueElegido) nuevos.fecha = ['Elige la fecha y la franja horaria de entrega']
        } else if (n === 2) {
            nuevos = erroresDe(esquemaDedicatoria.safeParse(datos))
        } else {
            // Paso 3
            nuevos = erroresDe(esquemaFinal.safeParse(datos))
            if (legales.length > 0 && datos.aceptaLegales !== 'on') {
                nuevos.aceptaLegales = ['Para continuar, acepta los términos']
            }
        }

        setErrores(nuevos)

        if (Object.keys(nuevos).length === 0) {
            setResumen(datos)
            return true
        }

        setAviso({ texto: 'Revisa los campos marcados en rojo para continuar.' })

        const primero = Object.keys(nuevos)[0]
        const idElemento = primero === 'coloniaId' ? 'buscar-colonia' : primero === 'fecha' ? 'error-fecha' : primero
        document.getElementById(idElemento)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        document.getElementById(idElemento)?.focus({ preventScroll: true })

        return false
    }

    function irA(destino: Paso) {
        if (destino > paso && !validarPaso(paso)) return
        setAviso(null)
        setPaso(destino)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    function confirmar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (paso !== 3) return irA((paso + 1) as Paso)
        if (!validarPaso(3)) return

        const datos = new FormData(formulario.current!)
        datos.set('carrito', JSON.stringify(estado))
        setAviso(null)

        iniciar(async () => {
            const r = await crearPedido(datos)
            if (r.ok) {
                carrito.vaciar()
                router.push(`/pedido/${r.token}`)
                return
            }
            if (r.requiereCuenta) return router.push('/cuenta/entrar?volver=/checkout')

            setErrores(r.errores ?? {})
            setAviso({ texto: r.mensaje, volverAlCarrito: r.volverAlCarrito })
            // Regresa al paso donde está el primer error
            const campos = Object.keys(r.errores ?? {})
            const camposPaso1 = [
                'destinatarioNombre', 'destinatarioTelefono', 'coloniaId', 'calle',
                'nombreLugar', 'detalleLugar', 'relacionLugar', 'fecha',
            ]
            const camposPaso2 = ['paraTarjeta', 'mensajeTarjeta', 'firmaTarjeta']
            if (campos.some((x) => camposPaso1.includes(x)) || r.volverAlCarrito) setPaso(1)
            else if (campos.some((x) => camposPaso2.includes(x))) setPaso(2)
            recotizar()
            window.scrollTo({ top: 0, behavior: 'smooth' })
        })
    }
    const ahoraServidor = Date.now() + respuesta!.desfaseMs
    const limitePago = Math.min(
        ahoraServidor + pago.plazoMinutos * 60_000,
        c.cierreBloque ? Date.parse(c.cierreBloque) : Infinity,
    )
    const minutosParaPagar = Math.max(0, Math.floor((limitePago - ahoraServidor) / 60_000))
    const horaLimite = new Intl.DateTimeFormat('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' }).format(limitePago)

    return (
        <div className="space-y-8">
            <PasosCheckout actual={paso} onIr={irA} />
            <h1 className="font-titulos text-3xl font-semibold text-texto sm:text-5xl">{TITULOS[paso]}</h1>

            <form ref={formulario} onSubmit={confirmar} noValidate className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
                <div className="space-y-5">
                    {aviso && (
                        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
                            {aviso.texto}
                            {aviso.volverAlCarrito && <Link href="/carrito" className="ml-2 font-semibold underline">Volver al carrito</Link>}
                        </div>
                    )}

                    {/* ───────── Paso 1: Entrega ───────── */}
                    <div className={paso === 1 ? 'space-y-5' : 'hidden'}>
                        <Bloque titulo="¿Quién recibe?" descripcion="Usaremos estos datos solo para la entrega.">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Campo id="destinatarioNombre" etiqueta="Nombre de quien recibe" placeholder="Nombre y apellido" error={err('destinatarioNombre')} />
                                <Campo
                                    id="destinatarioTelefono"
                                    etiqueta="Celular de quien recibe"
                                    type="tel"
                                    inputMode="tel"
                                    placeholder="10 dígitos"
                                    error={err('destinatarioTelefono')}
                                    ayuda="Para coordinar la entrega"
                                />
                            </div>
                        </Bloque>

                        <Bloque titulo="Dirección de entrega">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <Campo id="calle" etiqueta="Calle y número" placeholder="Ej. Av. Costera Miguel Alemán 123" autoComplete="street-address" error={err('calle')} />
                                </div>
                                <SelectorColonia seleccionada={colonia} onSeleccionar={setColonia} error={err('coloniaId')} />
                                <Campo id="referencias" etiqueta="Entre calles y referencias" placeholder="Frente a la farmacia, portón negro" ayuda="Ayuda al repartidor a encontrar el lugar" />
                                <SelectorUbicacion error={err('entregaLatitud') ?? err('entregaLongitud')} />
                            </div>

                            <fieldset>
                                <legend className="mb-2 text-sm font-medium text-texto">Tipo de lugar</legend>
                                <input type="hidden" name="tipoLugar" value={tipoLugar} />
                                <div className="flex flex-wrap gap-2">
                                    {TIPOS_LUGAR.map((t) => (
                                        <button
                                            key={t}
                                            type="button"
                                            onClick={() => { setTipoLugar(t); setRelacion(null) }}
                                            aria-pressed={tipoLugar === t}
                                            className={`rounded-full border px-4 py-2 text-sm transition-colors ${tipoLugar === t ? 'border-primario bg-primario text-sobre-primario' : 'border-borde text-texto hover:border-primario/50'
                                                }`}
                                        >
                                            {LUGARES[t].texto}
                                        </button>
                                    ))}
                                </div>
                            </fieldset>

                            {lugar.nombre && (
                                <div className="grid gap-4 rounded-xl bg-fondo p-4 sm:grid-cols-2">
                                    <Campo key={`nombre-${tipoLugar}`} id="nombreLugar" etiqueta={lugar.nombre} error={err('nombreLugar')} />
                                    {lugar.detalle && (
                                        <Campo
                                            key={`detalle-${tipoLugar}`}
                                            id="detalleLugar"
                                            etiqueta={`${lugar.detalle.etiqueta}${detalleObligatorio(tipoLugar, relacion) ? '' : ' (opcional)'}`}
                                            error={err('detalleLugar')}
                                        />
                                    )}
                                    {lugar.relaciones && (
                                        <fieldset className="sm:col-span-2">
                                            <legend className="mb-2 text-sm font-medium text-texto">La persona que recibe es…</legend>
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(lugar.relaciones).map(([valor, texto]) => (
                                                    <label
                                                        key={valor}
                                                        className="cursor-pointer rounded-full border border-borde bg-superficie px-4 py-2 text-sm text-texto has-checked:border-primario has-checked:bg-primario-suave has-checked:font-semibold has-checked:text-primario-oscuro"
                                                    >
                                                        <input type="radio" name="relacionLugar" value={valor} checked={relacion === valor} onChange={() => setRelacion(valor)} className="sr-only" />
                                                        {texto}
                                                    </label>
                                                ))}
                                            </div>
                                            {err('relacionLugar') && <p className="mt-1 text-xs text-red-700">{err('relacionLugar')}</p>}
                                        </fieldset>
                                    )}
                                </div>
                            )}

                            {colonia && (
                                colonia.conCobertura ? (
                                    <p className="flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
                                        <span aria-hidden>✓</span> Tenemos cobertura en {colonia.nombre} · Envío {envio ? formatearPrecio(envio) : 'gratis'}
                                    </p>
                                ) : (
                                    <div className="space-y-3 rounded-xl bg-primario-suave p-4 text-sm text-primario-oscuro">
                                        <p className="font-medium">Por el momento no tenemos entregas en {colonia.nombre}.</p>
                                        {whatsappSinCobertura && (
                                            <a href={whatsappSinCobertura} target="_blank" rel="noopener noreferrer" className="inline-block rounded-full bg-primario px-4 py-2 font-semibold text-sobre-primario">
                                                Escríbenos por WhatsApp
                                            </a>
                                        )}
                                    </div>
                                )
                            )}

                        </Bloque>

                        <Bloque titulo="Fecha y horario de entrega" descripcion="Elige el día y la franja.">
                            <AvisoAnticipacion
                                dias={c.diasAnticipacion}
                                producto={c.productoAnticipacion}
                                fechaMinima={c.fechaMinima}
                                fechaElegida={estado.fecha}
                            />
                            <CalendarioEntrega items={estado.items} seleccionada={estado.fecha} onElegir={(f) => carrito.elegirEntrega(f, null)} />

                            {c.dia && !c.dia.disponible && (
                                <p className="rounded-xl bg-primario-suave p-3 text-sm text-primario-oscuro">{c.dia.motivo}</p>
                            )}

                            {c.dia?.disponible && (
                                <fieldset>
                                    <legend className="mb-2 text-sm font-medium text-texto">Franja horaria</legend>
                                    <div className="flex flex-wrap gap-2">
                                        {c.dia.bloques.map((b) => (
                                            <button
                                                key={b.clave}
                                                type="button"
                                                disabled={!b.disponible}
                                                title={b.motivo ?? undefined}
                                                onClick={() => carrito.elegirEntrega(estado.fecha, b.clave)}
                                                aria-pressed={estado.bloque === b.clave}
                                                className={`rounded-full border px-4 py-2 text-sm transition-colors ${estado.bloque === b.clave
                                                    ? 'border-primario bg-primario text-sobre-primario'
                                                    : b.disponible
                                                        ? 'border-borde text-texto hover:border-primario/50'
                                                        : 'cursor-not-allowed border-transparent bg-fondo text-texto-suave line-through'
                                                    }`}
                                            >
                                                {b.inicio} – {b.fin}
                                            </button>
                                        ))}
                                    </div>
                                    {c.dia.nota && <p className="mt-2 text-xs text-texto-suave">{c.dia.nota}</p>}
                                </fieldset>
                            )}

                            {c.cierreBloque && c.bloqueElegido && (
                                <CronometroBloque
                                    key={c.cierreBloque}
                                    cierre={c.cierreBloque}
                                    desfaseMs={respuesta!.desfaseMs}
                                    inicio={c.bloqueElegido.inicio}
                                    fin={c.bloqueElegido.fin}
                                    onVencido={recotizar}
                                />
                            )}
                            {err('fecha') && <p className="text-sm text-red-700">{err('fecha')}</p>}
                        </Bloque>
                    </div>

                    {/* ───────── Paso 2: Dedicatoria ───────── */}
                    <div className={paso === 2 ? '' : 'hidden'}>
                        <Bloque titulo="Tarjeta de dedicatoria" descripcion="Se imprime y va con el arreglo.">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-4">
                                    <Campo id="paraTarjeta" etiqueta="Para" placeholder="Ej. Mariana" maxLength={60} value={para} onChange={(e) => setPara(e.target.value)} disabled={enBlanco} />
                                    <div className="space-y-1.5">
                                        <label htmlFor="mensajeTarjeta" className="block text-sm font-medium text-texto">Mensaje</label>
                                        <textarea
                                            id="mensajeTarjeta"
                                            name="mensajeTarjeta"
                                            rows={5}
                                            maxLength={250}
                                            value={mensajeTarjeta}
                                            onChange={(e) => setMensajeTarjeta(e.target.value)}
                                            disabled={enBlanco}
                                            className={claseCampo}
                                        />
                                        <p className={`text-xs ${err('mensajeTarjeta') ? 'text-red-700' : 'text-texto-suave'}`}>
                                            {err('mensajeTarjeta') ?? `${mensajeTarjeta.length} / 250 caracteres`}
                                        </p>
                                    </div>
                                    {!anonimo && (
                                        <Campo id="firmaTarjeta" etiqueta="Firma" placeholder="Con cariño, Ricardo" maxLength={60} value={firma} onChange={(e) => setFirma(e.target.value)} disabled={enBlanco} />
                                    )}
                                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                                        <input type="checkbox" name="anonimo" checked={anonimo} onChange={(e) => setAnonimo(e.target.checked)} disabled={enBlanco} className="h-4 w-4 accent-primario" />
                                        <span className="text-texto">Anónimo</span>
                                    </label>
                                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                                        <input type="checkbox" name="tarjetaEnBlanco" checked={enBlanco} onChange={(e) => setEnBlanco(e.target.checked)} className="h-4 w-4 accent-primario" />
                                        <span className="text-texto">Quiero tarjeta en blanco</span>
                                    </label>
                                </div>

                                {/* Vista previa */}
                                <div className="space-y-1.5">
                                    <span className="block text-sm font-medium text-texto">Vista previa</span>
                                    <div className="flex min-h-56 flex-col rounded-tarjeta border border-amber-200 bg-amber-50 p-6 text-stone-800">
                                        {enBlanco ? (
                                            <p className="m-auto text-sm text-stone-500">Tarjeta en blanco</p>
                                        ) : (
                                            <>
                                                {para && <p className="text-sm text-stone-600">Para: {para}</p>}
                                                <p className="mt-3 flex-1 whitespace-pre-line font-titulos text-xl leading-snug">
                                                    {mensajeTarjeta || <span className="text-stone-400">Tu mensaje aparecerá aquí</span>}
                                                </p>
                                                <div className="mt-4 flex items-end justify-between gap-3 text-sm text-stone-600">
                                                    <span>{anonimo ? '— Anónimo' : firma ? `— ${firma}` : ''}</span>
                                                    <span className="text-xs">{mensajeTarjeta.length}/250</span>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Bloque>
                    </div>

                    {/* ───────── Paso 3: Finalizar ───────── */}
                    <div className={paso === 3 ? 'space-y-5' : 'hidden'}>
                        <Bloque titulo="Tus datos">
                            <p className="text-sm text-texto-suave">
                                Comprando como <strong className="text-texto">{usuario.nombre}</strong> ({usuario.email})
                            </p>
                            <Campo id="compradorTelefono" etiqueta="Tu celular" type="tel" inputMode="tel" defaultValue={usuario.telefono} error={err('compradorTelefono')} ayuda="Para avisarte sobre tu pedido" />
                            <div className="space-y-1.5">
                                <label htmlFor="notas" className="block text-sm font-medium text-texto">Notas para la florería (opcional)</label>
                                <textarea id="notas" name="notas" rows={2} maxLength={300} className={claseCampo} />
                            </div>
                        </Bloque>

                        <Bloque titulo="Método de pago">
                            {pago.activo ? (
                                <>
                                    <label className="flex items-start gap-3 rounded-xl border border-primario bg-primario-suave p-4">
                                        <input type="radio" checked readOnly className="mt-0.5 accent-primario" />
                                        <span>
                                            <span className="block text-sm font-semibold text-texto">Transferencia bancaria (SPEI)</span>
                                            <span className="block text-xs text-texto-suave">
                                                {pago.banco ? `Cuenta ${pago.banco}. ` : ''}Al confirmar te mostramos la CLABE y el monto.
                                            </span>
                                        </span>
                                    </label>
                                    <p className={`rounded-xl p-3 text-sm ${minutosParaPagar < 20 ? 'bg-red-50 text-red-800' : 'bg-fondo text-texto-suave'}`}>
                                        Tendrás hasta las <strong>{horaLimite}</strong> ({minutosParaPagar} min) para hacer la transferencia y subir tu comprobante.
                                        Si no lo recibimos a tiempo, el pedido se cancela y el horario se libera.
                                        {minutosParaPagar < 20 && ' Es poco tiempo: si no alcanzas, elige un horario más tarde.'}
                                    </p>
                                </>
                            ) : (
                                <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800">
                                    Por el momento no estamos recibiendo pagos en línea. Escríbenos por WhatsApp para hacer tu pedido.
                                </p>
                            )}
                        </Bloque>

                        <Bloque titulo="Revisa tu pedido">
                            <div className="space-y-4 text-sm">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="text-texto-suave">
                                        <p className="font-medium text-texto">Entrega</p>
                                        <p>{resumen.destinatarioNombre} · {resumen.destinatarioTelefono}</p>
                                        <p>{resumen.calle}, {colonia?.nombre}</p>
                                        {tipoLugar !== 'casa' && (
                                            <p>
                                                {lugar.texto}: {resumen.nombreLugar}
                                                {resumen.detalleLugar && ` · ${resumen.detalleLugar}`}
                                                {relacion && lugar.relaciones && ` · ${lugar.relaciones[relacion]}`}
                                            </p>
                                        )}
                                        {c.dia && c.bloqueElegido && (
                                            <p className="capitalize">{fechaLarga(c.dia.fecha)}, {c.bloqueElegido.inicio} a {c.bloqueElegido.fin}</p>
                                        )}
                                    </div>
                                    <button type="button" onClick={() => irA(1)} className="shrink-0 font-medium text-primario hover:underline">Editar</button>
                                </div>
                                <div className="flex items-start justify-between gap-4 border-t border-borde pt-4">
                                    <div className="text-texto-suave">
                                        <p className="font-medium text-texto">Dedicatoria</p>
                                        <p>{enBlanco ? 'Tarjeta en blanco' : mensajeTarjeta || 'Sin mensaje'}</p>
                                    </div>
                                    <button type="button" onClick={() => irA(2)} className="shrink-0 font-medium text-primario hover:underline">Editar</button>
                                </div>
                            </div>
                        </Bloque>
                        {legales.length > 0 && (
                            <div className="rounded-tarjeta border border-borde bg-superficie p-4 sm:p-6">
                                <CasillaLegales legales={legales} error={err('aceptaLegales')} />
                            </div>
                        )}
                    </div>

                    {/* Navegación */}
                    <div className="flex items-center justify-between gap-4 pt-2">
                        {paso === 1 ? (
                            <Link href="/carrito" className="text-sm font-semibold text-primario hover:underline">Volver al carrito</Link>
                        ) : (
                            <button type="button" onClick={() => irA((paso - 1) as Paso)} className="text-sm font-semibold text-primario hover:underline">
                                Volver a {paso === 2 ? 'entrega' : 'dedicatoria'}
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={enviando || (paso === 3 && !pago.activo)}
                            className="rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro disabled:opacity-60"
                        >
                            {paso === 1 ? 'Continuar a dedicatoria' : paso === 2 ? 'Continuar' : enviando ? 'Registrando pedido…' : 'Confirmar pedido'}
                        </button>
                    </div>
                </div>

                {/* Resumen */}
                <aside className="h-fit space-y-4 rounded-tarjeta border border-borde bg-superficie p-5 lg:sticky lg:top-24">
                    <h2 className="text-lg font-semibold text-texto">Resumen del pedido</h2>
                    <ul className="space-y-2 text-sm">
                        {c.lineas.map((l) => (
                            <li key={l.productoId} className="flex justify-between gap-3">
                                <span className="text-texto-suave">{l.nombre} × {l.cantidad}</span>
                                <span className="shrink-0 text-texto">{formatearPrecio(l.subtotal)}</span>
                            </li>
                        ))}
                    </ul>
                    <div className="space-y-1.5 border-t border-borde pt-3 text-sm">
                        <div className="flex justify-between text-texto-suave"><span>Subtotal</span><span>{formatearPrecio(c.total)}</span></div>
                        <div className="flex justify-between text-texto-suave">
                            <span>Envío{colonia?.conCobertura ? ` · ${colonia.nombre}` : ''}</span>
                            <span>{colonia?.conCobertura ? (envio ? formatearPrecio(envio) : 'Gratis') : '—'}</span>
                        </div>
                        {c.temporada && <p className="text-xs text-acento">Precios de temporada: {c.temporada}</p>}
                        <div className="flex justify-between border-t border-borde pt-3 text-xl font-semibold text-texto">
                            <span>Total</span>
                            <span>{formatearPrecio(total)}</span>
                        </div>
                    </div>
                </aside>
            </form>
        </div>
    )
}