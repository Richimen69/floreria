import { FormTemporada } from '@/components/admin/FormTemporada'
import { listarOpcionesComplemento } from '@/server/consultas/productos'

export default async function NuevaTemporadaPage() {
  const productos = await listarOpcionesComplemento()
  return <FormTemporada productos={productos} />
}