import Link from 'next/link'
import { Suspense } from 'react'
import { FormHorarioSemanal } from '@/components/admin/FormHorarioSemanal'
import { VistaPreviaCalendario } from '@/components/admin/VistaPreviaCalendario'
import { fechaCorta } from '@/lib/fechas'
import { listarExcepciones, obtenerConfigCalendario } from '@/server/consultas/calendario'
import { EncabezadoPagina } from '@/components/admin/EncabezadoPagina'

const NOMBRE_TIPO = { especial: 'Horario especial', no_disponible: 'Aún no disponible', cerrado: 'Cerrado' }

export default async function CalendarioPage() {
  const [config, excepciones] = await Promise.all([obtenerConfigCalendario(), listarExcepciones()])

  return (
    <div>
      
      <div className="sticky top-0 z-10 -mx-8 mb-8 border-b border-borde bg-fondo/85 px-8 py-4 backdrop-blur">
        <h1 className="font-titulos text-2xl font-semibold text-texto">Calendario de entregas</h1>
        <p className="text-sm text-texto-suave">Horarios, cupos y fechas especiales. Todas las horas son de Acapulco.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6">
          <FormHorarioSemanal semana={config.semana} horizonteDias={config.horizonteDias} />

          <section className="rounded-tarjeta border border-borde bg-superficie shadow-sm">
            <header className="flex items-center justify-between gap-4 border-b border-borde px-6 py-4">
              <div>
                <h2 className="font-titulos text-lg font-semibold text-texto">Fechas especiales</h2>
                <p className="text-sm text-texto-suave">Sustituyen al horario habitual en esas fechas.</p>
              </div>
              <Link href="/admin/calendario/excepciones/nueva" className="rounded-full bg-primario px-4 py-2 text-sm font-semibold text-sobre-primario hover:bg-primario-oscuro">
                Agregar
              </Link>
            </header>
            {excepciones.length === 0 ? (
              <p className="p-6 text-sm text-texto-suave">No hay fechas especiales.</p>
            ) : (
              <ul className="divide-y divide-borde">
                {excepciones.map((e) => (
                  <li key={e.id}>
                    <Link href={`/admin/calendario/excepciones/${e.id}`} className="flex items-center justify-between gap-4 px-6 py-3 hover:bg-fondo/60">
                      <span>
                        <span className="block text-sm font-medium text-texto">{e.nombre}</span>
                        <span className="block text-xs text-texto-suave">
                          {e.fechaInicio === e.fechaFin ? fechaCorta(e.fechaInicio) : `${fechaCorta(e.fechaInicio)} – ${fechaCorta(e.fechaFin)}`}{' '}
                          {e.fechaInicio.slice(0, 4)}
                        </span>
                      </span>
                      <span className="rounded-full bg-fondo px-2.5 py-1 text-xs font-semibold text-texto-suave">{NOMBRE_TIPO[e.tipo]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <section className="h-fit rounded-tarjeta border border-borde bg-superficie shadow-sm xl:sticky xl:top-28">
          <header className="border-b border-borde px-6 py-4">
            <h2 className="font-titulos text-lg font-semibold text-texto">Próximos 14 días</h2>
            <p className="text-sm text-texto-suave">Lo que verán los clientes ahora mismo. Tachado = cerrado o lleno.</p>
          </header>
          <Suspense fallback={<p className="p-6 text-sm text-texto-suave">Calculando…</p>}>
            <VistaPreviaCalendario />
          </Suspense>
        </section>
      </div>
    </div>
  )
}