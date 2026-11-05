import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'
import * as schema from '@/db/schema'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? [],
  emailAndPassword: {
    enabled: true,
    // Nadie puede registrarse por sí mismo por ahora.
    // Lo abriremos cuando hagamos las cuentas de clientes.
    disableSignUp: true,
  },
  user: {
    additionalFields: {
      role: { type: 'string', defaultValue: 'cliente', input: false },
    },
  },
  plugins: [nextCookies()], // debe ir siempre al final
})