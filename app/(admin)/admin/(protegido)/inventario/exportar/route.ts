import { faltante } from '@/lib/inventario'
import { hoyEnAcapulco } from '@/lib/fechas'
import { requireAdmin } from '@/lib/permisos'
import { listarInsumos } from '@/server/consultas/inventario'

function celda(valor: unknown) {
  const texto = String(valor ?? '')
  return /[",\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

export async function GET(request: Request) {
  await requireAdmin()

  const { searchParams } = new URL(request.url)
  const compras = searchParams.get('tipo') === 'compras'
  const categoria = (searchParams.get('categoria') ?? '').slice(0, 50)

  const insumos = await listarInsumos({ categoria, filtro: compras ? 'bajo-minimo' : 'todos' })

  const encabezado = ['Categoría', 'Insumo', 'Unidad', 'Existencia', 'Mínimo', 'Faltan', 'Costo unitario', 'Proveedor']
  const filas = insumos.map((i) => [
    i.categoria,
    i.nombre,
    i.unidad,
    i.existencia,
    i.minimo ?? '',
    faltante(i) ?? '',
    i.costoUnitarioCentavos != null ? (i.costoUnitarioCentavos / 100).toFixed(2) : '',
    i.proveedor ?? '',
  ])

  // El BOM (\uFEFF) hace que Excel reconozca los acentos
  const csv = '\uFEFF' + [encabezado, ...filas].map((f) => f.map(celda).join(',')).join('\r\n')
  const nombre = `${compras ? 'lista-compras' : 'inventario'}-${hoyEnAcapulco()}.csv`

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombre}"`,
      'Cache-Control': 'no-store',
    },
  })
}