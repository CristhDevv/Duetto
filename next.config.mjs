/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['duetto-five.vercel.app'] }
  }
};

export default nextConfig;
