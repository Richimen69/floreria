import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const categorias = pgTable('categorias', {
  id: serial('id').primaryKey(),
  nombre: text('nombre').notNull(),
  slug: text('slug').notNull().unique(),
  descripcion: text('descripcion'),
  imagenUrl: text('imagen_url'),
  orden: integer('orden').notNull().default(0),
  activa: boolean('activa').notNull().default(true),
  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type Categoria = typeof categorias.$inferSelect