import "server-only";
import { cacheTag } from "next/cache";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  productoCategorias,
  productoComplementos,
  productos,
} from "@/db/schema";

export async function listarProductosAdmin() {
  "use cache";
  cacheTag("productos", "categorias");

  return db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      imagenes: productos.imagenes,
      precioCentavos: productos.precioCentavos,
      precioOfertaCentavos: productos.precioOfertaCentavos,
      activo: productos.activo,
      disponible: productos.disponible,
      destacado: productos.destacado,
      ofertaDesde: productos.ofertaDesde,
      ofertaHasta: productos.ofertaHasta,
      controlarExistencias: productos.controlarExistencias,
      existencias: productos.existencias,
      diasAnticipacion: productos.diasAnticipacion,
      categorias: sql<string>`coalesce((
        SELECT string_agg(c.nombre, ', ' ORDER BY c.orden)
        FROM producto_categorias pc JOIN categorias c ON c.id = pc.categoria_id
        WHERE pc.producto_id = ${productos.id}
      ), '')`,
    })
    .from(productos)
    .orderBy(asc(productos.orden), asc(productos.nombre));
}

export async function obtenerProducto(id: number) {
  "use cache";
  cacheTag("productos");

  const [fila] = await db
    .select()
    .from(productos)
    .where(eq(productos.id, id))
    .limit(1);
  if (!fila) return null;

  const [cats, comps] = await Promise.all([
    db
      .select({ id: productoCategorias.categoriaId })
      .from(productoCategorias)
      .where(eq(productoCategorias.productoId, id)),
    db
      .select({ id: productoComplementos.complementoId })
      .from(productoComplementos)
      .where(eq(productoComplementos.productoId, id))
      .orderBy(asc(productoComplementos.orden)),
  ]);

  return {
    ...fila,
    categoriaIds: cats.map((c) => c.id),
    complementoIds: comps.map((c) => c.id),
  };
}

export type ProductoAdmin = NonNullable<
  Awaited<ReturnType<typeof obtenerProducto>>
>;

// Lista ligera para el selector de complementos
export async function listarOpcionesComplemento() {
  "use cache";
  cacheTag("productos");

  const filas = await db
    .select({
      id: productos.id,
      nombre: productos.nombre,
      imagenes: productos.imagenes,
      precioCentavos: productos.precioCentavos,
    })
    .from(productos)
    .where(eq(productos.activo, true))
    .orderBy(asc(productos.nombre));

  return filas.map(({ imagenes, ...resto }) => ({
    ...resto,
    imagen: imagenes[0] ?? null,
  }));
}
