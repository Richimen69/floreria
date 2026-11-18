'use client'

import { startTransition, useActionState } from 'react'
import { guardarInsumo } from '@/server/acciones/inventario'
import { Campo, Seccion } from '@/components/admin/Formulario'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'
import { Boton } from '@/components/ui/Boton'
import { Ayuda, Etiqueta, claseInput } from '@/components/ui/Campo'
import { UNIDADES } from '@/lib/inventario'
import { centavosATexto } from '@/lib/utils'
import type { Insumo } from '@/db/schema'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

const estadoInicial: EstadoFormulario = { ok: false, mensaje: '' }

export function FormInsumo({ insumo, categorias }: { insumo?: Insumo; categorias: string[] }) {
  const accionGuardar = guardarInsumo.bind(null, insumo?.id ?? null)
  const [estado, accion, guardando] = useActionState(accionGuardar, estadoInicial)
  const err = (campo: string) => estado.errores?.[campo]?.[0]

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    startTransition(() => accion(datos))
  }

  return (
    <form onSubmit={enviar}>
      <EncabezadoPagina
        titulo={insumo ? insumo.nombre : 'Nuevo insumo'}
        volver={{ href: '/admin/inventario', texto: 'Inventario' }}
        descripcion={estado.mensaje && !estado.ok ? <span className="text-red-700">{estado.mensaje}</span> : undefined}
        acciones={<Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar'}</Boton>}
      />

      <div className="max-w-3xl space-y-6">
        <Seccion titulo="Datos" descripcion="Cómo identifican este insumo.">
          <Campo nombre="nombre" etiqueta="Nombre" valor={insumo?.nombre ?? ''} error={err('nombre')} placeholder="Ej. Rosa roja de exportación" ancho />

          <div className="space-y-1.5">
            <Etiqueta htmlFor="categoria">Categoría</Etiqueta>
            <input id="categoria" name="categoria" list="categorias-insumo" defaultValue={insumo?.categoria ?? ''} placeholder="Ej. Flores" className={claseInput} />
            <datalist id="categorias-insumo">
              {categorias.map((c) => <option key={c} value={c} />)}
            </datalist>
            <Ayuda error={err('categoria')} texto="Elige una existente o escribe una nueva" />
          </div>

          <div className="space-y-1.5">
            <Etiqueta htmlFor="unidad">Unidad</Etiqueta>
            <select id="unidad" name="unidad" defaultValue={insumo?.unidad ?? 'pieza'} className={claseInput}>
              {UNIDADES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </Seccion>

        <Seccion titulo="Existencias" descripcion="El mínimo sirve para generar la lista de compras.">
          {!insumo && (
            <Campo nombre="existenciaInicial" etiqueta="Existencia inicial" valor="" error={err('existenciaInicial')} placeholder="0" ayuda="Lo que tienen hoy. Después cambia con movimientos" />
          )}
          <Campo nombre="minimo" etiqueta="Mínimo" valor={insumo?.minimo != null ? String(insumo.minimo) : ''} error={err('minimo')} placeholder="Opcional" ayuda="Al llegar a esta cantidad aparece en la lista de compras" />
        </Seccion>

        <Seccion titulo="Compra" descripcion="Opcional, como referencia.">
          <Campo nombre="costo" etiqueta="Costo por unidad" valor={centavosATexto(insumo?.costoUnitarioCentavos ?? null)} error={err('costo')} placeholder="0.00" ayuda="Se actualiza al registrar entradas con costo" />
          <Campo nombre="proveedor" etiqueta="Proveedor" valor={insumo?.proveedor ?? ''} error={err('proveedor')} />
          <Campo nombre="notas" etiqueta="Notas" valor={insumo?.notas ?? ''} error={err('notas')} multilinea ancho />
        </Seccion>

        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-borde bg-superficie p-4">
          <input type="checkbox" name="activo" defaultChecked={insumo?.activo ?? true} className="mt-0.5 h-4 w-4 accent-primario" />
          <span>
            <span className="block text-sm font-medium text-texto">Activo</span>
            <span className="block text-xs text-texto-suave">Desactívalo si ya no lo compran; se conserva su historial</span>
          </span>
        </label>
      </div>
    </form>
  )
}