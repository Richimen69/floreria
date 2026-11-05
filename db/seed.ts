import 'dotenv/config'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { ajustesSitio } from './schema'

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  try {
    await db.insert(ajustesSitio).values({ id: 1, nombre: 'Florería' }).onConflictDoNothing()
    console.log('Ajustes iniciales listos')
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})