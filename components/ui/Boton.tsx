type Variante = 'primario' | 'secundario' | 'peligro'

const estilos: Record<Variante, string> = {
  primario: 'bg-primario text-sobre-primario hover:bg-primario-oscuro',
  secundario: 'border border-borde bg-superficie text-texto hover:bg-fondo',
  peligro: 'text-red-700 hover:bg-red-50',
}

export function Boton({
  variante = 'primario',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante }) {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold transition-colors disabled:opacity-60 ${estilos[variante]} ${className}`}
      {...props}
    />
  )
}