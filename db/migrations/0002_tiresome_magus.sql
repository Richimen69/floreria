CREATE TABLE "categorias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"slug" text NOT NULL,
	"descripcion" text,
	"imagen_url" text,
	"orden" integer DEFAULT 0 NOT NULL,
	"activa" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categorias_slug_unique" UNIQUE("slug")
);
