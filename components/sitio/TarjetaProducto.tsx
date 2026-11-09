import Image from "next/image";
import { formatearPrecio } from "@/lib/utils";
import type { ProductoPublico } from "@/server/consultas/catalogo";
import Link from "next/link";
import { fechaCorta } from "@/lib/fechas";
import { BotonAgregar } from "@/components/sitio/BotonAgregar";

export function TarjetaProducto({
  producto,
  destacado = false,
}: {
  producto: ProductoPublico;
  destacado?: boolean;
}) {
  const imagen = producto.imagenes[0];
  const enOferta = producto.enOferta;

  return (
    <article className="group flex flex-col overflow-hidden rounded-tarjeta border border-borde bg-superficie transition-shadow hover:shadow-md">
      <Link
        href={`/producto/${producto.slug}`}
        className="relative aspect-square overflow-hidden bg-primario-suave"
      >
        {imagen && (
          <Image
            src={imagen}
            alt={producto.nombre}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${!producto.sePuedePedir ? "opacity-60 grayscale" : ""}`}
          />
        )}
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          {destacado && (
            <span className="rounded-full bg-acento px-2.5 py-1 text-[11px] font-semibold text-sobre-acento">
              Top
            </span>
          )}
          {enOferta && producto.sePuedePedir && (
            <span className="rounded-full bg-primario px-2.5 py-1 text-[11px] font-semibold text-sobre-primario">
              Oferta
            </span>
          )}
          {!producto.sePuedePedir && (
            <span className="rounded-full bg-texto px-2.5 py-1 text-[11px] font-semibold text-fondo">
              {producto.sinExistencias ? "Sin existencias" : "Agotado hoy"}
            </span>
          )}
          {!producto.disponible && (
            <span className="rounded-full bg-texto px-2.5 py-1 text-[11px] font-semibold text-fondo">
              Agotado hoy
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <h3 className="text-sm font-medium leading-snug text-texto sm:text-base">
          <Link
            href={`/producto/${producto.slug}`}
            className="hover:text-primario"
          >
            {producto.nombre}
          </Link>
        </h3>
        <div className="mt-auto flex items-baseline gap-2 pt-1">
          <span className="font-semibold text-primario">
            {formatearPrecio(producto.precioActualCentavos)}
          </span>
          {enOferta && (
            <span className="text-xs text-texto-suave line-through">
              {formatearPrecio(producto.precioCentavos)}
            </span>
          )}
        </div>
        {enOferta && producto.ofertaHasta && (
          <p className="text-xs text-acento">
            Oferta para entregas hasta el {fechaCorta(producto.ofertaHasta)}
          </p>
        )}
        {producto.diasAnticipacion > 0 && producto.sePuedePedir && (
          <p className="text-xs text-texto-suave">
            Pídelo con {producto.diasAnticipacion} día(s) de anticipación
          </p>
        )}
        <BotonAgregar
          productoId={producto.id}
          disponible={producto.sePuedePedir}
          textoNoDisponible={
            producto.sinExistencias ? "Sin existencias" : "No disponible"
          }
        />
      </div>
    </article>
  );
}
