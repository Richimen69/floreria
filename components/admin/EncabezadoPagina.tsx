import Link from 'next/link'

type Props = {
  titulo: string
  descripcion?: React.ReactNode
  volver?: { href: string; texto: string }
  acciones?: React.ReactNode
}

export function EncabezadoPagina({ titulo, descripcion, volver, acciones }: Props) {
  return (
    <div className="sticky top-14 z-20 -mx-4 mb-6 flex flex-col gap-3 border-b border-borde bg-fondo/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:top-0 lg:-mx-8 lg:mb-8 lg:px-8 lg:py-4">
      <div className="min-w-0">
        {volver && (
          <Link href={volver.href} className="text-sm text-texto-suave hover:text-primario">
            ← {volver.texto}
          </Link>
        )}
        <h1 className="truncate font-titulos text-xl font-semibold text-texto sm:text-2xl">{titulo}</h1>
        {descripcion && <div className="text-sm text-texto-suave">{descripcion}</div>}
      </div>
      {acciones && <div className="flex shrink-0 flex-wrap gap-2">{acciones}</div>}
    </div>
  )
}