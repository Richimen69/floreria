'use client'

import { useEffect, useRef } from 'react'
import type { Map as MapaLibre } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mezclar } from '@/lib/colores'

const maplibregl = await import('maplibre-gl')
maplibregl.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs')
const { Map, Marker, Popup, NavigationControl } = maplibregl
type Props = {
  latitud: number
  longitud: number
  nombre: string
  direccion: string | null
  colores: { primario: string; acento: string; fondo: string }
}


// Pinta el mapa con la paleta de la marca
function aplicarPaleta(mapa: MapaLibre, colores: Props['colores']) {
  const agua = mezclar(colores.acento, colores.fondo, 0.3)
  const verde = mezclar(colores.acento, colores.fondo, 0.18)

  for (const capa of mapa.getStyle().layers) {
    try {
      if (capa.type === 'background') {
        mapa.setPaintProperty(capa.id, 'background-color', colores.fondo)
      } else if (capa.type === 'fill' && capa.id.includes('water')) {
        mapa.setPaintProperty(capa.id, 'fill-color', agua)
      } else if (capa.type === 'fill' && /park|wood|grass|landcover/.test(capa.id)) {
        mapa.setPaintProperty(capa.id, 'fill-color', verde)
      }
    } catch {
      // Algunas capas no aceptan el cambio; se dejan como vienen
    }
  }
}

export function MapaInteractivo({ latitud, longitud, nombre, direccion, colores }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mapa: MapaLibre | undefined
    let cancelado = false

    async function iniciar() {
      // Se carga solo en el navegador
      const { Map, Marker, Popup, NavigationControl } = await import('maplibre-gl')
      if (cancelado || !contenedor.current) return

      mapa = new Map({
        container: contenedor.current,
        style: 'https://tiles.openfreemap.org/styles/positron',
        center: [longitud, latitud],
        zoom: 15.5,
        // En celular, mover el mapa requiere dos dedos para no estorbar el scroll de la página
        cooperativeGestures: true,
        attributionControl: { compact: true },
        locale: {
          'CooperativeGesturesHandler.WindowsHelpText': 'Usa Ctrl + rueda del mouse para hacer zoom',
          'CooperativeGesturesHandler.MacHelpText': 'Usa ⌘ + rueda del mouse para hacer zoom',
          'CooperativeGesturesHandler.MobileHelpText': 'Usa dos dedos para mover el mapa',
        },
      })

      mapa.addControl(new NavigationControl({ showCompass: false }), 'top-right')
      mapa.on('load', () => mapa && aplicarPaleta(mapa, colores))

      // Marcador con el color principal
      const marcador = document.createElement('div')
      marcador.className =
        'flex h-11 w-11 items-center justify-center rounded-full bg-primario text-sobre-primario shadow-lg ring-4 ring-white cursor-pointer'
      marcador.innerHTML =
        '<svg viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M12 2a4 4 0 014 4 4 4 0 014 4 4 4 0 01-4 4 4 4 0 01-4 4 4 4 0 01-4-4 4 4 0 01-4-4 4 4 0 014-4 4 4 0 014-4zm0 8a2 2 0 100 4 2 2 0 000-4z"/></svg>'

      // Ventana con nombre, dirección y ruta (con textContent para no inyectar HTML)
      const contenido = document.createElement('div')
      contenido.className = 'space-y-1 p-1'
      const titulo = document.createElement('p')
      titulo.className = 'text-sm font-semibold text-texto'
      titulo.textContent = nombre
      contenido.append(titulo)
      if (direccion) {
        const texto = document.createElement('p')
        texto.className = 'text-xs text-texto-suave'
        texto.textContent = direccion
        contenido.append(texto)
      }
      const ruta = document.createElement('a')
      ruta.href = `https://www.google.com/maps/dir/?api=1&destination=${latitud},${longitud}`
      ruta.target = '_blank'
      ruta.rel = 'noopener noreferrer'
      ruta.className = 'inline-block pt-1 text-xs font-semibold text-primario hover:underline'
      ruta.textContent = 'Cómo llegar →'
      contenido.append(ruta)

      const ventana = new Popup({ offset: 30, closeButton: false }).setDOMContent(contenido)

      new Marker({ element: marcador, anchor: 'center' })
        .setLngLat([longitud, latitud])
        .setPopup(ventana)
        .addTo(mapa)
        .togglePopup()
    }

    iniciar()

    return () => {
      cancelado = true
      mapa?.remove()
    }
  }, [latitud, longitud, nombre, direccion, colores.primario, colores.acento, colores.fondo])

  return (
    <div
      ref={contenedor}
      className="h-72 w-full overflow-hidden rounded-tarjeta border border-borde bg-primario-suave sm:h-96"
    />
  )
}