import type { Metadata } from 'next'
import { Fraunces, DM_Sans } from 'next/font/google'
import { obtenerAjustes } from '@/server/consultas/ajustes'
import { esOscuro, textoSobre } from '@/lib/colores'
import './globals.css'

const titulos = Fraunces({ subsets: ['latin'], variable: '--fuente-titulos' })
const texto = DM_Sans({ subsets: ['latin'], variable: '--fuente-texto' })

export const metadata: Metadata = { title: 'Florería' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const a = await obtenerAjustes()

  const variables = {
    '--marca': a.colorPrimario,
    '--acento': a.colorAcento,
    '--fondo': a.colorFondo,
    '--texto-sobre-marca': textoSobre(a.colorPrimario),
    '--texto-sobre-acento': textoSobre(a.colorAcento),
    '--texto': esOscuro(a.colorFondo) ? '#f5efe9' : '#2b2420',
  } as React.CSSProperties

  return (
    <html lang="es-MX" className={`${titulos.variable} ${texto.variable}`} style={variables}>
      <body className="antialiased">{children}</body>
    </html>
  )
}