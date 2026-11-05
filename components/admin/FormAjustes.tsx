"use client";

import { startTransition, useActionState, useState } from "react";
import { guardarAjustes } from "@/server/acciones/ajustes";
import { SubirImagen } from "@/components/admin/SubirImagen";
import { VistaPrevia, type Vista } from "@/components/admin/VistaPrevia";
import { Boton } from "@/components/ui/Boton";
import { Ayuda, Etiqueta, claseInput } from "@/components/ui/Campo";
import type { AjustesSitio } from "@/db/schema";
import type { EstadoFormulario } from "@/lib/validaciones/ajustes";
import { Campo, Seccion } from "@/components/admin/Formulario";

const estadoInicial: EstadoFormulario = { ok: false, mensaje: "" };

function SelectorColor({
  nombre,
  etiqueta,
  ayuda,
  valor,
}: {
  nombre: string;
  etiqueta: string;
  ayuda: string;
  valor: string;
}) {
  return (
    <label
      htmlFor={nombre}
      className="flex cursor-pointer items-center gap-3 rounded-xl border border-borde p-3 hover:border-primario/40"
    >
      <input
        id={nombre}
        name={nombre}
        type="color"
        defaultValue={valor}
        className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border-0 bg-transparent p-0"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-texto">{etiqueta}</span>
        <span className="block text-xs text-texto-suave">{ayuda}</span>
        <span className="mt-0.5 block font-mono text-xs uppercase text-texto-suave">
          {valor}
        </span>
      </span>
    </label>
  );
}

export function FormAjustes({ ajustes }: { ajustes: AjustesSitio }) {
  const [estado, accion, guardando] = useActionState(
    guardarAjustes,
    estadoInicial,
  );
  const [vista, setVista] = useState<Vista>(ajustes);
  const [sinGuardar, setSinGuardar] = useState(false);
  const [estadoVisto, setEstadoVisto] = useState(estado);

  // Cuando llega un resultado nuevo de la acción y fue exitoso, ya no hay cambios pendientes
  if (estado !== estadoVisto) {
    setEstadoVisto(estado);
    if (estado.ok) setSinGuardar(false);
  }

  const err = (campo: string) => estado.errores?.[campo]?.[0];

  function alCambiar(e: React.FormEvent<HTMLFormElement>) {
    const d = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    setVista((v) => ({
      ...v,
      nombre: d.nombre,
      eslogan: d.eslogan,
      colorPrimario: d.colorPrimario,
      colorAcento: d.colorAcento,
      colorFondo: d.colorFondo,
      tituloPortada: d.tituloPortada,
      textoPortada: d.textoPortada,
    }));
    setSinGuardar(true);
  }

  function alCambiarImagen(campo: "logoUrl" | "imagenPortadaUrl") {
    return (url: string) => {
      setVista((v) => ({ ...v, [campo]: url || null }));
      setSinGuardar(true);
    };
  }

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  return (
    <form onSubmit={enviar} onChange={alCambiar}>
      {/* Barra fija */}
      <div className="sticky top-0 z-10 -mx-8 mb-8 flex items-center justify-between gap-4 border-b border-borde bg-fondo/85 px-8 py-4 backdrop-blur">
        <div>
          <h1 className="font-titulos text-2xl font-semibold text-texto">
            Ajustes del sitio
          </h1>
          <p className="text-sm text-texto-suave">
            {sinGuardar ? (
              <span className="font-medium text-amber-700">
                Tienes cambios sin guardar
              </span>
            ) : estado.mensaje ? (
              <span className={estado.ok ? "text-green-700" : "text-red-700"}>
                {estado.mensaje}
              </span>
            ) : (
              "Esta información se muestra en la página pública."
            )}
          </p>
        </div>
        <Boton type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar cambios"}
        </Boton>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <Seccion
            titulo="Identidad"
            descripcion="Cómo se presenta tu florería en todo el sitio."
          >
            <Campo
              nombre="nombre"
              etiqueta="Nombre de la florería"
              valor={ajustes.nombre}
              error={err("nombre")}
            />
            <Campo
              nombre="eslogan"
              etiqueta="Eslogan"
              valor={ajustes.eslogan}
              error={err("eslogan")}
              placeholder="Ej. Flores que dicen lo que sientes"
            />
            <SubirImagen
              nombre="logoUrl"
              etiqueta="Logo"
              carpeta="logos"
              valorInicial={ajustes.logoUrl}
              ayuda="PNG con fondo transparente, de preferencia"
              error={err("logoUrl")}
              onCambio={alCambiarImagen("logoUrl")}
            />
          </Seccion>

          <Seccion
            titulo="Colores"
            descripcion="Se aplican al sitio público y a este panel."
          >
            <SelectorColor
              nombre="colorPrimario"
              etiqueta="Principal"
              ayuda="Botones y enlaces"
              valor={vista.colorPrimario}
            />
            <SelectorColor
              nombre="colorAcento"
              etiqueta="Acento"
              ayuda="Etiquetas y detalles"
              valor={vista.colorAcento}
            />
            <SelectorColor
              nombre="colorFondo"
              etiqueta="Fondo"
              ayuda="Un tono claro se lee mejor"
              valor={vista.colorFondo}
            />
          </Seccion>

          <Seccion
            titulo="Portada"
            descripcion="Lo primero que ven tus clientes al entrar."
          >
            <Campo
              nombre="tituloPortada"
              etiqueta="Título"
              valor={ajustes.tituloPortada}
              error={err("tituloPortada")}
              placeholder="Ej. Flores frescas para cada momento"
              ancho
            />
            <div className="md:col-span-2">
              <SubirImagen
                nombre="imagenPortadaUrl"
                etiqueta="Imagen de portada"
                carpeta="portada"
                forma="ancha"
                valorInicial={ajustes.imagenPortadaUrl}
                ayuda="Horizontal, idealmente 1600 × 900 px"
                error={err("imagenPortadaUrl")}
                onCambio={alCambiarImagen("imagenPortadaUrl")}
              />
            </div>
            <Campo
              nombre="textoPortada"
              etiqueta="Texto de presentación"
              valor={ajustes.textoPortada}
              error={err("textoPortada")}
              multilinea
              ancho
            />
            <Campo
              nombre="quienesSomos"
              etiqueta="Quiénes somos"
              valor={ajustes.quienesSomos}
              error={err("quienesSomos")}
              multilinea
              ancho
            />
          </Seccion>

          <Seccion
            titulo="Contacto"
            descripcion="Cómo pueden comunicarse y encontrarte."
          >
            <Campo
              nombre="whatsapp"
              etiqueta="WhatsApp"
              valor={ajustes.whatsapp}
              error={err("whatsapp")}
              placeholder="527441234567"
              ayuda="Con lada de país, sin espacios"
            />
            <Campo
              nombre="telefono"
              etiqueta="Teléfono"
              valor={ajustes.telefono}
              error={err("telefono")}
            />
            <Campo
              nombre="email"
              etiqueta="Correo"
              tipo="email"
              valor={ajustes.email}
              error={err("email")}
            />
            <Campo
              nombre="direccion"
              etiqueta="Dirección"
              valor={ajustes.direccion}
              error={err("direccion")}
            />
            <Campo
              nombre="mapaUrl"
              etiqueta="Enlace de Google Maps"
              valor={ajustes.mapaUrl}
              error={err("mapaUrl")}
              placeholder="https://maps.app.goo.gl/…"
            />
            <Campo
              nombre="horario"
              etiqueta="Horario"
              valor={ajustes.horario}
              error={err("horario")}
              placeholder="Lun a Sáb, 9:00 a 20:00"
            />
            <Campo
              nombre="coordenadas"
              etiqueta="Coordenadas del mapa"
              valor={
                ajustes.latitud != null
                  ? `${ajustes.latitud}, ${ajustes.longitud}`
                  : ""
              }
              error={err("coordenadas")}
              placeholder="16.8531, -99.8237"
              ayuda="En Google Maps, clic derecho sobre la florería y copia los números que aparecen arriba"
              ancho
            />
          </Seccion>

          <Seccion
            titulo="Redes sociales"
            descripcion="Deja vacío lo que no uses."
          >
            <Campo
              nombre="facebookUrl"
              etiqueta="Facebook"
              valor={ajustes.facebookUrl}
              error={err("facebookUrl")}
              placeholder="https://facebook.com/…"
            />
            <Campo
              nombre="instagramUrl"
              etiqueta="Instagram"
              valor={ajustes.instagramUrl}
              error={err("instagramUrl")}
              placeholder="https://instagram.com/…"
            />
            <Campo
              nombre="tiktokUrl"
              etiqueta="TikTok"
              valor={ajustes.tiktokUrl}
              error={err("tiktokUrl")}
              placeholder="https://tiktok.com/@…"
            />
          </Seccion>
        </div>

        <VistaPrevia v={vista} />
      </div>
    </form>
  );
}
