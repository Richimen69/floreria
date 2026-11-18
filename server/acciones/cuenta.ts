'use server'

import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { user } from '@/db/schema'
import { obtenerSesion } from '@/lib/permisos'
import { legalesPublicadas } from '@/server/consultas/legales'

export async function registrarAceptacionLegal() {
  const sesion = await obtenerSesion()
  if (!sesion) return

  const legales = await legalesPublicadas()
  if (legales.length === 0) return

  await db
    .update(user)
    .set({
      privacidadVersionAceptada: legales.find((l) => l.slug === 'aviso-de-privacidad')?.version ?? null,
      legalesAceptadosEn: new Date(),
    })
    .where(eq(user.id, sesion.user.id))
}