CREATE TABLE "precios_temporada" (
	"temporada_id" integer NOT NULL,
	"producto_id" integer NOT NULL,
	"precio_centavos" integer NOT NULL,
	CONSTRAINT "precios_temporada_temporada_id_producto_id_pk" PRIMARY KEY("temporada_id","producto_id")
);
--> statement-breakpoint
CREATE TABLE "temporadas" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"fecha_inicio" date NOT NULL,
	"fecha_fin" date NOT NULL,
	"ajuste_porcentaje" integer DEFAULT 0 NOT NULL,
	"redondeo_centavos" integer DEFAULT 1000 NOT NULL,
	"permite_ofertas" boolean DEFAULT false NOT NULL,
	"reservas_abiertas" boolean DEFAULT false NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "temporada_fechas_validas" CHECK ("temporadas"."fecha_fin" >= "temporadas"."fecha_inicio")
);
--> statement-breakpoint
ALTER TABLE "precios_temporada" ADD CONSTRAINT "precios_temporada_temporada_id_temporadas_id_fk" FOREIGN KEY ("temporada_id") REFERENCES "public"."temporadas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "precios_temporada" ADD CONSTRAINT "precios_temporada_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;