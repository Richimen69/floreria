export const TIPOS_LUGAR = ['casa', 'hotel', 'oficina', 'hospital', 'funeraria'] as const
export type TipoLugar = (typeof TIPOS_LUGAR)[number]

type ConfigLugar = {
  texto: string
  nombre: string | null // etiqueta del nombre del lugar (null = no se pide)
  detalle: { etiqueta: string; obligatorio: boolean } | null
  relaciones: Record<string, string> | null
}

export const LUGARES: Record<TipoLugar, ConfigLugar> = {
  casa: { texto: 'Casa', nombre: null, detalle: null, relaciones: null },
  hotel: {
    texto: 'Hotel',
    nombre: 'Nombre del hotel',
    detalle: { etiqueta: 'Número de habitación', obligatorio: true },
    relaciones: { huesped: 'Huésped', trabajador: 'Trabajador' },
  },
  oficina: {
    texto: 'Oficina',
    nombre: 'Empresa o edificio',
    detalle: { etiqueta: 'Piso, área o departamento', obligatorio: false },
    relaciones: null,
  },
  hospital: {
    texto: 'Hospital',
    nombre: 'Nombre del hospital',
    detalle: { etiqueta: 'Habitación o área', obligatorio: false },
    relaciones: { paciente: 'Paciente', trabajador: 'Trabajador' },
  },
  funeraria: {
    texto: 'Funeraria',
    nombre: 'Nombre de la funeraria',
    detalle: { etiqueta: 'Sala o capilla', obligatorio: false },
    relaciones: { familiar: 'Familiar o asistente', trabajador: 'Trabajador' },
  },
}

// En hospital, si es paciente, la habitación se vuelve obligatoria
export function detalleObligatorio(tipo: TipoLugar, relacion: string | null) {
  return Boolean(LUGARES[tipo].detalle?.obligatorio) || (tipo === 'hospital' && relacion === 'paciente')
}