'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { restrictToParentElement, restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import { reordenarCategorias } from '@/server/acciones/categorias'
import type { Categoria } from '@/db/schema'

function Fila({ c }: { c: Categoria }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id: c.id })

  return (
    <tr
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`bg-superficie ${isDragging ? 'relative z-10 shadow-lg ring-2 ring-primario/30' : 'hover:bg-fondo/60'}`}
    >
      <td className="w-10 py-3 pl-2 sm:pl-3">
        <button
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          type="button"
          aria-label={`Mover ${c.nombre}`}
          className="flex h-9 w-9 cursor-grab touch-none items-center justify-center rounded-lg text-texto-suave hover:bg-fondo hover:text-texto active:cursor-grabbing"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden>
            <circle cx="7" cy="5" r="1.5" /><circle cx="13" cy="5" r="1.5" />
            <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
            <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
          </svg>
        </button>
      </td>
      <td className="px-3 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
            {c.imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imagenUrl} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <span className="font-medium text-texto">{c.nombre}</span>
        </div>
      </td>
      <td className="hidden px-3 py-3 font-mono text-xs text-texto-suave sm:table-cell sm:px-5">/catalogo/{c.slug}</td>
      <td className="px-3 py-3 sm:px-5">
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${c.activa ? 'bg-acento-suave text-acento' : 'bg-fondo text-texto-suave'}`}>
          {c.activa ? 'Visible' : 'Oculta'}
        </span>
      </td>
      <td className="px-3 py-3 text-right sm:px-5">
        <Link href={`/admin/categorias/${c.id}`} className="font-medium text-primario hover:underline">
          Editar
        </Link>
      </td>
    </tr>
  )
}

export function ListaCategorias({ categorias }: { categorias: Categoria[] }) {
  const [lista, setLista] = useState(categorias)
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, iniciar] = useTransition()

  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function alSoltar({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return

    const anterior = lista
    const nueva = arrayMove(
      lista,
      lista.findIndex((c) => c.id === active.id),
      lista.findIndex((c) => c.id === over.id),
    )
    setLista(nueva) // se mueve al instante, sin esperar al servidor
    setMensaje(null)

    iniciar(async () => {
      const r = await reordenarCategorias(nueva.map((c) => c.id))
      if (r.ok) {
        setMensaje({ ok: true, texto: 'Orden guardado' })
      } else {
        setLista(anterior)
        setMensaje({ ok: false, texto: 'No se pudo guardar el orden. Intenta de nuevo.' })
      }
    })
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-texto-suave" aria-live="polite">
        {guardando ? 'Guardando orden…' : mensaje ? (
          <span className={mensaje.ok ? 'text-green-700' : 'text-red-700'}>{mensaje.texto}</span>
        ) : (
          'Arrastra desde ⠿ para cambiar el orden en que aparecen en el catálogo.'
        )}
      </p>

      <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie shadow-sm">
        <DndContext
          id="lista-categorias"
          sensors={sensores}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={alSoltar}
        >
          <table className="w-full text-sm">
            <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
              <tr>
                <th className="w-10" />
                <th className="px-3 py-3 font-semibold sm:px-5">Categoría</th>
                <th className="hidden px-3 py-3 font-semibold sm:table-cell sm:px-5">URL</th>
                <th className="px-3 py-3 font-semibold sm:px-5">Estado</th>
                <th className="px-3 py-3 sm:px-5" />
              </tr>
            </thead>
            <SortableContext items={lista.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              <tbody className="divide-y divide-borde">
                {lista.map((c) => (
                  <Fila key={c.id} c={c} />
                ))}
              </tbody>
            </SortableContext>
          </table>
        </DndContext>
      </div>
    </div>
  )
}