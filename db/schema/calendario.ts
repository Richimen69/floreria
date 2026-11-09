import { sql } from 'drizzle-orm'
import { check, date, integer, pgEnum, pgTable, serial, text } from 'drizzle-orm/pg-core'

export const tipoExcepcion = pgEnum('tipo_excepcion', ['cerrado', 'no_disponible', 'especial'])

export const bloquesSemana = pgTable(
  'bloques_semana',
  {
    id: serial('id').primaryKey(),
    diaSemana: integer('dia_semana').notNull(), // 0 = domingo
    inicio: text('inicio').notNull(),           // 'HH:MM'
    fin: text('fin').notNull(),
    minutosCierre: integer('minutos_cierre').notNull().default(30),
    capacidad: integer('capacidad').notNull().default(15),
  },
  (t) => [check('dia_semana_valido', sql`${t.diaSemana} BETWEEN 0 AND 6`)],
)

export const excepcionesCalendario = pgTable(
  'excepciones_calendario',
  {
    id: serial('id').primaryKey(),
    nombre: text('nombre').notNull(),
    fechaInicio: date('fecha_inicio', { mode: 'string' }).notNull(),
    fechaFin: date('fecha_fin', { mode: 'string' }).notNull(),
    tipo: tipoExcepcion('tipo').notNull(),
    nota: text('nota'),
  },
  (t) => [check('excepcion_fechas_validas', sql`${t.fechaFin} >= ${t.fechaInicio}`)],
)

export const bloquesExcepcion = pgTable('bloques_excepcion', {
  id: serial('id').primaryKey(),
  excepcionId: integer('excepcion_id')
    .notNull()
    .references(() => excepcionesCalendario.id, { onDelete: 'cascade' }),
  inicio: text('inicio').notNull(),
  fin: text('fin').notNull(),
  minutosCierre: integer('minutos_cierre').notNull().default(30),
  capacidad: integer('capacidad').notNull().default(15),
})

export type ExcepcionCalendario = typeof excepcionesCalendario.$inferSelect