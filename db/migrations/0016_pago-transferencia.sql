CREATE TYPE "public"."metodo_pago" AS ENUM('transferencia', 'mercadopago');--> statement-breakpoint
ALTER TABLE "ajustes_sitio" ADD COLUMN "transferencia_activa" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ajustes_sitio" ADD COLUMN "banco" text;--> statement-breakpoint
ALTER TABLE "ajustes_sitio" ADD COLUMN "titular_cuenta" text;--> statement-breakpoint
ALTER TABLE "ajustes_sitio" ADD COLUMN "clabe" text;--> statement-breakpoint
ALTER TABLE "ajustes_sitio" ADD COLUMN "plazo_pago_minutos" integer DEFAULT 120 NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "metodo_pago" "metodo_pago" DEFAULT 'transferencia' NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "pago_vence_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "comprobante_key" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "comprobante_tipo" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "comprobante_subido_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "motivo_rechazo" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "existencias_devueltas" boolean DEFAULT false NOT NULL;