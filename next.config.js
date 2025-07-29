/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações de output para Docker
  output: 'standalone',
  
  // Configurações de imagens
  images: {
    domains: [
      'localhost',
      'iadm.iaprojetos.com.br',
      's3.iaprojetos.com.br',
      'supabase.iaprojetos.com.br'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.iaprojetos.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 's3.iaprojetos.com.br',
        port: '',
        pathname: '/**',
      }
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
  
  // Configurações de bundle analyzer (apenas em desenvolvimento)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: false,
          })
        );
      }
      return config;
    },
  }),
  
  // Configurações experimentais
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Configurações de variáveis de ambiente
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
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