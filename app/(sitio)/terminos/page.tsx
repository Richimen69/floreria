import { PaginaLegalPublica, metadataLegal } from '@/components/sitio/PaginaLegalPublica'

export const generateMetadata = () => metadataLegal('terminos')

export default function TerminosPage() {
  return <PaginaLegalPublica slug="terminos" />
}