import 'dotenv/config'
import { eq, isNull } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { colonias } from './schema'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool)

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
// Rectángulo alrededor de Acapulco: oeste, norte, este, sur
const CAJA_ACAPULCO = '-100.10,17.10,-99.50,16.60'
const AGENTE = 'FloresEnAcapulco/1.0 (pedidos@floresenacapulco.com)'

type Punto = { lat: number; lng: number }

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function buscar(parametros: Record<string, string>): Promise<Punto | null> {
    const url = new URL(NOMINATIM)
    for (const [k, v] of Object.entries({
        format: 'jsonv2',
        limit: '1',
        countrycodes: 'mx',
        viewbox: CAJA_ACAPULCO,
        bounded: '1',
        ...parametros,
    })) {
        url.searchParams.set(k, v)
    }

    await esperar(1100) // máximo una consulta por segundo
    const r = await fetch(url, { headers: { 'User-Agent': AGENTE, 'Accept-Language': 'es' } })
    if (!r.ok) throw new Error(`Nominatim respondió ${r.status}`)
    const [primero] = (await r.json()) as { lat: string; lon: string }[]
    return primero ? { lat: Number(primero.lat), lng: Number(primero.lon) } : null
}

async function main() {
    const pendientes = await db.select().from(colonias).where(isNull(colonias.latitud))
    console.log(`${pendientes.length} colonias sin coordenadas`)

    const porCp = new Map<string, Punto | null>()
    let porNombre = 0
    let porCodigo = 0
    let sinUbicar = 0

    for (const [i, c] of pendientes.entries()) {
        // 1) Por nombre de la colonia
        let punto = await buscar({ q: `${c.nombre}, ${c.cp}, Acapulco de Juárez, Guerrero` })
        if (punto) {
            porNombre++
        } else {
            // 2) Por código postal (se busca una sola vez por CP)
            if (!porCp.has(c.cp)) porCp.set(c.cp, await buscar({ postalcode: c.cp }))
            punto = porCp.get(c.cp) ?? null
            if (punto) porCodigo++
            else sinUbicar++
        }

        if (punto) {
            await db.update(colonias).set({ latitud: punto.lat, longitud: punto.lng }).where(eq(colonias.id, c.id))
        }
        if ((i + 1) % 25 === 0) console.log(`  ${i + 1} / ${pendientes.length}`)
    }

    console.log(`Listo: ${porNombre} por nombre, ${porCodigo} por código postal, ${sinUbicar} sin ubicar`)
    await pool.end()
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})