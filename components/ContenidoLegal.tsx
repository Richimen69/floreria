type Bloque = { tipo: 'titulo' | 'parrafo'; texto: string } | { tipo: 'lista'; elementos: string[] }

function separarBloques(contenido: string): Bloque[] {
  const bloques: Bloque[] = []
  for (const trozo of contenido.replace(/\r\n/g, '\n').split(/\n\s*\n/)) {
    const lineas = trozo.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lineas.length === 0) continue

    if (lineas.length === 1 && lineas[0].startsWith('## ')) {
      bloques.push({ tipo: 'titulo', texto: lineas[0].slice(3) })
    } else if (lineas.every((l) => l.startsWith('- '))) {
      bloques.push({ tipo: 'lista', elementos: lineas.map((l) => l.slice(2)) })
    } else {
      // Un título seguido de texto en el mismo trozo
      if (lineas[0].startsWith('## ')) {
        bloques.push({ tipo: 'titulo', texto: lineas[0].slice(3) })
        lineas.shift()
      }
      bloques.push({ tipo: 'parrafo', texto: lineas.join(' ') })
    }
  }
  return bloques
}

export function ContenidoLegal({ contenido }: { contenido: string }) {
  const bloques = separarBloques(contenido)

  if (bloques.length === 0) {
    return <p className="text-sm text-texto-suave">Sin contenido todavía.</p>
  }

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-texto">
      {bloques.map((b, i) =>
        b.tipo === 'titulo' ? (
          <h2 key={i} className="pt-4 font-titulos text-xl font-semibold text-texto">{b.texto}</h2>
        ) : b.tipo === 'lista' ? (
          <ul key={i} className="list-disc space-y-1 pl-6">
            {b.elementos.map((e, j) => <li key={j}>{e}</li>)}
          </ul>
        ) : (
          <p key={i}>{b.texto}</p>
        ),
      )}
    </div>
  )
}