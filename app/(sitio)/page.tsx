import Image from "next/image";
import Link from "next/link";
import { TarjetaProducto } from "@/components/sitio/TarjetaProducto";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { obtenerAjustes } from "@/server/consultas/ajustes";
import { listarDestacados } from "@/server/consultas/catalogo";
import { MapaUbicacion } from "@/components/sitio/MapaUbicacion";
import { MapaInteractivo } from "@/components/sitio/MapaInteractivo";

export default async function InicioPage() {
  const [a, destacados] = await Promise.all([
    obtenerAjustes(),
    listarDestacados(),
  ]);
  const whatsapp = enlaceWhatsapp(
    a.whatsapp,
    "Hola, me gustaría información sobre sus arreglos.",
  );
  const conImagen = Boolean(a.imagenPortadaUrl);

  return (
    <>
      {/* Portada */}
      <section className="relative overflow-hidden">
        {conImagen ? (
          <>
            <Image
              src={a.imagenPortadaUrl!}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/35 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primario-suave via-fondo to-acento-suave" />
        )}

        <div
          className={`relative mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-end px-4 py-16 sm:px-6 sm:py-24 ${conImagen ? "text-white" : "text-texto"}`}
        >
          <div className="max-w-2xl space-y-4">
            {a.eslogan && (
              <p
                className={`text-xs font-semibold uppercase tracking-[0.2em] ${conImagen ? "text-white/85" : "text-acento"}`}
              >
                {a.eslogan}
              </p>
            )}
            <h1 className="font-titulos text-4xl leading-tight font-semibold sm:text-6xl">
              {a.tituloPortada ?? a.nombre}
            </h1>
            {a.textoPortada && (
              <p
                className={`max-w-xl text-base sm:text-lg ${conImagen ? "text-white/90" : "text-texto-suave"}`}
              >
                {a.textoPortada}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/catalogo"
                className="rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro"
              >
                Ver catálogo
              </Link>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-acento px-6 py-3 text-sm font-semibold text-sobre-acento hover:opacity-90"
                >
                  Pedir por WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Productos Top */}
      {destacados.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-acento">
                Los favoritos
              </p>
              <h2 className="font-titulos text-3xl font-semibold text-texto">
                Productos Top
              </h2>
            </div>
            <Link
              href="/catalogo"
              className="shrink-0 text-sm font-medium text-primario hover:underline"
            >
              Ver todo →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {destacados.map((p) => (
              <TarjetaProducto key={p.id} producto={p} destacado />
            ))}
          </div>
        </section>
      )}

      {/* Quiénes somos */}
      {a.quienesSomos && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <div className="rounded-tarjeta bg-primario-suave px-6 py-12 sm:px-12">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-acento">
              Nuestra historia
            </p>
            <h2 className="mb-4 font-titulos text-3xl font-semibold text-texto">
              Quiénes somos
            </h2>
            <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-texto-suave">
              {a.quienesSomos}
            </p>
          </div>
        </section>
      )}

      {/* Visítanos */}
      {(a.direccion || a.horario || a.telefono) && (
        <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
          <h2 className="mb-6 font-titulos text-3xl font-semibold text-texto">
            Visítanos
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {a.direccion && (
              <div className="rounded-tarjeta border border-borde bg-superficie p-6">
                <p className="mb-1 text-sm font-semibold text-texto">
                  Dirección
                </p>
                <p className="text-sm text-texto-suave">{a.direccion}</p>
                {a.mapaUrl && (
                  <a
                    href={a.mapaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-primario hover:underline"
                  >
                    Cómo llegar →
                  </a>
                )}
              </div>
            )}
            {a.horario && (
              <div className="rounded-tarjeta border border-borde bg-superficie p-6">
                <p className="mb-1 text-sm font-semibold text-texto">Horario</p>
                <p className="whitespace-pre-line text-sm text-texto-suave">
                  {a.horario}
                </p>
              </div>
            )}
            {(a.telefono || whatsapp) && (
              <div className="rounded-tarjeta border border-borde bg-superficie p-6">
                <p className="mb-1 text-sm font-semibold text-texto">
                  Contacto
                </p>
                {a.telefono && (
                  <a
                    href={`tel:${a.telefono}`}
                    className="block text-sm text-texto-suave hover:text-primario"
                  >
                    Tel. {a.telefono}
                  </a>
                )}
                {whatsapp && (
                  <a
                    href={whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-block text-sm font-medium text-primario hover:underline"
                  >
                    Escríbenos por WhatsApp →
                  </a>
                )}
              </div>
            )}
          </div>
          {a.latitud != null && a.longitud != null ? (
            <div className="mt-4">
              <MapaInteractivo
                latitud={a.latitud}
                longitud={a.longitud}
                nombre={a.nombre}
                direccion={a.direccion}
                colores={{
                  primario: a.colorPrimario,
                  acento: a.colorAcento,
                  fondo: a.colorFondo,
                }}
              />
            </div>
          ) : (
            a.direccion && (
              <div className="mt-4">
                <MapaUbicacion nombre={a.nombre} direccion={a.direccion} />
              </div>
            )
          )}
        </section>
      )}
    </>
  );
}
