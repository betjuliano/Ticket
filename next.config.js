/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  reactStrictMode: true,
  
  // Configurações de output para Docker
  output: 'standalone',
  
  // Configurações de imagens
  images: {
    domains: [
      'localhost',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Configurações de headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
  
  // Configurações de redirecionamentos
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Configurações de compressão
  compress: true,
  
  // Configurações de pacotes externos para servidor
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
  
  // Configurações de variáveis de ambiente
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  
  // Configurações de TypeScript
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Configurações de ESLint
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;

