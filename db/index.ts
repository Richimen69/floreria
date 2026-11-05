import 'server-only'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// En desarrollo, Next.js recarga módulos y crearía una conexión nueva cada vez.
// Guardamos el pool en globalThis para reutilizarlo.
const globalParaDb = globalThis as unknown as { pool?: Pool }

const pool =
  globalParaDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL })

if (process.env.NODE_ENV !== 'production') globalParaDb.pool = pool

export const db = drizzle(pool, { schema })