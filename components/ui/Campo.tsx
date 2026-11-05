export const claseInput =
  'w-full rounded-xl border border-borde bg-superficie px-3.5 py-2.5 text-sm text-texto outline-none transition focus:border-primario focus:ring-4 focus:ring-primario/15'

export function Etiqueta(props: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="block text-sm font-medium text-texto" {...props} />
}

export function Ayuda({ error, texto }: { error?: string; texto?: string }) {
  if (error) return <p className="text-xs text-red-700">{error}</p>
  if (texto) return <p className="text-xs text-texto-suave">{texto}</p>
  return null
}