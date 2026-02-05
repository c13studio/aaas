'use client'

import Link from 'next/link'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatUSDC, shortenAddress } from '@/lib/utils'
import type { ProductWithCategory } from '@/lib/supabase'
import { Flame, TrendingUp, Zap, ShoppingCart, Tag } from 'lucide-react'

type Props = {
  product: ProductWithCategory
}

const hypeBadgeConfig = {
  viral: {
    label: 'Viral',
    icon: Zap,
    className: 'bg-purple-500 hover:bg-purple-600',
  },
  trending: {
    label: 'Trending',
    icon: TrendingUp,
    className: 'bg-orange-500 hover:bg-orange-600',
  },
  hot: {
    label: 'Hot',
    icon: Flame,
    className: 'bg-red-500 hover:bg-red-600',
  },
}

export function ProductCard({ product }: Props) {
  const hypeBadge = product.hype_badge
    ? hypeBadgeConfig[product.hype_badge as keyof typeof hypeBadgeConfig]
    : null

  return (
    <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link
              href={`/pay/${product.id}`}
              className="font-semibold text-lg hover:text-primary line-clamp-1"
            >
              {product.name}
            </Link>
            {product.one_liner && (
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                {product.one_liner}
              </p>
            )}
          </div>
          
          {hypeBadge && (
            <Badge className={`shrink-0 ${hypeBadge.className}`}>
              <hypeBadge.icon className="h-3 w-3 mr-1" />
              {hypeBadge.label}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 pb-3">
        {/* Category & Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {product.category && (
            <Badge variant="secondary" className="text-xs">
              {product.category.name}
            </Badge>
          )}
          {product.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
          {product.tags && product.tags.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{product.tags.length - 3}
            </Badge>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5" />
            <span>{product.sales_count || 0} sales</span>
          </div>
          {product.hype_score > 0 && (
            <div className="flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-orange-500" />
              <span>{product.hype_score}</span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div>
            <div className="text-lg font-bold">
              {formatUSDC(product.price_usdc)}
            </div>
            <div className="text-xs text-muted-foreground">
              by {shortenAddress(product.seller_wallet)}
            </div>
          </div>
          <Button asChild size="sm">
            <Link href={`/pay/${product.id}`}>
              Buy Now
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
