import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
	images: {
		domains: ['localhost'], // Add your image domains here
		deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048], // Optimize for common device sizes
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		formats: ['image/webp'],
	},
	experimental: {
		optimizeCss: true,
	},
}

export default nextConfig
