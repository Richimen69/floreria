import 'server-only'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { connection } from 'next/server'
import { auth } from './auth'

export async function obtenerSesion() {
  // La sesión depende de cada visita: nunca se pre-renderiza
  await connection()
  return auth.api.getSession({ headers: await headers() })
}

export async function requireAdmin() {
  const sesion = await obtenerSesion()
  if (!sesion || sesion.user.role !== 'admin') {
    redirect('/admin/login')
  }
  return sesion
}