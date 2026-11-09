import { sql } from 'drizzle-orm'
import { boolean, check, date, integer, pgTable, primaryKey, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { productos } from './productos'

export const temporadas = pgTable(
  'temporadas',
  {
    id: serial('id').primaryKey(),
    nombre: text('nombre').notNull(),
    fechaInicio: date('fecha_inicio', { mode: 'string' }).notNull(),
    fechaFin: date('fecha_fin', { mode: 'string' }).notNull(),
    ajustePorcentaje: integer('ajuste_porcentaje').notNull().default(0),
    redondeoCentavos: integer('redondeo_centavos').notNull().default(1000),
    permiteOfertas: boolean('permite_ofertas').notNull().default(false),
    reservasAbiertas: boolean('reservas_abiertas').notNull().default(false),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check('temporada_fechas_validas', sql`${t.fechaFin} >= ${t.fechaInicio}`)],
)

export const preciosTemporada = pgTable(
  'precios_temporada',
  {
    temporadaId: integer('temporada_id')
      .notNull()
      .references(() => temporadas.id, { onDelete: 'cascade' }),
    productoId: integer('producto_id')
      .notNull()
      .references(() => productos.id, { onDelete: 'cascade' }),
    precioCentavos: integer('precio_centavos').notNull(),
  },
  (t) => [primaryKey({ columns: [t.temporadaId, t.productoId] })],
)

export type Temporada = typeof temporadas.$inferSelect