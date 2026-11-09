import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const ajustesSitio = pgTable(
  "ajustes_sitio",
  {
    id: integer("id").primaryKey().default(1),

    // Identidad
    nombre: text("nombre").notNull().default("Florería"),
    eslogan: text("eslogan"),
    logoUrl: text("logo_url"),
    colorPrimario: text("color_primario").notNull().default("#be185d"),
    colorAcento: text("color_acento").notNull().default("#6b8f71"),
    colorFondo: text("color_fondo").notNull().default("#faf7f5"),

    // Portada e información
    tituloPortada: text("titulo_portada"),
    textoPortada: text("texto_portada"),
    imagenPortadaUrl: text("imagen_portada_url"),
    quienesSomos: text("quienes_somos"),

    // Contacto
    whatsapp: text("whatsapp"),
    telefono: text("telefono"),
    email: text("email"),
    direccion: text("direccion"),
    mapaUrl: text("mapa_url"),
    horario: text("horario"),
    latitud: doublePrecision("latitud"),
    longitud: doublePrecision("longitud"),
    // Redes
    facebookUrl: text("facebook_url"),
    instagramUrl: text("instagram_url"),
    tiktokUrl: text("tiktok_url"),
    horizonteDias: integer("horizonte_dias").notNull().default(60),
    actualizadoEn: timestamp("actualizado_en", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [check("ajustes_una_sola_fila", sql`${t.id} = 1`)],
);

export type AjustesSitio = typeof ajustesSitio.$inferSelect;
