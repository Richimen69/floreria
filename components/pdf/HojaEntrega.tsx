import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

export type DatosHoja = {
  folio: string
  fechaTexto: string
  horario: string
  destinatarioNombre: string
  destinatarioTelefono: string
  lugar: string | null
  direccion: string[]
  referencias: string | null
  zona: string | null
  tarjeta: { enBlanco: boolean; para: string | null; mensaje: string | null; firma: string | null; anonimo: boolean }
  notas: string | null
  productos: { cantidad: number; nombre: string; imagen: string | null }[]
  qr: string | null
  floreria: { nombre: string; telefonos: string }
  impresoEn: string
}

const s = StyleSheet.create({
  pagina: { padding: 28, fontSize: 9, fontFamily: 'Helvetica', color: '#111' },
  arriba: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 7, color: '#555', marginBottom: 6 },
  checklist: { borderWidth: 1, borderColor: '#111', padding: 8, marginBottom: 10 },
  checklistTitulo: { fontFamily: 'Helvetica-Bold', fontSize: 11, textAlign: 'center', marginBottom: 6 },
  checkFila: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  casilla: { width: 9, height: 9, borderWidth: 1, borderColor: '#111', marginRight: 6 },
  checkTexto: { fontSize: 7.5, textTransform: 'uppercase' },
  titulo: { fontFamily: 'Helvetica-Bold', fontSize: 12, textAlign: 'center', marginVertical: 6 },
  encabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  negrita: { fontFamily: 'Helvetica-Bold' },
  folio: { fontFamily: 'Helvetica-Bold', fontSize: 13, textAlign: 'right' },
  horario: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#b91c1c', textAlign: 'right' },
  caja: { borderWidth: 1, borderColor: '#999', marginBottom: 8 },
  fila: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc' },
  celda: { flex: 1, padding: 6 },
  celdaBorde: { flex: 1, padding: 6, borderLeftWidth: 1, borderColor: '#ccc' },
  etiqueta: { fontSize: 7, color: '#555', textTransform: 'uppercase', marginBottom: 2 },
  qrCaja: { width: 92, padding: 6, borderLeftWidth: 1, borderColor: '#ccc', alignItems: 'center' },
  qr: { width: 76, height: 76 },
  qrTexto: { fontSize: 6.5, textAlign: 'center', color: '#555', marginTop: 2 },
  mensaje: { fontSize: 10, fontFamily: 'Helvetica-Oblique', marginTop: 2 },
  tabla: { borderWidth: 1, borderColor: '#999', marginBottom: 16 },
  tablaEncabezado: { flexDirection: 'row', backgroundColor: '#eee', borderBottomWidth: 1, borderColor: '#999' },
  colCantidad: { width: 60, padding: 6, textAlign: 'center' },
  colFoto: { width: 80, padding: 6 },
  colDescripcion: { flex: 1, padding: 6 },
  foto: { width: 64, height: 64, objectFit: 'cover' },
  firmas: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 },
  firma: { width: '45%', borderTopWidth: 1, borderColor: '#111', paddingTop: 4, fontSize: 8, textAlign: 'center' },
})

export function HojaEntrega({ d }: { d: DatosHoja }) {
  const checklist = [
    'Arreglo completo y en perfectas condiciones',
    'Complementos completos y correctos (globos, chocolates, peluches, vino, etc.)',
    'Tarjeta con el mensaje correcto y que coincide con el número de pedido',
    'Fecha y horario de entrega correctos',
    'Domicilio completo verificado',
    'Solicitar nombre, firma y parentesco de quien recibe',
    `Si no hay quien reciba o el destinatario no contesta, llamar a la florería: ${d.floreria.telefonos}`,
    `Al entregar, reportarlo a la florería por llamada o WhatsApp: ${d.floreria.telefonos}`,
  ]

  return (
    <Page size="LETTER" style={s.pagina}>
      <View style={s.arriba}>
        <Text>{d.floreria.nombre}</Text>
        <Text>Impreso: {d.impresoEn}</Text>
      </View>

      {/* Checklist */}
      <View style={s.checklist}>
        <Text style={s.checklistTitulo}>IMPORTANTE: VALIDAR ANTES DE SALIR A RUTA</Text>
        {checklist.map((t) => (
          <View key={t} style={s.checkFila}>
            <View style={s.casilla} />
            <Text style={s.checkTexto}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={s.titulo}>INFORMACIÓN DE ENTREGA</Text>

      <View style={s.encabezado}>
        <Text style={{ fontSize: 11 }}>
          <Text style={s.negrita}>Fecha de entrega: </Text>
          {d.fechaTexto}
        </Text>
        <View>
          <Text style={s.folio}>Pedido {d.folio}</Text>
          <Text style={s.horario}>Horario: {d.horario}</Text>
        </View>
      </View>

      {/* Quién recibe y dónde */}
      <View style={s.caja}>
        <View style={s.fila}>
          <View style={s.celda}>
            <Text style={s.etiqueta}>Recibe</Text>
            <Text style={s.negrita}>{d.destinatarioNombre}</Text>
          </View>
          <View style={s.celdaBorde}>
            <Text style={s.etiqueta}>Teléfono</Text>
            <Text style={s.negrita}>{d.destinatarioTelefono}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <View style={s.celda}>
            <Text style={s.etiqueta}>Domicilio</Text>
            {d.lugar && <Text style={s.negrita}>{d.lugar}</Text>}
            {d.direccion.map((linea) => <Text key={linea}>{linea}</Text>)}
            {d.zona && <Text style={{ color: '#555', marginTop: 2 }}>Zona: {d.zona}</Text>}
          </View>
          <View style={s.celdaBorde}>
            <Text style={s.etiqueta}>Referencias</Text>
            <Text>{d.referencias || 'Sin referencias'}</Text>
          </View>
          {d.qr && (
            <View style={s.qrCaja}>
              <Image src={d.qr} style={s.qr} />
              <Text style={s.qrTexto}>Escanea para abrir la ruta</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tarjeta */}
      <View style={[s.caja, { padding: 6 }]}>
        <Text style={s.etiqueta}>Mensaje de la tarjeta</Text>
        {d.tarjeta.enBlanco ? (
          <Text style={s.negrita}>TARJETA EN BLANCO</Text>
        ) : d.tarjeta.mensaje ? (
          <>
            {d.tarjeta.para && <Text>Para: {d.tarjeta.para}</Text>}
            <Text style={s.mensaje}>{d.tarjeta.mensaje}</Text>
            <Text style={{ marginTop: 3 }}>{d.tarjeta.anonimo ? '— Anónimo' : d.tarjeta.firma ? `— ${d.tarjeta.firma}` : ''}</Text>
          </>
        ) : (
          <Text>Sin tarjeta</Text>
        )}
      </View>

      {d.notas && (
        <View style={[s.caja, { padding: 6 }]}>
          <Text style={s.etiqueta}>Comentarios del cliente</Text>
          <Text>{d.notas}</Text>
        </View>
      )}

      {/* Productos, sin precios */}
      <View style={s.tabla}>
        <View style={s.tablaEncabezado}>
          <Text style={[s.colCantidad, s.negrita]}>Cantidad</Text>
          <Text style={[s.colFoto, s.negrita]}>Foto</Text>
          <Text style={[s.colDescripcion, s.negrita]}>Descripción</Text>
        </View>
        {d.productos.map((p, i) => (
          <View key={i} style={[{ flexDirection: 'row', alignItems: 'center' }, i > 0 ? { borderTopWidth: 1, borderColor: '#ccc' } : {}]}>
            <Text style={[s.colCantidad, { fontSize: 14, fontFamily: 'Helvetica-Bold' }]}>{p.cantidad}</Text>
            <View style={s.colFoto}>{p.imagen && <Image src={p.imagen} style={s.foto} />}</View>
            <Text style={[s.colDescripcion, { fontSize: 10 }]}>{p.nombre}</Text>
          </View>
        ))}
      </View>

      <View style={s.firmas} wrap={false}>
        <Text style={s.firma}>Nombre, firma y parentesco de quien recibe</Text>
        <Text style={s.firma}>Fecha y hora de entrega</Text>
      </View>
    </Page>
  )
}

export function DocumentoEntregas({ hojas }: { hojas: DatosHoja[] }) {
  return (
    <Document title={hojas.length === 1 ? `Entrega ${hojas[0].folio}` : 'Entregas'}>
      {hojas.map((d) => <HojaEntrega key={d.folio} d={d} />)}
    </Document>
  )
}