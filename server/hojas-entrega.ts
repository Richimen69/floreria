import 'server-only'
import QRCode from 'qrcode'
import sharp from 'sharp'
import type { DatosHoja } from '@/components/pdf/HojaEntrega'
import { fechaLarga } from '@/lib/fechas'
import { LUGARES } from '@/lib/lugares'
import type { obtenerPedidoAdmin } from '@/server/consultas/pedidos-admin'

type Pedido = NonNullable<Awaited<ReturnType<typeof obtenerPedidoAdmin>>>
type Ajustes = { nombre: string; telefono: string | null; whatsapp: string | null }

// Foto del producto lista para el PDF (JPG pequeño como data URL)
async function imagenParaPdf(url: string) {
  try {
    const r = await fetch(url)
    if (!r.ok) return null
    const jpg = await sharp(Buffer.from(await r.arrayBuffer()))
      .resize(240, 240, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer()
    return `data:image/jpeg;base64,${jpg.toString('base64')}`
  } catch {
    return null
  }
}

const formatoImpresion = new Intl.DateTimeFormat('es-MX', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/Mexico_City' })

export async function datosHojaEntrega(p: Pedido, a: Ajustes): Promise<DatosHoja> {
  const lugar = LUGARES[p.tipoLugar]
  const textoLugar =
    p.tipoLugar === 'casa'
      ? null
      : [
          `${lugar.texto}: ${p.nombreLugar ?? ''}`,
          p.detalleLugar,
          p.relacionLugar ? lugar.relaciones?.[p.relacionLugar] : null,
        ]
          .filter(Boolean)
          .join(' · ')

  const qr =
    p.entregaLatitud != null && p.entregaLongitud != null
      ? await QRCode.toDataURL(`https://www.google.com/maps/dir/?api=1&destination=${p.entregaLatitud},${p.entregaLongitud}`, {
          margin: 1,
          width: 240,
        })
      : null

  const productos = await Promise.all(
    p.items.map(async (i) => ({
      cantidad: i.cantidad,
      nombre: i.nombre,
      imagen: i.imagen ? await imagenParaPdf(i.imagen) : null,
    })),
  )

  const telefonos = [...new Set([a.telefono, a.whatsapp].filter(Boolean))].join(' / ') || 'ver directorio'

  return {
    folio: p.folio,
    fechaTexto: fechaLarga(p.fechaEntrega),
    horario: `${p.bloqueInicio} a ${p.bloqueFin}`,
    destinatarioNombre: p.destinatarioNombre ?? '',
    destinatarioTelefono: p.destinatarioTelefono ?? '',
    lugar: textoLugar,
    direccion: [p.calle ?? '', `${p.coloniaNombre ?? ''}, C.P. ${p.cp ?? ''}`, 'Acapulco de Juárez, Guerrero'],
    referencias: p.referencias,
    zona: p.zonaNombre,
    tarjeta: {
      enBlanco: p.tarjetaEnBlanco,
      para: p.paraTarjeta,
      mensaje: p.mensajeTarjeta,
      firma: p.firmaTarjeta,
      anonimo: p.anonimo,
    },
    notas: p.notas,
    productos,
    qr,
    floreria: { nombre: a.nombre, telefonos },
    impresoEn: formatoImpresion.format(new Date()),
  }
}