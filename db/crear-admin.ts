import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { hashPassword } from 'better-auth/crypto'
import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { account, user } from './schema'

async function main() {
  const [email, password, name = 'Administrador'] = process.argv.slice(2)

  if (!email || !password || password.length < 8) {
    console.error('Uso: npm run crear-admin -- correo@ejemplo.com contraseña "Nombre"')
    console.error('La contraseña debe tener al menos 8 caracteres.')
    process.exit(1)
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)
  const userId = randomUUID()

  try {
    await db.transaction(async (tx) => {
      await tx.insert(user).values({
        id: userId,
        name,
        email: email.toLowerCase(),
        emailVerified: true,
        role: 'admin',
      })
      await tx.insert(account).values({
        id: randomUUID(),
        accountId: userId,
        providerId: 'credential',
        userId,
        password: await hashPassword(password),
      })
    })
    console.log(`Admin creado: ${email}`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})