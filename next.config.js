/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.giphy.com',
      },
    ],
    unoptimized: true, // This allows us to use local images without optimization
  },
}

module.exports = nextConfig 