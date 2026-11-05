import 'server-only'
import { cacheTag } from 'next/cache'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { categorias, productos } from '@/db/schema'

const camposProducto = {
  id: productos.id,
  nombre: productos.nombre,
  slug: productos.slug,
  descripcion: productos.descripcion,
  imagenes: productos.imagenes,
  precioCentavos: productos.precioCentavos,
  precioOfertaCentavos: productos.precioOfertaCentavos,
  disponible: productos.disponible,
  categoriaId: productos.categoriaId,
}

export type ProductoPublico = Awaited<ReturnType<typeof listarDestacados>>[number]

export async function listarDestacados() {
  'use cache'
  cacheTag('productos', 'categorias')

  return db
    .select(camposProducto)
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .where(and(eq(productos.activo, true), eq(productos.destacado, true), eq(categorias.activa, true)))
    .orderBy(asc(productos.orden), asc(productos.nombre))
    .limit(8)
}

export async function obtenerCatalogo() {
  'use cache'
  cacheTag('productos', 'categorias')

  const [listaCategorias, listaProductos] = await Promise.all([
    db.select().from(categorias).where(eq(categorias.activa, true)).orderBy(asc(categorias.orden), asc(categorias.nombre)),
    db.select(camposProducto).from(productos).where(eq(productos.activo, true)).orderBy(asc(productos.orden), asc(productos.nombre)),
  ])

  // Agrupa los productos dentro de su categoría y omite categorías vacías
  return listaCategorias
    .map((categoria) => ({
      ...categoria,
      productos: listaProductos.filter((p) => p.categoriaId === categoria.id),
    }))
    .filter((categoria) => categoria.productos.length > 0)
}