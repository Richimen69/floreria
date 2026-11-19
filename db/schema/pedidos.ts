import { sql } from 'drizzle-orm'
import { doublePrecision, boolean, date, index, integer, pgEnum, pgSequence, pgTable, serial, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { colonias } from './envios'
import { productos } from './productos'
import { user } from './auth'
export const estadoPago = pgEnum('estado_pago', [
    'pendiente', 'en_revision', 'pagado', 'rechazado', 'vencido', 'cancelado', 'reembolsado',
])
export const estadoTrabajo = pgEnum('estado_trabajo', ['nuevo', 'preparando', 'listo', 'en_camino', 'entregado', 'cancelado'])
export const origenPedido = pgEnum('origen_pedido', ['web', 'whatsapp', 'telefono', 'redes', 'tienda'])
export const tipoEntrega = pgEnum('tipo_entrega', ['envio', 'recoger'])
export const tipoLugar = pgEnum('tipo_lugar', ['casa', 'hotel', 'oficina', 'hospital', 'funeraria'])
export const metodoPago = pgEnum('metodo_pago', ['transferencia', 'mercadopago'])
export const folioPedidosSeq = pgSequence('folio_pedidos_seq', { startWith: 1 })
export const pedidos = pgTable(
    'pedidos',
    {
        id: serial('id').primaryKey(),
        folio: text('folio')
            .notNull()
            .unique()
            .default(sql`'MB-' || lpad(nextval('folio_pedidos_seq')::text, 4, '0')`),
        token: uuid('token').notNull().unique().defaultRandom(), // enlace privado para el cliente
        origen: origenPedido('origen').notNull().default('web'),
        estadoPago: estadoPago('estado_pago').notNull().default('pendiente'),
        estadoTrabajo: estadoTrabajo('estado_trabajo').notNull().default('nuevo'),
        metodoPago: metodoPago('metodo_pago').notNull().default('transferencia'),
        pagoVenceEn: timestamp('pago_vence_en', { withTimezone: true }), // límite para subir el comprobante
        mpPreferenciaId: text('mp_preferencia_id'), // el "enlace de pago" creado en Mercado Pago
        mpPagoId: text('mp_pago_id'),               // el pago aprobado (o el último intento)
        mpEstado: text('mp_estado'),                // último estado reportado por Mercado Pago
        mpDetalle: text('mp_detalle'),              // detalle del estado, para el panel
        pagoTardio: boolean('pago_tardio').notNull().default(false), // se aprobó cuando el pedido ya no estaba vigente
        comprobanteKey: text('comprobante_key'),                         // ruta en el bucket privado
        comprobanteTipo: text('comprobante_tipo'),
        comprobanteSubidoEn: timestamp('comprobante_subido_en', { withTimezone: true }),
        motivoRechazo: text('motivo_rechazo'),
        existenciasDevueltas: boolean('existencias_devueltas').notNull().default(false),
        // Quien compra
        compradorNombre: text('comprador_nombre').notNull(),
        compradorTelefono: text('comprador_telefono').notNull(),
        compradorEmail: text('comprador_email'),

        entregaLatitud: doublePrecision('entrega_latitud'),
        entregaLongitud: doublePrecision('entrega_longitud'),

        versionPrivacidad: integer('version_privacidad'),
        versionTerminos: integer('version_terminos'),
        versionCancelaciones: integer('version_cancelaciones'),
        legalesAceptadosEn: timestamp('legales_aceptados_en', { withTimezone: true }),

        // Entrega (por ahora siempre a domicilio)
        tipoEntrega: tipoEntrega('tipo_entrega').notNull().default('envio'),
        fechaEntrega: date('fecha_entrega', { mode: 'string' }).notNull(),
        bloqueInicio: text('bloque_inicio').notNull(),
        bloqueFin: text('bloque_fin').notNull(),
        destinatarioNombre: text('destinatario_nombre'),
        destinatarioTelefono: text('destinatario_telefono'),
        coloniaId: integer('colonia_id').references(() => colonias.id, { onDelete: 'set null' }),
        coloniaNombre: text('colonia_nombre'), // copia al momento de la compra
        cp: text('cp'),
        zonaNombre: text('zona_nombre'),
        calle: text('calle'),
        referencias: text('referencias'),
        usuarioId: text('usuario_id').references(() => user.id, { onDelete: 'set null' }),

        tipoLugar: tipoLugar('tipo_lugar').notNull().default('casa'),
        nombreLugar: text('nombre_lugar'),     // hotel, empresa, hospital o funeraria
        detalleLugar: text('detalle_lugar'),   // habitación, piso, sala…
        relacionLugar: text('relacion_lugar'), // huesped, paciente, familiar, trabajador

        // Tarjeta
        mensajeTarjeta: text('mensaje_tarjeta'),
        firmaTarjeta: text('firma_tarjeta'),
        anonimo: boolean('anonimo').notNull().default(false),
        notas: text('notas'),
        paraTarjeta: text('para_tarjeta'),
        tarjetaEnBlanco: boolean('tarjeta_en_blanco').notNull().default(false),

        // Importes (copia al momento de la compra)
        subtotalCentavos: integer('subtotal_centavos').notNull(),
        envioCentavos: integer('envio_centavos').notNull().default(0),
        totalCentavos: integer('total_centavos').notNull(),

        creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
        actualizadoEn: timestamp('actualizado_en', { withTimezone: true })
            .notNull()
            .defaultNow()
            .$onUpdate(() => sql`now()`),
    },
    (t) => [index('pedidos_entrega_idx').on(t.fechaEntrega, t.bloqueInicio)],
)

export const pedidoItems = pgTable('pedido_items', {
    id: serial('id').primaryKey(),
    pedidoId: integer('pedido_id')
        .notNull()
        .references(() => pedidos.id, { onDelete: 'cascade' }),
    productoId: integer('producto_id').references(() => productos.id, { onDelete: 'set null' }),
    nombre: text('nombre').notNull(),
    imagen: text('imagen'),
    cantidad: integer('cantidad').notNull(),
    precioUnitarioCentavos: integer('precio_unitario_centavos').notNull(),
    subtotalCentavos: integer('subtotal_centavos').notNull(),
    enOferta: boolean('en_oferta').notNull().default(false),
    deTemporada: boolean('de_temporada').notNull().default(false),
})

export type Pedido = typeof pedidos.$inferSelect

export const pedidoEventos = pgTable(
    'pedido_eventos',
    {
        id: serial('id').primaryKey(),
        pedidoId: integer('pedido_id')
            .notNull()
            .references(() => pedidos.id, { onDelete: 'cascade' }),
        tipo: text('tipo').notNull(), // 'creado' | 'pago' | 'trabajo' | 'cancelado'
        de: text('de'),
        a: text('a'),
        nota: text('nota'),
        usuarioId: text('usuario_id').references(() => user.id, { onDelete: 'set null' }),
        creadoEn: timestamp('creado_en', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [index('pedido_eventos_pedido_idx').on(t.pedidoId, t.creadoEn)],
)