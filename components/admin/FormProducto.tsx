'use client'

import Link from 'next/link'
import { startTransition, useActionState } from 'react'
import { eliminarProducto, guardarProducto } from '@/server/acciones/productos'
import { Campo, Seccion } from '@/components/admin/Formulario'
import { GaleriaImagenes } from '@/components/admin/GaleriaImagenes'
import { Boton } from '@/components/ui/Boton'
import { Ayuda, Etiqueta, claseInput } from '@/components/ui/Campo'
import { centavosATexto } from '@/lib/utils'
import type { Categoria, Producto } from '@/db/schema'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

const estadoInicial: EstadoFormulario = { ok: false, mensaje: '' }

function Interruptor({ nombre, titulo, descripcion, marcado }: {
  nombre: string
  titulo: string
  descripcion: string
  marcado: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde p-4 hover:border-primario/40">
      <input type="checkbox" name={nombre} defaultChecked={marcado} className="mt-0.5 h-4 w-4 accent-primario" />
      <span>
        <span className="block text-sm font-medium text-texto">{titulo}</span>
        <span className="block text-xs text-texto-suave">{descripcion}</span>
      </span>
    </label>
  )
}

export function FormProducto({ producto, categorias }: { producto?: Producto; categorias: Categoria[] }) {
  const accionGuardar = guardarProducto.bind(null, producto?.id ?? null)
  const [estado, accion, guardando] = useActionState(accionGuardar, estadoInicial)
  const err = (campo: string) => estado.errores?.[campo]?.[0]

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    startTransition(() => accion(datos))
  }

  async function eliminar() {
    if (!producto) return
    if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return
    await eliminarProducto(producto.id)
  }

  if (categorias.length === 0) {
    return (
      <div className="mt-8 rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
        <p className="font-titulos text-lg text-texto">Primero crea una categoría</p>
        <Link href="/admin/categorias/nueva" className="mt-2 inline-block text-sm font-medium text-primario hover:underline">
          Crear categoría →
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={enviar}>
      <div className="sticky top-0 z-10 -mx-8 mb-8 flex items-center justify-between gap-4 border-b border-borde bg-fondo/85 px-8 py-4 backdrop-blur">
        <div>
          <Link href="/admin/productos" className="text-sm text-texto-suave hover:text-primario">← Productos</Link>
          <h1 className="font-titulos text-2xl font-semibold text-texto">{producto ? producto.nombre : 'Nuevo producto'}</h1>
          {estado.mensaje && !estado.ok && <p className="text-sm text-red-700">{estado.mensaje}</p>}
        </div>
        <div className="flex gap-2">
          {producto && <Boton type="button" variante="peligro" onClick={eliminar}>Eliminar</Boton>}
          <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <Seccion titulo="Información" descripcion="Lo que verán tus clientes en el catálogo.">
          <Campo nombre="nombre" etiqueta="Nombre" valor={producto?.nombre ?? ''} error={err('nombre')} placeholder="Ej. Ramo de 12 rosas rojas" />
          <div className="space-y-1.5">
            <Etiqueta htmlFor="categoriaId">Categoría</Etiqueta>
            <select id="categoriaId" name="categoriaId" defaultValue={producto?.categoriaId ?? ''} className={claseInput}>
              <option value="" disabled>Elige una categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}{!c.activa ? ' (oculta)' : ''}</option>
              ))}
            </select>
            <Ayuda error={err('categoriaId')} />
          </div>
          <Campo nombre="descripcion" etiqueta="Descripción" valor={producto?.descripcion ?? ''} error={err('descripcion')} multilinea ancho placeholder="Qué incluye, tamaño, tipo de flores…" />
          <Campo nombre="slug" etiqueta="Identificador en la URL" valor={producto?.slug ?? ''} error={err('slug')} ayuda="Déjalo vacío para generarlo a partir del nombre" />
        </Seccion>

        <Seccion titulo="Fotos" descripcion="Buenas fotos venden más; usa luz natural y fondo limpio.">
          <GaleriaImagenes valorInicial={producto?.imagenes ?? []} error={err('imagenes')} />
        </Seccion>

        <Seccion titulo="Precio" descripcion="En pesos mexicanos, con IVA incluido.">
          <Campo nombre="precio" etiqueta="Precio" valor={centavosATexto(producto?.precioCentavos ?? null)} error={err('precio')} placeholder="650.00" />
          <Campo
            nombre="precioOferta"
            etiqueta="Precio de oferta"
            valor={centavosATexto(producto?.precioOfertaCentavos ?? null)}
            error={err('precioOferta')}
            ayuda="Opcional. Si lo llenas, se mostrará tachado el precio normal"
          />
        </Seccion>

        <Seccion titulo="Visibilidad" descripcion="Controla dónde y cuándo aparece.">
          <Interruptor nombre="activo" titulo="Visible en el sitio" descripcion="Desmárcalo para ocultarlo sin borrarlo" marcado={producto?.activo ?? true} />
          <Interruptor nombre="disponible" titulo="Disponible para pedir" descripcion="Desmárcalo si hoy no hay flores para este arreglo" marcado={producto?.disponible ?? true} />
          <Interruptor nombre="destacado" titulo="Producto Top" descripcion="Aparece en la sección destacada de Inicio" marcado={producto?.destacado ?? false} />
          <Campo nombre="orden" etiqueta="Orden dentro de su categoría" tipo="number" valor={String(producto?.orden ?? 0)} error={err('orden')} />
        </Seccion>
      </div>
    </form>
  )
}