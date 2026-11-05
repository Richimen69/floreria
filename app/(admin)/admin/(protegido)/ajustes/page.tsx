import { FormAjustes } from '@/components/admin/FormAjustes'
import { obtenerAjustes } from '@/server/consultas/ajustes'

export default async function AjustesPage() {
  const ajustes = await obtenerAjustes()
  return <FormAjustes ajustes={ajustes} />
}