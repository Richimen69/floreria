"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import {
  eliminarCategoria,
  guardarCategoria,
} from "@/server/acciones/categorias";
import { Campo, Seccion } from "@/components/admin/Formulario";
import { SubirImagen } from "@/components/admin/SubirImagen";
import { Boton } from "@/components/ui/Boton";
import type { Categoria } from "@/db/schema";
import type { EstadoFormulario } from "@/lib/validaciones/ajustes";

const estadoInicial: EstadoFormulario = { ok: false, mensaje: "" };

export function FormCategoria({ categoria }: { categoria?: Categoria }) {
  const accionGuardar = guardarCategoria.bind(null, categoria?.id ?? null);
  const [estado, accion, guardando] = useActionState(
    accionGuardar,
    estadoInicial,
  );
  const err = (campo: string) => estado.errores?.[campo]?.[0];

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    startTransition(() => accion(datos));
  }

  async function eliminar() {
    if (!categoria) return;
    if (!confirm(`¿Eliminar la categoría "${categoria.nombre}"?`)) return;
    const resultado = await eliminarCategoria(categoria.id);
    if (resultado && !resultado.ok) alert(resultado.mensaje);
  }

  return (
    <form onSubmit={enviar}>
      <div className="sticky top-0 z-10 -mx-8 mb-8 flex items-center justify-between gap-4 border-b border-borde bg-fondo/85 px-8 py-4 backdrop-blur">
        <div>
          <Link
            href="/admin/categorias"
            className="text-sm text-texto-suave hover:text-primario"
          >
            ← Categorías
          </Link>
          <h1 className="font-titulos text-2xl font-semibold text-texto">
            {categoria ? categoria.nombre : "Nueva categoría"}
          </h1>
          {estado.mensaje && !estado.ok && (
            <p className="text-sm text-red-700">{estado.mensaje}</p>
          )}
        </div>
        <div className="flex gap-2">
          {categoria && (
            <Boton type="button" variante="peligro" onClick={eliminar}>
              Eliminar
            </Boton>
          )}
          <Boton type="submit" disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar"}
          </Boton>
        </div>
      </div>

      <div className="max-w-3xl space-y-6">
        <Seccion
          titulo="Información"
          descripcion="Cómo aparece la categoría en el catálogo."
        >
          <Campo
            nombre="nombre"
            etiqueta="Nombre"
            valor={categoria?.nombre ?? ""}
            error={err("nombre")}
            placeholder="Ej. Ramos de rosas"
          />
          <Campo
            nombre="slug"
            etiqueta="Identificador en la URL"
            valor={categoria?.slug ?? ""}
            error={err("slug")}
            ayuda="Déjalo vacío para generarlo a partir del nombre"
            placeholder="ramos-de-rosas"
          />
          <Campo
            nombre="descripcion"
            etiqueta="Descripción"
            valor={categoria?.descripcion ?? ""}
            error={err("descripcion")}
            multilinea
            ancho
          />
          <div className="md:col-span-2">
            <SubirImagen
              nombre="imagenUrl"
              etiqueta="Imagen"
              carpeta="categorias"
              forma="ancha"
              valorInicial={categoria?.imagenUrl ?? null}
              error={err("imagenUrl")}
            />
          </div>
        </Seccion>

        <Seccion
          titulo="Visibilidad"
          descripcion="Controla dónde y cuándo se muestra."
        >
          <Campo
            nombre="orden"
            etiqueta="Orden"
            tipo="number"
            valor={String(categoria?.orden ?? 0)}
            error={err("orden")}
            ayuda="Las categorías con número menor aparecen primero"
          />
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-4 hover:border-primario/40">
            <input
              type="checkbox"
              name="activa"
              defaultChecked={categoria?.activa ?? true}
              className="mt-0.5 h-4 w-4 accent-primario"
            />
            <span>
              <span className="block text-sm font-medium text-texto">
                Visible en el sitio
              </span>
              <span className="block text-xs text-texto-suave">
                Desmárcala para ocultarla sin borrarla
              </span>
            </span>
          </label>
        </Seccion>
      </div>
    </form>
  );
}
