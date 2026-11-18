import type { FilaProductoAdmin } from '@/server/consultas/productos'

function Etiqueta({ children, tono }: { children: React.ReactNode; tono: 'acento' | 'primario' | 'neutro' }) {
  const estilos = {
    acento: 'bg-acento-suave text-acento',
    primario: 'bg-primario-suave text-primario-oscuro',
    neutro: 'bg-fondo text-texto-suave',
  }
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${estilos[tono]}`}>{children}</span>
}

export function EtiquetasProducto({ p }: { p: FilaProductoAdmin }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {!p.activo ? (
        <Etiqueta tono="neutro">Oculto</Etiqueta>
      ) : p.controlarExistencias && p.existencias <= 0 ? (
        <Etiqueta tono="neutro">Sin existencias</Etiqueta>
      ) : !p.disponible ? (
        <Etiqueta tono="neutro">Agotado hoy</Etiqueta>
      ) : (
        <Etiqueta tono="acento">{p.controlarExistencias ? `${p.existencias} en existencia` : 'Disponible'}</Etiqueta>
      )}
      {p.destacado && <Etiqueta tono="primario">Top</Etiqueta>}
      {p.diasAnticipacion > 0 && <Etiqueta tono="neutro">{p.diasAnticipacion} día(s)</Etiqueta>}
    </div>
  )
}