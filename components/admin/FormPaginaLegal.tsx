'use client'

import { startTransition, useActionState, useState } from 'react'
import { ContenidoLegal } from '@/components/ContenidoLegal'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { Boton } from '@/components/ui/Boton'
import { Ayuda, Etiqueta, claseInput } from '@/components/ui/Campo'
import { guardarPaginaLegal } from '@/server/acciones/legales'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

const estadoInicial: EstadoFormulario = { ok: false, mensaje: '' }

type Props = {
  slug: string
  titulo: string
  contenido: string
  publicada: boolean
  version: number
}

export function FormPaginaLegal({ slug, titulo, contenido, publicada, version }: Props) {
  const [estado, accion, guardando] = useActionState(guardarPaginaLegal.bind(null, slug), estadoInicial)
  const [texto, setTexto] = useState(contenido)
  const err = (campo: string) => estado.errores?.[campo]?.[0]

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    startTransition(() => accion(datos))
  }

  return (
    <form onSubmit={enviar}>
      <EncabezadoPagina
        titulo={titulo}
        volver={{ href: '/admin/legales', texto: 'Textos legales' }}
        descripcion={
          estado.mensaje ? (
            <span className={estado.ok ? 'text-green-700' : 'text-red-700'}>{estado.mensaje}</span>
          ) : (
            `${publicada ? 'Publicada' : 'Borrador'} · versión ${version}`
          )
        }
        acciones={<Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>}
      />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Etiqueta htmlFor="titulo">Título</Etiqueta>
            <input id="titulo" name="titulo" defaultValue={titulo} className={claseInput} />
            <Ayuda error={err('titulo')} />
          </div>

          <div className="space-y-1.5">
            <Etiqueta htmlFor="contenido">Contenido</Etiqueta>
            <textarea
              id="contenido"
              name="contenido"
              rows={24}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              className={`${claseInput} font-mono text-sm leading-relaxed`}
            />
            <Ayuda
              error={err('contenido')}
              texto="“## Texto” crea un subtítulo · “- texto” crea un punto de lista · una línea en blanco separa párrafos"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde bg-superficie p-4">
            <input type="checkbox" name="publicada" defaultChecked={publicada} className="mt-0.5 h-4 w-4 accent-primario" />
            <span>
              <span className="block text-sm font-medium text-texto">Publicada</span>
              <span className="block text-xs text-texto-suave">
                Mientras esté apagado, la página no se muestra en el sitio. Si cambias el texto de una página publicada, se crea una versión nueva.
              </span>
            </span>
          </label>
        </div>

        <div className="space-y-1.5">
          <span className="block text-sm font-medium text-texto">Vista previa</span>
          <div className="max-h-[75vh] overflow-y-auto rounded-tarjeta border border-borde bg-superficie p-6">
            <ContenidoLegal contenido={texto} />
          </div>
        </div>
      </div>
    </form>
  )
}