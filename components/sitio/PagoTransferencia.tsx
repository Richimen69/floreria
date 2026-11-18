'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { formatearPrecio } from '@/lib/utils'
import { subirComprobante } from '@/server/acciones/comprobantes'

function Copiar({ valor }: { valor: string }) {
  const [copiado, setCopiado] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(valor)
        setCopiado(true)
        setTimeout(() => setCopiado(false), 1500)
      }}
      className="shrink-0 rounded-full border border-borde px-3 py-1 text-xs font-medium text-texto hover:border-primario"
    >
      {copiado ? '✓ Copiado' : 'Copiar'}
    </button>
  )
}

function Fila({ etiqueta, valor, copiar }: { etiqueta: string; valor: string; copiar?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-xs text-texto-suave">{etiqueta}</p>
        <p className="truncate font-medium text-texto">{valor}</p>
      </div>
      {copiar && <Copiar valor={copiar} />}
    </div>
  )
}

const dos = (n: number) => String(n).padStart(2, '0')

type Props = {
  token: string
  folio: string
  totalCentavos: number
  venceEn: string
  banco: string
  titular: string
  clabe: string
}

export function PagoTransferencia({ token, folio, totalCentavos, venceEn, banco, titular, clabe }: Props) {
  const router = useRouter()
  const [ahora, setAhora] = useState<number | null>(null) // null en el servidor y en el primer render
  const [error, setError] = useState<string | null>(null)
  const [subiendo, iniciar] = useTransition()

  // La hora solo se lee en el navegador, después de hidratar
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

  // Al vencer, se recarga la página para mostrar que el plazo terminó
  useEffect(() => {
    if (vencido) router.refresh()
  }, [vencido, router])

  const total = restante === null ? null : Math.max(0, Math.floor(restante / 1000))
  const tiempo =
    total === null ? '–:––:––' : `${Math.floor(total / 3600)}:${dos(Math.floor((total % 3600) / 60))}:${dos(total % 60)}`
  const horaLimite = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Mexico_City',
  }).format(new Date(venceEn))
  const urgente = restante !== null && restante < 15 * 60_000

  function enviar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const datos = new FormData(e.currentTarget)
    setError(null)
    iniciar(async () => {
      const r = await subirComprobante(token, datos)
      if (r.ok) router.refresh()
      else setError(r.mensaje)
    })
  }

  return (
    <section className="space-y-4 rounded-tarjeta border-2 border-primario/30 bg-superficie p-5">
      <div className={`rounded-xl p-3 text-center ${urgente ? 'bg-red-50 text-red-800' : 'bg-primario-suave text-primario-oscuro'}`}>
        <p className="font-mono text-3xl font-semibold tabular-nums">{tiempo}</p>
        <p className="text-sm">para transferir y subir tu comprobante (hasta las {horaLimite})</p>
      </div>

      <div>
        <h2 className="font-titulos text-lg font-semibold text-texto">Datos para tu transferencia</h2>
        <div className="divide-y divide-borde">
          <Fila etiqueta="Banco" valor={banco} />
          <Fila etiqueta="Titular" valor={titular} copiar={titular} />
          <Fila etiqueta="CLABE" valor={clabe.replace(/(\d{3})(\d{3})(\d{11})(\d)/, '$1 $2 $3 $4')} copiar={clabe} />
          <Fila etiqueta="Monto exacto" valor={formatearPrecio(totalCentavos)} copiar={(totalCentavos / 100).toFixed(2)} />
          <Fila etiqueta="Concepto" valor={folio} copiar={folio} />
        </div>
        <p className="mt-2 text-xs text-texto-suave">Escribe el folio como concepto para que identifiquemos tu pago.</p>
      </div>

      <form onSubmit={enviar} className="space-y-3 border-t border-borde pt-4">
        <label htmlFor="comprobante" className="block text-sm font-medium text-texto">Sube tu comprobante</label>
        <input
          id="comprobante"
          name="comprobante"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required
          className="block w-full text-sm text-texto-suave file:mr-3 file:rounded-full file:border-0 file:bg-primario-suave file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primario-oscuro"
        />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <button
          type="submit"
          disabled={subiendo}
          className="w-full rounded-full bg-primario px-6 py-3 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro disabled:opacity-60"
        >
          {subiendo ? 'Subiendo…' : 'Enviar comprobante'}
        </button>
      </form>
    </section>
  )
}