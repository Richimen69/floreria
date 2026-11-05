import { FormProducto } from '@/components/admin/FormProducto'
import { listarCategorias } from '@/server/consultas/categorias'

export default async function NuevoProductoPage() {
  const categorias = await listarCategorias()
  return <FormProducto categorias={categorias} />
}