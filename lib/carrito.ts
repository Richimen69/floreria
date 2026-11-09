import { useSyncExternalStore } from 'react'

const CLAVE = 'floreria-carrito'
const MAXIMO_POR_PRODUCTO = 20

export type ItemCarrito = { productoId: number; cantidad: number }
export type EstadoCarrito = { items: ItemCarrito[]; fecha: string | null; bloque: string | null }

const VACIO: EstadoCarrito = { items: [], fecha: null, bloque: null }

let actual: EstadoCarrito | null = null
const oyentes = new Set<() => void>()

function leer(): EstadoCarrito {
  if (actual) return actual
  try {
    const texto = localStorage.getItem(CLAVE)
    actual = texto ? { ...VACIO, ...JSON.parse(texto) } : VACIO
  } catch {
    actual = VACIO
  }
  return actual!
}

function guardar(nuevo: EstadoCarrito) {
  actual = nuevo
  try {
    localStorage.setItem(CLAVE, JSON.stringify(nuevo))
  } catch {
    // Navegación privada sin almacenamiento: el carrito vive solo en memoria
  }
  oyentes.forEach((avisar) => avisar())
}

function suscribir(avisar: () => void) {
  oyentes.add(avisar)
  // Si el carrito cambia en otra pestaña, se vuelve a leer
  const alCambiarEnOtraPestana = (e: StorageEvent) => {
    if (e.key === CLAVE) {
      actual = null
      avisar()
    }
  }
  window.addEventListener('storage', alCambiarEnOtraPestana)
  return () => {
    oyentes.delete(avisar)
    window.removeEventListener('storage', alCambiarEnOtraPestana)
  }
}

export const carrito = {
  agregar(productoId: number, cantidad = 1) {
    const e = leer()
    const existe = e.items.some((i) => i.productoId === productoId)
    const items = existe
      ? e.items.map((i) =>
          i.productoId === productoId ? { ...i, cantidad: Math.min(i.cantidad + cantidad, MAXIMO_POR_PRODUCTO) } : i,
        )
      : [...e.items, { productoId, cantidad }]
    guardar({ ...e, items })
  },

  cambiarCantidad(productoId: number, cantidad: number) {
    if (cantidad <= 0) return carrito.quitar(productoId)
    const e = leer()
    guardar({
      ...e,
      items: e.items.map((i) =>
        i.productoId === productoId ? { ...i, cantidad: Math.min(cantidad, MAXIMO_POR_PRODUCTO) } : i,
      ),
    })
  },

  quitar(productoId: number) {
    const e = leer()
    guardar({ ...e, items: e.items.filter((i) => i.productoId !== productoId) })
  },

  elegirEntrega(fecha: string | null, bloque: string | null) {
    guardar({ ...leer(), fecha, bloque })
  },

  vaciar() {
    guardar(VACIO)
  },
}

export function useCarrito() {
  return useSyncExternalStore(suscribir, leer, () => VACIO)
}

// true solo en el navegador, después de hidratar
export function useMontado() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )
}