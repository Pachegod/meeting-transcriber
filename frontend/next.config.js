/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
    NEXT_PUBLIC_RD_STATION_ENABLED: process.env.NEXT_PUBLIC_RD_STATION_ENABLED || 'false',
  },
  images: {
    domains: ['localhost', 'api.meeting-transcriber.com.br'],
    unoptimized: process.env.NODE_ENV !== 'production',
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizeCss: true,
  },
}

module.exports = nextConfig 