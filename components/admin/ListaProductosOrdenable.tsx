'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { EtiquetasProducto } from '@/components/admin/EtiquetasProducto'
import { formatearPrecio } from '@/lib/utils'
import { reordenarProductosEnCategoria } from '@/server/acciones/productos'
import type { FilaProductoAdmin } from '@/server/consultas/productos'

function Fila({ p, posicion }: { p: FilaProductoAdmin; posicion: number }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: p.id })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-center gap-3 bg-superficie px-2 py-2.5 sm:px-3 ${isDragging ? 'relative z-10 shadow-lg ring-2 ring-primario/30' : ''}`}
    >
      <button
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        type="button"
        aria-label={`Mover ${p.nombre}`}
        className="flex h-9 w-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-texto-suave hover:bg-fondo hover:text-texto active:cursor-grabbing"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
          <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
          <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>
      <span className="w-6 shrink-0 text-center text-xs text-texto-suave">{posicion}</span>
      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
        {p.imagenes[0] && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.imagenes[0]} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-texto">{p.nombre}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-texto-suave">{formatearPrecio(p.precioOfertaCentavos ?? p.precioCentavos)}</span>
          <EtiquetasProducto p={p} />
        </div>
      </div>
      <Link href={`/admin/productos/${p.id}`} className="shrink-0 px-2 text-sm font-medium text-primario hover:underline">
        Editar
      </Link>
    </li>
  )
}

export function ListaProductosOrdenable({ categoriaId, productos }: { categoriaId: number; productos: FilaProductoAdmin[] }) {
  const [lista, setLista] = useState(productos)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, iniciar] = useTransition()

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return
    const anterior = lista
    const nueva = arrayMove(lista, lista.findIndex((p) => p.id === active.id), lista.findIndex((p) => p.id === over.id))
    setLista(nueva)
    setMensaje(null)

    iniciar(async () => {
      const r = await reordenarProductosEnCategoria(categoriaId, nueva.map((p) => p.id))
      if (!r.ok) setLista(anterior)
      setMensaje({ ok: r.ok, texto: r.mensaje })
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-texto-suave" aria-live="polite">
        {guardando ? 'Guardando orden…' : mensaje ? (
          <span className={mensaje.ok ? 'text-green-700' : 'text-red-700'}>{mensaje.texto}</span>
        ) : (
          'Arrastra desde ⠿ para cambiar el orden en que aparecen en esta categoría del catálogo.'
        )}
      </p>
      <DndContext
        id={`productos-categoria-${categoriaId}`}
        sensors={sensores}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        onDragEnd={alSoltar}
      >
        <SortableContext items={lista.map((p) => p.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y divide-borde overflow-hidden rounded-tarjeta border border-borde bg-superficie shadow-sm">
            {lista.map((p, i) => (
              <Fila key={p.id} p={p} posicion={i + 1} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}