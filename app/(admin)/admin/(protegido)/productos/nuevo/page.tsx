import { FormProducto } from "@/components/admin/FormProducto";
import { listarCategorias } from "@/server/consultas/categorias";
import { listarOpcionesComplemento } from "@/server/consultas/productos";

export default async function NuevoProductoPage() {
  const [categorias, opciones] = await Promise.all([
    listarCategorias(),
    listarOpcionesComplemento(),
  ]);
  return (
    <FormProducto categorias={categorias} opcionesComplemento={opciones} />
  );
}
