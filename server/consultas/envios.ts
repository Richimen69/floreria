import 'server-only'
import { cacheTag } from 'next/cache'
import { and, asc, count, eq, ilike, isNull, or, sql } from 'drizzle-orm'
import { db } from '@/db'
import { colonias, zonasEnvio } from '@/db/schema'

export async function listarZonas() {
  'use cache'
  cacheTag('envios')

  return db
    .select({
      id: zonasEnvio.id,
      nombre: zonasEnvio.nombre,
      costoCentavos: zonasEnvio.costoCentavos,
      notaInterna: zonasEnvio.notaInterna,
      activa: zonasEnvio.activa,
      totalColonias: sql<number>`(SELECT count(*)::int FROM colonias c WHERE c.zona_id = zonas_envio.id)`,
    })
    .from(zonasEnvio)
    .orderBy(asc(zonasEnvio.orden), asc(zonasEnvio.nombre))
}

export type ZonaListada = Awaited<ReturnType<typeof listarZonas>>[number]

export async function listarColoniasAdmin({ q, zona, pagina }: { q: string; zona: string; pagina: number }) {
  'use cache'
  cacheTag('envios')

  const POR_PAGINA = 50
  const condiciones = []

  if (q) {
    const patron = `%${q.replace(/[%_\\]/g, '\\$&')}%`
    condiciones.push(or(ilike(colonias.nombre, patron), ilike(colonias.cp, `${q}%`)))
  }
  if (zona === 'sin-cobertura') condiciones.push(isNull(colonias.zonaId))
  else if (Number(zona) > 0) condiciones.push(eq(colonias.zonaId, Number(zona)))

  const filtro = condiciones.length ? and(...condiciones) : undefined

  const [filas, [{ total }], [{ sinCobertura }]] = await Promise.all([
    db
      .select({ id: colonias.id, nombre: colonias.nombre, tipo: colonias.tipo, cp: colonias.cp, zonaId: colonias.zonaId })
      .from(colonias)
      .where(filtro)
      .orderBy(asc(colonias.nombre), asc(colonias.cp))
      .limit(POR_PAGINA)
      .offset((pagina - 1) * POR_PAGINA),
    db.select({ total: count() }).from(colonias).where(filtro),
    db.select({ sinCobertura: count() }).from(colonias).where(isNull(colonias.zonaId)),
  ])

  return { filas, total, sinCobertura, totalPaginas: Math.max(1, Math.ceil(total / POR_PAGINA)) }
}

export type FilaColonia = Awaited<ReturnType<typeof listarColoniasAdmin>>['filas'][number]