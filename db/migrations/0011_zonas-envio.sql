CREATE TABLE "colonias" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"tipo" text,
	"cp" text NOT NULL,
	"zona_id" integer,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "zonas_envio" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"costo_centavos" integer DEFAULT 0 NOT NULL,
	"nota_interna" text,
	"activa" boolean DEFAULT true NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "colonias" ADD CONSTRAINT "colonias_zona_id_zonas_envio_id_fk" FOREIGN KEY ("zona_id") REFERENCES "public"."zonas_envio"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "colonias_nombre_cp_idx" ON "colonias" USING btree ("nombre","cp");--> statement-breakpoint
CREATE INDEX "colonias_zona_idx" ON "colonias" USING btree ("zona_id");