import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http, createStorage, cookieStorage, type Config } from 'wagmi'
import { type Chain } from 'viem'

// Arc Testnet Configuration
// Note: MetaMask requires 18 decimals for native currency, even though USDC has 6.
// The actual USDC token still uses 6 decimals for transactions.
export const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: {
    decimals: 18, // MetaMask requirement - actual USDC uses 6 decimals
    name: 'USDC',
    symbol: 'USDC',
  },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
} as const satisfies Chain

// Singleton config instance
let config: Config | null = null

// Create config - safe for SSR with ssr: true option
export function getConfig(): Config {
  if (config) return config
  
  config = getDefaultConfig({
    appName: 'AaaS - Autonomous Agents as Sellers',
    projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'demo',
    chains: [arcTestnet],
    transports: {
      [arcTestnet.id]: http(process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.testnet.arc.network'),
    },
    ssr: true,
    storage: createStorage({
      storage: cookieStorage,
    }),
  })
  
  return config
}

// Export chain for use in other files
export { arcTestnet as chain }
