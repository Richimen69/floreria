'use client'

import Link from 'next/link'
import { startTransition, useActionState, useState } from 'react'
import { eliminarExcepcion, guardarExcepcion } from '@/server/acciones/calendario'
import { EditorBloques, conUid, sinUid, nuevoBloque, type BloqueEditable } from '@/components/admin/EditorBloques'
import { Campo, Seccion } from '@/components/admin/Formulario'
import { Boton } from '@/components/ui/Boton'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'
import type { ExcepcionAdmin } from '@/server/consultas/calendario'

const estadoInicial: EstadoFormulario = { ok: false, mensaje: '' }

const TIPOS = [
  { valor: 'especial', titulo: 'Horario especial', texto: 'Estos días usan sus propios bloques y cupos en lugar del horario habitual' },
  { valor: 'no_disponible', titulo: 'Reservas aún no disponibles', texto: 'Se muestra “Reservas para esta fecha aún no disponibles” hasta que la cambies' },
  { valor: 'cerrado', titulo: 'Cerrado', texto: 'No hay entregas en estas fechas' },
] as const

export function FormExcepcion({ excepcion }: { excepcion?: ExcepcionAdmin }) {
  const accionGuardar = guardarExcepcion.bind(null, excepcion?.id ?? null)
  const [estado, accion, guardando] = useActionState(accionGuardar, estadoInicial)
  const [tipo, setTipo] = useState<string>(excepcion?.tipo ?? 'especial')
  const [bloques, setBloques] = useState<BloqueEditable[]>(() =>
    excepcion?.bloques.length
      ? conUid(excepcion.bloques)
      : [nuevoBloque({ inicio: '08:00', fin: '14:00' }), nuevoBloque({ inicio: '14:00', fin: '20:00' })],
  )
  const err = (campo: string) => estado.errores?.[campo]?.[0]

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    datos.set('bloques', JSON.stringify(sinUid(bloques)))
    startTransition(() => accion(datos))
  }

  async function eliminar() {
    if (!excepcion || !confirm(`¿Eliminar "${excepcion.nombre}"? Esas fechas volverán al horario habitual.`)) return
    await eliminarExcepcion(excepcion.id)
  }

  return (
    <form onSubmit={enviar}>
      <div className="sticky top-0 z-10 -mx-8 mb-8 flex items-center justify-between gap-4 border-b border-borde bg-fondo/85 px-8 py-4 backdrop-blur">
        <div>
          <Link href="/admin/calendario" className="text-sm text-texto-suave hover:text-primario">← Calendario</Link>
          <h1 className="font-titulos text-2xl font-semibold text-texto">{excepcion ? excepcion.nombre : 'Nueva excepción'}</h1>
          {estado.mensaje && !estado.ok && <p className="text-sm text-red-700">{estado.mensaje}</p>}
        </div>
        <div className="flex gap-2">
          {excepcion && <Boton type="button" variante="peligro" onClick={eliminar}>Eliminar</Boton>}
          <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>
        </div>
      </div>

      <div className="max-w-4xl space-y-6">
        <Seccion titulo="Fechas" descripcion="Una sola fecha (mismo día en ambos campos) o un rango.">
          <Campo nombre="nombre" etiqueta="Nombre" valor={excepcion?.nombre ?? ''} error={err('nombre')} placeholder="Ej. Día de las Madres" ancho />
          <Campo nombre="fechaInicio" etiqueta="Desde" tipo="date" valor={excepcion?.fechaInicio ?? ''} error={err('fechaInicio')} />
          <Campo nombre="fechaFin" etiqueta="Hasta" tipo="date" valor={excepcion?.fechaFin ?? ''} error={err('fechaFin')} />
          <Campo nombre="nota" etiqueta="Nota para el cliente" valor={excepcion?.nota ?? ''} error={err('nota')} placeholder="Opcional. Ej. Horario extendido por temporada" ancho />
        </Seccion>

        <Seccion titulo="Tipo" descripcion="Qué pasa en estas fechas.">
          <div className="grid gap-3 md:col-span-2 md:grid-cols-3">
            {TIPOS.map((t) => (
              <label key={t.valor} className="flex cursor-pointer gap-3 rounded-xl border border-borde p-4 has-checked:border-primario has-checked:bg-primario-suave">
                <input type="radio" name="tipo" value={t.valor} checked={tipo === t.valor} onChange={() => setTipo(t.valor)} className="mt-0.5 accent-primario" />
                <span>
                  <span className="block text-sm font-medium text-texto">{t.titulo}</span>
                  <span className="block text-xs text-texto-suave">{t.texto}</span>
                </span>
              </label>
            ))}
          </div>
        </Seccion>

        {tipo === 'especial' && (
          <Seccion titulo="Bloques de estas fechas" descripcion="Reemplazan al horario habitual. Puedes traslaparlos con cupos independientes.">
            <div className="md:col-span-2">
              <EditorBloques bloques={bloques} onChange={setBloques} />
              {err('bloques') && <p className="mt-2 text-xs text-red-700">{err('bloques')}</p>}
            </div>
          </Seccion>
        )}
      </div>
    </form>
  )
}