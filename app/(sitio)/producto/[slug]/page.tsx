import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { GaleriaProducto } from "@/components/sitio/GaleriaProducto";
import { formatearPrecio } from "@/lib/utils";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { obtenerAjustes } from "@/server/consultas/ajustes";
import { TarjetaProducto } from "@/components/sitio/TarjetaProducto";
import { obtenerProductoPorSlug } from "@/server/consultas/catalogo";
import { fechaCorta } from "@/lib/fechas";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await obtenerProductoPorSlug(slug);
  if (!p) return {};

  return {
    title: p.nombre,
    description: p.descripcion ?? undefined,
    // Imagen que se muestra al compartir el enlace por WhatsApp o redes
    openGraph: {
      title: p.nombre,
      images: p.imagenes[0] ? [p.imagenes[0]] : [],
    },
  };
}

async function Detalle({ params }: Props) {
  const { slug } = await params;
  const [p, ajustes] = await Promise.all([
    obtenerProductoPorSlug(slug),
    obtenerAjustes(),
  ]);
  if (!p) notFound();
  const categoria = p.categorias[0];

  const precio = p.precioActualCentavos;
  const whatsapp = enlaceWhatsapp(
    ajustes.whatsapp,
    `Hola, me interesa el arreglo "${p.nombre}" de ${formatearPrecio(precio)}.`,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-10">
      <nav className="mb-6 text-sm text-texto-suave">
        <Link href="/catalogo" className="hover:text-primario">
          Catálogo
        </Link>
        {categoria && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/catalogo#${categoria.slug}`}
              className="hover:text-primario"
            >
              {categoria.nombre}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <GaleriaProducto imagenes={p.imagenes} nombre={p.nombre} />

        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-acento">
              {p.categorias.map((c) => c.nombre).join(" · ")}
            </p>
            <h1 className="mt-1 font-titulos text-3xl font-semibold leading-tight text-texto sm:text-4xl">
              {p.nombre}
            </h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-primario">
              {formatearPrecio(precio)}
            </span>
            {p.precioOfertaCentavos != null && (
              <span className="text-base text-texto-suave line-through">
                {formatearPrecio(p.precioCentavos)}
              </span>
            )}
          </div>
          {p.enOferta && p.ofertaHasta && (
            <p className="text-sm text-acento">
              Precio de oferta para entregas hasta el{" "}
              {fechaCorta(p.ofertaHasta)}. Después aplica el precio normal.
            </p>
          )}

          {!p.sePuedePedir && (
            <p className="rounded-xl bg-primario-suave px-4 py-3 text-sm text-primario-oscuro">
              {p.sinExistencias
                ? "Por ahora no tenemos existencias de este producto. Escríbenos y te avisamos cuando vuelva."
                : "Este arreglo no está disponible hoy. Escríbenos y te sugerimos una alternativa."}
            </p>
          )}

          {p.diasAnticipacion > 0 && p.sePuedePedir && (
            <p className="rounded-xl border border-borde px-4 py-3 text-sm text-texto-suave">
              Este arreglo requiere{" "}
              <strong className="text-texto">
                {p.diasAnticipacion} día(s) de anticipación
              </strong>{" "}
              para su preparación.
            </p>
          )}

          {p.descripcion && (
            <div>
              <h2 className="mb-2 text-sm font-semibold text-texto">
                Descripción
              </h2>
              <p className="whitespace-pre-line leading-relaxed text-texto-suave">
                {p.descripcion}
              </p>
            </div>
          )}

          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={!p.sePuedePedir}
              className="flex-1 rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro disabled:cursor-not-allowed disabled:bg-borde disabled:text-texto-suave"
            >
              {p.sePuedePedir ? "Agregar al carrito" : "No disponible"}
            </button>
            {whatsapp && (
              <a
                href={whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-full border border-borde px-6 py-3 text-center text-sm font-semibold text-texto hover:border-primario hover:text-primario"
              >
                Preguntar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </div>
      {p.complementos.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-5 font-titulos text-2xl font-semibold text-texto">
            Acompáñalo con…
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {p.complementos.map((c) => (
              <TarjetaProducto key={c.id} producto={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function EsqueletoDetalle() {
  return (
    <div className="mx-auto grid max-w-6xl animate-pulse gap-8 px-4 pt-16 sm:px-6 md:grid-cols-2">
      <div className="aspect-square rounded-tarjeta bg-borde" />
      <div className="space-y-4">
        <div className="h-4 w-24 rounded bg-borde" />
        <div className="h-9 w-3/4 rounded bg-borde" />
        <div className="h-7 w-32 rounded bg-borde" />
        <div className="h-24 rounded bg-borde" />
      </div>
    </div>
  );
}

export default function ProductoPage({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoDetalle />}>
      <Detalle params={params} />
    </Suspense>
  );
}
