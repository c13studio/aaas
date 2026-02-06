'use client'

import { useState, useEffect } from 'react'
import { useAccount, useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CONTRACTS, USDC_ABI } from '@/lib/contracts'
import { ExternalLink, Coins } from 'lucide-react'

const FAUCET_URL = 'https://faucet.circle.com/'
const MIN_USDC_THRESHOLD = 1 // Show modal if balance is less than 1 USDC

export function FaucetModal() {
  const { address, isConnected } = useAccount()
  const [showModal, setShowModal] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  // Check USDC balance
  const { data: balance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  useEffect(() => {
    // Check if user has already dismissed this session
    const dismissed = sessionStorage.getItem('faucet-modal-dismissed')
    if (dismissed) {
      setHasDismissed(true)
      return
    }

    // Show modal if connected and balance is low
    if (isConnected && balance !== undefined && !hasDismissed) {
      const balanceNumber = Number(formatUnits(balance, 6))
      if (balanceNumber < MIN_USDC_THRESHOLD) {
        // Small delay so it doesn't feel jarring
        const timer = setTimeout(() => setShowModal(true), 1000)
        return () => clearTimeout(timer)
      }
    }
  }, [isConnected, balance, hasDismissed])

  const handleDismiss = () => {
    setShowModal(false)
    setHasDismissed(true)
    sessionStorage.setItem('faucet-modal-dismissed', 'true')
  }

  const handleGetUSDC = () => {
    window.open(FAUCET_URL, '_blank')
    handleDismiss()
  }

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-6 w-6 text-blue-500" />
            Get Testnet USDC
          </DialogTitle>
          <DialogDescription>
            You need USDC on Arc Testnet to make purchases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 mb-3">
              Get free testnet USDC from Circle's faucet. Select <strong>Arc Testnet</strong> from the network dropdown and enter your wallet address.
            </p>
            <p className="text-xs text-blue-600">
              You can request 20 USDC every 2 hours.
            </p>
          </div>

          <Button onClick={handleGetUSDC} className="w-full" size="lg">
            <ExternalLink className="h-4 w-4 mr-2" />
            Get USDC from Faucet
          </Button>

          <Button variant="ghost" onClick={handleDismiss} className="w-full">
            I already have USDC
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
