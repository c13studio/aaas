'use client'

import { useAccount, useDisconnect } from 'wagmi'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type User = {
  wallet_address: string
  display_name: string | null
}

export function useAuth() {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [needsUsername, setNeedsUsername] = useState(false)

  const createUserIfNotExists = useCallback(async (walletAddress: string) => {
    setIsLoading(true)
    try {
      const normalizedAddress = walletAddress.toLowerCase()
      
      // Check if user exists
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('wallet_address', normalizedAddress)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned, which is expected for new users
        console.error('Error fetching user:', fetchError)
        return
      }

      if (existingUser) {
        setUser(existingUser)
        // Check if they need to claim a username
        setNeedsUsername(!existingUser.display_name)
        return
      }

      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert([{ wallet_address: normalizedAddress }])
        .select()
        .single()

      if (insertError) {
        console.error('Error creating user:', insertError)
        return
      }

      setUser(newUser)
      // New user needs to claim username
      setNeedsUsername(true)
    } catch (error) {
      console.error('Error in createUserIfNotExists:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Update user after username claim
  const onUsernameClaimed = useCallback((username: string) => {
    setUser(prev => prev ? { ...prev, display_name: username } : null)
    setNeedsUsername(false)
  }, [])

  // Auto-create user profile on wallet connection
  useEffect(() => {
    if (isConnected && address) {
      createUserIfNotExists(address)
    } else {
      setUser(null)
      setNeedsUsername(false)
    }
  }, [isConnected, address, createUserIfNotExists])

  return {
    address: address?.toLowerCase(),
    isConnected,
    isLoading,
    user,
    needsUsername,
    onUsernameClaimed,
    disconnect,
  }
}
