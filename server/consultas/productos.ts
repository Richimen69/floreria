import 'server-only'
import { cacheTag } from 'next/cache'
import { asc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { categorias, productos } from '@/db/schema'

export async function listarProductosAdmin() {
  'use cache'
  cacheTag('productos', 'categorias')

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
      categoria: categorias.nombre,
    })
    .from(productos)
    .innerJoin(categorias, eq(productos.categoriaId, categorias.id))
    .orderBy(asc(categorias.orden), asc(productos.orden), asc(productos.nombre))
}

export async function obtenerProducto(id: number) {
  'use cache'
  cacheTag('productos')
  const [fila] = await db.select().from(productos).where(eq(productos.id, id)).limit(1)
  return fila ?? null
}