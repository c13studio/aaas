'use client'

import { useAccount } from 'wagmi'
import { useMyProducts, useDeleteProduct } from '@/hooks/useProducts'
import { useMyOrders } from '@/hooks/useOrders'
import { useAuth } from '@/hooks/useAuth'
import { ConnectButton } from '@/components/connect-button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { formatUSDC, shortenAddress } from '@/lib/utils'
import type { ProductWithCategory, Order } from '@/lib/supabase'
import Link from 'next/link'
import {
  Package,
  ShoppingCart,
  Flame,
  TrendingUp,
  Zap,
  Download,
  ExternalLink,
  Plus,
  DollarSign,
  BarChart3,
  Pencil,
  Trash2,
} from 'lucide-react'

export default function DashboardContent() {
  const { isConnected } = useAccount()
  const { address } = useAuth()
  const { data: products, isLoading: productsLoading } = useMyProducts()
  const { data: orders, isLoading: ordersLoading } = useMyOrders()

  if (!isConnected) {
    return (
      <div className="container py-16 max-w-md text-center">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-4">Seller Dashboard</h1>
        <p className="text-muted-foreground mb-6">
          Connect your wallet to view your products and orders.
        </p>
        <ConnectButton />
      </div>
    )
  }

  const activeProducts = products?.filter((p) => p.status === 'active') || []
  const draftProducts = products?.filter((p) => p.status === 'draft') || []
  const completedOrders = orders?.filter((o) => o.status === 'completed') || []
  
  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.amount_usdc), 0)
  const totalSales = activeProducts.reduce((sum, p) => sum + (p.sales_count || 0), 0)
  const avgHypeScore = activeProducts.length 
    ? activeProducts.reduce((sum, p) => sum + (p.hype_score || 0), 0) / activeProducts.length
    : 0

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your products and track performance</p>
        </div>
        <Button asChild>
          <Link href="/create">
            <Plus className="h-4 w-4 mr-2" />
            Create Product
          </Link>
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Products</CardDescription>
            <CardTitle className="text-3xl">{activeProducts.length}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              {draftProducts.length} drafts
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Sales</CardDescription>
            <CardTitle className="text-3xl">{totalSales}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ShoppingCart className="h-4 w-4" />
              All time
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue</CardDescription>
            <CardTitle className="text-3xl">{formatUSDC(totalRevenue)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              USDC (after fees)
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Hype Score</CardDescription>
            <CardTitle className="text-3xl">{Math.round(avgHypeScore)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              Across products
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList>
          <TabsTrigger value="products">
            <Package className="h-4 w-4 mr-2" />
            Products ({products?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="orders">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Orders ({orders?.length || 0})
          </TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products">
          {productsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : products?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No products yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first product to start selling
                </p>
                <Button asChild>
                  <Link href="/create">Create Product</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {products?.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          {ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-1/3 mb-2" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : orders?.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
                <p className="text-muted-foreground">
                  Orders will appear here when customers purchase your products
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders?.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ProductCard({ product }: { product: ProductWithCategory }) {
  const deleteProduct = useDeleteProduct()
  
  const hypeBadgeConfig = {
    viral: { label: 'Viral', icon: Zap, className: 'bg-purple-500' },
    trending: { label: 'Trending', icon: TrendingUp, className: 'bg-orange-500' },
    hot: { label: 'Hot', icon: Flame, className: 'bg-red-500' },
  }

  const hypeBadge = product.hype_badge
    ? hypeBadgeConfig[product.hype_badge as keyof typeof hypeBadgeConfig]
    : null

  const handleDownloadSkill = () => {
    if (product.blockchain_link_id) {
      window.open(`/api/skills/${product.id}`, '_blank')
    }
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this product? This cannot be undone.')) {
      try {
        await deleteProduct.mutateAsync(product.id)
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <Badge 
                variant={product.status === 'active' ? 'default' : 'secondary'}
                className={product.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}
              >
                {product.status}
              </Badge>
              {hypeBadge && (
                <Badge className={hypeBadge.className}>
                  <hypeBadge.icon className="h-3 w-3 mr-1" />
                  {hypeBadge.label}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {product.one_liner || 'No description'}
            </p>
            
            {/* Stats */}
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{formatUSDC(product.price_usdc)}</span>
              </div>
              <div className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                <span>{product.sales_count || 0} sales</span>
              </div>
              {product.hype_score > 0 && (
                <div className="flex items-center gap-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <span>Hype: {product.hype_score}</span>
                </div>
              )}
              {product.hashtag && (
                <div className="text-muted-foreground">
                  #{product.hashtag}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {product.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSkill}
                  title="Download AaaS.md skill file"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Skill
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/pay/${product.id}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View
                  </Link>
                </Button>
              </>
            )}
            {product.status === 'draft' && (
              <Button size="sm" asChild>
                <Link href={`/create?product=${product.id}`}>
                  Activate
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm" asChild>
              <Link href={`/create?product=${product.id}`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={handleDelete}
              disabled={deleteProduct.isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function OrderCard({ order }: { order: Order }) {
  const statusColors = {
    pending: 'bg-yellow-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
              <Badge className={statusColors[order.status as keyof typeof statusColors]}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              Buyer: {shortenAddress(order.buyer_wallet)}
            </p>
            <div className="flex items-center gap-4 text-sm">
              <span className="font-medium">{formatUSDC(order.amount_usdc)} USDC</span>
              <span className="text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          {order.tx_hash && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://explorer.arc.network/tx/${order.tx_hash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Tx
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
