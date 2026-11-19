'use client'

import { useEffect, useRef, useState } from 'react'
import type { Map as MapaLibre, Marker as Marcador } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const CENTRO_ACAPULCO: [number, number] = [-99.8901, 16.8634] // [longitud, latitud]

type Punto = { lat: number; lng: number }

export function SelectorUbicacion({ error, centro }: { error?: string; centro?: { lat: number; lng: number } | null }) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaLibre | null>(null)
  const marcador = useRef<Marcador | null>(null)
  const [punto, setPunto] = useState<Punto | null>(null)
  const [ubicando, setUbicando] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

  // Para que el mapa empiece en la colonia si ya estaba elegida al cargar
  const centroInicial = useRef(centro)

  // 1) Crear el mapa (una sola vez)
  useEffect(() => {
    let cancelado = false

    async function iniciar() {
      const maplibregl = await import('maplibre-gl')
      maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
      if (cancelado || !contenedor.current) return

      const inicio = centroInicial.current
      const m = new maplibregl.Map({
        container: contenedor.current,
        style: 'https://tiles.openfreemap.org/styles/liberty', // con calles y nombres, mejor para ubicar
        center: inicio ? [inicio.lng, inicio.lat] : CENTRO_ACAPULCO,
        zoom: inicio ? 15 : 12,
        cooperativeGestures: true,
        attributionControl: { compact: true },
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda del mouse para hacer zoom',
          'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda del mouse para hacer zoom',
          'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
        },
      })
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      const color = getComputedStyle(document.documentElement).getPropertyValue('--marca').trim() || '#be185d'
      const mk = new maplibregl.Marker({ draggable: true, color })
      mk.on('dragend', () => {
        const { lat, lng } = mk.getLngLat()
        setPunto({ lat, lng })
      })

      // Tocar el mapa coloca (o mueve) el pin
      m.on('click', (e) => {
        mk.setLngLat(e.lngLat).addTo(m)
        setPunto({ lat: e.lngLat.lat, lng: e.lngLat.lng })
        setAviso(null)
      })

      mapa.current = m
      marcador.current = mk
    }

    iniciar()
    return () => {
      cancelado = true
      mapa.current?.remove()
    }
  }, [])

  // 2) Al elegir otra colonia, llevar el mapa hasta ella
  const centroLat = centro?.lat
  const centroLng = centro?.lng
  useEffect(() => {
    if (centroLat == null || centroLng == null) return
    if (mapa.current) {
      mapa.current.flyTo({ center: [centroLng, centroLat], zoom: 15 })
    } else {
      // El mapa todavía está cargando: que empiece en la colonia
      centroInicial.current = { lat: centroLat, lng: centroLng }
    }
  }, [centroLat, centroLng])

  function colocar(p: Punto) {
    setPunto(p)
    if (mapa.current && marcador.current) {
      marcador.current.setLngLat([p.lng, p.lat]).addTo(mapa.current)
      mapa.current.flyTo({ center: [p.lng, p.lat], zoom: 17 })
    }
  }

  function usarMiUbicacion() {
    if (!navigator.geolocation) return setAviso('Tu navegador no permite obtener la ubicación. Marca el punto en el mapa.')
    setUbicando(true)
    setAviso(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUbicando(false)
        colocar({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setUbicando(false)
        setAviso('No pudimos obtener tu ubicación. Marca el punto tocando el mapa.')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  function quitar() {
    marcador.current?.remove()
    setPunto(null)
  }

  return (
    <div className="space-y-2 sm:col-span-2">
      <div>
        <span className="block text-sm font-medium text-texto">Ubicación en el mapa (recomendado)</span>
        <span className="block text-xs text-texto-suave">
          {centro
            ? 'Te mostramos tu colonia. Toca el punto exacto de entrega y arrastra el pin para afinarlo.'
            : 'Elige tu colonia y te llevamos ahí; luego toca el punto exacto de entrega.'}
        </span>
      </div>

      <div ref={contenedor} className="h-72 w-full overflow-hidden rounded-xl border border-borde bg-primario-suave sm:h-80" />

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {punto ? (
          <>
            <span className="font-medium text-green-700">✓ Ubicación marcada</span>
            <button type="button" onClick={quitar} className="text-texto-suave hover:text-red-700">Quitar</button>
          </>
        ) : (
          <span className="text-xs text-texto-suave"></span>
        )}
      </div>

      {(aviso || error) && <p className="text-xs text-red-700">{error ?? aviso}</p>}

      <input type="hidden" name="entregaLatitud" value={punto ? punto.lat.toFixed(6) : ''} />
      <input type="hidden" name="entregaLongitud" value={punto ? punto.lng.toFixed(6) : ''} />
    </div>
  )
}