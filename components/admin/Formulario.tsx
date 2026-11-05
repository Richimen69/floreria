import { Ayuda, Etiqueta, claseInput } from '@/components/ui/Campo'

export function Seccion({ titulo, descripcion, children }: {
  titulo: string
  descripcion: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-tarjeta border border-borde bg-superficie shadow-sm">
      <header className="border-b border-borde px-6 py-4">
        <h2 className="font-titulos text-lg font-semibold text-texto">{titulo}</h2>
        <p className="text-sm text-texto-suave">{descripcion}</p>
      </header>
      <div className="grid gap-5 p-6 md:grid-cols-2">{children}</div>
    </section>
  )
}

export function Campo({ nombre, etiqueta, valor, error, ayuda, placeholder, tipo = 'text', multilinea = false, ancho = false }: {
  nombre: string
  etiqueta: string
  valor: string | null
  error?: string
  ayuda?: string
  placeholder?: string
  tipo?: string
  multilinea?: boolean
  ancho?: boolean
}) {
  return (
    <div className={`space-y-1.5 ${ancho ? 'md:col-span-2' : ''}`}>
      <Etiqueta htmlFor={nombre}>{etiqueta}</Etiqueta>
      {multilinea ? (
        <textarea id={nombre} name={nombre} defaultValue={valor ?? ''} placeholder={placeholder} rows={4} className={`${claseInput} resize-y`} />
      ) : (
        <input id={nombre} name={nombre} type={tipo} defaultValue={valor ?? ''} placeholder={placeholder} className={claseInput} />
      )}
      <Ayuda error={error} texto={ayuda} />
    </div>
  )
}