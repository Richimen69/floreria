import type { NextConfig } from "next";

const encabezadosSeguridad = [
  // Que nadie pueda meter el sitio dentro de un iframe en otra página (clickjacking)
  { key: 'X-Frame-Options', value: 'DENY' },
  // Que el navegador no "adivine" tipos de archivo
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // No mandar la URL completa a otros sitios al hacer clic en un enlace
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // El sitio no usa cámara, micrófono ni ubicación
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  cacheComponents: true,
  poweredByHeader: false,
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: [new URL(`${process.env.R2_PUBLIC_URL}/**`)],
  },
  async headers() {
    return [{ source: '/:path*', headers: encabezadosSeguridad }]
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
