'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useCreateProduct, useProduct } from '@/hooks/useProducts'
import { ProductForm, type ProductFormData } from '@/components/product/product-form'
import { ActivateProduct } from '@/components/product/activate-product'
import { ConnectButton } from '@/components/connect-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'

export default function CreatePageContent() {
  const router = useRouter()
  const { isConnected, address } = useAuth()
  const createProduct = useCreateProduct()
  const [createdProductId, setCreatedProductId] = useState<string | null>(null)
  const { data: product } = useProduct(createdProductId || undefined)
  const [step, setStep] = useState<'form' | 'activate'>('form')

  const handleSubmit = async (formData: ProductFormData) => {
    try {
      const priceNum = parseFloat(formData.price_usdc)
      if (isNaN(priceNum) || priceNum <= 0) {
        toast.error('Please enter a valid price')
        return
      }

      const newProduct = await createProduct.mutateAsync({
        name: formData.name,
        one_liner: formData.one_liner || undefined,
        description: formData.description || undefined,
        price_usdc: priceNum,
        category_id: formData.category_id || undefined,
        tags: formData.tags,
        delivery_method: formData.delivery_method || undefined,
        download_url: formData.download_url || undefined,
        file_name: formData.file_name || undefined,
        file_size: formData.file_size || undefined,
        file_type: formData.file_type || undefined,
        image_url: formData.image_url || undefined,
        marketing_templates: formData.marketing_templates.length > 0 
          ? formData.marketing_templates 
          : undefined,
        faq_blocks: formData.faq_blocks.length > 0 
          ? formData.faq_blocks 
          : undefined,
      })

      setCreatedProductId(newProduct.id)
      setStep('activate')
      toast.success('Product saved as draft!')
    } catch (error: any) {
      console.error('Error creating product:', error)
      toast.error(error.message || 'Failed to create product')
    }
  }

  const handleActivated = () => {
    // Refresh the product data
  }

  if (!isConnected) {
    return (
      <div className="container py-16">
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Connect Your Wallet</CardTitle>
            <CardDescription>
              Connect your wallet to create and sell digital products
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ConnectButton />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        {step === 'activate' && (
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => setStep('form')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Edit
          </Button>
        )}
        <h1 className="text-3xl font-bold">Create Product</h1>
        <p className="text-muted-foreground mt-2">
          {step === 'form'
            ? 'Fill in the details about your digital product'
            : 'Activate your product on the blockchain to start selling'}
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        <div className={`flex items-center gap-2 ${step === 'form' ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'form' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            {step === 'activate' ? <CheckCircle2 className="h-5 w-5" /> : '1'}
          </div>
          <span className="font-medium">Product Details</span>
        </div>
        <div className="flex-1 h-px bg-border" />
        <div className={`flex items-center gap-2 ${step === 'activate' ? 'text-foreground' : 'text-muted-foreground'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step === 'activate' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            2
          </div>
          <span className="font-medium">Activate & Claim</span>
        </div>
      </div>

      {/* Content */}
      {step === 'form' ? (
        <ProductForm
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending}
          submitLabel="Save & Continue"
        />
      ) : product ? (
        <ActivateProduct
          product={product}
          onActivated={handleActivated}
        />
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Loading product...
          </CardContent>
        </Card>
      )}
    </div>
  )
}
