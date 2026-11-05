export function MapaUbicacion({ direccion, nombre }: { direccion: string; nombre: string }) {
  const consulta = encodeURIComponent(`${nombre}, ${direccion}`)

  return (
    <div className="overflow-hidden rounded-tarjeta border border-borde bg-superficie">
      <iframe
        title={`Ubicación de ${nombre}`}
        src={`https://www.google.com/maps?q=${consulta}&output=embed`}
        className="h-72 w-full sm:h-96"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  )
}