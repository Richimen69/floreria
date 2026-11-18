'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { insumos, movimientosInsumo } from '@/db/schema'
import { formatearCantidad, redondear2 } from '@/lib/inventario'
import { requireAdmin } from '@/lib/permisos'
import { esquemaInsumo, esquemaMovimiento } from '@/lib/validaciones/inventario'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

export async function guardarInsumo(
  id: number | null,
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const sesion = await requireAdmin()

  const resultado = esquemaInsumo.safeParse(Object.fromEntries(formData))
  if (!resultado.success) {
    return { ok: false, mensaje: 'Revisa los campos marcados', errores: z.flattenError(resultado.error).fieldErrors }
  }

  const { existenciaInicial, costo, ...datos } = resultado.data

  if (id) {
    // La existencia no se edita aquí: solo cambia con movimientos
    await db.update(insumos).set({ ...datos, costoUnitarioCentavos: costo }).where(eq(insumos.id, id))
  } else {
    const inicial = existenciaInicial ?? 0
    await db.transaction(async (tx) => {
      const [nuevo] = await tx
        .insert(insumos)
        .values({ ...datos, costoUnitarioCentavos: costo, existencia: inicial })
        .returning({ id: insumos.id })

      if (inicial > 0) {
        await tx.insert(movimientosInsumo).values({
          insumoId: nuevo.id,
          tipo: 'entrada',
          cambio: inicial,
          existenciaResultante: inicial,
          costoUnitarioCentavos: costo,
          nota: 'Existencia inicial',
          usuarioId: sesion.user.id,
        })
      }
    })
  }

  updateTag('inventario')
  redirect('/admin/inventario')
}

class ErrorInventario extends Error {}

export async function registrarMovimiento(formData: FormData): Promise<{ ok: boolean; mensaje: string }> {
  const sesion = await requireAdmin()

  const resultado = esquemaMovimiento.safeParse(Object.fromEntries(formData))
  if (!resultado.success) {
    return { ok: false, mensaje: resultado.error.issues[0]?.message ?? 'Datos no válidos' }
  }
  const { insumoId, tipo, cantidad, costo, nota } = resultado.data

  if (tipo !== 'ajuste' && cantidad <= 0) return { ok: false, mensaje: 'La cantidad debe ser mayor a 0' }

  try {
    await db.transaction(async (tx) => {
      // Bloquea la fila para que dos movimientos simultáneos no se pisen
      const [insumo] = await tx
        .select({ existencia: insumos.existencia, unidad: insumos.unidad })
        .from(insumos)
        .where(eq(insumos.id, insumoId))
        .for('update')
      if (!insumo) throw new ErrorInventario('El insumo no existe')

      const cambio = redondear2(
        tipo === 'entrada' ? cantidad : tipo === 'ajuste' ? cantidad - insumo.existencia : -cantidad,
      )
      const nueva = redondear2(insumo.existencia + cambio)

      if (nueva < 0) {
        throw new ErrorInventario(`Solo hay ${formatearCantidad(insumo.existencia)} ${insumo.unidad}(s) en existencia`)
      }
      if (tipo === 'ajuste' && cambio === 0) {
        throw new ErrorInventario('La existencia registrada ya es esa cantidad')
      }

      await tx
        .update(insumos)
        .set({
          existencia: nueva,
          ...(tipo === 'entrada' && costo != null ? { costoUnitarioCentavos: costo } : {}),
        })
        .where(eq(insumos.id, insumoId))

      await tx.insert(movimientosInsumo).values({
        insumoId,
        tipo,
        cambio,
        existenciaResultante: nueva,
        costoUnitarioCentavos: tipo === 'entrada' ? (costo ?? null) : null,
        nota,
        usuarioId: sesion.user.id,
      })
    })
  } catch (error) {
    if (error instanceof ErrorInventario) return { ok: false, mensaje: error.message }
    throw error
  }

  updateTag('inventario')
  return { ok: true, mensaje: 'Movimiento registrado' }
}