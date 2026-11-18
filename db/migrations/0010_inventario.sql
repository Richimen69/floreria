CREATE TYPE "public"."tipo_movimiento_insumo" AS ENUM('entrada', 'salida', 'merma', 'ajuste');--> statement-breakpoint
CREATE TABLE "insumos" (
	"id" serial PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL,
	"categoria" text DEFAULT 'General' NOT NULL,
	"unidad" text DEFAULT 'pieza' NOT NULL,
	"existencia" numeric(12, 2) DEFAULT 0 NOT NULL,
	"minimo" numeric(12, 2),
	"costo_unitario_centavos" integer,
	"proveedor" text,
	"notas" text,
	"activo" boolean DEFAULT true NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "movimientos_insumo" (
	"id" serial PRIMARY KEY NOT NULL,
	"insumo_id" integer NOT NULL,
	"tipo" "tipo_movimiento_insumo" NOT NULL,
	"cambio" numeric(12, 2) NOT NULL,
	"existencia_resultante" numeric(12, 2) NOT NULL,
	"costo_unitario_centavos" integer,
	"nota" text,
	"usuario_id" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "movimientos_insumo" ADD CONSTRAINT "movimientos_insumo_insumo_id_insumos_id_fk" FOREIGN KEY ("insumo_id") REFERENCES "public"."insumos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "movimientos_insumo" ADD CONSTRAINT "movimientos_insumo_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "insumos_categoria_idx" ON "insumos" USING btree ("categoria","nombre");--> statement-breakpoint
CREATE INDEX "movimientos_insumo_idx" ON "movimientos_insumo" USING btree ("insumo_id","creado_en");