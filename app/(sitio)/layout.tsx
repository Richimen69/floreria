import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { EnlacesNav, NavSitio } from "@/components/sitio/NavSitio";
import { enlaceWhatsapp } from "@/lib/whatsapp";
import { obtenerAjustes } from "@/server/consultas/ajustes";

export async function generateMetadata(): Promise<Metadata> {
  const a = await obtenerAjustes();
  return {
    title: { default: a.nombre, template: `%s · ${a.nombre}` },
    description: a.eslogan ?? a.textoPortada ?? undefined,
  };
}

export default async function LayoutSitio({
  children,
}: {
  children: React.ReactNode;
}) {
  const a = await obtenerAjustes();
  const whatsapp = enlaceWhatsapp(
    a.whatsapp,
    `Hola, vengo de su página web y me gustaría hacer un pedido.`,
  );

  const redes = [
    { nombre: "Facebook", url: a.facebookUrl },
    { nombre: "Instagram", url: a.instagramUrl },
    { nombre: "TikTok", url: a.tiktokUrl },
  ].filter((r) => r.url);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-borde bg-fondo/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            {a.logoUrl ? (
              <div className="flex items-center gap-4">
                <img
                  src={a.logoUrl}
                  alt={a.nombre}
                  className="h-11 w-auto sm:h-20"
                />
                <span className="font-titulos text-base font-semibold text-texto">
                  {a.nombre}
                </span>
              </div>
            ) : (
              <span className="font-titulos text-xl font-semibold text-texto">
                {a.nombre}
              </span>
            )}
          </Link>
          <div className="flex items-center gap-2">
            <Suspense fallback={<EnlacesNav pathname={null} />}>
              <NavSitio />
            </Suspense>
            <Link
              href="/carrito"
              aria-label="Carrito"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-borde text-texto hover:border-primario hover:text-primario"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                className="h-5 w-5"
                aria-hidden
              >
                <path
                  d="M6 7h12l-1 13H7L6 7zM9 7a3 3 0 016 0"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-borde bg-superficie">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
          <div>
            <p className="font-titulos text-lg font-semibold text-texto">
              {a.nombre}
            </p>
            {a.eslogan && (
              <p className="mt-1 text-sm text-texto-suave">{a.eslogan}</p>
            )}
          </div>
          <div className="space-y-1 text-sm text-texto-suave">
            <p className="mb-2 font-semibold text-texto">Contacto</p>
            {a.telefono && <p>Tel. {a.telefono}</p>}
            {a.email && <p>{a.email}</p>}
            {a.direccion && <p>{a.direccion}</p>}
            {a.horario && <p className="whitespace-pre-line">{a.horario}</p>}
          </div>
          {redes.length > 0 && (
            <div className="space-y-1 text-sm">
              <p className="mb-2 font-semibold text-texto">Síguenos</p>
              {redes.map((r) => (
                <a
                  key={r.nombre}
                  href={r.url!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-texto-suave hover:text-primario"
                >
                  {r.nombre}
                </a>
              ))}
            </div>
          )}
        </div>
      </footer>

      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escríbenos por WhatsApp"
          className="fixed right-4 bottom-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition-transform hover:scale-105"
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-7 w-7"
            aria-hidden
          >
            <path d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm0 18.2a8.2 8.2 0 01-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1112 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3z" />
          </svg>
        </a>
      )}
    </div>
  );
}
