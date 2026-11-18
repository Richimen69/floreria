ALTER TABLE "user" ADD COLUMN "privacidad_version_aceptada" integer;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "legales_aceptados_en" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "version_privacidad" integer;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "version_terminos" integer;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "version_cancelaciones" integer;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "legales_aceptados_en" timestamp with time zone;