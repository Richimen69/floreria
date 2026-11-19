'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { formatearPrecio } from '@/lib/utils'
import { enlacePagoMercadoPago } from '@/server/acciones/pagos'

const dos = (n: number) => String(n).padStart(2, '0')

type Props = { token: string; totalCentavos: number; venceEn: string }

export function PagoMercadoPago({ token, totalCentavos, venceEn }: Props) {
  const router = useRouter()
  const [ahora, setAhora] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, iniciar] = useTransition()

  useEffect(() => {
    const tic = () => setAhora(Date.now())
    const primero = setTimeout(tic, 0)
    const intervalo = setInterval(tic, 1000)
    return () => {
      clearTimeout(primero)
      clearInterval(intervalo)
    }
  }, [])

  const restante = ahora === null ? null : Date.parse(venceEn) - ahora
  const vencido = restante !== null && restante <= 0

  useEffect(() => {
    if (vencido) router.refresh()
  }, [vencido, router])

  const total = restante === null ? null : Math.max(0, Math.floor(restante / 1000))
  const tiempo = total === null ? '–:––:––' : `${Math.floor(total / 3600)}:${dos(Math.floor((total % 3600) / 60))}:${dos(total % 60)}`
  const urgente = restante !== null && restante < 15 * 60_000

  function pagar() {
    setError(null)
    iniciar(async () => {
      const r = await enlacePagoMercadoPago(token)
      if (r.ok) window.location.assign(r.url)
      else setError(r.mensaje)
    })
  }

  return (
    <section className="space-y-4 rounded-tarjeta border-2 border-primario/30 bg-superficie p-5 text-center">
      <div className={`rounded-xl p-3 ${urgente ? 'bg-red-50 text-red-800' : 'bg-primario-suave text-primario-oscuro'}`}>
        <p className="font-mono text-3xl font-semibold tabular-nums">{tiempo}</p>
        <p className="text-sm">para completar tu pago</p>
      </div>
      <p className="text-sm text-texto-suave">Total a pagar: <strong className="text-texto">{formatearPrecio(totalCentavos)}</strong></p>
      <button
        type="button"
        onClick={pagar}
        disabled={cargando}
        className="w-full rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro disabled:opacity-60"
      >
        {cargando ? 'Abriendo Mercado Pago…' : 'Pagar con Mercado Pago'}
      </button>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    </section>
  )
}