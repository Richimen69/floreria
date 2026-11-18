'use client'

import { useState, useTransition } from 'react'
import {
  ESTADOS_PAGO,
  ESTADOS_TRABAJO,
  FLUJO_PAGO,
  FLUJO_TRABAJO,
  esRetroceso,
  pendienteDeReembolso,
  revisarCambio,
  revisarCancelacion,
  type EstadoPago,
  type EstadoTrabajo,
} from '@/lib/pedidos'
import { cambiarEstado, cancelarPedido, rechazarPago } from '@/server/acciones/pedidos-admin'

type Props = { pedidoId: number; estadoPago: EstadoPago; estadoTrabajo: EstadoTrabajo }

function Insignia({ clase, children }: { clase: string; children: React.ReactNode }) {
  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${clase}`}>{children}</span>
}

export function AccionesPedido({ pedidoId, estadoPago, estadoTrabajo }: Props) {
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null)
  const [guardando, iniciar] = useTransition()
  const actual = { estadoPago, estadoTrabajo }

  function ejecutar(accion: () => Promise<{ ok: boolean; mensaje: string }>) {
    iniciar(async () => {
      const r = await accion()
      setMensaje({ ok: r.ok, texto: r.mensaje })
    })
  }

  function cancelar() {
    const motivo = prompt('¿Por qué se cancela el pedido?')
    if (motivo === null) return
    ejecutar(() => cancelarPedido(pedidoId, motivo))
  }

  const impedimentoCancelar = revisarCancelacion(actual)

  return (
    <div className="space-y-5">
      {/* Trabajo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-texto">Trabajo</span>
          <Insignia clase={ESTADOS_TRABAJO[estadoTrabajo].clase}>{ESTADOS_TRABAJO[estadoTrabajo].texto}</Insignia>
        </div>
        <div className="flex flex-wrap gap-2">
          {FLUJO_TRABAJO[estadoTrabajo].map((destino) => {
            const motivo = revisarCambio(actual, 'trabajo', destino)
            const atras = esRetroceso(estadoTrabajo, destino)
            return (
              <button
                key={destino}
                type="button"
                disabled={guardando || motivo !== null}
                title={motivo ?? undefined}
                onClick={() => ejecutar(() => cambiarEstado(pedidoId, 'trabajo', destino))}
                className={`rounded-full px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${atras ? 'border border-borde text-texto-suave hover:text-texto' : 'bg-primario text-sobre-primario hover:bg-primario-oscuro'
                  }`}
              >
                {atras ? `← Regresar a ${ESTADOS_TRABAJO[destino].texto}` : `Marcar: ${ESTADOS_TRABAJO[destino].texto}`}
              </button>
            )
          })}
        </div>
        {FLUJO_TRABAJO[estadoTrabajo].some((d) => !esRetroceso(estadoTrabajo, d)) &&
          revisarCambio(actual, 'trabajo', FLUJO_TRABAJO[estadoTrabajo].find((d) => !esRetroceso(estadoTrabajo, d))!) && (
            <p className="text-xs text-amber-800">
              {revisarCambio(actual, 'trabajo', FLUJO_TRABAJO[estadoTrabajo].find((d) => !esRetroceso(estadoTrabajo, d))!)}
            </p>
          )}
      </div>

      {/* Pago */}
      <div className="space-y-2 border-t border-borde pt-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-texto">Pago</span>
          <Insignia clase={ESTADOS_PAGO[estadoPago].clase}>{ESTADOS_PAGO[estadoPago].texto}</Insignia>
        </div>
        {pendienteDeReembolso(actual) && (
          <p className="rounded-xl bg-amber-50 p-2 text-xs text-amber-900">Pedido cancelado con pago recibido: pendiente de reembolso.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {FLUJO_PAGO[estadoPago].map((destino) => {
            const motivo = revisarCambio(actual, 'pago', destino)
            return (
              <button
                key={destino}
                type="button"
                disabled={guardando || motivo !== null}
                title={motivo ?? undefined}
                onClick={() => {
                  if (destino === 'pagado' && !confirm('¿Ya verificaste en tu banco que el dinero llegó?')) return
                  if (destino === 'rechazado') {
                    const motivo = prompt('¿Por qué se rechaza el comprobante? El cliente verá este mensaje.')
                    if (motivo === null) return
                    return ejecutar(() => rechazarPago(pedidoId, motivo))
                  }
                  ejecutar(() => cambiarEstado(pedidoId, 'pago', destino))
                }}
                className="rounded-full border border-borde px-4 py-2 text-sm font-medium text-texto hover:border-primario disabled:cursor-not-allowed disabled:opacity-40"
              >
                {destino === 'pagado' ? 'Registrar pago' : destino === 'rechazado' ? 'Rechazar comprobante' : `Marcar: ${ESTADOS_PAGO[destino].texto}`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Cancelar */}
      {!impedimentoCancelar && (
        <div className="border-t border-borde pt-4">
          <button type="button" disabled={guardando} onClick={cancelar} className="text-sm font-medium text-red-700 hover:underline">
            Cancelar pedido
          </button>
        </div>
      )}

      {mensaje && (
        <p aria-live="polite" className={`text-sm ${mensaje.ok ? 'text-green-700' : 'text-red-700'}`}>{mensaje.texto}</p>
      )}
    </div>
  )
}