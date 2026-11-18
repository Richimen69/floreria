'use server'

import { and, eq, gte, lte, ne } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/db'
import { ajustesSitio, bloquesExcepcion, bloquesSemana, excepcionesCalendario } from '@/db/schema'
import type { ConfigCalendario, PedidoAfectado } from '@/lib/calendario'
import { requireAdmin } from '@/lib/permisos'
import { describirError, esquemaExcepcion, esquemaSemana, leerJson } from '@/lib/validaciones/calendario'
import type { EstadoFormulario } from '@/lib/validaciones/ajustes'
import { pedidosAfectados } from '@/server/calendario'
import { obtenerConfigCalendario } from '@/server/consultas/calendario'

function mensajeAfectados(afectados: PedidoAfectado[]) {
  const total = afectados.reduce((suma, a) => suma + a.total, 0)
  return `Este cambio afecta ${total} pedido(s) ya registrado(s). Revísalos antes de guardar.`
}

export async function guardarHorarioSemanal(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin()

  const resultado = esquemaSemana.safeParse({
    horizonteDias: formData.get('horizonteDias'),
    semana: leerJson(formData.get('semana')),
  })
  if (!resultado.success) return { ok: false, mensaje: describirError(resultado.error) }

  const { horizonteDias, semana } = resultado.data

  // Revisar pedidos contra el horario nuevo, a menos que ya se haya confirmado
  if (formData.get('confirmarAfectados') !== 'on') {
    const actual = await obtenerConfigCalendario()
    const nueva: ConfigCalendario = {
      ...actual,
      horizonteDias,
      semana: Object.fromEntries(Object.entries(semana).map(([dia, bloques]) => [Number(dia), bloques])),
    }
    const afectados = await pedidosAfectados(nueva)
    if (afectados.length > 0) return { ok: false, mensaje: mensajeAfectados(afectados), afectados }
  }

  const filas = Object.entries(semana).flatMap(([dia, bloques]) => bloques.map((b) => ({ ...b, diaSemana: Number(dia) })))

  await db.transaction(async (tx) => {
    await tx.delete(bloquesSemana)
    if (filas.length > 0) await tx.insert(bloquesSemana).values(filas)
    await tx.update(ajustesSitio).set({ horizonteDias }).where(eq(ajustesSitio.id, 1))
  })

  updateTag('calendario')
  updateTag('ajustes')
  return { ok: true, mensaje: 'Horario guardado' }
}

export async function guardarExcepcion(
  id: number | null,
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin()

  const resultado = esquemaExcepcion.safeParse({
    ...Object.fromEntries(formData),
    bloques: leerJson(formData.get('bloques')) ?? [],
  })
  if (!resultado.success) {
    return { ok: false, mensaje: describirError(resultado.error), errores: z.flattenError(resultado.error).fieldErrors }
  }

  const { bloques, ...datos } = resultado.data
  const bloquesFinales = datos.tipo === 'especial' ? bloques : []

  const traslape = and(lte(excepcionesCalendario.fechaInicio, datos.fechaFin), gte(excepcionesCalendario.fechaFin, datos.fechaInicio))
  const [otra] = await db
    .select({ nombre: excepcionesCalendario.nombre })
    .from(excepcionesCalendario)
    .where(id ? and(traslape, ne(excepcionesCalendario.id, id)) : traslape)
    .limit(1)

  if (otra) {
    return {
      ok: false,
      mensaje: `Las fechas se enciman con la excepción "${otra.nombre}"`,
      errores: { fechaInicio: ['Fechas encimadas con otra excepción'] },
    }
  }

  // Revisar pedidos: se quita la versión anterior de esta excepción y se agrega la nueva
  if (formData.get('confirmarAfectados') !== 'on') {
    const actual = await obtenerConfigCalendario()
    const nueva: ConfigCalendario = {
      ...actual,
      excepciones: [...actual.excepciones.filter((e) => e.id !== id), { id: id ?? 0, ...datos, bloques: bloquesFinales }],
    }
    const afectados = await pedidosAfectados(nueva)
    if (afectados.length > 0) return { ok: false, mensaje: mensajeAfectados(afectados), afectados }
  }

  await db.transaction(async (tx) => {
    let excepcionId: number
    if (id) {
      await tx.update(excepcionesCalendario).set(datos).where(eq(excepcionesCalendario.id, id))
      excepcionId = id
    } else {
      const [nueva] = await tx.insert(excepcionesCalendario).values(datos).returning({ id: excepcionesCalendario.id })
      excepcionId = nueva.id
    }

    await tx.delete(bloquesExcepcion).where(eq(bloquesExcepcion.excepcionId, excepcionId))
    if (bloquesFinales.length > 0) {
      await tx.insert(bloquesExcepcion).values(bloquesFinales.map((b) => ({ ...b, excepcionId })))
    }
  })

  updateTag('calendario')
  redirect('/admin/calendario')
}

export async function eliminarExcepcion(id: number, confirmado = false): Promise<{ afectados?: PedidoAfectado[] } | void> {
  await requireAdmin()

  // Al borrarla, esas fechas regresan al horario habitual
  if (!confirmado) {
    const actual = await obtenerConfigCalendario()
    const afectados = await pedidosAfectados({ ...actual, excepciones: actual.excepciones.filter((e) => e.id !== id) })
    if (afectados.length > 0) return { afectados }
  }

  await db.delete(excepcionesCalendario).where(eq(excepcionesCalendario.id, id))
  updateTag('calendario')
  redirect('/admin/calendario')
}