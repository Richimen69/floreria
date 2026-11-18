CREATE TYPE "public"."tipo_lugar" AS ENUM('casa', 'hotel', 'oficina', 'hospital', 'funeraria');--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "telefono" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "usuario_id" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "tipo_lugar" "tipo_lugar" DEFAULT 'casa' NOT NULL;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "nombre_lugar" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "detalle_lugar" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD COLUMN "relacion_lugar" text;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" DROP COLUMN "evento_temprano";