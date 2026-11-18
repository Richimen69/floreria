import "server-only";
import { cacheTag } from "next/cache";
import { and, asc, count, eq, ilike, isNotNull, lte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  productoCategorias,
  productoComplementos,
  productos,
  categorias
} from "@/db/schema";

import type { EstadoProducto } from '@/lib/filtros-productos'

type FiltrosProductos = {
  q: string
  categoriaId: number | null
  estado: EstadoProducto
  pagina: number
  porPagina: number
}

export async function listarProductosAdmin({ q, categoriaId, estado, pagina, porPagina }: FiltrosProductos) {
  'use cache'
  cacheTag('productos', 'categorias')

  const condiciones = []

  if (q) {
    // Escapa los comodines de LIKE que alguien pudiera escribir
    condiciones.push(ilike(productos.nombre, `%${q.replace(/[%_\\]/g, '\\$&')}%`))
  }
  if (categoriaId) {
    condiciones.push(sql`EXISTS (
      SELECT 1 FROM producto_categorias pc
      WHERE pc.producto_id = ${productos.id} AND pc.categoria_id = ${categoriaId}
    )`)
  }

  switch (estado) {
    case 'visibles': condiciones.push(eq(productos.activo, true)); break
    case 'ocultos': condiciones.push(eq(productos.activo, false)); break
    case 'agotados': condiciones.push(eq(productos.disponible, false)); break
    case 'sin-existencias':
      condiciones.push(and(eq(productos.controlarExistencias, true), lte(productos.existencias, 0)))
      break
    case 'top': condiciones.push(eq(productos.destacado, true)); break
    case 'oferta': condiciones.push(isNotNull(productos.precioOfertaCentavos)); break
  }

  const filtro = condiciones.length > 0 ? and(...condiciones) : undefined

  // Con categoría elegida, se ordena por la posición dentro de ella
  const orden = categoriaId
    ? [
      sql`(SELECT pc.orden FROM producto_categorias pc WHERE pc.producto_id = ${productos.id} AND pc.categoria_id = ${categoriaId})`,
      asc(productos.nombre),
    ]
    : [asc(productos.nombre)]

  const [filas, [{ total }]] = await Promise.all([
    db
      .select({
        id: productos.id,
        nombre: productos.nombre,
        imagenes: productos.imagenes,
        precioCentavos: productos.precioCentavos,
        precioOfertaCentavos: productos.precioOfertaCentavos,
        ofertaDesde: productos.ofertaDesde,
        ofertaHasta: productos.ofertaHasta,
        activo: productos.activo,
        disponible: productos.disponible,
        destacado: productos.destacado,
        controlarExistencias: productos.controlarExistencias,
        existencias: productos.existencias,
        diasAnticipacion: productos.diasAnticipacion,
        categorias: sql<string>`coalesce((
  SELECT string_agg(c.nombre, ', ' ORDER BY c.orden)
  FROM producto_categorias pc JOIN categorias c ON c.id = pc.categoria_id
  WHERE pc.producto_id = productos.id
), '')`,
      })
      .from(productos)
      .where(filtro)
      .orderBy(...orden)
      .limit(porPagina)
      .offset((pagina - 1) * porPagina),
    db.select({ total: count() }).from(productos).where(filtro),
  ])

  return { filas, total }
}

export type FilaProductoAdmin = Awaited<ReturnType<typeof listarProductosAdmin>>['filas'][number]

export async function contarProductosPorCategoria() {
  'use cache'
  cacheTag('productos', 'categorias')

  return db
    .select({
      id: categorias.id,
      nombre: categorias.nombre,
      total: sql<number>`(SELECT count(*)::int FROM producto_categorias pc WHERE pc.categoria_id = categorias.id)`,
    })
    .from(categorias)
    .orderBy(asc(categorias.orden), asc(categorias.nombre))
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
