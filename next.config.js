/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/images/:path*.png',
          destination: '/images/:path*.webp',
        },
        {
          source: '/images/:path*.jpg',
          destination: '/images/:path*.webp',
        },
        {
          source: '/images/:path*.jpeg',
          destination: '/images/:path*.webp',
        },
      ],
    };
  },
};

export default nextConfig;
