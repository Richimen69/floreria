DROP INDEX "producto_categorias_categoria_idx";--> statement-breakpoint
ALTER TABLE "producto_categorias" ADD COLUMN "orden" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "producto_categorias_categoria_idx" ON "producto_categorias" USING btree ("categoria_id","orden");
UPDATE "producto_categorias" pc
SET "orden" = sub.posicion
FROM (
  SELECT pc2.producto_id, pc2.categoria_id,
         row_number() OVER (PARTITION BY pc2.categoria_id ORDER BY p.orden, p.nombre) - 1 AS posicion
  FROM "producto_categorias" pc2
  JOIN "productos" p ON p.id = pc2.producto_id
) sub
WHERE pc.producto_id = sub.producto_id AND pc.categoria_id = sub.categoria_id;