ALTER TABLE "pedidos" ADD COLUMN "para_tarjeta" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "tarjeta_en_blanco" boolean DEFAULT false NOT NULL;