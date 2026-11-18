export function destinoSeguro(volver: string | undefined, porDefecto = '/') {
  return volver && volver.startsWith('/') && !volver.startsWith('//') ? volver : porDefecto
}