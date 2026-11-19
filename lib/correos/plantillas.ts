import { formatearPrecio } from '@/lib/utils'

export type Marca = { nombre: string; logoUrl: string | null; color: string; sitioUrl: string }

// Todo texto que escribió un usuario se escapa para que no inyecte HTML
export function escapar(texto: string | null | undefined) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

function boton(url: string, texto: string, color: string) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${color};border-radius:999px">
    <a href="${url}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-weight:600;text-decoration:none;font-family:Arial,sans-serif;font-size:15px">${escapar(texto)}</a>
  </td></tr></table>`
}

function filas(datos: [string, string][]) {
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-collapse:collapse">
    ${datos
            .map(
                ([k, v]) => `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#777;font-size:14px">${escapar(k)}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:#222;font-size:14px;font-weight:600;text-align:right">${escapar(v)}</td>
        </tr>`,
            )
            .join('')}
  </table>`
}

function plantilla(m: Marca, titulo: string, cuerpo: string) {
    const encabezado = m.logoUrl
        ? `<img src="${m.logoUrl}" alt="${escapar(m.nombre)}" height="48" style="height:48px">`
        : `<span style="font-size:22px;font-weight:700;color:${m.color}">${escapar(m.nombre)}</span>`

    return `<!doctype html><html lang="es"><body style="margin:0;background:#f6f2ef;font-family:Arial,sans-serif;color:#222">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px">
        <tr><td style="padding:28px 28px 0">${encabezado}</td></tr>
        <tr><td style="padding:20px 28px 28px">
          <h1 style="margin:0 0 12px;font-size:22px;color:#222">${escapar(titulo)}</h1>
          ${cuerpo}
        </td></tr>
      </table>
        <p style="color:#999;font-size:12px;margin:16px 0 0">
        ${escapar(m.nombre)} · <a href="${m.sitioUrl}" style="color:#999">${m.sitioUrl.replace(/^https?:\/\//, '')}</a>
        · <a href="${m.sitioUrl}/aviso-de-privacidad" style="color:#999">Aviso de privacidad</a>
        </p>
    </td></tr></table>
  </body></html>`
}

const p = (texto: string) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.5">${texto}</p>`

// ───────── Datos de un pedido que usan las plantillas ─────────

export type PedidoCorreo = {
    folio: string
    token: string
    compradorNombre: string
    totalCentavos: number
    fechaTexto: string // 'lunes, 10 de mayo'
    bloque: string     // '09:00 a 12:00'
    destinatarioNombre: string | null
    direccion: string
    productos: { nombre: string; cantidad: number }[]
}

function resumenPedido(ped: PedidoCorreo) {
    return filas([
        ['Folio', ped.folio],
        ['Entrega', `${ped.fechaTexto}, ${ped.bloque}`],
        ['Para', ped.destinatarioNombre ?? ''],
        ['Dirección', ped.direccion],
        ...ped.productos.map((x) => [`${x.cantidad} ×`, x.nombre] as [string, string]),
        ['Total', formatearPrecio(ped.totalCentavos)],
    ])
}

// ───────── Al cliente ─────────

export function pedidoRecibido(
    m: Marca,
    ped: PedidoCorreo,
    pago: { banco: string; titular: string; clabe: string; horaLimite: string },
) {
    const url = `${m.sitioUrl}/pedido/${ped.token}`
    return {
        asunto: `Pedido ${ped.folio} recibido: completa tu pago`,
        html: plantilla(
            m,
            `¡Gracias, ${ped.compradorNombre}!`,
            p(`Recibimos tu pedido <strong>${escapar(ped.folio)}</strong>. Para confirmarlo, haz tu transferencia y sube el comprobante <strong>antes de las ${escapar(pago.horaLimite)}</strong>. Si no lo recibimos a tiempo, el pedido se cancela y el horario se libera.`) +
            filas([
                ['Banco', pago.banco],
                ['Titular', pago.titular],
                ['CLABE', pago.clabe],
                ['Monto exacto', formatearPrecio(ped.totalCentavos)],
                ['Concepto', ped.folio],
            ]) +
            boton(url, 'Subir mi comprobante', m.color) +
            resumenPedido(ped),
        ),
        texto: `Recibimos tu pedido ${ped.folio}. Transfiere ${formatearPrecio(ped.totalCentavos)} a la CLABE ${pago.clabe} (${pago.banco}, ${pago.titular}) con el concepto ${ped.folio}, y sube tu comprobante antes de las ${pago.horaLimite} en: ${url}`,
    }
}

export function comprobanteRecibido(m: Marca, ped: PedidoCorreo) {
    const url = `${m.sitioUrl}/pedido/${ped.token}`
    return {
        asunto: `Recibimos tu comprobante · ${ped.folio}`,
        html: plantilla(
            m,
            'Recibimos tu comprobante',
            p(`Estamos verificando tu pago del pedido <strong>${escapar(ped.folio)}</strong>. Te avisaremos en cuanto se confirme.`) +
            boton(url, 'Ver mi pedido', m.color),
        ),
        texto: `Recibimos tu comprobante del pedido ${ped.folio}. Lo estamos verificando. Puedes ver tu pedido en: ${url}`,
    }
}

export function pagoConfirmado(m: Marca, ped: PedidoCorreo) {
    const url = `${m.sitioUrl}/pedido/${ped.token}`
    return {
        asunto: `Pago confirmado · ${ped.folio}`,
        html: plantilla(
            m,
            '¡Tu pago está confirmado!',
            p(`Ya estamos preparando tu pedido <strong>${escapar(ped.folio)}</strong>. Lo entregaremos el ${escapar(ped.fechaTexto)}, entre ${escapar(ped.bloque)}.`) +
            resumenPedido(ped) +
            boton(url, 'Ver mi pedido', m.color),
        ),
        texto: `Tu pago del pedido ${ped.folio} está confirmado. Entrega: ${ped.fechaTexto}, ${ped.bloque}. Detalles: ${url}`,
    }
}

export function pedidoCancelado(m: Marca, ped: PedidoCorreo, motivo: 'rechazado' | 'vencido' | 'cancelado', detalle: string | null) {
    const url = `${m.sitioUrl}/pedido/${ped.token}`
    const explicacion =
        motivo === 'vencido'
            ? 'No recibimos tu comprobante a tiempo, así que el pedido se canceló y el horario se liberó.'
            : motivo === 'rechazado'
                ? `No pudimos confirmar tu pago${detalle ? `: ${escapar(detalle)}` : '.'}`
                : `Tu pedido fue cancelado${detalle ? `: ${escapar(detalle)}` : '.'}`

    return {
        asunto: `Pedido ${ped.folio} cancelado`,
        html: plantilla(
            m,
            'Tu pedido se canceló',
            p(explicacion) + p('Si aún lo necesitas, puedes volver a pedirlo y elegir otro horario.') + boton(url, 'Volver a pedir', m.color),
        ),
        texto: `${explicacion.replace(/<[^>]+>/g, '')} Puedes volver a pedir en: ${url}`,
    }
}

export function recuperarContrasena(m: Marca, nombre: string, url: string) {
    return {
        asunto: 'Crea una nueva contraseña',
        html: plantilla(
            m,
            `Hola, ${nombre}`,
            p('Recibimos una solicitud para cambiar tu contraseña. El enlace es válido durante 1 hora.') +
            boton(url, 'Crear nueva contraseña', m.color) +
            p('<span style="color:#777;font-size:13px">Si no lo pediste tú, ignora este correo; tu contraseña no cambiará.</span>'),
        ),
        texto: `Para crear una nueva contraseña entra a: ${url} (válido 1 hora). Si no lo pediste, ignora este correo.`,
    }
}

// ───────── A la florería ─────────

export function avisoFloreria(m: Marca, titulo: string, ped: PedidoCorreo, urlPanel: string) {
    return {
        asunto: `${titulo} · ${ped.folio}`,
        html: plantilla(m, titulo, resumenPedido(ped) + boton(urlPanel, 'Abrir en el panel', m.color)),
        texto: `${titulo}: ${ped.folio}, ${formatearPrecio(ped.totalCentavos)}, entrega ${ped.fechaTexto} ${ped.bloque}. Panel: ${urlPanel}`,
    }
}

export function pedidoEnCamino(m: Marca, ped: PedidoCorreo) {
    const url = `${m.sitioUrl}/pedido/${ped.token}`
    return {
        asunto: `Tu pedido va en camino · ${ped.folio}`,
        html: plantilla(
            m,
            '¡Tu pedido va en camino!',
            p(`Tu pedido <strong>${escapar(ped.folio)}</strong> ya salió y llegará entre ${escapar(ped.bloque)} a ${escapar(ped.direccion)}.`) +
            boton(url, 'Ver mi pedido', m.color),
        ),
        texto: `Tu pedido ${ped.folio} ya va en camino y llegará entre ${ped.bloque}. Detalles: ${url}`,
    }
}

export function pedidoEntregado(m: Marca, ped: PedidoCorreo) {
    return {
        asunto: `Pedido entregado · ${ped.folio}`,
        html: plantilla(
            m,
            '¡Tu pedido fue entregado!',
            p(`Entregamos tu pedido <strong>${escapar(ped.folio)}</strong>${ped.destinatarioNombre ? ` a ${escapar(ped.destinatarioNombre)}` : ''}. Gracias por confiar en nosotros.`) +
            boton(`${m.sitioUrl}/catalogo`, 'Ver más arreglos', m.color),
        ),
        texto: `Entregamos tu pedido ${ped.folio}${ped.destinatarioNombre ? ` a ${ped.destinatarioNombre}` : ''}. ¡Gracias por tu compra!`,
    }
}

export function pedidoRecibidoMercadoPago(m: Marca, ped: PedidoCorreo, horaLimite: string) {
  const url = `${m.sitioUrl}/pedido/${ped.token}`
  return {
    asunto: `Pedido ${ped.folio} recibido`,
    html: plantilla(
      m,
      `¡Gracias, ${ped.compradorNombre}!`,
      p(`Recibimos tu pedido <strong>${escapar(ped.folio)}</strong>. Si aún no completas el pago, hazlo <strong>antes de las ${escapar(horaLimite)}</strong>; si no, el pedido se cancela y el horario se libera.`) +
        boton(url, 'Ver mi pedido y pagar', m.color) +
        resumenPedido(ped),
    ),
    texto: `Recibimos tu pedido ${ped.folio}. Si aún no pagas, completa el pago antes de las ${horaLimite} en: ${url}`,
  }
}