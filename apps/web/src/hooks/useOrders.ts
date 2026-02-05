'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Order } from '@/lib/supabase'
import { useAuth } from './useAuth'

// Fetch orders for a seller (dashboard)
export function useMyOrders() {
  const { address } = useAuth()

  return useQuery({
    queryKey: ['my-orders', address],
    queryFn: async () => {
      if (!address) return []

      // Get orders for products owned by the current user
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(id, name, seller_wallet)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filter to only orders for products owned by this seller
      const myOrders = data.filter(
        (order: any) => order.product?.seller_wallet === address
      )

      return myOrders as (Order & { product: { id: string; name: string; seller_wallet: string } })[]
    },
    enabled: !!address,
  })
}

// Fetch orders for a specific product
export function useProductOrders(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-orders', productId],
    queryFn: async () => {
      if (!productId) return []

      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Order[]
    },
    enabled: !!productId,
  })
}

// Fetch a single order by ID
export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      if (!orderId) return null

      const { data, error } = await supabase
        .from('orders')
        .select('*, product:products(*)')
        .eq('id', orderId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!orderId,
  })
}

// Create a new order (after payment)
export function useCreateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      blockchainLinkId,
      buyerWallet,
      amountUsdc,
      txHash,
    }: {
      productId: string
      blockchainLinkId: number
      buyerWallet: string
      amountUsdc: number
      txHash: string
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .insert([
          {
            product_id: productId,
            blockchain_link_id: blockchainLinkId,
            buyer_wallet: buyerWallet.toLowerCase(),
            amount_usdc: amountUsdc,
            tx_hash: txHash,
            status: 'completed',
            payment_confirmed_at: new Date().toISOString(),
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data as Order
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-orders', data.product_id] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })
}

// Update order status
export function useUpdateOrder() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      orderId,
      updates,
    }: {
      orderId: string
      updates: Partial<Order>
    }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error
      return data as Order
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['order', data.id] })
      queryClient.invalidateQueries({ queryKey: ['product-orders', data.product_id] })
      queryClient.invalidateQueries({ queryKey: ['my-orders'] })
    },
  })
}
