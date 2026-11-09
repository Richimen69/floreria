'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState, useTransition } from 'react'
import { BotonAgregar } from '@/components/sitio/BotonAgregar'
import { carrito, useCarrito, useMontado } from '@/lib/carrito'
import { fechaCorta, fechaLarga } from '@/lib/fechas'
import { formatearPrecio } from '@/lib/utils'
import { cotizarCarrito, type Cotizacion } from '@/server/acciones/carrito'

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

  // Cada cambio del carrito se vuelve a cotizar en el servidor
  useEffect(() => {
    if (estado.items.length === 0) return
    const id = ++ultimaPeticion.current
    iniciar(async () => {
      const resultado = await cotizarCarrito(estado)
      if (id === ultimaPeticion.current) setCotizacion(resultado) // ignora respuestas viejas
    })
  }, [estado])

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

  if (!cotizacion) return <Esqueleto />

  const c = cotizacion
  const hayProblemas = c.lineas.some((l) => l.problema)

  const motivoBoton = hayProblemas
    ? 'Revisa los productos marcados'
    : !estado.fecha
      ? 'Elige la fecha de entrega'
      : !c.dia?.disponible
        ? 'Elige otra fecha de entrega'
        : !c.bloqueElegido
          ? 'Elige un horario de entrega'
          : null

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
        <div className="space-y-2">
          <h2 className="font-titulos text-lg font-semibold text-texto">Entrega</h2>

          {c.diasAnticipacion > 0 && (
            <p className="text-sm text-texto-suave">
              Tu pedido requiere {c.diasAnticipacion} día(s) de anticipación. Primera fecha posible: {fechaCorta(c.fechaMinima)}.
            </p>
          )}

          <label htmlFor="fecha" className="block text-sm font-medium text-texto">Fecha de entrega</label>
          <input
            id="fecha"
            type="date"
            min={c.fechaMinima}
            max={c.fechaMaxima}
            value={estado.fecha ?? ''}
            onChange={(e) => carrito.elegirEntrega(e.target.value || null, null)}
            className="w-full rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-base text-texto outline-none focus:border-primario focus:ring-4 focus:ring-primario/15 sm:text-sm"
          />
          {estado.fecha && <p className="text-xs capitalize text-texto-suave">{fechaLarga(estado.fecha)}</p>}
        </div>

        {/* Fecha no disponible: motivo y siguientes opciones */}
        {c.dia && !c.dia.disponible && (
          <div className="space-y-2 rounded-xl bg-primario-suave p-3">
            <p className="text-sm font-medium text-primario-oscuro">{c.dia.motivo}</p>
            {c.dia.nota && <p className="text-xs text-primario-oscuro">{c.dia.nota}</p>}
          </div>
        )}

        {c.proximas.length > 0 && (!c.dia || !c.dia.disponible) && (
          <div className="space-y-2">
            <p className="text-sm text-texto-suave">{c.dia ? 'Fechas disponibles más cercanas:' : 'Próximas fechas disponibles:'}</p>
            <div className="flex flex-wrap gap-2">
              {c.proximas.map((d) => (
                <button
                  key={d.fecha}
                  type="button"
                  onClick={() => carrito.elegirEntrega(d.fecha, null)}
                  className="rounded-full border border-borde px-3 py-1.5 text-sm capitalize text-texto hover:border-primario hover:text-primario"
                >
                  {fechaLarga(d.fecha)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Bloques del día elegido */}
        {c.dia?.disponible && (
          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium text-texto">Horario de entrega</legend>
            {c.dia.nota && <p className="text-xs text-texto-suave">{c.dia.nota}</p>}
            {c.dia.bloques.map((b) => (
              <label
                key={b.clave}
                className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm ${
                  b.disponible
                    ? 'cursor-pointer border-borde hover:border-primario/50 has-checked:border-primario has-checked:bg-primario-suave'
                    : 'cursor-not-allowed border-borde text-texto-suave opacity-60'
                }`}
              >
                <span className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="bloque"
                    disabled={!b.disponible}
                    checked={estado.bloque === b.clave}
                    onChange={() => carrito.elegirEntrega(estado.fecha, b.clave)}
                    className="accent-primario"
                  />
                  <span className="font-medium text-texto">{b.inicio} a {b.fin}</span>
                </span>
                {!b.disponible && <span className="text-xs">{b.motivo}</span>}
              </label>
            ))}
            <p className="text-xs text-texto-suave">Entregamos dentro del horario elegido, sin hora exacta.</p>
          </fieldset>
        )}

        {/* Resumen */}
        <div className="space-y-2 border-t border-borde pt-4 text-sm">
          <div className="flex justify-between text-texto-suave">
            <span>Productos</span>
            <span>{formatearPrecio(c.total)}</span>
          </div>
          <div className="flex justify-between text-texto-suave">
            <span>Envío</span>
            <span>Se calcula en el siguiente paso</span>
          </div>
          <div className="flex justify-between pt-1 text-base font-semibold text-texto">
            <span>Subtotal</span>
            <span>{formatearPrecio(c.total)}</span>
          </div>
          {!estado.fecha && (
            <p className="text-xs text-texto-suave">
              Precios para entrega el {fechaCorta(c.fechaPrecios)}. Pueden cambiar según la fecha que elijas.
            </p>
          )}
          {c.temporada && <p className="text-xs text-acento">Precios de temporada: {c.temporada}</p>}
        </div>

        {c.listo ? (
          <Link href="/checkout" className="block rounded-full bg-primario px-6 py-3 text-center text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">
            Continuar
          </Link>
        ) : (
          <div>
            <button type="button" disabled className="w-full cursor-not-allowed rounded-full bg-borde px-6 py-3 text-sm font-semibold text-texto-suave">
              Continuar
            </button>
            {motivoBoton && <p className="mt-2 text-center text-xs text-texto-suave">{motivoBoton}</p>}
          </div>
        )}
      </aside>
    </div>
  )
}