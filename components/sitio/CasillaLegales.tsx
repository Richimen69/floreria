import Link from 'next/link'

type Props = {
  legales: { slug: string; titulo: string }[]
  error?: string
  nombre?: string
}

export function CasillaLegales({ legales, error, nombre = 'aceptaLegales' }: Props) {
  if (legales.length === 0) return null

  // "A, B y C"
  const enlaces = legales.map((l, i) => (
    <span key={l.slug}>
      {i > 0 && (i === legales.length - 1 ? ' y ' : ', ')}
      <Link href={`/${l.slug}`} target="_blank" className="font-medium text-primario underline">
        {l.titulo.toLowerCase()}
      </Link>
    </span>
  ))

  return (
    <div className="space-y-1">
      <label className="flex cursor-pointer items-start gap-3 text-sm text-texto">
        <input type="checkbox" name={nombre} required className="mt-0.5 h-4 w-4 shrink-0 accent-primario" />
        <span>He leído y acepto {enlaces}.</span>
      </label>
      {error && <p className="text-xs text-red-700">{error}</p>}
    </div>
  )
}