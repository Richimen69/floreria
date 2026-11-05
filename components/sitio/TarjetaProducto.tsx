import Image from 'next/image'
import { formatearPrecio } from '@/lib/utils'
import type { ProductoPublico } from '@/server/consultas/catalogo'

export function TarjetaProducto({ producto, destacado = false }: { producto: ProductoPublico; destacado?: boolean }) {
  const imagen = producto.imagenes[0]
  const enOferta = producto.precioOfertaCentavos != null

  return (
    <article className="group flex flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie transition-shadow hover:shadow-md">
      <div className="relative aspect-square overflow-hidden bg-primario-suave">
        {imagen && (
          <Image
            src={imagen}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!producto.disponible ? 'opacity-60 grayscale' : ''}`}
          />
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {destacado && (
            <span className="rounded-full bg-acento px-2.5 py-1 text-[11px] font-semibold text-sobre-acento">Top</span>
          )}
          {enOferta && producto.disponible && (
            <span className="rounded-full bg-primario px-2.5 py-1 text-[11px] font-semibold text-sobre-primario">Oferta</span>
          )}
          {!producto.disponible && (
            <span className="rounded-full bg-texto px-2.5 py-1 text-[11px] font-semibold text-fondo">Agotado hoy</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="text-sm font-medium leading-snug text-texto sm:text-base">{producto.nombre}</h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-semibold text-primario">
            {formatearPrecio(producto.precioOfertaCentavos ?? producto.precioCentavos)}
          </span>
          {enOferta && (
            <span className="text-xs text-texto-suave line-through">{formatearPrecio(producto.precioCentavos)}</span>
          )}
        </div>
        <button
          type="button"
          disabled={!producto.disponible}
          className="mt-2 rounded-full bg-primario px-4 py-2 text-sm font-semibold text-sobre-primario transition-colors hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-texto-suave"
        >
          {producto.disponible ? 'Agregar' : 'No disponible'}
        </button>
      </div>
    </article>
  )
}