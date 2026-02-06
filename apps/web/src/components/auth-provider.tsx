'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useAuth, type User } from '@/hooks/useAuth'
import { ClaimUsernameModal } from '@/components/claim-username-modal'
import { FaucetModal } from '@/components/faucet-modal'

type AuthContextType = {
  address: string | undefined
  isConnected: boolean
  isLoading: boolean
  user: User | null
  disconnect: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { 
    address, 
    isConnected, 
    isLoading, 
    user, 
    needsUsername, 
    onUsernameClaimed,
    disconnect 
  } = useAuth()

  return (
    <AuthContext.Provider value={{ address, isConnected, isLoading, user, disconnect }}>
      {children}
      
      {/* Username claim modal - shows when user is connected but hasn't claimed username */}
      {isConnected && address && needsUsername && (
        <ClaimUsernameModal
          open={true}
          walletAddress={address.toLowerCase()}
          onClaimed={onUsernameClaimed}
        />
      )}
      
      {/* Faucet modal - shows when user is connected with low USDC balance */}
      {isConnected && !needsUsername && <FaucetModal />}
    </AuthContext.Provider>
  )
}
