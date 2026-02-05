'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
} from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ConnectButton } from '@/components/connect-button'
import { CONTRACTS, AAAS_PAYMENT_LINK_ABI, USDC_ABI } from '@/lib/contracts'
import { useCreateOrder } from '@/hooks/useOrders'
import { supabase } from '@/lib/supabase'
import { formatUSDC, shortenAddress } from '@/lib/utils'
import type { ProductWithCategory } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  CheckCircle2, 
  Download, 
  Loader2, 
  Wallet, 
  ExternalLink,
  Copy,
  Store
} from 'lucide-react'

type Props = {
  product: ProductWithCategory
}

type PaymentStep = 'connect' | 'approve' | 'pay' | 'success'

export function PaymentContent({ product }: Props) {
  const router = useRouter()
  const { address, isConnected } = useAccount()
  const createOrder = useCreateOrder()
  
  const [step, setStep] = useState<PaymentStep>('connect')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)

  const amountBigInt = parseUnits(product.price_usdc.toString(), 6)

  // Check USDC allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: 'allowance',
    args: address && CONTRACTS.AAAS_PAYMENT_LINK 
      ? [address, CONTRACTS.AAAS_PAYMENT_LINK] 
      : undefined,
  })

  // Check USDC balance
  const { data: balance } = useReadContract({
    address: CONTRACTS.USDC,
    abi: USDC_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
  })

  // Approve USDC
  const {
    writeContract: writeApprove,
    data: approveTxHash,
    isPending: isApprovePending,
  } = useWriteContract()

  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveTxHash })

  // Pay
  const {
    writeContract: writePay,
    data: payTxHash,
    isPending: isPayPending,
  } = useWriteContract()

  const { isLoading: isPayConfirming, isSuccess: isPayConfirmed } =
    useWaitForTransactionReceipt({ hash: payTxHash })

  // Update step based on connection and allowance
  useEffect(() => {
    if (!isConnected) {
      setStep('connect')
    } else if (allowance !== undefined && allowance < amountBigInt) {
      setStep('approve')
    } else if (allowance !== undefined) {
      setStep('pay')
    }
  }, [isConnected, allowance, amountBigInt])

  // Handle approve confirmation
  useEffect(() => {
    if (isApproveConfirmed) {
      refetchAllowance()
      setStep('pay')
      toast.success('USDC approved!')
    }
  }, [isApproveConfirmed, refetchAllowance])

  // Handle payment confirmation
  useEffect(() => {
    if (isPayConfirmed && payTxHash) {
      handlePaymentConfirmed(payTxHash)
    }
  }, [isPayConfirmed, payTxHash])

  const handlePaymentConfirmed = async (hash: string) => {
    if (!address) return

    try {
      // Create order in database
      await createOrder.mutateAsync({
        productId: product.id,
        blockchainLinkId: product.blockchain_link_id!,
        buyerWallet: address,
        amountUsdc: product.price_usdc,
        txHash: hash,
      })

      // Generate download URL
      let finalDownloadUrl = product.download_url

      if (product.delivery_method === 'file' && product.download_url) {
        // Get file path from URL
        const url = new URL(product.download_url)
        const filePath = url.pathname.split('/').slice(-2).join('/') // Get last two segments

        const { data } = await supabase.storage
          .from('digital-products')
          .createSignedUrl(filePath, 3600) // 1 hour expiry

        if (data?.signedUrl) {
          finalDownloadUrl = data.signedUrl
        }
      }

      setTxHash(hash)
      setDownloadUrl(finalDownloadUrl)
      setStep('success')
      setShowSuccessModal(true)
      toast.success('Payment successful!')
    } catch (error) {
      console.error('Error recording order:', error)
      toast.error('Payment recorded but failed to create order')
    }
  }

  const handleApprove = () => {
    if (!CONTRACTS.USDC || !CONTRACTS.AAAS_PAYMENT_LINK) {
      toast.error('Contracts not configured')
      return
    }

    writeApprove({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [CONTRACTS.AAAS_PAYMENT_LINK, amountBigInt],
    })
  }

  const handlePay = () => {
    if (!CONTRACTS.AAAS_PAYMENT_LINK || !product.blockchain_link_id) {
      toast.error('Payment link not configured')
      return
    }

    writePay({
      address: CONTRACTS.AAAS_PAYMENT_LINK,
      abi: AAAS_PAYMENT_LINK_ABI,
      functionName: 'payLink',
      args: [BigInt(product.blockchain_link_id)],
    })
  }

  const copyDownloadLink = async () => {
    if (downloadUrl) {
      await navigator.clipboard.writeText(downloadUrl)
      toast.success('Download link copied!')
    }
  }

  const hasInsufficientBalance = balance !== undefined && balance < amountBigInt

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>
            Pay with USDC on Arc Testnet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Balance Info */}
          {isConnected && balance !== undefined && (
            <div className="p-4 bg-muted rounded-lg flex justify-between items-center">
              <span className="text-muted-foreground">Your USDC Balance</span>
              <span className={`font-mono ${hasInsufficientBalance ? 'text-red-500' : ''}`}>
                {formatUnits(balance, 6)} USDC
              </span>
            </div>
          )}

          {hasInsufficientBalance && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              Insufficient USDC balance. You need at least {formatUSDC(product.price_usdc)}.
            </div>
          )}

          {/* Payment Steps */}
          <div className="space-y-4">
            {/* Step 1: Connect Wallet */}
            <div className={`flex items-center gap-4 p-4 rounded-lg border ${
              step === 'connect' ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                isConnected ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                {isConnected ? <CheckCircle2 className="h-5 w-5" /> : '1'}
              </div>
              <div className="flex-1">
                <p className="font-medium">Connect Wallet</p>
                <p className="text-sm text-muted-foreground">
                  {isConnected ? shortenAddress(address!) : 'Connect to pay'}
                </p>
              </div>
              {!isConnected && <ConnectButton />}
            </div>

            {/* Step 2: Approve USDC */}
            <div className={`flex items-center gap-4 p-4 rounded-lg border ${
              step === 'approve' ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'pay' || step === 'success' ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                {step === 'pay' || step === 'success' ? <CheckCircle2 className="h-5 w-5" /> : '2'}
              </div>
              <div className="flex-1">
                <p className="font-medium">Approve USDC</p>
                <p className="text-sm text-muted-foreground">
                  Allow contract to spend {formatUSDC(product.price_usdc)}
                </p>
              </div>
              {step === 'approve' && (
                <Button
                  onClick={handleApprove}
                  disabled={isApprovePending || isApproveConfirming || hasInsufficientBalance}
                >
                  {isApprovePending || isApproveConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Approve'
                  )}
                </Button>
              )}
            </div>

            {/* Step 3: Pay */}
            <div className={`flex items-center gap-4 p-4 rounded-lg border ${
              step === 'pay' ? 'border-primary bg-primary/5' : 'border-border'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                step === 'success' ? 'bg-green-500 text-white' : 'bg-muted'
              }`}>
                {step === 'success' ? <CheckCircle2 className="h-5 w-5" /> : '3'}
              </div>
              <div className="flex-1">
                <p className="font-medium">Complete Payment</p>
                <p className="text-sm text-muted-foreground">
                  Pay {formatUSDC(product.price_usdc)} USDC
                </p>
              </div>
              {step === 'pay' && (
                <Button
                  onClick={handlePay}
                  disabled={isPayPending || isPayConfirming}
                  size="lg"
                >
                  {isPayPending || isPayConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {isPayConfirming ? 'Confirming...' : 'Sign...'}
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Pay Now
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            1% platform fee • Payments on Arc Testnet
          </p>
        </CardContent>
      </Card>

      {/* Success Modal - TOKEN GATED CONTENT */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription>
              Your purchase is complete. Download your product below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transaction Info */}
            {txHash && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Transaction</p>
                <a
                  href={`https://explorer.arc.network/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-mono text-primary hover:underline flex items-center gap-1"
                >
                  {shortenAddress(txHash)}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {/* THE TOKEN-GATED DOWNLOAD */}
            <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
              <h3 className="font-semibold">Your Download is Ready</h3>
              
              {downloadUrl ? (
                <>
                  <Button
                    onClick={() => window.open(downloadUrl, '_blank')}
                    className="w-full"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {product.file_name || 'Product'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={copyDownloadLink}
                    className="w-full"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Download Link
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center">
                    Link expires in 1 hour
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Check your order details for access instructions.
                </p>
              )}
            </div>

            {/* Marketplace Redirect */}
            <div className="pt-4 border-t">
              <p className="text-sm text-muted-foreground mb-3 text-center">
                Discover more products from our marketplace
              </p>
              <Button
                variant="outline"
                onClick={() => router.push('/marketplace')}
                className="w-full"
              >
                <Store className="h-4 w-4 mr-2" />
                Browse Marketplace
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
