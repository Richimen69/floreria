import { Suspense } from "react";
import { notFound } from "next/navigation";
import { FormProducto } from "@/components/admin/FormProducto";
import { EsqueletoFormulario } from "@/components/admin/EsqueletoFormulario";
import { listarCategorias } from "@/server/consultas/categorias";
import { obtenerProducto } from "@/server/consultas/productos";
import { listarOpcionesComplemento } from "@/server/consultas/productos";

type Props = { params: Promise<{ id: string }> };

async function Contenido({ params }: Props) {
  const { id } = await params;
  const numero = Number(id);
  if (!Number.isInteger(numero)) notFound();

  const [producto, categorias, opciones] = await Promise.all([
    obtenerProducto(numero),
    listarCategorias(),
    listarOpcionesComplemento(),
  ]);
  if (!producto) notFound();

  return (
    <FormProducto
      producto={producto}
      categorias={categorias}
      opcionesComplemento={opciones}
    />
  );
}

export default function EditarProductoPage({ params }: Props) {
  return (
    <Suspense fallback={<EsqueletoFormulario />}>
      <Contenido params={params} />
    </Suspense>
  );
}
