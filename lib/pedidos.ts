export const ESTADOS_TRABAJO = {
    nuevo: { texto: 'Nuevo', clase: 'bg-primario-suave text-primario-oscuro' },
    preparando: { texto: 'Preparando', clase: 'bg-amber-50 text-amber-900' },
    listo: { texto: 'Listo', clase: 'bg-acento-suave text-acento' },
    en_camino: { texto: 'En camino', clase: 'bg-blue-50 text-blue-800' },
    entregado: { texto: 'Entregado', clase: 'bg-green-50 text-green-800' },
    cancelado: { texto: 'Cancelado', clase: 'bg-fondo text-texto-suave line-through' },
} as const

export const ESTADOS_PAGO = {
    pendiente: { texto: 'Pendiente de pago', clase: 'bg-amber-50 text-amber-900' },
    en_revision: { texto: 'Comprobante en revisión', clase: 'bg-blue-50 text-blue-800' },
    pagado: { texto: 'Pagado', clase: 'bg-green-50 text-green-800' },
    rechazado: { texto: 'Pago rechazado', clase: 'bg-red-50 text-red-800' },
    vencido: { texto: 'Plazo vencido', clase: 'bg-fondo text-texto-suave' },
    cancelado: { texto: 'Cancelado', clase: 'bg-fondo text-texto-suave' },
    reembolsado: { texto: 'Reembolsado', clase: 'bg-fondo text-texto-suave' },
} as const

export const DETALLES_MERCADO_PAGO: Record<string, string> = {
    accredited: 'Acreditado',
    pending_contingency: 'En revisión',
    pending_review_manual: 'En revisión manual',
    cc_rejected_insufficient_amount: 'Fondos insuficientes',
    cc_rejected_bad_filled_security_code: 'Código de seguridad incorrecto',
    cc_rejected_bad_filled_date: 'Fecha de vencimiento incorrecta',
    cc_rejected_bad_filled_other: 'Datos de tarjeta incorrectos',
    cc_rejected_call_for_authorize: 'El banco pide autorizar el pago',
    cc_rejected_high_risk: 'Rechazado por seguridad',
    cc_rejected_other_reason: 'Rechazado por el banco',
    expired: 'Vencido',
}

export const ESTADOS_MERCADO_PAGO: Record<string, string> = {
    approved: 'Aprobado',
    authorized: 'Autorizado',
    pending: 'Pendiente',
    in_process: 'En revisión por Mercado Pago',
    in_mediation: 'En disputa',
    rejected: 'Rechazado',
    cancelled: 'Cancelado',
    refunded: 'Reembolsado',
    charged_back: 'Contracargo',
}

export const METODOS_PAGO: Record<string, string> = {
    transferencia: 'Transferencia',
    mercadopago: 'Mercado Pago',
}

export type EstadoTrabajo = keyof typeof ESTADOS_TRABAJO
export type EstadoPago = keyof typeof ESTADOS_PAGO

// Pagos que ya no ocupan cupo
export const PAGOS_INACTIVOS: EstadoPago[] = ['rechazado', 'vencido', 'cancelado', 'reembolsado']

// Para wa.me: los celulares de México llevan 52 al inicio
export function whatsappMexico(telefono: string | null, mensaje?: string) {
    if (!telefono) return null
    const numero = telefono.length === 10 ? `52${telefono}` : telefono
    return `https://wa.me/${numero}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`
}

type EstadoActual = { estadoPago: EstadoPago; estadoTrabajo: EstadoTrabajo; metodoPago?: string }
// Hacia dónde puede moverse cada estado (cancelar es una acción aparte)
export const FLUJO_TRABAJO: Record<EstadoTrabajo, EstadoTrabajo[]> = {
    nuevo: ['preparando'],
    preparando: ['listo', 'nuevo'],
    listo: ['en_camino', 'preparando'],
    en_camino: ['entregado', 'listo'],
    entregado: [],
    cancelado: [],
}

export const FLUJO_PAGO: Record<EstadoPago, EstadoPago[]> = {
    pendiente: ['pagado'],                  // el admin puede registrar un pago recibido por otra vía
    en_revision: ['pagado', 'rechazado'],   // tras revisar el comprobante
    pagado: ['reembolsado'],
    rechazado: [],
    vencido: [],
    cancelado: [],
    reembolsado: [],
}

const ORDEN_TRABAJO: EstadoTrabajo[] = ['nuevo', 'preparando', 'listo', 'en_camino', 'entregado']

export function esRetroceso(de: EstadoTrabajo, a: EstadoTrabajo) {
    return ORDEN_TRABAJO.indexOf(a) < ORDEN_TRABAJO.indexOf(de)
}

// Devuelve null si el cambio es válido, o el motivo por el que no lo es
export function revisarCambio(p: EstadoActual, tipo: 'pago' | 'trabajo', destino: string): string | null {
    if (tipo === 'pago' && destino === 'pagado' && p.metodoPago === 'mercadopago') {
        return 'Los pagos con Mercado Pago se confirman solos'
    }
    if (tipo === 'trabajo') {
        const a = destino as EstadoTrabajo
        if (p.estadoTrabajo === 'cancelado') return 'El pedido está cancelado'
        if (p.estadoTrabajo === 'entregado') return 'El pedido ya fue entregado'
        if (!FLUJO_TRABAJO[p.estadoTrabajo].includes(a)) {
            return `No se puede pasar de “${ESTADOS_TRABAJO[p.estadoTrabajo].texto}” a “${ESTADOS_TRABAJO[a]?.texto ?? a}”`
        }
        if (a !== 'nuevo' && p.estadoPago !== 'pagado') return 'Primero registra el pago del pedido'
        return null
    }

    const a = destino as EstadoPago
    if (!FLUJO_PAGO[p.estadoPago].includes(a)) {
        return `No se puede pasar de “${ESTADOS_PAGO[p.estadoPago].texto}” a “${ESTADOS_PAGO[a]?.texto ?? a}”`
    }
    if (p.estadoTrabajo === 'cancelado' && a !== 'reembolsado') return 'El pedido está cancelado'
    if (a === 'reembolsado' && p.estadoTrabajo !== 'cancelado') return 'Para reembolsar, primero cancela el pedido'
    return null
}

export function revisarCancelacion(p: EstadoActual): string | null {
    if (p.estadoTrabajo === 'entregado') return 'El pedido ya fue entregado'
    if (p.estadoTrabajo === 'cancelado') return 'El pedido ya está cancelado'
    return null
}

export function pendienteDeReembolso(p: EstadoActual) {
    return p.estadoTrabajo === 'cancelado' && p.estadoPago === 'pagado'
}