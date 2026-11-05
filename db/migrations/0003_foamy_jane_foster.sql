CREATE TABLE "productos" (
	"id" serial PRIMARY KEY NOT NULL,
	"categoria_id" integer NOT NULL,
	"nombre" text NOT NULL,
	"slug" text NOT NULL,
	"descripcion" text,
	"precio_centavos" integer NOT NULL,
	"precio_oferta_centavos" integer,
	"imagenes" text[] DEFAULT '{}'::text[] NOT NULL,
	"activo" boolean DEFAULT true NOT NULL,
	"disponible" boolean DEFAULT true NOT NULL,
	"destacado" boolean DEFAULT false NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "productos_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE restrict ON UPDATE no action;