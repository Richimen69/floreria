type Precificable = {
  id: number
  precioCentavos: number
  precioOfertaCentavos: number | null
  ofertaDesde: string | null
  ofertaHasta: string | null
}

export type ReglasTemporada = {
  ajustePorcentaje: number
  redondeoCentavos: number
  permiteOfertas: boolean
  precios: Record<number, number> // productoId → precio especial en centavos
}

export function redondear(centavos: number, redondeo: number) {
  return redondeo > 0 ? Math.round(centavos / redondeo) * redondeo : Math.round(centavos)
}

export function ofertaAplica(p: Precificable, fechaEntrega: string, hoy: string) {
  if (p.precioOfertaCentavos == null || !p.ofertaHasta) return false
  if (hoy > p.ofertaHasta) return false
  if (p.ofertaDesde && hoy < p.ofertaDesde) return false
  return fechaEntrega <= p.ofertaHasta
}

export function precioDeTemporada(p: Precificable, t: ReglasTemporada) {
  const especial = t.precios[p.id]
  if (especial != null) return especial
  if (t.ajustePorcentaje !== 0) {
    return redondear(p.precioCentavos * (1 + t.ajustePorcentaje / 100), t.redondeoCentavos)
  }
  return null
}

/**
 * Precio de un producto para una fecha de entrega. Orden:
 * 1. Precio de temporada (especial del producto o ajuste general).
 *    Si la temporada permite ofertas y la oferta es más barata, gana la oferta.
 * 2. Oferta vigente (si no hay temporada, o si la temporada la permite).
 * 3. Precio normal.
 */
export function calcularPrecio(
  p: Precificable,
  fechaEntrega: string,
  hoy: string,
  temporada: ReglasTemporada | null = null,
) {
  const hayOferta = ofertaAplica(p, fechaEntrega, hoy)
  const ofertaPermitida = hayOferta && (!temporada || temporada.permiteOfertas)

  if (temporada) {
    const precioTemporada = precioDeTemporada(p, temporada)
    if (precioTemporada != null) {
      if (ofertaPermitida && p.precioOfertaCentavos! < precioTemporada) {
        return { precioCentavos: p.precioOfertaCentavos!, enOferta: true, deTemporada: false }
      }
      return { precioCentavos: precioTemporada, enOferta: false, deTemporada: true }
    }
  }

  return {
    precioCentavos: ofertaPermitida ? p.precioOfertaCentavos! : p.precioCentavos,
    enOferta: ofertaPermitida,
    deTemporada: false,
  }
}