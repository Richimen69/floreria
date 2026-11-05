import { esOscuro, textoSobre } from '@/lib/colores'
import type { AjustesSitio } from '@/db/schema'

export type Vista = Pick<
  AjustesSitio,
  | 'nombre' | 'eslogan' | 'logoUrl'
  | 'colorPrimario' | 'colorAcento' | 'colorFondo'
  | 'tituloPortada' | 'textoPortada' | 'imagenPortadaUrl'
>

export function VistaPrevia({ v }: { v: Vista }) {
  // Las mismas variables que usa el sitio, aplicadas solo a este recuadro
  const estilo = {
    '--marca': v.colorPrimario,
    '--acento': v.colorAcento,
    '--fondo': v.colorFondo,
    '--texto-sobre-marca': textoSobre(v.colorPrimario),
    '--texto-sobre-acento': textoSobre(v.colorAcento),
    '--texto': esOscuro(v.colorFondo) ? '#f5efe9' : '#2b2420',
  } as React.CSSProperties

  return (
    <div className="space-y-2 xl:sticky xl:top-24">
      <p className="text-xs font-semibold uppercase tracking-wider text-texto-suave">Vista previa</p>

      <div style={estilo} className="overflow-hidden rounded-tarjeta border border-borde bg-fondo text-texto shadow-sm">
        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-borde px-4 py-3">
          <div className="flex items-center gap-2">
            {v.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.logoUrl} alt="" className="h-7 w-auto" />
            ) : (
              <span className="font-titulos text-base font-semibold">{v.nombre || 'Tu florería'}</span>
            )}
          </div>
          <div className="flex gap-3 text-xs text-texto-suave">
            <span className="font-medium text-primario">Inicio</span>
            <span>Catálogo</span>
          </div>
        </div>

        {/* Portada */}
        <div className="relative">
          {v.imagenPortadaUrl && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={v.imagenPortadaUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/10" />
            </>
          )}
          <div className={`relative space-y-2 px-5 py-8 ${v.imagenPortadaUrl ? 'text-white' : ''}`}>
            {v.eslogan && (
              <p className={`text-[11px] font-semibold uppercase tracking-wider ${v.imagenPortadaUrl ? 'text-white/80' : 'text-acento'}`}>
                {v.eslogan}
              </p>
            )}
            <h3 className="font-titulos text-xl leading-tight font-semibold">
              {v.tituloPortada || 'Flores frescas para cada momento'}
            </h3>
            <p className={`line-clamp-3 text-xs ${v.imagenPortadaUrl ? 'text-white/85' : 'text-texto-suave'}`}>
              {v.textoPortada || 'Aquí aparecerá el texto de presentación de la portada.'}
            </p>
            <div className="flex gap-2 pt-2">
              <span className="rounded-full bg-primario px-3 py-1.5 text-xs font-semibold text-sobre-primario">
                Ver catálogo
              </span>
              <span className="rounded-full bg-acento px-3 py-1.5 text-xs font-semibold text-sobre-acento">
                WhatsApp
              </span>
            </div>
          </div>
        </div>

        {/* Producto de ejemplo */}
        <div className="grid grid-cols-2 gap-3 p-4">
          {['Ramo de rosas', 'Arreglo de girasoles'].map((nombre, i) => (
            <div key={nombre} className="overflow-hidden rounded-xl border border-borde bg-superficie">
              <div className="aspect-square bg-primario-suave" />
              <div className="space-y-1 p-2">
                {i === 0 && (
                  <span className="inline-block rounded-full bg-acento-suave px-2 py-0.5 text-[10px] font-semibold text-acento">
                    Top
                  </span>
                )}
                <p className="text-xs font-medium">{nombre}</p>
                <p className="text-xs font-semibold text-primario">$650</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}