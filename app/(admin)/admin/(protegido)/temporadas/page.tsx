import Link from "next/link";
import { listarTemporadas } from "@/server/consultas/temporadas";
import { fechaCorta } from "@/lib/fechas";
import { EncabezadoPagina } from "@/components/admin/EncabezadoPagina";

export default async function TemporadasPage() {
  const lista = await listarTemporadas();

  return (
    <div>
      <EncabezadoPagina
        titulo="Temporadas"
        descripcion={`${lista.length} temporada(s) en el catálogo.`}
        acciones={
          <Link
            href="/admin/temporadas/nueva"
            className="rounded-full bg-primario px-5 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro"
          >
            Nueva temporada
          </Link>
        }
      />
      {lista.length === 0 ? (
        <div className="rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
          <p className="font-titulos text-lg text-texto">
            Aún no hay temporadas
          </p>
          <p className="mt-1 text-sm text-texto-suave">
            Crea una para el 14 de febrero o el Día de las Madres.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
              <tr>
                <th className="px-5 py-3 font-semibold">Temporada</th>
                <th className="px-5 py-3 font-semibold">Fechas</th>
                <th className="px-5 py-3 font-semibold">Ajuste</th>
                <th className="px-5 py-3 font-semibold">Precios especiales</th>
                <th className="px-5 py-3 font-semibold">Reservas</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {lista.map((t) => (
                <tr key={t.id} className="hover:bg-fondo/60">
                  <td className="px-5 py-3 font-medium text-texto">
                    {t.nombre}
                  </td>
                  <td className="px-5 py-3 text-texto-suave">
                    {fechaCorta(t.fechaInicio)} – {fechaCorta(t.fechaFin)}{" "}
                    {t.fechaInicio.slice(0, 4)}
                  </td>
                  <td className="px-5 py-3 text-texto-suave">
                    {t.ajustePorcentaje === 0
                      ? "—"
                      : `${t.ajustePorcentaje > 0 ? "+" : ""}${t.ajustePorcentaje}%`}
                  </td>
                  <td className="px-5 py-3 text-texto-suave">
                    {t.totalPrecios}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${t.reservasAbiertas ? "bg-acento-suave text-acento" : "bg-fondo text-texto-suave"}`}
                    >
                      {t.reservasAbiertas ? "Abiertas" : "Cerradas"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/temporadas/${t.id}`}
                      className="font-medium text-primario hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
