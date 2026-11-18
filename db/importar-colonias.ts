import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { colonias } from './schema'

async function main() {
  const [ruta, municipio = 'Acapulco de Juárez'] = process.argv.slice(2)
  if (!ruta) {
    console.error('Uso: npm run importar-colonias -- ruta/al/archivo.txt ["Municipio"]')
    process.exit(1)
  }

  // El archivo de Correos viene en codificación Latin-1, no UTF-8
  const texto = new TextDecoder('latin1').decode(readFileSync(ruta))
  const lineas = texto.split(/\r?\n/).filter(Boolean)

  const filaEncabezado = lineas.findIndex((l) => l.startsWith('d_codigo'))
  if (filaEncabezado === -1) throw new Error('No se encontró el encabezado; ¿es el TXT de Correos de México?')

  const columnas = lineas[filaEncabezado].split('|')
  const col = (nombre: string) => columnas.indexOf(nombre)

  const filas = lineas
    .slice(filaEncabezado + 1)
    .map((l) => l.split('|'))
    .filter((c) => c[col('D_mnpio')] === municipio)
    .map((c) => ({
      nombre: c[col('d_asenta')].trim(),
      tipo: c[col('d_tipo_asenta')].trim() || null,
      cp: c[col('d_codigo')].trim(),
    }))

  if (filas.length === 0) {
    const municipios = new Set(lineas.slice(filaEncabezado + 1).map((l) => l.split('|')[col('D_mnpio')]))
    console.error(`No hay colonias para "${municipio}". Municipios en el archivo:`, [...municipios].slice(0, 20))
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  try {
    for (let i = 0; i < filas.length; i += 500) {
      await db.insert(colonias).values(filas.slice(i, i + 500)).onConflictDoNothing()
    }
    console.log(`${filas.length} colonias procesadas para ${municipio} (las repetidas se omiten)`)
  } finally {
    await pool.end()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})