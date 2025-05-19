
import type { NextConfig } from 'next';

// Environment configuration helper
const isProd = process.env.NODE_ENV === 'production';
const isDebug = process.env.DEBUG_BUILD === 'true';

// Add build diagnostics for debugging
if (isDebug) {
  console.log('Next.js Build Configuration:');
  console.log(`- Environment: ${isProd ? 'production' : 'development'}`);
  console.log(`- TypeScript Errors: ${isProd ? 'ignored' : 'enforced'}`);
  console.log(`- ESLint: ${isProd ? 'ignored' : 'enforced'}`);
  console.log('- Output Mode: standalone');
}

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // Only ignore TypeScript errors in production builds
    // In development, we want to see and fix these errors
    ignoreBuildErrors: isProd,
  },
  eslint: {
    // Only ignore ESLint during production builds
    // In development, we want to see and fix linting issues
    ignoreDuringBuilds: isProd,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Production optimizations
  compiler: {
    removeConsole: isProd
      ? {
          exclude: ['error', 'warn'],
        }
      : false,
  },
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  // Optimize output for production - standalone mode is ideal for containerized deployments
  output: 'standalone',
  // swcMinify option has been removed as it's deprecated in Next.js 15.2.3 (now enabled by default)
  // Configure headers for better security and performance
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
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
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=31536000',
          },
        ],
      },
      {
        source: '/sounds/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=31536000',
          },
        ],
      },
    ];
  },
  // Configure redirects for better SEO
  redirects: async () => {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
  // Environment variables accessible to the client (browser)
  env: {
    // Build information
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_APP_ENV: process.env.NODE_ENV || 'development',
    
    // API configuration
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '/api',
    
    // Game configuration
    NEXT_PUBLIC_ENABLE_DEBUG: process.env.NEXT_PUBLIC_ENABLE_DEBUG === 'true' ? 'true' : 'false',
    // Debug build information
    NEXT_PUBLIC_BUILD_DIAGNOSTICS: isDebug ? 'true' : 'false',
  },
};

// Add comprehensive debug output when requested
if (isDebug) {
  console.log('Next.js Config Details:');
  console.log('- React Strict Mode:', nextConfig.reactStrictMode);
  console.log('- Output Mode:', nextConfig.output);
  console.log('- Image Domains:', JSON.stringify(nextConfig.images?.remotePatterns));
  console.log('- Environment Variables:', Object.keys(nextConfig.env || {}).join(', '));
}

export default nextConfig;
