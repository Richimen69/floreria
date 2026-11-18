CREATE TYPE "public"."estado_pago" AS ENUM('pendiente', 'pagado', 'rechazado', 'cancelado', 'reembolsado');--> statement-breakpoint
CREATE TYPE "public"."estado_trabajo" AS ENUM('nuevo', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado');--> statement-breakpoint
CREATE TYPE "public"."origen_pedido" AS ENUM('web', 'whatsapp', 'telefono', 'redes', 'tienda');--> statement-breakpoint
CREATE TYPE "public"."tipo_entrega" AS ENUM('envio', 'recoger');--> statement-breakpoint
CREATE TABLE "pedido_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"pedido_id" integer NOT NULL,
	"producto_id" integer,
	"nombre" text NOT NULL,
	"imagen" text,
	"cantidad" integer NOT NULL,
	"precio_unitario_centavos" integer NOT NULL,
	"subtotal_centavos" integer NOT NULL,
	"en_oferta" boolean DEFAULT false NOT NULL,
	"de_temporada" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pedidos" (
	"id" serial PRIMARY KEY NOT NULL,
	"folio" text NOT NULL,
	"token" uuid DEFAULT gen_random_uuid() NOT NULL,
	"origen" "origen_pedido" DEFAULT 'web' NOT NULL,
	"estado_pago" "estado_pago" DEFAULT 'pendiente' NOT NULL,
	"estado_trabajo" "estado_trabajo" DEFAULT 'nuevo' NOT NULL,
	"comprador_nombre" text NOT NULL,
	"comprador_telefono" text NOT NULL,
	"comprador_email" text,
	"tipo_entrega" "tipo_entrega" DEFAULT 'envio' NOT NULL,
	"fecha_entrega" date NOT NULL,
	"bloque_inicio" text NOT NULL,
	"bloque_fin" text NOT NULL,
	"destinatario_nombre" text,
	"destinatario_telefono" text,
	"colonia_id" integer,
	"colonia_nombre" text,
	"cp" text,
	"zona_nombre" text,
	"calle" text,
	"referencias" text,
	"evento_temprano" boolean DEFAULT false NOT NULL,
	"mensaje_tarjeta" text,
	"firma_tarjeta" text,
	"anonimo" boolean DEFAULT false NOT NULL,
	"notas" text,
	"subtotal_centavos" integer NOT NULL,
	"envio_centavos" integer DEFAULT 0 NOT NULL,
	"total_centavos" integer NOT NULL,
	"creado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"actualizado_en" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pedidos_folio_unique" UNIQUE("folio"),
	CONSTRAINT "pedidos_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_pedido_id_pedidos_id_fk" FOREIGN KEY ("pedido_id") REFERENCES "public"."pedidos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedido_items" ADD CONSTRAINT "pedido_items_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_colonia_id_colonias_id_fk" FOREIGN KEY ("colonia_id") REFERENCES "public"."colonias"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pedidos_entrega_idx" ON "pedidos" USING btree ("fecha_entrega","bloque_inicio");