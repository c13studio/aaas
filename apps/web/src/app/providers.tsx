'use client'

import '@rainbow-me/rainbowkit/styles.css'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { getConfig, arcTestnet } from '@/lib/wagmi'
import { useState, useEffect, createContext, useContext, type ReactNode, useRef } from 'react'
import { reconnect } from 'wagmi/actions'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/components/auth-provider'

// Context to track if providers are mounted
const MountedContext = createContext(false)
export const useMounted = () => useContext(MountedContext)

// Create QueryClient once
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
  const configRef = useRef(getConfig())
  const config = configRef.current

  useEffect(() => {
    setMounted(true)
    reconnect(config)
  }, [config])

  return (
    <MountedContext.Provider value={mounted}>
      <WagmiProvider config={config}>
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
