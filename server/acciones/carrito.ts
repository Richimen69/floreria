'use server'

import { z } from 'zod'
import { calcularPrecio } from '@/lib/precios'
import { sumarDias } from '@/lib/fechas'
import type { DiaEntrega, EstadoBloque } from '@/lib/calendario'
import { ahoraEnAcapulco, diaDeEntrega, siguientesFechasDisponibles } from '@/server/calendario'
import { obtenerConfigCalendario } from '@/server/consultas/calendario'
import { complementosDe, obtenerProductosPorIds } from '@/server/consultas/catalogo'
import { temporadaParaFecha } from '@/server/consultas/temporadas'

const esquemaEntrada = z.object({
  items: z
    .array(z.object({ productoId: z.number().int().positive(), cantidad: z.number().int().min(1).max(20) }))
    .max(30),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  bloque: z.string().max(20).nullable(),
})

export type LineaCarrito = {
  productoId: number
  nombre: string | null
  slug: string | null
  imagen: string | null
  cantidad: number
  precioUnitario: number
  subtotal: number
  enOferta: boolean
  deTemporada: boolean
  problema: string | null
}

export type Sugerencia = { id: number; nombre: string; slug: string; imagen: string | null; precio: number }

export type Cotizacion = {
  lineas: LineaCarrito[]
  total: number
  hoy: string
  fechaMinima: string
  fechaMaxima: string
  diasAnticipacion: number
  fechaPrecios: string
  temporada: string | null
  dia: DiaEntrega | null
  bloqueElegido: EstadoBloque | null
  proximas: DiaEntrega[]
  sugerencias: Sugerencia[]
  listo: boolean
}

export async function cotizarCarrito(entrada: unknown): Promise<Cotizacion> {
  const datos = esquemaEntrada.parse(entrada)
  const ids = [...new Set(datos.items.map((i) => i.productoId))].sort((a, b) => a - b)

  const [ahora, config, productos] = await Promise.all([
    ahoraEnAcapulco(),
    obtenerConfigCalendario(),
    obtenerProductosPorIds(ids),
  ])
  const porId = new Map(productos.map((p) => [p.id, p]))

  // La anticipación del carrito la marca el producto que pida más días
  const diasAnticipacion = Math.max(0, ...productos.map((p) => p.diasAnticipacion))
  const fechaMinima = sumarDias(ahora.fecha, diasAnticipacion)
  const fechaMaxima = sumarDias(ahora.fecha, config.horizonteDias)

  // Sin fecha elegida, los precios se estiman para la primera fecha posible
  const fechaPrecios = datos.fecha ?? fechaMinima

  const [temporada, dia, complementos] = await Promise.all([
    temporadaParaFecha(fechaPrecios),
    datos.fecha ? diaDeEntrega(datos.fecha, fechaMinima) : Promise.resolve(null),
    complementosDe(ids),
  ])

  const lineas: LineaCarrito[] = datos.items.map((item) => {
    const p = porId.get(item.productoId)
    if (!p) {
      return {
        productoId: item.productoId, nombre: null, slug: null, imagen: null, cantidad: item.cantidad,
        precioUnitario: 0, subtotal: 0, enOferta: false, deTemporada: false,
        problema: 'Este producto ya no está disponible',
      }
    }

    const { precioCentavos, enOferta, deTemporada } = calcularPrecio(p, fechaPrecios, ahora.fecha, temporada)

    let problema: string | null = null
    if (!p.disponible) problema = 'No disponible por ahora'
    else if (p.controlarExistencias && p.existencias <= 0) problema = 'Sin existencias'
    else if (p.controlarExistencias && item.cantidad > p.existencias) problema = `Solo quedan ${p.existencias} pieza(s)`

    return {
      productoId: p.id, nombre: p.nombre, slug: p.slug, imagen: p.imagenes[0] ?? null, cantidad: item.cantidad,
      precioUnitario: precioCentavos, subtotal: precioCentavos * item.cantidad, enOferta, deTemporada, problema,
    }
  })

  const total = lineas.filter((l) => !l.problema).reduce((suma, l) => suma + l.subtotal, 0)
  const bloqueElegido = dia?.bloques.find((b) => b.clave === datos.bloque && b.disponible) ?? null

  // Si la fecha no sirve (o no hay fecha), ofrecer las siguientes disponibles
  const proximas =
    !dia || !dia.disponible ? await siguientesFechasDisponibles(4, fechaMinima) : []

  const enCarrito = new Set(ids)
  const sugerencias: Sugerencia[] = complementos
    .filter((c) => !enCarrito.has(c.id) && c.disponible && !(c.controlarExistencias && c.existencias <= 0))
    .slice(0, 4)
    .map((c) => ({
      id: c.id,
      nombre: c.nombre,
      slug: c.slug,
      imagen: c.imagenes[0] ?? null,
      precio: calcularPrecio(c, fechaPrecios, ahora.fecha, temporada).precioCentavos,
    }))

  return {
    lineas,
    total,
    hoy: ahora.fecha,
    fechaMinima,
    fechaMaxima,
    diasAnticipacion,
    fechaPrecios,
    temporada: temporada?.nombre ?? null,
    dia,
    bloqueElegido,
    proximas,
    sugerencias,
    listo: lineas.length > 0 && lineas.every((l) => !l.problema) && Boolean(dia?.disponible) && Boolean(bloqueElegido),
  }
}