import { PaginaLegalPublica, metadataLegal } from '@/components/sitio/PaginaLegalPublica'

export const generateMetadata = () => metadataLegal('aviso-de-privacidad')

export default function AvisoPrivacidadPage() {
  return <PaginaLegalPublica slug="aviso-de-privacidad" />
}