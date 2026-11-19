ALTER TABLE "ajustes_sitio" ADD COLUMN "mercado_pago_activo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "mp_preferencia_id" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "mp_pago_id" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "mp_estado" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "mp_detalle" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "pago_tardio" boolean DEFAULT false NOT NULL;