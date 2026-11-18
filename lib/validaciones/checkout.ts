import { z } from 'zod'
import { LUGARES, TIPOS_LUGAR, detalleObligatorio } from '@/lib/lugares'

const coordenada = (min: number, max: number) =>
    z
        .string()
        .optional()
        .transform((v) => (v ? Number(v) : null))
        .refine((v) => v === null || (Number.isFinite(v) && v >= min && v <= max), 'La ubicación marcada está fuera de nuestra zona de entrega')

const telefono = (mensaje: string) =>
    z.string().transform((v) => v.replace(/\D/g, '')).refine((v) => v.length === 10, mensaje)
const opcional = (max: number) =>
    z
        .string()
        .trim()
        .max(max)
        .optional()
        .transform((v) => (v ? v : null))
const checkbox = z.string().optional().transform((v) => v === 'on')

// Paso 1: Entrega
export const esquemaEntrega = z
    .object({
        entregaLatitud: coordenada(16.5, 17.3),
        entregaLongitud: coordenada(-100.3, -99.4),
        destinatarioNombre: z.string().trim().min(2, '¿A quién se lo entregamos?').max(80),
        destinatarioTelefono: telefono('Escribe el celular de 10 dígitos de quien recibe'),
        coloniaId: z.coerce.number({ error: 'Elige la colonia de la lista' }).int().positive('Elige la colonia de la lista'),
        calle: z.string().trim().min(5, 'Escribe calle y número').max(150),
        referencias: opcional(200),
        tipoLugar: z.enum(TIPOS_LUGAR),
        nombreLugar: opcional(100),
        detalleLugar: opcional(60),
        relacionLugar: z.string().optional().transform((v) => v || null),
    })
    .superRefine((d, ctx) => {
        const lugar = LUGARES[d.tipoLugar]
        if (lugar.nombre && !d.nombreLugar) {
            ctx.addIssue({ code: 'custom', path: ['nombreLugar'], message: `Escribe el ${lugar.nombre.toLowerCase()}` })
        }
        if (lugar.relaciones && (!d.relacionLugar || !(d.relacionLugar in lugar.relaciones))) {
            ctx.addIssue({ code: 'custom', path: ['relacionLugar'], message: 'Indica quién es la persona que recibe' })
        }
        if (lugar.detalle && detalleObligatorio(d.tipoLugar, d.relacionLugar) && !d.detalleLugar) {
            ctx.addIssue({ code: 'custom', path: ['detalleLugar'], message: `Escribe ${lugar.detalle.etiqueta.toLowerCase()}` })
        }
        if ((d.entregaLatitud === null) !== (d.entregaLongitud === null)) {
            ctx.addIssue({ code: 'custom', path: ['entregaLatitud'], message: 'Vuelve a marcar la ubicación en el mapa' })
        }
    })
    .transform((d) => (d.tipoLugar === 'casa' ? { ...d, nombreLugar: null, detalleLugar: null, relacionLugar: null } : d))

// Paso 2: Dedicatoria
export const esquemaDedicatoria = z
    .object({
        tarjetaEnBlanco: checkbox,
        paraTarjeta: opcional(60),
        mensajeTarjeta: z
            .string()
            .trim()
            .max(250, 'Máximo 250 caracteres')
            .optional()
            .transform((v) => (v ? v : null)),
        firmaTarjeta: opcional(60),
        anonimo: checkbox,
    })
    .transform((d) =>
        d.tarjetaEnBlanco
            ? { ...d, paraTarjeta: null, mensajeTarjeta: null, firmaTarjeta: null, anonimo: false }
            : { ...d, firmaTarjeta: d.anonimo ? null : d.firmaTarjeta },
    )

// Paso 3: Finalizar
export const esquemaFinal = z.object({
    compradorTelefono: telefono('Escribe tu celular de 10 dígitos'),
    notas: opcional(300),
    aceptaLegales: z.string().optional().transform((v) => v === 'on'),
})

export type ErroresCampos = Record<string, string[] | undefined>

export function erroresDe(resultado: { success: boolean; error?: z.ZodError }): ErroresCampos {
    return resultado.success || !resultado.error ? {} : z.flattenError(resultado.error).fieldErrors
}

// Valida los tres pasos juntos (lo usa el servidor al confirmar)
export function validarCheckout(datos: Record<string, unknown>) {
    const entrega = esquemaEntrega.safeParse(datos)
    const dedicatoria = esquemaDedicatoria.safeParse(datos)
    const final = esquemaFinal.safeParse(datos)

    if (entrega.success && dedicatoria.success && final.success) {
        return { ok: true as const, datos: { ...entrega.data, ...dedicatoria.data, ...final.data } }
    }
    return {
        ok: false as const,
        errores: { ...erroresDe(entrega), ...erroresDe(dedicatoria), ...erroresDe(final) },
    }
}