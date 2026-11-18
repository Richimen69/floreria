import { boolean, index, integer, numeric, pgEnum, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'
import { sql } from 'drizzle-orm'

export const tipoMovimientoInsumo = pgEnum('tipo_movimiento_insumo', ['entrada', 'salida', 'merma', 'ajuste'])

export const insumos = pgTable(
  'insumos',
  {
    id: serial('id').primaryKey(),
    nombre: text('nombre').notNull(),
    categoria: text('categoria').notNull().default('General'),
    unidad: text('unidad').notNull().default('pieza'),
    existencia: numeric('existencia', { precision: 12, scale: 2, mode: 'number' }).notNull().default(0),
    minimo: numeric('minimo', { precision: 12, scale: 2, mode: 'number' }),
    costoUnitarioCentavos: integer('costo_unitario_centavos'),
    proveedor: text('proveedor'),
    notas: text('notas'),
    activo: boolean('activo').notNull().default(true),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => sql`now()`),
  },
  (t) => [index('insumos_categoria_idx').on(t.categoria, t.nombre)],
)

export const movimientosInsumo = pgTable(
  'movimientos_insumo',
  {
    id: serial('id').primaryKey(),
    insumoId: integer('insumo_id')
      .notNull()
      .references(() => insumos.id, { onDelete: 'cascade' }),
    tipo: tipoMovimientoInsumo('tipo').notNull(),
    cambio: numeric('cambio', { precision: 12, scale: 2, mode: 'number' }).notNull(), // + suma, − resta
    existenciaResultante: numeric('existencia_resultante', { precision: 12, scale: 2, mode: 'number' }).notNull(),
    costoUnitarioCentavos: integer('costo_unitario_centavos'),
    nota: text('nota'),
    usuarioId: text('usuario_id').references(() => user.id, { onDelete: 'set null' }),
    creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('movimientos_insumo_idx').on(t.insumoId, t.creadoEn)],
)

export type Insumo = typeof insumos.$inferSelect