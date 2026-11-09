'use client'

import { startTransition, useActionState, useState } from 'react'
import { guardarHorarioSemanal } from '@/server/acciones/calendario'
import { EditorBloques, conUid, sinUid, type BloqueEditable } from '@/components/admin/EditorBloques'
import { Boton } from '@/components/ui/Boton'
import { Etiqueta, claseInput } from '@/components/ui/Campo'
import { DIAS } from '@/lib/validaciones/calendario'
import type { BloqueConfig } from '@/lib/calendario'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0] // de lunes a domingo
const estadoInicial: EstadoFormulario = { ok: false, mensaje: '' }

type Props = { semana: Record<number, BloqueConfig[]>; horizonteDias: number }

export function FormHorarioSemanal({ semana, horizonteDias }: Props) {
  const [estado, accion, guardando] = useActionState(guardarHorarioSemanal, estadoInicial)
  const [dias, setDias] = useState<Record<number, BloqueEditable[]>>(() =>
    Object.fromEntries(ORDEN_DIAS.map((d) => [d, conUid(semana[d] ?? [])])),
  )

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    datos.set('semana', JSON.stringify(Object.fromEntries(ORDEN_DIAS.map((d) => [d, sinUid(dias[d])]))))
    startTransition(() => accion(datos))
  }

  function copiarLunes() {
    setDias((actual) => ({
      ...actual,
      ...Object.fromEntries([2, 3, 4, 5, 6].map((d) => [d, conUid(sinUid(actual[1]))])),
    }))
  }

  return (
    <form onSubmit={enviar} className="rounded-tarjeta border border-borde bg-superficie shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-borde px-6 py-4">
        <div>
          <h2 className="font-titulos text-lg font-semibold text-texto">Horario habitual</h2>
          <p className="text-sm text-texto-suave">Bloques de entrega de cada día. Los bloques pueden traslaparse.</p>
        </div>
        <div className="flex items-center gap-3">
          {estado.mensaje && (
            <p role="status" className={`text-sm ${estado.ok ? 'text-green-700' : 'text-red-700'}`}>{estado.mensaje}</p>
          )}
          <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar horario'}</Boton>
        </div>
      </header>

      <div className="space-y-6 p-6">
        <div className="max-w-xs space-y-1.5">
          <Etiqueta htmlFor="horizonteDias">Reservas con hasta (días)</Etiqueta>
          <input id="horizonteDias" name="horizonteDias" type="number" min={1} defaultValue={horizonteDias} className={claseInput} />
          <p className="text-xs text-texto-suave">Qué tan lejos pueden elegir fecha los clientes. 60 ≈ dos meses.</p>
        </div>

        <div className="divide-y divide-borde">
          {ORDEN_DIAS.map((d) => (
            <div key={d} className="grid gap-3 py-4 md:grid-cols-[140px_1fr]">
              <div>
                <p className="font-medium text-texto">{DIAS[d]}</p>
                {dias[d].length === 0 && <p className="text-xs text-texto-suave">Sin entregas</p>}
                {d === 1 && (
                  <button type="button" onClick={copiarLunes} className="mt-1 text-xs text-primario hover:underline">
                    Copiar a martes–sábado
                  </button>
                )}
              </div>
              <EditorBloques bloques={dias[d]} onChange={(b) => setDias((actual) => ({ ...actual, [d]: b }))} />
            </div>
          ))}
        </div>
      </div>
    </form>
  )
}