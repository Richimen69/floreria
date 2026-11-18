import Link from 'next/link'
import { fechaLarga } from '@/lib/fechas'
import type { PedidoAfectado } from '@/lib/calendario'

export function AvisoPedidosAfectados({ afectados }: { afectados: PedidoAfectado[] }) {
  return (
    <div role="alert" className="space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Hay pedidos registrados que quedarían fuera de la nueva configuración:</p>

      <ul className="space-y-3">
        {afectados.map((a) => (
          <li key={`${a.fecha}-${a.bloque}`}>
            <p>
              <span className="font-medium capitalize">{fechaLarga(a.fecha)}, {a.bloque}</span> · {a.motivo}
            </p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {a.pedidos.map((p) => (
                <Link
                  key={p.id}
                  href={`/admin/pedidos/${p.id}`}
                  target="_blank"
                  className="rounded-full bg-white px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-900 ring-1 ring-amber-300 hover:ring-amber-500"
                >
                  {p.folio}
                </Link>
              ))}
            </div>
          </li>
        ))}
      </ul>

      <p>
        Los pedidos <strong>no se moverán ni se borrarán</strong>: conservan su fecha y horario. Si hay que reprogramar, contacta a esos clientes.
      </p>

      <label className="flex cursor-pointer items-start gap-2 font-medium">
        <input type="checkbox" name="confirmarAfectados" required className="mt-0.5 h-4 w-4 accent-primario" />
        Entiendo, guardar de todos modos
      </label>
    </div>
  )
}