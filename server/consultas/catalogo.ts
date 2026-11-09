import "server-only";
import { and, asc, eq, sql, inArray, desc, notInArray, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  categorias,
  productoCategorias,
  productoComplementos,
  productos,
} from "@/db/schema";
import { cacheLife, cacheTag } from "next/cache";
import { hoyEnAcapulco } from "@/lib/fechas";
import { temporadaParaFecha } from "@/server/consultas/temporadas";
import { calcularPrecio, type ReglasTemporada } from "@/lib/precios";

const camposProducto = {
  id: productos.id,
  nombre: productos.nombre,
  slug: productos.slug,
  descripcion: productos.descripcion,
  imagenes: productos.imagenes,
  precioCentavos: productos.precioCentavos,
  precioOfertaCentavos: productos.precioOfertaCentavos,
  disponible: productos.disponible,
  diasAnticipacion: productos.diasAnticipacion,
  controlarExistencias: productos.controlarExistencias,
  existencias: productos.existencias,
  ofertaDesde: productos.ofertaDesde,
  ofertaHasta: productos.ofertaHasta,
};

// Un producto se muestra solo si está en al menos una categoría visible
const enCategoriaVisible = sql<boolean>`EXISTS (
  SELECT 1 FROM producto_categorias pc
  JOIN categorias c ON c.id = pc.categoria_id
  WHERE pc.producto_id = ${productos.id} AND c.activa
)`;

type ConExistencias = {
  disponible: boolean;
  controlarExistencias: boolean;
  existencias: number;
};

type Enriquecible = ConExistencias & {
  precioCentavos: number;
  precioOfertaCentavos: number | null;
  ofertaDesde: string | null;
  ofertaHasta: string | null;
};

function conDisponibilidad<T extends Enriquecible & { id: number }>(
  p: T,
  hoy: string,
  temporada: ReglasTemporada | null,
) {
  const sinExistencias = p.controlarExistencias && p.existencias <= 0;
  const {
    precioCentavos: precioActualCentavos,
    enOferta,
    deTemporada,
  } = calcularPrecio(p, hoy, hoy, temporada);
  return {
    ...p,
    sinExistencias,
    sePuedePedir: p.disponible && !sinExistencias,
    precioActualCentavos,
    enOferta,
    deTemporada,
  };
}
export async function listarDestacados() {
  "use cache";
  cacheTag("productos", "categorias", "temporadas");
  cacheLife("hours");
  const hoy = hoyEnAcapulco();
  const temporada = await temporadaParaFecha(hoy);

  const filas = await db
    .select(camposProducto)
    .from(productos)
    .where(
      and(
        eq(productos.activo, true),
        eq(productos.destacado, true),
        enCategoriaVisible,
      ),
    )
    .orderBy(asc(productos.orden), asc(productos.nombre))
    .limit(8);

  return filas.map((p) => conDisponibilidad(p, hoy, temporada));
}

export type ProductoPublico = Awaited<
  ReturnType<typeof listarDestacados>
>[number];

export async function obtenerCatalogo() {
  "use cache";
  cacheTag("productos", "categorias", "temporadas");
  cacheLife("hours");
  const hoy = hoyEnAcapulco();
  const temporada = await temporadaParaFecha(hoy);

  const [listaCategorias, listaProductos, enlaces] = await Promise.all([
    db
      .select()
      .from(categorias)
      .where(eq(categorias.activa, true))
      .orderBy(asc(categorias.orden), asc(categorias.nombre)),
    db
      .select(camposProducto)
      .from(productos)
      .where(eq(productos.activo, true))
      .orderBy(asc(productos.orden), asc(productos.nombre)),
    db.select().from(productoCategorias),
  ]);

  const productosListos = listaProductos.map((p) =>
    conDisponibilidad(p, hoy, temporada),
  );

  return listaCategorias
    .map((categoria) => {
      const ids = new Set(
        enlaces
          .filter((e) => e.categoriaId === categoria.id)
          .map((e) => e.productoId),
      );
      return {
        ...categoria,
        productos: productosListos.filter((p) => ids.has(p.id)),
      };
    })
    .filter((categoria) => categoria.productos.length > 0);
}

export async function obtenerProductoPorSlug(slug: string) {
  "use cache";
  cacheTag("productos", "categorias", "temporadas");
  cacheLife("hours");
  const hoy = hoyEnAcapulco();
  const temporada = await temporadaParaFecha(hoy);

  const [fila] = await db
    .select(camposProducto)
    .from(productos)
    .where(
      and(
        eq(productos.slug, slug),
        eq(productos.activo, true),
        enCategoriaVisible,
      ),
    )
    .limit(1);
  if (!fila) return null;

  const [cats, complementos] = await Promise.all([
    db
      .select({ nombre: categorias.nombre, slug: categorias.slug })
      .from(productoCategorias)
      .innerJoin(categorias, eq(productoCategorias.categoriaId, categorias.id))
      .where(
        and(
          eq(productoCategorias.productoId, fila.id),
          eq(categorias.activa, true),
        ),
      )
      .orderBy(asc(categorias.orden)),
    db
      .select(camposProducto)
      .from(productoComplementos)
      .innerJoin(
        productos,
        eq(productoComplementos.complementoId, productos.id),
      )
      .where(
        and(
          eq(productoComplementos.productoId, fila.id),
          eq(productos.activo, true),
        ),
      )
      .orderBy(asc(productoComplementos.orden)),
  ]);

  return {
    ...conDisponibilidad(fila, hoy, temporada),
    categorias: cats,
    complementos: complementos.map((p) => conDisponibilidad(p, hoy, temporada)),
  };
}
// Productos del carrito (sin precio: el precio depende de la fecha elegida)
export async function obtenerProductosPorIds(ids: number[]) {
  "use cache";
  cacheTag("productos", "categorias");
  if (ids.length === 0) return [];

  return db
    .select(camposProducto)
    .from(productos)
    .where(
      and(
        inArray(productos.id, ids),
        eq(productos.activo, true),
        enCategoriaVisible,
      ),
    );
}

// Complementos sugeridos de los productos del carrito, sin repetir
export async function complementosDe(ids: number[]) {
  "use cache";
  cacheTag("productos", "categorias");
  if (ids.length === 0) return [];

  const filas = await db
    .select(camposProducto)
    .from(productoComplementos)
    .innerJoin(productos, eq(productoComplementos.complementoId, productos.id))
    .where(
      and(
        inArray(productoComplementos.productoId, ids),
        eq(productos.activo, true),
        enCategoriaVisible,
      ),
    )
    .orderBy(asc(productoComplementos.orden));

  const vistos = new Set<number>();
  return filas.filter((f) => {
    if (vistos.has(f.id)) return false;
    vistos.add(f.id);
    return true;
  });
}

export async function productosRecomendados(productoId: number, limite = 4) {
  "use cache";
  cacheTag("productos", "categorias", "temporadas");
  cacheLife("hours");

  const hoy = hoyEnAcapulco();
  const temporada = await temporadaParaFecha(hoy);

  // Comparte al menos una categoría con el producto
  const mismaCategoria = sql<boolean>`EXISTS (
    SELECT 1 FROM producto_categorias a
    JOIN producto_categorias b ON a.categoria_id = b.categoria_id
    WHERE a.producto_id = ${productos.id} AND b.producto_id = ${productoId}
  )`;

  // No es uno de sus complementos (esos ya se muestran aparte)
  const noEsComplemento = sql<boolean>`NOT EXISTS (
    SELECT 1 FROM producto_complementos pc
    WHERE pc.producto_id = ${productoId} AND pc.complemento_id = ${productos.id}
  )`;

  const base = and(
    eq(productos.activo, true),
    enCategoriaVisible,
    ne(productos.id, productoId),
    noEsComplemento,
  );

  const similares = await db
    .select(camposProducto)
    .from(productos)
    .where(and(base, mismaCategoria))
    .orderBy(
      desc(productos.disponible),
      desc(productos.destacado),
      asc(productos.orden),
      asc(productos.nombre),
    )
    .limit(limite);

  // Si faltan, se completa con los Productos Top
  let resultado = similares;
  if (similares.length < limite) {
    const yaIncluidos = similares.map((p) => p.id);
    const relleno = await db
      .select(camposProducto)
      .from(productos)
      .where(
        and(
          base,
          eq(productos.destacado, true),
          yaIncluidos.length > 0
            ? notInArray(productos.id, yaIncluidos)
            : undefined,
        ),
      )
      .orderBy(desc(productos.disponible), asc(productos.orden))
      .limit(limite - similares.length);
    resultado = [...similares, ...relleno];
  }

  return resultado.map((p) => conDisponibilidad(p, hoy, temporada));
}
