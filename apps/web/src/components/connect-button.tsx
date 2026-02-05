'use client'

import dynamic from 'next/dynamic'

// Dynamically import RainbowKit button with SSR disabled
const RainbowConnectButton = dynamic(
  () => import('@rainbow-me/rainbowkit').then((mod) => mod.ConnectButton),
  { 
    ssr: false,
    loading: () => (
      <button 
        className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg opacity-50"
        disabled
      >
        Connect Wallet
      </button>
    )
  }
)

export function ConnectButton() {
  return (
    <RainbowConnectButton 
      showBalance={false}
      chainStatus="icon"
      accountStatus="address"
    />
  )
}
