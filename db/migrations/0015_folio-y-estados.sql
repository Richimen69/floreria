CREATE SEQUENCE "public"."folio_pedidos_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "pedido_eventos" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"tipo" text NOT NULL,
	"de" text,
	"a" text,
	"nota" text,
	"usuario_id" text,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pedidos" ALTER COLUMN "folio" SET DEFAULT 'MB-' || lpad(nextval('folio_pedidos_seq')::text, 4, '0');--> statement-breakpoint
ALTER TABLE "pedido_eventos" ADD CONSTRAINT "pedido_eventos_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_eventos" ADD CONSTRAINT "pedido_eventos_usuario_id_user_id_fk" FOREIGN KEY ("usuario_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pedido_eventos_pedido_idx" ON "pedido_eventos" USING btree ("pedido_id","creado_en");