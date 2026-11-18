import { sql } from 'drizzle-orm'
import { boolean, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export const paginasLegales = pgTable('paginas_legales', {
  slug: text('slug').primaryKey(), // 'aviso-de-privacidad', 'terminos', 'cancelaciones'
  titulo: text('titulo').notNull(),
  contenido: text('contenido').notNull().default(''),
  publicada: boolean('publicada').notNull().default(false),
  version: integer('version').notNull().default(1), // sube cada vez que cambia el contenido publicado
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => sql`now()`),
})

export type PaginaLegal = typeof paginasLegales.$inferSelect