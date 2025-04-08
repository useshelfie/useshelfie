import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  images: {
    domains: ["localhost"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/webp"],
  },
}

export default nextConfig
