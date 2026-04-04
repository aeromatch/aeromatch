/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // No añadir Content-Type aquí para /sitemap.xml: duplica la cabecera con la del Route Handler
  // y algunos clientes (p. ej. Google) rechazan respuestas con Content-Type duplicado o ambiguo.
}

module.exports = nextConfig
