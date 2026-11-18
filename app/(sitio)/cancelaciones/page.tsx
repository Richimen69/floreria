import { PaginaLegalPublica, metadataLegal } from '@/components/sitio/PaginaLegalPublica'

export const generateMetadata = () => metadataLegal('cancelaciones')

export default function CancelacionesPage() {
  return <PaginaLegalPublica slug="cancelaciones" />
}