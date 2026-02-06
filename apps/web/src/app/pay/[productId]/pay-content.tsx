'use client'

import { useParams } from 'next/navigation'
import { useProduct } from '@/hooks/useProducts'
import { PaymentContent } from './payment-content'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatUSDC } from '@/lib/utils'
import { AlertCircle } from 'lucide-react'

export default function PayPageContent() {
  const params = useParams()
  const productId = params.productId as string
  const { data: product, isLoading, error } = useProduct(productId)

  if (isLoading) {
    return (
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground">
              This product may have been removed or the link is invalid.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!product.blockchain_link_id) {
    return (
      <div className="container py-8 max-w-2xl">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Product Not Active</h2>
            <p className="text-muted-foreground">
              This product hasn&apos;t been activated yet. Please check back later.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-2xl">
      {/* Product Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{product.name}</CardTitle>
              {product.one_liner && (
                <CardDescription className="mt-2 text-base">
                  {product.one_liner}
                </CardDescription>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-2xl font-bold">
                {formatUSDC(product.price_usdc)}
              </div>
              <div className="text-sm text-muted-foreground">USDC</div>
            </div>
          </div>
          
          {/* Category & Tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {product.category && (
              <Badge variant="secondary">{product.category.name}</Badge>
            )}
            {product.tags?.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </CardHeader>
        
        {product.description && (
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {product.description}
            </p>
          </CardContent>
        )}
      </Card>

      {/* Payment Section */}
      <PaymentContent product={product} />
    </div>
  )
}
