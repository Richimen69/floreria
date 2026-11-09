'use client'

import { claseInput } from '@/components/ui/Campo'
import type { BloqueConfig } from '@/lib/calendario'

export type BloqueEditable = BloqueConfig & { uid: string }

export function nuevoBloque(base?: Partial<BloqueConfig>): BloqueEditable {
  return { uid: crypto.randomUUID(), inicio: '09:00', fin: '12:00', minutosCierre: 30, capacidad: 15, ...base }
}

export function conUid(bloques: BloqueConfig[]): BloqueEditable[] {
  return bloques.map((b) => ({ ...b, uid: crypto.randomUUID() }))
}

export function sinUid(bloques: BloqueEditable[]): BloqueConfig[] {
  return bloques.map(({ uid: _uid, ...b }) => b)
}

type Props = { bloques: BloqueEditable[]; onChange: (bloques: BloqueEditable[]) => void }

export function EditorBloques({ bloques, onChange }: Props) {
  function actualizar(uid: string, campo: keyof BloqueConfig, valor: string) {
    onChange(
      bloques.map((b) =>
        b.uid === uid ? { ...b, [campo]: campo === 'inicio' || campo === 'fin' ? valor : Number(valor) } : b,
      ),
    )
  }

  function agregar() {
    const ultimo = bloques.at(-1)
    onChange([...bloques, nuevoBloque(ultimo ? { inicio: ultimo.fin, fin: ultimo.fin } : undefined)])
  }

  return (
    <div className="space-y-2">
      {bloques.length > 0 && (
        <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 px-1 text-xs font-medium text-texto-suave sm:grid">
          <span>Desde</span>
          <span>Hasta</span>
          <span>Cierre (min antes)</span>
          <span>Cupo (pedidos)</span>
          <span className="w-8" />
        </div>
      )}

      {bloques.map((b) => (
        <div key={b.uid} className="grid grid-cols-2 gap-2 rounded-xl border border-borde p-2 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:border-0 sm:p-0">
          <input type="time" value={b.inicio} onChange={(e) => actualizar(b.uid, 'inicio', e.target.value)} className={claseInput} aria-label="Desde" />
          <input type="time" value={b.fin} onChange={(e) => actualizar(b.uid, 'fin', e.target.value)} className={claseInput} aria-label="Hasta" />
          <input type="number" min={0} value={b.minutosCierre} onChange={(e) => actualizar(b.uid, 'minutosCierre', e.target.value)} className={claseInput} aria-label="Minutos de cierre" />
          <input type="number" min={1} value={b.capacidad} onChange={(e) => actualizar(b.uid, 'capacidad', e.target.value)} className={claseInput} aria-label="Cupo" />
          <button
            type="button"
            onClick={() => onChange(bloques.filter((x) => x.uid !== b.uid))}
            aria-label="Quitar bloque"
            className="col-span-2 rounded-lg px-2 text-sm text-red-700 hover:bg-red-50 sm:col-span-1 sm:w-8"
          >
            ×
          </button>
        </div>
      ))}

      <button type="button" onClick={agregar} className="text-sm font-medium text-primario hover:underline">
        + Agregar bloque
      </button>
    </div>
  )
}