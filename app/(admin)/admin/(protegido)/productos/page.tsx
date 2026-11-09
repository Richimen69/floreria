import Link from "next/link";
import { listarProductosAdmin } from "@/server/consultas/productos";
import { formatearPrecio } from "@/lib/utils";
import { fechaCorta } from "@/lib/fechas";
import { EncabezadoPagina } from "@/components/admin/EncabezadoPagina";

function Etiqueta({
  children,
  tono,
}: {
  children: React.ReactNode;
  tono: "acento" | "primario" | "neutro";
}) {
  const estilos = {
    acento: "bg-acento-suave text-acento",
    primario: "bg-primario-suave text-primario-oscuro",
    neutro: "bg-fondo text-texto-suave",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estilos[tono]}`}
    >
      {children}
    </span>
  );
}

export default async function ProductosPage() {
  const lista = await listarProductosAdmin();

  return (
    <div>
      <EncabezadoPagina
        titulo="Productos"
        descripcion={`${lista.length} producto(s) en el catálogo.`}
        acciones={
          <Link
            href="/admin/productos/nuevo"
            className="rounded-full bg-primario px-5 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro"
          >
            Nuevo producto
          </Link>
        }
      />

      {lista.length === 0 ? (
        <div className="rounded-tarjeta border-2 border-dashed border-borde p-12 text-center">
          <p className="font-titulos text-lg text-texto">
            Aún no hay productos
          </p>
          <p className="mt-1 text-sm text-texto-suave">
            Agrega el primero con su foto y precio.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-tarjeta border border-borde bg-superficie shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-borde bg-fondo text-left text-xs uppercase tracking-wider text-texto-suave">
              <tr>
                <th className="px-5 py-3 font-semibold">Producto</th>
                <th className="px-5 py-3 font-semibold">Categoría</th>
                <th className="px-5 py-3 font-semibold">Precio</th>
                <th className="px-5 py-3 font-semibold">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-borde">
              {lista.map((p) => (
                <tr key={p.id} className="hover:bg-fondo/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-primario-suave">
                        {p.imagenes[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.imagenes[0]}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <span className="font-medium text-texto">{p.nombre}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-texto-suave">
                    <div className="flex flex-wrap gap-1.5">
                      {!p.activo ? (
                        <Etiqueta tono="neutro">Oculto</Etiqueta>
                      ) : p.controlarExistencias && p.existencias <= 0 ? (
                        <Etiqueta tono="neutro">Sin existencias</Etiqueta>
                      ) : !p.disponible ? (
                        <Etiqueta tono="neutro">Agotado hoy</Etiqueta>
                      ) : (
                        <Etiqueta tono="acento">
                          {p.controlarExistencias
                            ? `${p.existencias} en existencia`
                            : "Disponible"}
                        </Etiqueta>
                      )}
                      {p.destacado && <Etiqueta tono="primario">Top</Etiqueta>}
                      {p.diasAnticipacion > 0 && (
                        <Etiqueta tono="neutro">
                          {p.diasAnticipacion} día(s)
                        </Etiqueta>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    {p.precioOfertaCentavos ? (
                      <div>
                        <span className="font-semibold text-primario">
                          {formatearPrecio(p.precioOfertaCentavos)}
                        </span>
                        <span className="ml-2 text-xs text-texto-suave line-through">
                          {formatearPrecio(p.precioCentavos)}
                        </span>
                        {p.ofertaHasta ? (
                          <p className="text-xs text-texto-suave">
                            {p.ofertaDesde
                              ? `Del ${fechaCorta(p.ofertaDesde)} al `
                              : "Vence el "}
                            {fechaCorta(p.ofertaHasta)}
                          </p>
                        ) : (
                          <p className="text-xs text-red-700">
                            Sin vencimiento: la oferta no está activa
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="font-medium text-texto">
                        {formatearPrecio(p.precioCentavos)}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {!p.activo ? (
                        <Etiqueta tono="neutro">Oculto</Etiqueta>
                      ) : !p.disponible ? (
                        <Etiqueta tono="neutro">Agotado</Etiqueta>
                      ) : (
                        <Etiqueta tono="acento">Disponible</Etiqueta>
                      )}
                      {p.destacado && <Etiqueta tono="primario">Top</Etiqueta>}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/admin/productos/${p.id}`}
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
