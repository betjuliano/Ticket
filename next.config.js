/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações de produção
  reactStrictMode: true,
  swcMinify: true,
  
  // Configurações de output para Docker
  output: 'standalone',
  
  // Configurações experimentais
  experimental: {
    // Otimizações de performance
    optimizeCss: true,
    optimizePackageImports: [
      '@radix-ui/react-icons',
      'lucide-react',
      'date-fns',
      'recharts'
    ],
    
    // Configurações de TypeScript
    typedRoutes: true
  },
  
  // Configurações de imagens
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self'",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
            ].join('; '),
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
      {
        source: '/dashboard',
        destination: '/tickets',
        permanent: false,
      },
    ];
  },
  
  // Configurações de rewrites para API
  async rewrites() {
    return [
      {
        source: '/api/health',
        destination: '/api/healthcheck',
      },
    ];
  },
  
  // Configurações de compressão
  compress: true,
  
  // Configurações de pacotes externos para servidor
  serverComponentsExternalPackages: [
    '@prisma/client',
    'bcryptjs',
    'nodemailer',
    'googleapis',
    'ioredis',
    'pg'
  ],
  
  // Configurações de variáveis de ambiente
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Configurações de TypeScript
  typescript: {
    // Permitir build mesmo com erros de tipo em desenvolvimento
    ignoreBuildErrors: process.env.NODE_ENV === 'development',
  },
  
  // Configurações de ESLint
  eslint: {
    // Ignorar ESLint durante build em desenvolvimento
    ignoreDuringBuilds: process.env.NODE_ENV === 'development',
    // Diretórios para verificar
    dirs: ['app', 'components', 'lib', 'types'],
  },
  
  // Configurações de webpack
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Configurações personalizadas do webpack
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Otimizações para produção
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      };
    }
    
    return config;
  },
  
  // Configurações de análise de bundle
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
        })
      );
      return config;
    },
  }),
  
  // Configurações de logging
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },
  
  // Configurações de cache
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
  
  // Configurações de desenvolvimento
  ...(process.env.NODE_ENV === 'development' && {
    devIndicators: {
      buildActivity: true,
      buildActivityPosition: 'bottom-right',
    },
  }),
};

module.exports = nextConfig;

