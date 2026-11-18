import { fechaLarga } from '@/lib/fechas'

type Props = {
  dias: number
  producto: string | null
  fechaMinima: string
  fechaElegida?: string | null
}

export function AvisoAnticipacion({ dias, producto, fechaMinima, fechaElegida }: Props) {
  if (dias <= 0) return null
  const fechaYaNoSirve = fechaElegida && fechaElegida < fechaMinima

  return (
    <div role="note" className="flex gap-3 rounded-xl border border-acento/30 bg-acento-suave p-4 text-sm text-texto">
      <div className="space-y-1">
        <p>
          {producto ? <strong>{producto}</strong> : 'Tu pedido'} se prepara con{' '}
          <strong>{dias} día{dias === 1 ? '' : 's'} de anticipación</strong>.
        </p>
        <p className="text-texto-suave">
          La entrega más próxima posible es el <span className="font-medium capitalize text-texto">{fechaLarga(fechaMinima)}</span>.
        </p>
        {fechaYaNoSirve && (
          <p className="font-medium text-red-700">La fecha que habías elegido ya no es posible; elige otra.</p>
        )}
      </div>
    </div>
  )
}