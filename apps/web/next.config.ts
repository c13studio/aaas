import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Fix the "multiple lockfiles" warning
  outputFileTracingRoot: path.join(__dirname, '../../'),
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Fix for WalletConnect/MetaMask SDK dependency errors
    // These packages don't work in browser/server environments
    // Using regex patterns to properly exclude them
    if (!config.externals) {
      config.externals = []
    }
    
    if (Array.isArray(config.externals)) {
      config.externals.push(
        // Simple string externals (no @ symbol)
        'pino-pretty',
        'lokijs', 
        'encoding',
      )
      
      // For scoped packages with @, use a function to properly handle them
      config.externals.push(({ request }: { request: string }, callback: (err: Error | null, result?: string) => void) => {
        if (request === '@react-native-async-storage/async-storage') {
          // Return 'commonjs undefined' to make it resolve to undefined
          return callback(null, 'commonjs undefined')
        }
        callback(null)
      })
    }
    
    // Resolve potential issues with crypto packages in browser
    if (!isServer) {
      config.resolve = config.resolve || {}
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    return config
  },
}

export default nextConfig
