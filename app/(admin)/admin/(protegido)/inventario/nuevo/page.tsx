import { FormInsumo } from '@/components/admin/FormInsumo'
import { listarCategoriasInsumo } from '@/server/consultas/inventario'

export default async function NuevoInsumoPage() {
  const categorias = await listarCategoriasInsumo()
  return <FormInsumo categorias={categorias} />
}