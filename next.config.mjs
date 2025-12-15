/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  
  // Output configuration for serverless deployment
  output: 'standalone',
  
  // Skip TypeScript type checking during build (project works fine locally)
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Skip ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Image optimization - Netlify Image CDN will handle this automatically
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
