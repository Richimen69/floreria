import { Suspense } from 'react'
import { Sidebar } from '@/components/admin/Sidebar'
import { requireAdmin } from '@/lib/permisos'
import { obtenerAjustes } from '@/server/consultas/ajustes'

async function ZonaProtegida({ children }: { children: React.ReactNode }) {
  const sesion = await requireAdmin()
  const ajustes = await obtenerAjustes()

  return (
    <div className="flex min-h-screen bg-fondo">
      <Sidebar
        nombre={ajustes.nombre}
        logoUrl={ajustes.logoUrl}
        usuario={{ name: sesion.user.name, email: sesion.user.email }}
      />
      <main className="min-w-0 flex-1 px-8 pb-12">{children}</main>
    </div>
  )
}

export default function LayoutProtegido({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
          Cargando…
        </div>
      }
    >
      <ZonaProtegida>{children}</ZonaProtegida>
    </Suspense>
  )
}