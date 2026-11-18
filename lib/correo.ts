import 'server-only'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export type Correo = {
  para: string | string[]
  asunto: string
  html: string
  texto: string
  responderA?: string | null
}

// Nunca lanza error: un correo fallido no debe romper un pedido
export async function enviarCorreo(c: Correo) {
  if (!resend) {
    console.log(`[correo no enviado: falta RESEND_API_KEY] Para: ${c.para} · ${c.asunto}`)
    return
  }
  try {
    const { error } = await resend.emails.send({
      from: process.env.CORREO_REMITENTE!,
      to: c.para,
      subject: c.asunto,
      html: c.html,
      text: c.texto,
      replyTo: c.responderA ?? undefined,
    })
    if (error) console.error('Error al enviar correo:', c.asunto, error)
  } catch (e) {
    console.error('Error al enviar correo:', c.asunto, e)
  }
}