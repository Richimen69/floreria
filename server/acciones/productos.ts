'use server'

import { and, eq, ne } from 'drizzle-orm'
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

    await tx.delete(productoCategorias).where(eq(productoCategorias.productoId, productoId))
    await tx.insert(productoCategorias).values(categoriaIds.map((categoriaId) => ({ productoId, categoriaId })))

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