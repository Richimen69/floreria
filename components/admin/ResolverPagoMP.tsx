'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { resolverPagoMercadoPago } from '@/server/acciones/pedidos-admin'

export function ResolverPagoMP({ id }: { id: number }) {
  const router = useRouter()
  const [nota, setNota] = useState('')
  const [mensaje, setMensaje] = useState<string | null>(null)
  const [guardando, iniciar] = useTransition()

  function resolver() {
    iniciar(async () => {
      const r = await resolverPagoMercadoPago(id, nota)
      setMensaje(r.mensaje)
      if (r.ok) router.refresh()
    })
  }

  return (
    <div className="space-y-2">
      <input
        value={nota}
        onChange={(e) => setNota(e.target.value)}
        placeholder="¿Qué se hizo? Ej.: Reembolsado desde Mercado Pago"
        className="w-full rounded-xl border border-red-200 bg-white px-3 py-2 text-base outline-none focus:border-red-400 sm:text-sm"
      />
      <button
        type="button"
        onClick={resolver}
        disabled={guardando}
        className="rounded-full bg-red-700 px-4 py-2 text-xs font-semibold text-white hover:bg-red-800 disabled:opacity-60"
      >
        {guardando ? 'Guardando…' : 'Marcar como resuelto'}
      </button>
      {mensaje && <p className="text-xs text-red-900">{mensaje}</p>}
    </div>
  )
}