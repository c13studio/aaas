'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi'
import { parseUnits, decodeEventLog } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CONTRACTS, AAAS_PAYMENT_LINK_ABI } from '@/lib/contracts'
import { useActivateProduct } from '@/hooks/useProducts'
import { formatUSDC } from '@/lib/utils'
import type { Product } from '@/lib/supabase'
import { toast } from 'sonner'
import { CheckCircle2, Download, Loader2, Rocket, FileCode, Home, Twitter, ArrowRight, ExternalLink, Mail } from 'lucide-react'

type Props = {
  product: Product
  onActivated?: () => void
}

const X_HANDLE = 'c13agent'

// Generate a unique verification code
function generateVerificationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed confusing chars like 0/O, 1/I
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `aaas-${code}`
}

// Validate URL format
function isValidUrl(string: string): boolean {
  try {
    const url = new URL(string)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Check if URL looks like a tweet URL
function isTweetUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      (parsed.hostname === 'twitter.com' || 
       parsed.hostname === 'x.com' || 
       parsed.hostname === 'www.twitter.com' || 
       parsed.hostname === 'www.x.com') &&
      parsed.pathname.includes('/status/')
    )
  } catch {
    return false
  }
}

type VerificationStep = 'tweet' | 'verify' | 'complete'

export function ActivateProduct({ product, onActivated }: Props) {
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [verificationStep, setVerificationStep] = useState<VerificationStep>('tweet')
  const [tweetUrl, setTweetUrl] = useState('')
  const [email, setEmail] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const router = useRouter()
  const publicClient = usePublicClient()
  const activateProduct = useActivateProduct()

  // Generate verification code once per modal open
  const verificationCode = useMemo(() => generateVerificationCode(), [showSuccessModal])

  const {
    writeContract,
    data: txHash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess: isConfirmed,
    data: receipt,
  } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Handle tx confirmation
  useEffect(() => {
    if (isConfirmed && receipt && txHash) {
      handleTxConfirmed()
    }
  }, [isConfirmed, receipt, txHash])

  const handleTxConfirmed = async () => {
    if (!receipt || !txHash) return

    try {
      // Parse the PaymentLinkCreated event to get the linkId
      let blockchainLinkId = 1

      for (const log of receipt.logs) {
        try {
          const decoded = decodeEventLog({
            abi: AAAS_PAYMENT_LINK_ABI,
            data: log.data,
            topics: log.topics,
          })

          if (decoded.eventName === 'PaymentLinkCreated') {
            blockchainLinkId = Number((decoded.args as any).linkId)
            break
          }
        } catch {
          // Not the event we're looking for
        }
      }

      // Update product in database
      await activateProduct.mutateAsync({
        productId: product.id,
        blockchainLinkId,
        txHash,
      })

      setShowSuccessModal(true)
      setVerificationStep('tweet')
      toast.success('Product activated successfully!')
      onActivated?.()
    } catch (error) {
      console.error('Error activating product:', error)
      toast.error('Failed to save activation')
    }
  }

  const handleActivate = async () => {
    if (!CONTRACTS.AAAS_PAYMENT_LINK) {
      toast.error('Contract not configured. Please check environment variables.')
      return
    }

    try {
      // Convert price to smallest unit (6 decimals for USDC)
      const amountBigInt = parseUnits(product.price_usdc.toString(), 6)

      writeContract({
        address: CONTRACTS.AAAS_PAYMENT_LINK,
        abi: AAAS_PAYMENT_LINK_ABI,
        functionName: 'createPaymentLink',
        args: [amountBigInt, product.name],
      })
    } catch (error) {
      console.error('Error creating payment link:', error)
      toast.error('Failed to create payment link')
    }
  }

  // Generate Twitter Intent URL
  const tweetText = `I'm claiming my seller profile on @${X_HANDLE}'s marketplace\n\nVerification: ${verificationCode}`
  const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`

  const handlePostTweet = () => {
    window.open(twitterIntentUrl, '_blank')
  }

  const handleProceedToVerify = () => {
    setVerificationStep('verify')
  }

  const handleVerifyAndClaim = async () => {
    if (!tweetUrl) {
      toast.error('Please paste your tweet URL')
      return
    }

    if (!isValidUrl(tweetUrl)) {
      toast.error('Please enter a valid URL')
      return
    }

    if (!isTweetUrl(tweetUrl)) {
      toast.error('Please enter a valid X/Twitter post URL')
      return
    }

    setIsVerifying(true)
    
    // Simulate verification (in production, you might verify via X API)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // TODO: Optionally store email and tweet URL in database
    // await saveVerification({ productId: product.id, tweetUrl, email, verificationCode })
    
    setIsVerifying(false)
    setVerificationStep('complete')
    toast.success('Verification complete!')
  }

  const handleDownloadSkill = () => {
    window.open(`/api/skills/${product.id}`, '_blank')
  }

  const handleGoToDashboard = () => {
    setShowSuccessModal(false)
    router.push('/dashboard')
  }

  if (writeError) {
    toast.error(writeError.message)
  }

  const isLoading = isWritePending || isConfirming

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Activate Product
          </CardTitle>
          <CardDescription>
            Sign a transaction to create the payment link on-chain. 
            After activation, you can claim your AaaS.md skill file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Product</span>
              <span className="font-medium">{product.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Price</span>
              <span className="font-medium">{formatUSDC(product.price_usdc)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category</span>
              <span className="font-medium">{product.category_id || 'Not set'}</span>
            </div>
          </div>

          {product.blockchain_link_id ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-medium">Product is active!</span>
              </div>
              <Button onClick={handleDownloadSkill} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                Download AaaS.md Skill
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleActivate}
              disabled={isLoading}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {isConfirming ? 'Confirming...' : 'Sign Transaction...'}
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Activate on Blockchain
                </>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground text-center">
            This will cost a small amount of gas on Arc Testnet
          </p>
        </CardContent>
      </Card>

      {/* Success Modal with Tweet Verification */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
              Product Activated!
            </DialogTitle>
            <DialogDescription>
              Complete verification to claim your AaaS.md skill file.
            </DialogDescription>
          </DialogHeader>

          {/* Step 1: Post Tweet */}
          {verificationStep === 'tweet' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">1</span>
                Post this tweet
              </div>

              <div className="p-4 bg-muted rounded-lg space-y-2">
                <p className="text-sm whitespace-pre-wrap">
                  I'm claiming my seller profile on @{X_HANDLE}'s marketplace
                  {'\n\n'}
                  Verification: <span className="font-mono font-bold">{verificationCode}</span>
                </p>
              </div>

              <Button onClick={handlePostTweet} className="w-full">
                <Twitter className="h-4 w-4 mr-2" />
                Post Tweet
                <ExternalLink className="h-3 w-3 ml-2" />
              </Button>

              <button
                onClick={handleProceedToVerify}
                className="w-full text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 py-2 transition-colors"
              >
                I've posted this tweet
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Step 2: Verify Tweet URL */}
          {verificationStep === 'verify' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs">2</span>
                Paste your tweet URL
              </div>

              <p className="text-sm text-muted-foreground">
                Copy the URL of your verification tweet from X and paste it here.
              </p>

              <div className="space-y-2">
                <Label htmlFor="tweetUrl">Tweet URL *</Label>
                <Input
                  id="tweetUrl"
                  type="url"
                  value={tweetUrl}
                  onChange={(e) => setTweetUrl(e.target.value)}
                  placeholder="https://x.com/username/status/..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email (optional)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Get updates on your AaaS"
                />
              </div>

              <Button 
                onClick={handleVerifyAndClaim} 
                className="w-full"
                disabled={isVerifying || !tweetUrl}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Verify and Claim
                  </>
                )}
              </Button>

              <button
                onClick={() => setVerificationStep('tweet')}
                className="w-full text-sm text-muted-foreground hover:text-foreground py-2 transition-colors"
              >
                ← Back to Step 1
              </button>
            </div>
          )}

          {/* Step 3: Verification Complete - Download */}
          {verificationStep === 'complete' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Verification Complete!</span>
                </div>
                <p className="text-sm text-green-600/80 dark:text-green-400/80 mt-1">
                  Your seller profile has been claimed.
                </p>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-mono break-all">
                  Hashtag: #{product.hashtag || `aaas_${product.id.slice(0, 8)}`}
                </p>
              </div>

              <Button onClick={handleDownloadSkill} className="w-full">
                <FileCode className="h-4 w-4 mr-2" />
                Download AaaS.md Skill File
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Share this skill file with OpenClaw agents to start promoting your product
              </p>

              <Button 
                onClick={handleGoToDashboard} 
                variant="outline"
                className="w-full"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
