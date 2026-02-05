'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, XCircle, Loader2, User } from 'lucide-react'

type Props = {
  open: boolean
  walletAddress: string
  onClaimed: (username: string) => void
}

// Validation: lowercase, alphanumeric, underscore, 3-20 chars
const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/
const RESERVED_USERNAMES = ['admin', 'aaas', 'support', 'help', 'system', 'mod', 'moderator']

type ValidationState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export function ClaimUsernameModal({ open, walletAddress, onClaimed }: Props) {
  const [username, setUsername] = useState('')
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [validationMessage, setValidationMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Validate format
  const validateFormat = (value: string): { valid: boolean; message: string } => {
    if (!value) {
      return { valid: false, message: '' }
    }
    if (value.length < 3) {
      return { valid: false, message: 'Username must be at least 3 characters' }
    }
    if (value.length > 20) {
      return { valid: false, message: 'Username must be 20 characters or less' }
    }
    if (!USERNAME_REGEX.test(value)) {
      return { valid: false, message: 'Only lowercase letters, numbers, and underscores allowed' }
    }
    if (RESERVED_USERNAMES.includes(value.toLowerCase())) {
      return { valid: false, message: 'This username is reserved' }
    }
    return { valid: true, message: '' }
  }

  // Check uniqueness against database
  const checkUniqueness = useCallback(async (value: string) => {
    if (!value) return

    const formatCheck = validateFormat(value)
    if (!formatCheck.valid) {
      setValidationState('invalid')
      setValidationMessage(formatCheck.message)
      return
    }

    setValidationState('checking')
    setValidationMessage('Checking availability...')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('display_name')
        .eq('display_name', value.toLowerCase())
        .maybeSingle()

      if (error) {
        console.error('Error checking username:', error)
        setValidationState('invalid')
        setValidationMessage('Error checking availability')
        return
      }

      if (data) {
        setValidationState('taken')
        setValidationMessage('Username is already taken')
      } else {
        setValidationState('available')
        setValidationMessage('Username is available!')
      }
    } catch (error) {
      console.error('Error checking username:', error)
      setValidationState('invalid')
      setValidationMessage('Error checking availability')
    }
  }, [])

  // Debounced uniqueness check
  useEffect(() => {
    if (!username) {
      setValidationState('idle')
      setValidationMessage('')
      return
    }

    const formatCheck = validateFormat(username)
    if (!formatCheck.valid) {
      setValidationState('invalid')
      setValidationMessage(formatCheck.message)
      return
    }

    const timer = setTimeout(() => {
      checkUniqueness(username)
    }, 500)

    return () => clearTimeout(timer)
  }, [username, checkUniqueness])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Force lowercase and remove invalid characters
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (validationState !== 'available') {
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({ display_name: username.toLowerCase() })
        .eq('wallet_address', walletAddress)

      if (error) {
        // Check if it's a uniqueness error
        if (error.code === '23505') {
          setValidationState('taken')
          setValidationMessage('Username was just taken. Try another.')
        } else {
          console.error('Error saving username:', error)
          setValidationMessage('Failed to save username. Please try again.')
        }
        return
      }

      onClaimed(username.toLowerCase())
    } catch (error) {
      console.error('Error saving username:', error)
      setValidationMessage('Failed to save username. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getValidationIcon = () => {
    switch (validationState) {
      case 'checking':
        return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      case 'available':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'taken':
      case 'invalid':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getValidationColor = () => {
    switch (validationState) {
      case 'available':
        return 'text-green-500'
      case 'taken':
      case 'invalid':
        return 'text-red-500'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Claim Your Username
          </DialogTitle>
          <DialogDescription>
            Choose a unique username for your seller profile. This will be visible to buyers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <Input
                id="username"
                value={username}
                onChange={handleInputChange}
                placeholder="your_username"
                maxLength={20}
                autoComplete="off"
                autoFocus
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {getValidationIcon()}
              </div>
            </div>
            {validationMessage && (
              <p className={`text-sm ${getValidationColor()}`}>
                {validationMessage}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              3-20 characters. Lowercase letters, numbers, and underscores only.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={validationState !== 'available' || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Claiming...
              </>
            ) : (
              'Claim Username'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
