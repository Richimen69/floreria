CREATE TABLE "paginas_legales" (
	"slug" text PRIMARY KEY NOT NULL,
	"titulo" text NOT NULL,
	"contenido" text DEFAULT '' NOT NULL,
	"publicada" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
