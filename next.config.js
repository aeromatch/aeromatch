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
  // No añadir Content-Type aquí para /sitemap.xml: duplica la cabecera con la del Route Handler
  // y algunos clientes (p. ej. Google) rechazan respuestas con Content-Type duplicado o ambiguo.
}

module.exports = nextConfig
