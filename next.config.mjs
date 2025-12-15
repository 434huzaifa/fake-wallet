/** @type {import('next').NextConfig} */
const nextConfig = {
  // Performance optimizations
  compress: true,
  
  // Image optimization - Netlify Image CDN will handle this automatically
  images: {
    formats: ['image/webp', 'image/avif'],
  },
};

export default nextConfig;
