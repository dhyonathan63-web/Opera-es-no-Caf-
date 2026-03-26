import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['firebase', 'xlsx', 'googleapis'],
  transpilePackages: ['lucide-react', 'clsx', 'tailwind-merge', 'motion', 'framer-motion', 'date-fns', 'recharts', 'd3', 'react-markdown'],
  images: {
    unoptimized: true, 
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
    ],
  },
};

export default nextConfig;
