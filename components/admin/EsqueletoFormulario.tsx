export function EsqueletoFormulario() {
  return (
    <div className="animate-pulse">
      <div className="-mx-8 mb-8 border-b border-borde px-8 py-4">
        <div className="h-4 w-24 rounded bg-borde" />
        <div className="mt-2 h-7 w-56 rounded bg-borde" />
      </div>

      <div className="max-w-4xl space-y-6">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-tarjeta border border-borde bg-superficie p-6">
            <div className="h-5 w-40 rounded bg-borde" />
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {[0, 1, 2, 3].map((j) => (
                <div key={j} className="space-y-2">
                  <div className="h-3 w-24 rounded bg-borde" />
                  <div className="h-10 rounded-xl bg-fondo" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}