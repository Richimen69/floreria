'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { BotonAgregar } from '@/components/sitio/BotonAgregar'
import { carrito, useCarrito, useMontado } from '@/lib/carrito'
import { formatearPrecio } from '@/lib/utils'
import { cotizarCarrito, type Cotizacion } from '@/server/acciones/carrito'
import { AvisoAnticipacion } from '@/components/sitio/AvisoAnticipacion'

function Esqueleto() {
  return (
    <div className="grid animate-pulse gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-3">
        {[0, 1].map((i) => <div key={i} className="h-28 rounded-tarjeta bg-borde" />)}
      </div>
      <div className="h-72 rounded-tarjeta bg-borde" />
    </div>
  )
}

export function VistaCarrito() {
  const montado = useMontado()
  const estado = useCarrito()
  const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null)
  const [calculando, iniciar] = useTransition()
  const ultimaPeticion = useRef(0)

  const [respuesta, setRespuesta] = useState<{ cotizacion: Cotizacion; desfaseMs: number } | null>(null)
  const [version, setVersion] = useState(0)
  const recotizar = useCallback(() => setVersion((v) => v + 1), [])

  useEffect(() => {
    if (estado.items.length === 0) return
    const id = ++ultimaPeticion.current
    iniciar(async () => {
      const resultado = await cotizarCarrito(estado)
      if (id === ultimaPeticion.current) {
        setRespuesta({ cotizacion: resultado, desfaseMs: Date.parse(resultado.ahoraServidor) - Date.now() })
      }
    })
  }, [estado, version])

  if (!montado) return <Esqueleto />

  if (estado.items.length === 0) {
    return (
      <div className="rounded-tarjeta border-2 border-dashed border-borde px-6 py-16 text-center">
        <p className="font-titulos text-2xl text-texto">Tu carrito está vacío</p>
        <p className="mt-1 text-texto-suave">Elige un arreglo y aparecerá aquí.</p>
        <Link href="/catalogo" className="mt-6 inline-block rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">
          Ver catálogo
        </Link>
      </div>
    )
  }

  if (!respuesta) return <Esqueleto />
  const c = respuesta.cotizacion
  const hayProblemas = c.lineas.some((l) => l.problema)


  return (
    <div className={`grid gap-6 transition-opacity lg:grid-cols-[minmax(0,1fr)_380px] ${calculando ? 'opacity-70' : ''}`}>
      {/* Productos */}
      <div className="space-y-6">
        <ul className="divide-y divide-borde rounded-tarjeta border border-borde bg-superficie">
          {c.lineas.map((l) => (
            <li key={l.productoId} className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-primario-suave sm:h-24 sm:w-24">
                {l.imagen && <Image src={l.imagen} alt="" fill sizes="96px" className="object-cover" />}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-3">
                  {l.slug ? (
                    <Link href={`/producto/${l.slug}`} className="font-medium text-texto hover:text-primario">{l.nombre}</Link>
                  ) : (
                    <span className="font-medium text-texto-suave">Producto no disponible</span>
                  )}
                  <span className="shrink-0 font-semibold text-texto">{formatearPrecio(l.subtotal)}</span>
                </div>
                <p className="text-sm text-texto-suave">
                  {formatearPrecio(l.precioUnitario)} c/u
                  {l.enOferta && <span className="ml-2 rounded-full bg-primario-suave px-2 py-0.5 text-xs font-semibold text-primario-oscuro">Oferta</span>}
                  {l.deTemporada && <span className="ml-2 rounded-full bg-acento-suave px-2 py-0.5 text-xs font-semibold text-acento">Precio de temporada</span>}
                </p>

                {l.diasAnticipacion > 0 && (
                  <p className="text-xs font-medium text-acento">Requiere {l.diasAnticipacion} día(s) de anticipación</p>
                )}

                {l.problema && <p className="text-sm font-medium text-red-700">{l.problema}</p>}

                <div className="mt-auto flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center rounded-full border border-borde">
                    <button
                      type="button"
                      onClick={() => carrito.cambiarCantidad(l.productoId, l.cantidad - 1)}
                      aria-label="Quitar uno"
                      className="h-9 w-9 rounded-full text-lg text-texto hover:bg-fondo cursor-pointer"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-medium text-texto">{l.cantidad}</span>
                    <button
                      type="button"
                      onClick={() => carrito.cambiarCantidad(l.productoId, l.cantidad + 1)}
                      aria-label="Agregar uno"
                      className="h-9 w-9 rounded-full text-lg text-texto hover:bg-fondo cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                  <button type="button" onClick={() => carrito.quitar(l.productoId)} className="text-sm text-texto-suave hover:text-red-700 cursor-pointer">
                    Quitar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {c.sugerencias.length > 0 && (
          <section>
            <h2 className="mb-3 font-titulos text-xl font-semibold text-texto">Acompáñalo con…</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {c.sugerencias.map((s) => (
                <div key={s.id} className="flex flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie">
                  <Link href={`/producto/${s.slug}`} className="relative block aspect-square bg-primario-suave">
                    {s.imagen && <Image src={s.imagen} alt={s.nombre} fill sizes="25vw" className="object-cover" />}
                  </Link>
                  <div className="flex flex-1 flex-col p-3">
                    <p className="text-sm leading-snug text-texto">{s.nombre}</p>
                    <p className="mt-auto pt-1 text-sm font-semibold text-primario">{formatearPrecio(s.precio)}</p>
                    <BotonAgregar productoId={s.id} disponible />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Entrega y resumen */}
      <aside className="h-fit space-y-5 rounded-tarjeta border border-borde bg-superficie p-5 lg:sticky lg:top-24">
        <div className="space-y-2 text-sm">
          <AvisoAnticipacion dias={c.diasAnticipacion} producto={c.productoAnticipacion} fechaMinima={c.fechaMinima} />
          <div className="flex justify-between text-texto-suave">
            <span>Productos</span>
            <span>{formatearPrecio(c.total)}</span>
          </div>
          <div className="flex justify-between text-texto-suave">
            <span>Envío</span>
            <span>Se calcula con tu dirección</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold text-texto">
            <span>Subtotal</span>
            <span>{formatearPrecio(c.total)}</span>
          </div>
          <p className="text-xs text-texto-suave">Los precios pueden cambiar según la fecha de entrega que elijas.</p>
        </div>

        {c.productosListos ? (
          <Link href="/checkout" className="block rounded-full bg-primario px-6 py-3 text-center text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">
            Continuar
          </Link>
        ) : (
          <div>
            <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-borde px-6 py-3 text-sm font-semibold text-texto-suave">
              Continuar
            </button>
            <p className="mt-2 text-center text-xs text-texto-suave">Revisa los productos marcados</p>
          </div>
        )}
      </aside>
    </div>
  )
}