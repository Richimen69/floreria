import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const host = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl
  const esSubdominioAdmin = host.startsWith('admin.')

  if (esSubdominioAdmin) {
    // Las rutas /admin y /api pasan tal cual
    if (pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return NextResponse.next()
    }
    // admin.floreria.com/ajustes → /admin/ajustes
    const url = request.nextUrl.clone()
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  // En producción, el panel solo existe en el subdominio
  if (pathname.startsWith('/admin') && process.env.NODE_ENV === 'production') {
    return new NextResponse(null, { status: 404 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}