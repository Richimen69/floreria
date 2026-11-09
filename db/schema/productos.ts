import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { categorias } from "./categorias";

export const productos = pgTable("productos", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  slug: text("slug").notNull().unique(),
  descripcion: text("descripcion"),

  precioCentavos: integer("precio_centavos").notNull(),
  precioOfertaCentavos: integer("precio_oferta_centavos"),
  ofertaDesde: date("oferta_desde", { mode: "string" }),
  ofertaHasta: date("oferta_hasta", { mode: "string" }),
  imagenes: text("imagenes")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),

  diasAnticipacion: integer("dias_anticipacion").notNull().default(0),
  controlarExistencias: boolean("controlar_existencias")
    .notNull()
    .default(false),
  existencias: integer("existencias").notNull().default(0),

  activo: boolean("activo").notNull().default(true),
  disponible: boolean("disponible").notNull().default(true),
  destacado: boolean("destacado").notNull().default(false),
  orden: integer("orden").notNull().default(0),

  creadoEn: timestamp("creado_en", { withTimezone: true })
    .notNull()
    .defaultNow(),
  actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Un producto en varias categorías
export const productoCategorias = pgTable(
  "producto_categorias",
  {
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    categoriaId: integer("categoria_id")
      .notNull()
      .references(() => categorias.id, { onDelete: "restrict" }),
  },
  (t) => [
    primaryKey({ columns: [t.productoId, t.categoriaId] }),
    index("producto_categorias_categoria_idx").on(t.categoriaId),
  ],
);

// Complementos sugeridos: también son productos
export const productoComplementos = pgTable(
  "producto_complementos",
  {
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    complementoId: integer("complemento_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    orden: integer("orden").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.productoId, t.complementoId] }),
    check("complemento_distinto", sql`${t.productoId} <> ${t.complementoId}`),
  ],
);

export type Producto = typeof productos.$inferSelect;
