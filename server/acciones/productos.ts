'use server'

import { and, eq, ne } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { productos } from '@/db/schema'
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

  const datos = resultado.data

  const condicion = id
    ? and(eq(productos.slug, datos.slug), ne(productos.id, id))
    : eq(productos.slug, datos.slug)
  const [duplicado] = await db.select({ id: productos.id }).from(productos).where(condicion).limit(1)
  if (duplicado) {
    return {
      ok: false,
      mensaje: 'Revisa los campos marcados',
      errores: { slug: ['Ya existe un producto con este identificador'] },
    }
  }

  if (id) {
    await db.update(productos).set(datos).where(eq(productos.id, id))
  } else {
    await db.insert(productos).values(datos)
  }

  updateTag('productos')
  redirect('/admin/productos')
}

export async function eliminarProducto(id: number) {
  await requireAdmin()
  await db.delete(productos).where(eq(productos.id, id))
  updateTag('productos')
  redirect('/admin/productos')
}