const PASOS = ['Entrega', 'Dedicatoria', 'Finalizar'] as const

type Props = { actual: 1 | 2 | 3; onIr: (paso: 1 | 2 | 3) => void }

export function PasosCheckout({ actual, onIr }: Props) {
  return (
    <ol className="flex items-center justify-center gap-2 sm:gap-4">
      {PASOS.map((nombre, i) => {
        const numero = (i + 1) as 1 | 2 | 3
        const hecho = numero < actual
        const activo = numero === actual

        return (
          <li key={nombre} className="flex items-center gap-2 sm:gap-4">
            <button
              type="button"
              disabled={!hecho}
              onClick={() => onIr(numero)}
              aria-current={activo ? 'step' : undefined}
              className="flex items-center gap-2 disabled:cursor-default"
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${
                  hecho
                    ? 'border-primario bg-primario text-sobre-primario'
                    : activo
                      ? 'border-primario text-primario'
                      : 'border-borde text-texto-suave'
                }`}
              >
                {hecho ? '✓' : numero}
              </span>
              <span className={`text-sm ${activo ? 'font-semibold text-texto' : 'hidden text-texto-suave sm:inline'}`}>{nombre}</span>
            </button>
            {numero < 3 && <span className="h-px w-6 bg-borde sm:w-12" aria-hidden />}
          </li>
        )
      })}
    </ol>
  )
}