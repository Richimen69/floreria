'use server'

import { and, eq, gte, lte, ne } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { preciosTemporada, temporadas } from '@/db/schema'
import { requireAdmin } from '@/lib/permisos'
import { esquemaTemporada, leerPreciosTemporada } from '@/lib/validaciones/temporada'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'

export async function guardarTemporada(
  id: number | null,
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin()

  const resultado = esquemaTemporada.safeParse(Object.fromEntries(formData))
  const { precios, errores: erroresPrecios } = leerPreciosTemporada(formData)

  if (!resultado.success || Object.keys(erroresPrecios).length > 0) {
    return {
      ok: false,
      mensaje: 'Revisa los campos marcados',
      errores: { ...(resultado.success ? {} : z.flattenError(resultado.error).fieldErrors), ...erroresPrecios },
    }
  }

  const datos = resultado.data

  // Dos temporadas no pueden cubrir la misma fecha
  const condicionTraslape = and(lte(temporadas.fechaInicio, datos.fechaFin), gte(temporadas.fechaFin, datos.fechaInicio))
  const [traslape] = await db
    .select({ nombre: temporadas.nombre })
    .from(temporadas)
    .where(id ? and(condicionTraslape, ne(temporadas.id, id)) : condicionTraslape)
    .limit(1)

  if (traslape) {
    return {
      ok: false,
      mensaje: 'Revisa los campos marcados',
      errores: { fechaInicio: [`Las fechas se enciman con la temporada "${traslape.nombre}"`] },
    }
  }

  await db.transaction(async (tx) => {
    let temporadaId: number
    if (id) {
      await tx.update(temporadas).set(datos).where(eq(temporadas.id, id))
      temporadaId = id
    } else {
      const [nueva] = await tx.insert(temporadas).values(datos).returning({ id: temporadas.id })
      temporadaId = nueva.id
    }

    await tx.delete(preciosTemporada).where(eq(preciosTemporada.temporadaId, temporadaId))
    if (precios.length > 0) {
      await tx.insert(preciosTemporada).values(precios.map((p) => ({ ...p, temporadaId })))
    }
  })

  updateTag('temporadas')
  redirect('/admin/temporadas')
}

export async function eliminarTemporada(id: number) {
  await requireAdmin()
  await db.delete(temporadas).where(eq(temporadas.id, id))
  updateTag('temporadas')
  redirect('/admin/temporadas')
}

function sumarUnAnio(fecha: string) {
  const [a, m, d] = fecha.split('-').map(Number)
  return new Date(Date.UTC(a + 1, m - 1, d)).toISOString().slice(0, 10)
}

export async function duplicarTemporada(id: number) {
  await requireAdmin()

  const [original] = await db.select().from(temporadas).where(eq(temporadas.id, id)).limit(1)
  if (!original) return

  const precios = await db.select().from(preciosTemporada).where(eq(preciosTemporada.temporadaId, id))

  const nuevaId = await db.transaction(async (tx) => {
    const [nueva] = await tx
      .insert(temporadas)
      .values({
        nombre: `${original.nombre} (copia)`,
        fechaInicio: sumarUnAnio(original.fechaInicio),
        fechaFin: sumarUnAnio(original.fechaFin),
        ajustePorcentaje: original.ajustePorcentaje,
        redondeoCentavos: original.redondeoCentavos,
        permiteOfertas: original.permiteOfertas,
        reservasAbiertas: false, // la copia nace cerrada hasta revisar precios
      })
      .returning({ id: temporadas.id })

    if (precios.length > 0) {
      await tx.insert(preciosTemporada).values(
        precios.map((p) => ({ temporadaId: nueva.id, productoId: p.productoId, precioCentavos: p.precioCentavos })),
      )
    }
    return nueva.id
  })

  updateTag('temporadas')
  redirect(`/admin/temporadas/${nuevaId}`)
}