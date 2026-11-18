'use client'

export function BotonImprimir() {
  return (
    <button type="button" onClick={() => window.print()} className="rounded-full bg-primario px-4 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">
      Imprimir / PDF
    </button>
  )
}