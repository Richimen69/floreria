ALTER TYPE "public"."estado_pago" ADD VALUE 'en_revision' BEFORE 'pagado';--> statement-breakpoint
ALTER TYPE "public"."estado_pago" ADD VALUE 'vencido' BEFORE 'cancelado';