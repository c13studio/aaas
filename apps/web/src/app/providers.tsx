'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider, type Config } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { getConfig, arcTestnet } from '@/lib/wagmi'
import { useState, useEffect, createContext, useContext, type ReactNode, useRef } from 'react'
import { reconnect } from 'wagmi/actions'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/components/auth-provider'

// Context to track if providers are mounted
const MountedContext = createContext(false)
export const useMounted = () => useContext(MountedContext)

// Create QueryClient once - safe for SSR
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
})

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const configRef = useRef<Config | null>(null)
  
  // Only initialize wagmi config on client side to avoid indexedDB issues
  useEffect(() => {
    if (!configRef.current) {
      configRef.current = getConfig()
    }
    setMounted(true)
    if (configRef.current) {
      reconnect(configRef.current)
    }
  }, [])

  // Show loading state during SSR and initial client render
  if (!mounted || !configRef.current) {
    return (
      <MountedContext.Provider value={false}>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </MountedContext.Provider>
    )
  }

  return (
    <MountedContext.Provider value={mounted}>
      <WagmiProvider config={configRef.current}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider
            initialChain={arcTestnet}
            modalSize="compact"
          >
            <TooltipProvider>
              <AuthProvider>
                {children}
              </AuthProvider>
            </TooltipProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </MountedContext.Provider>
  )
}
