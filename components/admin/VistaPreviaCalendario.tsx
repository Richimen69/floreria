import { fechaLarga } from '@/lib/fechas'
import { proximosDias } from '@/server/calendario'

export async function VistaPreviaCalendario() {
  const dias = await proximosDias(14)

  return (
    <div className="divide-y divide-borde">
      {dias.map((d) => (
        <div key={d.fecha} className="flex flex-wrap items-center gap-3 px-6 py-3">
          <span className="w-44 shrink-0 text-sm font-medium capitalize text-texto">{fechaLarga(d.fecha)}</span>
          {d.bloques.length === 0 ? (
            <span className="text-sm text-texto-suave">{d.motivo}</span>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {d.bloques.map((b) => (
                <span
                  key={b.clave}
                  title={b.motivo ?? `Cupo: ${b.ocupados}/${b.capacidad}`}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    b.disponible ? 'bg-acento-suave text-acento' : 'bg-fondo text-texto-suave line-through'
                  }`}
                >
                  {b.inicio}–{b.fin}
                </span>
              ))}
            </div>
          )}
          {d.nota && <span className="text-xs text-texto-suave">· {d.nota}</span>}
        </div>
      ))}
    </div>
  )
}