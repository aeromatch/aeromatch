/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hay otro package-lock en el repo padre; fijar raíz evita que Turbopack resuelva mal el proyecto.
  turbopack: {
    root: __dirname,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  compress: true,
  poweredByHeader: false,
  // No añadir Content-Type aquí para /sitemap.xml: duplica la cabecera con la del Route Handler
  // y algunos clientes (p. ej. Google) rechazan respuestas con Content-Type duplicado o ambiguo.
}

module.exports = nextConfig
