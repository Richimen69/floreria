'use server'

import { and, eq, ne, sql } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { productoCategorias, productoComplementos, productos } from '@/db/schema'
import { requireAdmin } from '@/lib/permisos'
import { esquemaProducto, leerFormProducto } from '@/lib/validaciones/producto'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

export async function guardarProducto(
  id: number | null,
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin()

  const resultado = esquemaProducto.safeParse(leerFormProducto(formData))
  if (!resultado.success) {
    return {
      ok: false,
      mensaje: 'Revisa los campos marcados',
      errores: z.flattenError(resultado.error).fieldErrors,
    }
  }

  const { producto, categoriaIds, complementoIds } = resultado.data

  const condicion = id
    ? and(eq(productos.slug, producto.slug), ne(productos.id, id))
    : eq(productos.slug, producto.slug)
  const [duplicado] = await db.select({ id: productos.id }).from(productos).where(condicion).limit(1)
  if (duplicado) {
    return {
      ok: false,
      mensaje: 'Revisa los campos marcados',
      errores: { slug: ['Ya existe un producto con este identificador'] },
    }
  }

  // Todo o nada: el producto y sus relaciones se guardan juntos
  await db.transaction(async (tx) => {
    let productoId: number

    if (id) {
      await tx.update(productos).set(producto).where(eq(productos.id, id))
      productoId = id
    } else {
      const [nuevo] = await tx.insert(productos).values(producto).returning({ id: productos.id })
      productoId = nuevo.id
    }

    const existentes = await tx
      .select({ categoriaId: productoCategorias.categoriaId, orden: productoCategorias.orden })
      .from(productoCategorias)
      .where(eq(productoCategorias.productoId, productoId))
    const ordenPrevio = new Map(existentes.map((e) => [e.categoriaId, e.orden]))

    await tx.delete(productoCategorias).where(eq(productoCategorias.productoId, productoId))

    const filas = []
    for (const categoriaId of categoriaIds) {
      let orden = ordenPrevio.get(categoriaId)
      if (orden === undefined) {
        // Categoría nueva para este producto: va al final
        const [{ ultimo }] = await tx
          .select({ ultimo: sql<number>`coalesce(max(${productoCategorias.orden}), -1)` })
          .from(productoCategorias)
          .where(eq(productoCategorias.categoriaId, categoriaId))
        orden = ultimo + 1
      }
      filas.push({ productoId, categoriaId, orden })
    }
    await tx.insert(productoCategorias).values(filas)

    await tx.delete(productoComplementos).where(eq(productoComplementos.productoId, productoId))
    const complementos = complementoIds.filter((c) => c !== productoId)
    if (complementos.length > 0) {
      await tx
        .insert(productoComplementos)
        .values(complementos.map((complementoId, orden) => ({ productoId, complementoId, orden })))
    }
  })

  updateTag('productos')
  redirect('/admin/productos')
}

export async function eliminarProducto(id: number) {
  await requireAdmin()
  await db.delete(productos).where(eq(productos.id, id))
  updateTag('productos')
  redirect('/admin/productos')
}

export async function reordenarProductosEnCategoria(categoriaId: number, ids: number[]) {
  await requireAdmin()

  const resultado = z.array(z.number().int().positive()).max(1000).safeParse(ids)
  if (!resultado.success || !Number.isInteger(categoriaId)) return { ok: false, mensaje: 'Datos no válidos' }

  const actuales = await db
    .select({ productoId: productoCategorias.productoId })
    .from(productoCategorias)
    .where(eq(productoCategorias.categoriaId, categoriaId))

  // Solo se acepta la lista completa de la categoría, para no desordenar nada
  const esperados = new Set(actuales.map((a) => a.productoId))
  if (esperados.size !== resultado.data.length || !resultado.data.every((id) => esperados.has(id))) {
    return { ok: false, mensaje: 'La lista cambió mientras la ordenabas. Recarga la página.' }
  }

  await db.transaction(async (tx) => {
    for (const [posicion, productoId] of resultado.data.entries()) {
      await tx
        .update(productoCategorias)
        .set({ orden: posicion })
        .where(and(eq(productoCategorias.productoId, productoId), eq(productoCategorias.categoriaId, categoriaId)))
    }
  })

  updateTag('productos')
  return { ok: true, mensaje: 'Orden guardado' }
}