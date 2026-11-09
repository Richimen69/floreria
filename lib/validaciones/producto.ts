import { z } from "zod";
import { generarSlug } from "@/lib/utils";

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on");

const pesosACentavos = z
  .string()
  .trim()
  .refine(
    (v) => /^\d+(\.\d{1,2})?$/.test(v),
    "Escribe un precio válido, ej. 650 o 650.50",
  )
  .transform((v) => Math.round(Number(v) * 100));

const fechaOpcional = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Fecha no válida")
  .transform((v) => (v === "" ? null : v));

const listaIds = z.array(z.coerce.number().int().positive());

export const esquemaProducto = z
  .object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio").max(120),
    slug: z.string().trim().max(120),
    descripcion: z
      .string()
      .trim()
      .max(2000)
      .transform((v) => (v === "" ? null : v)),
    categoriaIds: listaIds.min(1, "Elige al menos una categoría"),
    complementoIds: listaIds.max(12, "Máximo 12 complementos"),
    precio: pesosACentavos.refine((v) => v > 0, "El precio debe ser mayor a 0"),
    ofertaDesde: fechaOpcional,
    ofertaHasta: fechaOpcional,
    precioOferta: z.union([
      z.literal("").transform(() => null),
      pesosACentavos,
    ]),
    imagenes: z
      .array(z.string().refine((v) => URL.canParse(v)))
      .max(8, "Máximo 8 imágenes"),
    diasAnticipacion: z.coerce
      .number()
      .int("Debe ser un número entero")
      .min(0)
      .max(60, "Máximo 60 días"),
    controlarExistencias: checkbox,
    existencias: z.coerce
      .number()
      .int("Debe ser un número entero")
      .min(0, "No puede ser negativo")
      .max(99999),
    orden: z.coerce.number().int().min(0).max(999),
    activo: checkbox,
    disponible: checkbox,
    destacado: checkbox,
  })
  .refine((d) => d.precioOferta == null || d.precioOferta < d.precio, {
    path: ["precioOferta"],
    message: "El precio de oferta debe ser menor al precio normal",
  })
  .refine((d) => d.precioOferta == null || d.ofertaHasta != null, {
    path: ["ofertaHasta"],
    message: "Indica hasta cuándo es válida la oferta",
  })
  .refine(
    (d) => !d.ofertaDesde || !d.ofertaHasta || d.ofertaDesde <= d.ofertaHasta,
    {
      path: ["ofertaHasta"],
      message: "El vencimiento debe ser igual o posterior al inicio",
    },
  )
  .transform(
    ({ precio, precioOferta, categoriaIds, complementoIds, ...resto }) => ({
      producto: {
        ...resto,
        slug: generarSlug(resto.slug || resto.nombre),
        precioCentavos: precio,
        precioOfertaCentavos: precioOferta,
      },
      categoriaIds: [...new Set(categoriaIds)],
      complementoIds: [...new Set(complementoIds)],
    }),
  );

// Los campos que se repiten (imágenes, categorías, complementos) no caben en Object.fromEntries
export function leerFormProducto(formData: FormData) {
  const lista = (campo: string) =>
    formData.getAll(campo).map(String).filter(Boolean);
  return {
    ...Object.fromEntries(formData),
    imagenes: lista("imagenes"),
    categoriaIds: lista("categoriaIds"),
    complementoIds: lista("complementoIds"),
    existencias: formData.get("existencias") || "0",
  };
}
