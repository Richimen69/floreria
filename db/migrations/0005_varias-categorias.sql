CREATE TABLE "producto_categorias" (
	"producto_id" integer NOT NULL,
	"categoria_id" integer NOT NULL,
	CONSTRAINT "producto_categorias_producto_id_categoria_id_pk" PRIMARY KEY("producto_id","categoria_id")
);
--> statement-breakpoint
CREATE TABLE "producto_complementos" (
	"producto_id" integer NOT NULL,
	"complemento_id" integer NOT NULL,
	"orden" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "producto_complementos_producto_id_complemento_id_pk" PRIMARY KEY("producto_id","complemento_id"),
	CONSTRAINT "complemento_distinto" CHECK ("producto_complementos"."producto_id" <> "producto_complementos"."complemento_id")
);
--> statement-breakpoint
ALTER TABLE "productos" DROP CONSTRAINT "productos_categoria_id_categorias_id_fk";
--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "dias_anticipacion" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "controlar_existencias" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "productos" ADD COLUMN "existencias" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "producto_categorias" ADD CONSTRAINT "producto_categorias_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto_categorias" ADD CONSTRAINT "producto_categorias_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto_complementos" ADD CONSTRAINT "producto_complementos_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "producto_complementos" ADD CONSTRAINT "producto_complementos_complemento_id_productos_id_fk" FOREIGN KEY ("complemento_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "producto_categorias_categoria_idx" ON "producto_categorias" USING btree ("categoria_id");--> statement-breakpoint
INSERT INTO "producto_categorias" ("producto_id", "categoria_id") SELECT "id", "categoria_id" FROM "productos";--> statement-breakpoint
ALTER TABLE "productos" DROP COLUMN "categoria_id";