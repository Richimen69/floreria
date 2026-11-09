"use client";

import Link from "next/link";
import { startTransition, useActionState } from "react";
import { eliminarProducto, guardarProducto } from "@/server/acciones/productos";
import { Campo, Seccion } from "@/components/admin/Formulario";
import { GaleriaImagenes } from "@/components/admin/GaleriaImagenes";
import { Boton } from "@/components/ui/Boton";
import { Ayuda, Etiqueta, claseInput } from "@/components/ui/Campo";
import { centavosATexto } from "@/lib/utils";
import type { Categoria, Producto } from "@/db/schema";
import type { EstadoFormulario } from "@/lib/validaciones/ajustes";
import { useState } from "react";
import {
  SelectorComplementos,
  type OpcionComplemento,
} from "@/components/admin/SelectorComplementos";
import type { ProductoAdmin } from "@/server/consultas/productos";
import { EncabezadoPagina } from "@/components/admin/EncabezadoPagina";

const estadoInicial: EstadoFormulario = { ok: false, mensaje: "" };

function Interruptor({
  nombre,
  titulo,
  descripcion,
  marcado,
}: {
  nombre: string;
  titulo: string;
  descripcion: string;
  marcado: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-4 hover:border-primario/40">
      <input
        type="checkbox"
        name={nombre}
        defaultChecked={marcado}
        className="mt-0.5 h-4 w-4 accent-primario"
      />
      <span>
        <span className="block text-sm font-medium text-texto">{titulo}</span>
        <span className="block text-xs text-texto-suave">{descripcion}</span>
      </span>
    </label>
  );
}

export function FormProducto({
  producto,
  categorias,
  opcionesComplemento,
}: {
  producto?: ProductoAdmin;
  categorias: Categoria[];
  opcionesComplemento: OpcionComplemento[];
}) {
  const accionGuardar = guardarProducto.bind(null, producto?.id ?? null);
  const [controlarExistencias, setControlarExistencias] = useState(
    producto?.controlarExistencias ?? false,
  );
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
    if (!producto) return;
    if (
      !confirm(
        `¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
      )
    )
      return;
    await eliminarProducto(producto.id);
  }

  if (categorias.length === 0) {
    return (
      <div className="mt-8 rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
        <p className="font-titulos text-lg text-texto">
          Primero crea una categoría
        </p>
        <Link
          href="/admin/categorias/nueva"
          className="mt-2 inline-block text-sm font-medium text-primario hover:underline"
        >
          Crear categoría →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar}>
      <EncabezadoPagina
        titulo={producto ? producto.nombre : "Nuevo producto"}
        volver={{ href: "/admin/productos", texto: "Productos" }}
        descripcion={
          estado.mensaje && !estado.ok ? (
            <span className="text-red-700">{estado.mensaje}</span>
          ) : undefined
        }
        acciones={
          <>
            {producto && (
              <Boton type="button" variante="peligro" onClick={eliminar}>
                Eliminar
              </Boton>
            )}
            <Boton type="submit" disabled={guardando}>
              {guardando ? "Guardando…" : "Guardar"}
            </Boton>
          </>
        }
      />

      <div className="max-w-4xl space-y-6">
        <Seccion
          titulo="Información"
          descripcion="Lo que verán tus clientes en el catálogo."
        >
          <Campo
            nombre="nombre"
            etiqueta="Nombre"
            valor={producto?.nombre ?? ""}
            error={err("nombre")}
            placeholder="Ej. Ramo de 12 rosas rojas"
          />
          <div className="space-y-2 md:col-span-2">
            <span className="block text-sm font-medium text-texto">
              Categorías
            </span>
            <div className="flex flex-wrap gap-2">
              {categorias.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-borde px-3 py-1.5 text-sm text-texto has-checked:border-primario has-checked:bg-primario-suave has-checked:text-primario-oscuro"
                >
                  <input
                    type="checkbox"
                    name="categoriaIds"
                    value={c.id}
                    defaultChecked={producto?.categoriaIds.includes(c.id)}
                    className="sr-only"
                  />
                  {c.nombre}
                  {!c.activa && (
                    <span className="text-xs text-texto-suave">(oculta)</span>
                  )}
                </label>
              ))}
            </div>
            {err("categoriaIds") && (
              <p className="text-xs text-red-700">{err("categoriaIds")}</p>
            )}
          </div>
          <Campo
            nombre="descripcion"
            etiqueta="Descripción"
            valor={producto?.descripcion ?? ""}
            error={err("descripcion")}
            multilinea
            ancho
            placeholder="Qué incluye, tamaño, tipo de flores…"
          />
          <Campo
            nombre="slug"
            etiqueta="Identificador en la URL"
            valor={producto?.slug ?? ""}
            error={err("slug")}
            ayuda="Déjalo vacío para generarlo a partir del nombre"
          />
        </Seccion>

        <Seccion
          titulo="Fotos"
          descripcion="Buenas fotos venden más; usa luz natural y fondo limpio."
        >
          <GaleriaImagenes
            valorInicial={producto?.imagenes ?? []}
            error={err("imagenes")}
          />
        </Seccion>

        <Seccion
          titulo="Precio"
          descripcion="En pesos mexicanos, con IVA incluido."
        >
          <Campo
            nombre="precio"
            etiqueta="Precio"
            valor={centavosATexto(producto?.precioCentavos ?? null)}
            error={err("precio")}
            placeholder="650.00"
          />
          <Campo
            nombre="precioOferta"
            etiqueta="Precio de oferta"
            valor={centavosATexto(producto?.precioOfertaCentavos ?? null)}
            error={err("precioOferta")}
            ayuda="Opcional. Si lo llenas, se mostrará tachado el precio normal"
          />
          <Campo
            nombre="ofertaDesde"
            etiqueta="Oferta válida desde"
            tipo="date"
            valor={producto?.ofertaDesde ?? ""}
            error={err("ofertaDesde")}
            ayuda="Opcional. Si lo dejas vacío, aplica desde hoy"
          />
          <Campo
            nombre="ofertaHasta"
            etiqueta="Vence el"
            tipo="date"
            valor={producto?.ofertaHasta ?? ""}
            error={err("ofertaHasta")}
            ayuda="Última fecha de entrega con precio de oferta"
          />
        </Seccion>

        <Seccion
          titulo="Complementos"
          descripcion="Productos sugeridos para acompañar este arreglo."
        >
          <SelectorComplementos
            opciones={opcionesComplemento}
            seleccionInicial={producto?.complementoIds ?? []}
            excluirId={producto?.id}
            error={err("complementoIds")}
          />
        </Seccion>

        <Seccion
          titulo="Disponibilidad"
          descripcion="Tiempo de preparación y control de piezas."
        >
          <Campo
            nombre="diasAnticipacion"
            etiqueta="Días de anticipación"
            tipo="number"
            valor={String(producto?.diasAnticipacion ?? 0)}
            error={err("diasAnticipacion")}
            ayuda="0 = se puede entregar el mismo día"
          />
          <div />

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-4 hover:border-primario/40">
            <input
              type="checkbox"
              name="controlarExistencias"
              checked={controlarExistencias}
              onChange={(e) => setControlarExistencias(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-primario"
            />
            <span>
              <span className="block text-sm font-medium text-texto">
                Controlar existencias
              </span>
              <span className="block text-xs text-texto-suave">
                Para productos con piezas limitadas, como peluches o vinos
              </span>
            </span>
          </label>

          {controlarExistencias ? (
            <Campo
              nombre="existencias"
              etiqueta="Piezas en existencia"
              tipo="number"
              valor={String(producto?.existencias ?? 0)}
              error={err("existencias")}
              ayuda="En 0 se mostrará como “Sin existencias”"
            />
          ) : (
            <input
              type="hidden"
              name="existencias"
              value={producto?.existencias ?? 0}
            />
          )}
        </Seccion>

        <Seccion
          titulo="Visibilidad"
          descripcion="Controla dónde y cuándo aparece."
        >
          <Interruptor
            nombre="activo"
            titulo="Visible en el sitio"
            descripcion="Desmárcalo para ocultarlo sin borrarlo"
            marcado={producto?.activo ?? true}
          />
          <Interruptor
            nombre="disponible"
            titulo="Disponible para pedir"
            descripcion="Desmárcalo si hoy no hay flores para este arreglo"
            marcado={producto?.disponible ?? true}
          />
          <Interruptor
            nombre="destacado"
            titulo="Producto Top"
            descripcion="Aparece en la sección destacada de Inicio"
            marcado={producto?.destacado ?? false}
          />
          <Campo
            nombre="orden"
            etiqueta="Orden dentro de su categoría"
            tipo="number"
            valor={String(producto?.orden ?? 0)}
            error={err("orden")}
          />
        </Seccion>
      </div>
    </form>
  );
}
