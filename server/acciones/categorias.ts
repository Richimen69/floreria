"use server";

import { and, eq, ne } from "drizzle-orm";
import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { categorias } from "@/db/schema";
import { requireAdmin } from "@/lib/permisos";
import { esquemaCategoria } from "@/lib/validaciones/categoria";
import type { EstadoFormulario } from "@/lib/validaciones/ajustes";
import { count } from "drizzle-orm";
import { productos } from "@/db/schema";
import { sql } from "drizzle-orm";
import { productoCategorias } from "@/db/schema";

async function slugOcupado(slug: string, excluirId?: number) {
  const condicion = excluirId
    ? and(eq(categorias.slug, slug), ne(categorias.id, excluirId))
    : eq(categorias.slug, slug);
  const [fila] = await db
    .select({ id: categorias.id })
    .from(categorias)
    .where(condicion)
    .limit(1);
  return Boolean(fila);
}

export async function guardarCategoria(
  id: number | null,
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin();

  const resultado = esquemaCategoria.safeParse(Object.fromEntries(formData));
  if (!resultado.success) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados",
      errores: z.flattenError(resultado.error).fieldErrors,
    };
  }

  const datos = resultado.data;

  if (await slugOcupado(datos.slug, id ?? undefined)) {
    return {
      ok: false,
      mensaje: "Revisa los campos marcados",
      errores: { slug: ["Ya existe una categoría con este identificador"] },
    };
  }

  if (id) {
    await db.update(categorias).set(datos).where(eq(categorias.id, id));
  } else {
    await db.insert(categorias).values(datos);
  }

  updateTag("categorias");
  redirect("/admin/categorias");
}

export async function eliminarCategoria(id: number) {
  await requireAdmin();

  const resultado = await db.execute<{ total: number }>(sql`
    SELECT count(*)::int AS total
    FROM producto_categorias pc
    WHERE pc.categoria_id = ${id}
      AND NOT EXISTS (
        SELECT 1 FROM producto_categorias otra
        WHERE otra.producto_id = pc.producto_id AND otra.categoria_id <> ${id}
      )
  `);
  const total = resultado.rows[0]?.total ?? 0;

  if (total > 0) {
    return {
      ok: false,
      mensaje: `No se puede eliminar: ${total} producto(s) solo están en esta categoría. Asígnales otra primero.`,
    };
  }

  await db.transaction(async (tx) => {
    await tx
      .delete(productoCategorias)
      .where(eq(productoCategorias.categoriaId, id));
    await tx.delete(categorias).where(eq(categorias.id, id));
  });

  updateTag("categorias");
  updateTag("productos");
  redirect("/admin/categorias");
}
