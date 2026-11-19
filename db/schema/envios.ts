import { boolean, index, integer, pgTable, serial, text, timestamp, uniqueIndex, doublePrecision } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
export const zonasEnvio = pgTable('zonas_envio', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  costoCentavos: integer('costo_centavos').notNull().default(0),
  notaInterna: text('nota_interna'),
  activa: boolean('activa').notNull().default(true),
  orden: integer('orden').notNull().default(0),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

export const colonias = pgTable(
  'colonias',
  {
    id: serial('id').primaryKey(),
    nombre: text('nombre').notNull(),
    tipo: text('tipo'), // Colonia, Fraccionamiento, Unidad habitacional…
    cp: text('cp').notNull(),
    // Sin zona = sin cobertura
    zonaId: integer('zona_id').references(() => zonasEnvio.id, { onDelete: 'set null' }),
    latitud: doublePrecision('latitud'),
    longitud: doublePrecision('longitud'),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex('colonias_nombre_cp_idx').on(t.nombre, t.cp),
    index('colonias_zona_idx').on(t.zonaId),
  ],
)

export type ZonaEnvio = typeof zonasEnvio.$inferSelect