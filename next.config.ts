import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // ─── Fix turbopack workspace root warning ──────────────────────────────────
  turbopack: {
    root: path.resolve(__dirname),
  },

  // ─── Security headers ──────────────────────────────────────────────────────
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // ─── Image domains (Cloud Storage + external avatars) ─────────────────────
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'storage.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
    ],
  },

  // ─── Experimental ─────────────────────────────────────────────────────────
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Для загрузки pitch deck файлов
    },
  },
};

export default nextConfig;
