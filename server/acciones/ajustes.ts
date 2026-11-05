'use server'

import { eq } from 'drizzle-orm'
import { updateTag } from 'next/cache'
import { z } from 'zod'
import { db } from '@/db'
import { ajustesSitio } from '@/db/schema'
import { requireAdmin } from '@/lib/permisos'
import { esquemaAjustes, type EstadoFormulario } from '@/lib/validaciones/ajustes'

export async function guardarAjustes(
  _estadoPrevio: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  await requireAdmin()

  const resultado = esquemaAjustes.safeParse(Object.fromEntries(formData))

  if (!resultado.success) {
    return {
      ok: false,
      mensaje: 'Revisa los campos marcados',
      errores: z.flattenError(resultado.error).fieldErrors,
    }
  }

  await db.update(ajustesSitio).set(resultado.data).where(eq(ajustesSitio.id, 1))
  updateTag('ajustes')

  return { ok: true, mensaje: 'Cambios guardados' }
}