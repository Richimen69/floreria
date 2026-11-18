'use client'

import { useRef, useState, useTransition } from 'react'
import { claseInput } from '@/components/ui/Campo'
import { Boton } from '@/components/ui/Boton'
import { TIPOS_MOVIMIENTO, formatearCantidad, type TipoMovimiento } from '@/lib/inventario'
import { registrarMovimiento } from '@/server/acciones/inventario'

type Props = {
    insumo: { id: number; nombre: string; unidad: string; existencia: number }
    textoBoton?: string
}

export function DialogoMovimiento({ insumo, textoBoton = 'Movimiento' }: Props) {
    const dialogo = useRef<HTMLDialogElement>(null)
    const [tipo, setTipo] = useState<TipoMovimiento>('entrada')
    const [error, setError] = useState<string | null>(null)
    const [guardando, iniciar] = useTransition()

    function abrir() {
        setTipo('entrada')
        setError(null)
        dialogo.current?.showModal()
    }

    function enviar(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const formulario = e.currentTarget
        const datos = new FormData(formulario)
        iniciar(async () => {
            const r = await registrarMovimiento(datos)
            if (r.ok) {
                formulario.reset()
                dialogo.current?.close()
            } else {
                setError(r.mensaje)
            }
        })
    }

    return (
        <>
            <button type="button" onClick={abrir} className="rounded-full border border-borde px-3 py-1.5 text-sm font-medium text-texto hover:border-primario hover:text-primario">
                {textoBoton}
            </button>

            <dialog
                ref={dialogo}
                className="m-auto w-[calc(100%-2rem)] max-w-md rounded-tarjeta border border-borde bg-superficie p-0 text-texto shadow-xl backdrop:bg-black/40 text-left"

            >
                <form onSubmit={enviar} className="space-y-4 p-5">
                    <input type="hidden" name="insumoId" value={insumo.id} />

                    <div>
                        <h2 className="font-titulos text-lg font-semibold">{insumo.nombre}</h2>
                        <p className="text-sm text-texto-suave">
                            Existencia actual: {formatearCantidad(insumo.existencia)} {insumo.unidad}(s)
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(TIPOS_MOVIMIENTO) as TipoMovimiento[]).map((t) => (
                            <label key={t} className="cursor-pointer rounded-xl border border-borde p-3 has-checked:border-primario has-checked:bg-primario-suave">
                                <input type="radio" name="tipo" value={t} checked={tipo === t} onChange={() => setTipo(t)} className="sr-only" />
                                <span className="block text-sm font-medium">{TIPOS_MOVIMIENTO[t].texto}</span>
                                <span className="block text-xs text-texto-suave">{TIPOS_MOVIMIENTO[t].ayuda}</span>
                            </label>
                        ))}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor={`cantidad-${insumo.id}`} className="block text-sm font-medium">
                            {tipo === 'ajuste' ? `¿Cuántos ${insumo.unidad}(s) hay físicamente?` : `Cantidad (${insumo.unidad}s)`}
                        </label>
                        <input id={`cantidad-${insumo.id}`} name="cantidad" inputMode="decimal" required autoFocus className={claseInput} />
                    </div>

                    {tipo === 'entrada' && (
                        <div className="space-y-1.5">
                            <label htmlFor={`costo-${insumo.id}`} className="block text-sm font-medium">Costo por {insumo.unidad} (opcional)</label>
                            <input id={`costo-${insumo.id}`} name="costo" inputMode="decimal" placeholder="0.00" className={claseInput} />
                        </div>
                    )}

                    <div className="space-y-1.5">
                        <label htmlFor={`nota-${insumo.id}`} className="block text-sm font-medium">Nota (opcional)</label>
                        <input
                            id={`nota-${insumo.id}`}
                            name="nota"
                            placeholder={tipo === 'entrada' ? 'Ej. Compra en mercado' : tipo === 'merma' ? 'Ej. Llegaron maltratadas' : ''}
                            className={claseInput}
                        />
                    </div>

                    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}

                    <div className="flex justify-end gap-2">
                        <Boton type="button" variante="secundario" onClick={() => dialogo.current?.close()}>Cancelar</Boton>
                        <Boton type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Registrar'}</Boton>
                    </div>
                </form>
            </dialog>
        </>
    )
}