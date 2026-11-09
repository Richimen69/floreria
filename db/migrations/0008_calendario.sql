CREATE TYPE "public"."tipo_excepcion" AS ENUM('cerrado', 'no_disponible', 'especial');--> statement-breakpoint
CREATE TABLE "bloques_excepcion" (
	"id" serial PRIMARY KEY NOT NULL,
	"excepcion_id" integer NOT NULL,
	"inicio" text NOT NULL,
	"fin" text NOT NULL,
	"minutos_cierre" integer DEFAULT 30 NOT NULL,
	"capacidad" integer DEFAULT 15 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bloques_semana" (
	"id" serial PRIMARY KEY NOT NULL,
	"dia_semana" integer NOT NULL,
	"inicio" text NOT NULL,
	"fin" text NOT NULL,
	"minutos_cierre" integer DEFAULT 30 NOT NULL,
	"capacidad" integer DEFAULT 15 NOT NULL,
	CONSTRAINT "dia_semana_valido" CHECK ("bloques_semana"."dia_semana" BETWEEN 0 AND 6)
);
--> statement-breakpoint
CREATE TABLE "excepciones_calendario" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"tipo" "tipo_excepcion" NOT NULL,
	"nota" text,
	CONSTRAINT "excepcion_fechas_validas" CHECK ("excepciones_calendario"."fecha_fin" >= "excepciones_calendario"."fecha_inicio")
);
--> statement-breakpoint
ALTER TABLE "ajustes_sitio" ADD COLUMN "horizonte_dias" integer DEFAULT 60 NOT NULL;--> statement-breakpoint
ALTER TABLE "bloques_excepcion" ADD CONSTRAINT "bloques_excepcion_excepcion_id_excepciones_calendario_id_fk" FOREIGN KEY ("excepcion_id") REFERENCES "public"."excepciones_calendario"("id") ON DELETE cascade ON UPDATE no action;