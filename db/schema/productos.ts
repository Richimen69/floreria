import { sql } from 'drizzle-orm'
import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { categorias } from './categorias'

export const productos = pgTable('productos', {
  id: serial('id').primaryKey(),
  categoriaId: integer('categoria_id')
    .notNull()
    .references(() => categorias.id, { onDelete: 'restrict' }),
  nombre: text('nombre').notNull(),
  slug: text('slug').notNull().unique(),
  descripcion: text('descripcion'),

  // Los precios se guardan en centavos para evitar errores de redondeo
  precioCentavos: integer('precio_centavos').notNull(),
  precioOfertaCentavos: integer('precio_oferta_centavos'),

  // La primera imagen es la principal
  imagenes: text('imagenes').array().notNull().default(sql`'{}'::text[]`),

  activo: boolean('activo').notNull().default(true),       // visible en el sitio
  disponible: boolean('disponible').notNull().default(true), // se puede pedir hoy
  destacado: boolean('destacado').notNull().default(false),  // aparece en "Productos Top"
  orden: integer('orden').notNull().default(0),

  creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
})

export type Producto = typeof productos.$inferSelect