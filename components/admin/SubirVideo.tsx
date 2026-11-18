'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  confirmarVideoListo,
  estadoVideo,
  prepararSubidaVideo,
  procesarVideo,
  quitarVideo,
} from '@/server/acciones/videos'

type Inicial = { estado: string | null; url: string | null; poster: string | null; error: string | null }
type Fase = 'vacio' | 'subiendo' | 'procesando' | 'listo' | 'error'

const TAMANO_MAXIMO = 150 * 1024 * 1024

// Sube con XMLHttpRequest porque fetch no informa el avance de la subida
function subirConProgreso(url: string, archivo: File, alAvanzar: (p: number) => void) {
  return new Promise<void>((resolver, rechazar) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', archivo.type)
    xhr.upload.onprogress = (e) => e.lengthComputable && alAvanzar(Math.round((e.loaded / e.total) * 100))
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolver() : rechazar(new Error(`Error ${xhr.status}`)))
    xhr.onerror = () => rechazar(new Error('Error de red'))
    xhr.send(archivo)
  })
}

export function SubirVideo({ productoId, inicial }: { productoId?: number; inicial: Inicial }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [fase, setFase] = useState<Fase>(
    inicial.estado === 'procesando' ? 'procesando' : inicial.estado === 'error' ? 'error' : inicial.url ? 'listo' : 'vacio',
  )
  const [progreso, setProgreso] = useState(0)
  const [video, setVideo] = useState({ url: inicial.url, poster: inicial.poster })
  const [error, setError] = useState<string | null>(inicial.error)

  // Mientras se procesa, se consulta el estado cada 3 segundos
  useEffect(() => {
    if (fase !== 'procesando' || !productoId) return
    const id = setInterval(async () => {
      const e = await estadoVideo(productoId)
      if (!e) return
      if (e.estado === 'listo') {
        clearInterval(id)
        setVideo({ url: e.url, poster: e.poster })
        setFase('listo')
        await confirmarVideoListo()
        router.refresh()
      } else if (e.estado === 'error') {
        clearInterval(id)
        setError(e.error)
        setFase('error')
      }
    }, 3000)
    return () => clearInterval(id)
  }, [fase, productoId, router])

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0]
    if (input.current) input.current.value = ''
    if (!archivo || !productoId) return

    if (archivo.size > TAMANO_MAXIMO) {
      setError('El video no debe pesar más de 150 MB')
      setFase('error')
      return
    }

    setError(null)
    setProgreso(0)
    setFase('subiendo')

    try {
      const r = await prepararSubidaVideo(productoId, archivo.type, archivo.size)
      if (!r.ok) throw new Error(r.mensaje)
      await subirConProgreso(r.url, archivo, setProgreso)
      const p = await procesarVideo(productoId, r.clave)
      if (!p.ok) throw new Error(p.mensaje)
      setFase('procesando')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo subir el video')
      setFase('error')
    }
  }

  async function quitar() {
    if (!productoId || !confirm('¿Quitar el video de este producto?')) return
    await quitarVideo(productoId)
    setVideo({ url: null, poster: null })
    setFase('vacio')
    router.refresh()
  }

  if (!productoId) {
    return (
      <p className="rounded-xl bg-fondo p-4 text-sm text-texto-suave md:col-span-2">
        Guarda el producto primero; después podrás agregarle un video.
      </p>
    )
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <div className="flex flex-wrap items-start gap-4">
        {/* Vista del video o estado */}
        <div className="flex aspect-square w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-borde bg-fondo">
          {fase === 'listo' && video.url ? (
            <video src={video.url} poster={video.poster ?? undefined} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          ) : fase === 'subiendo' ? (
            <div className="w-full px-4 text-center">
              <div className="h-2 overflow-hidden rounded-full bg-borde">
                <div className="h-full bg-primario transition-all" style={{ width: `${progreso}%` }} />
              </div>
              <p className="mt-2 text-xs text-texto-suave">Subiendo… {progreso}%</p>
            </div>
          ) : fase === 'procesando' ? (
            <p className="animate-pulse px-4 text-center text-xs text-texto-suave">Procesando video…<br />puede tardar un minuto</p>
          ) : (
            <span className="px-4 text-center text-xs text-texto-suave">Sin video</span>
          )}
        </div>

        <div className="space-y-2">
          <label
            className={`inline-block cursor-pointer rounded-full border border-borde px-4 py-2 text-sm font-medium text-texto hover:border-primario ${
              fase === 'subiendo' || fase === 'procesando' ? 'pointer-events-none opacity-50' : ''
            }`}
          >
            {fase === 'listo' ? 'Cambiar video' : 'Subir video'}
            <input ref={input} type="file" accept="video/mp4,video/quicktime,video/webm" onChange={alElegir} className="sr-only" />
          </label>
          {fase === 'listo' && (
            <button type="button" onClick={quitar} className="block text-sm text-red-700 hover:underline">
              Quitar video
            </button>
          )}
          <p className="max-w-xs text-xs text-texto-suave">
            Se reproduce solo, en silencio y en bucle, como un GIF. Se toman máximo los primeros 20 segundos y se optimiza automáticamente.
          </p>
        </div>
      </div>

      {fase === 'error' && error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  )
}