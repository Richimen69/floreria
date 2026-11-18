import 'server-only'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { nextCookies } from 'better-auth/next-js'
import { db } from '@/db'
import * as schema from '@/db/schema'
import { enviarCorreo } from '@/lib/correo'
import { recuperarContrasena } from '@/lib/correos/plantillas'
import { obtenerAjustes } from '@/server/consultas/ajustes'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg', schema }),
  trustedOrigins: process.env.BETTER_AUTH_TRUSTED_ORIGINS?.split(',') ?? [],
  emailAndPassword: {
    enabled: true,
    disableSignUp: false,
    minPasswordLength: 8,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hora
    sendResetPassword: async ({ user, url }) => {
      const a = await obtenerAjustes()
      const marca = { nombre: a.nombre, logoUrl: a.logoUrl, color: a.colorPrimario, sitioUrl: process.env.SITIO_URL ?? '' }
      // Sin await: así la respuesta tarda lo mismo exista o no la cuenta
      void enviarCorreo({ para: user.email, ...recuperarContrasena(marca, user.name, url) })
    },
  },
  advanced: {
    ipAddress: {
      ipAddressHeaders: ['cf-connecting-ip', 'x-forwarded-for'],
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,  // segundos
    max: 100,    // peticiones generales por minuto por IP
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },             // 5 intentos de login por minuto
      '/sign-up/email': { window: 60, max: 5 },
      '/request-password-reset': { window: 300, max: 3 },   // 3 correos de recuperación cada 5 min
    },
  },
  user: {
    additionalFields: {
      // input: false → nadie puede registrarse como admin desde el navegador
      role: { type: 'string', defaultValue: 'cliente', input: false },
      telefono: { type: 'string', required: false, input: true },
    },
  },
  plugins: [nextCookies()],
})