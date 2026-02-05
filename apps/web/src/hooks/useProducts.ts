'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, type Product, type ProductWithCategory } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { generateSlug, generateHashtag } from '@/lib/utils'

type ProductFormData = {
  name: string
  one_liner?: string
  description?: string
  price_usdc: number
  category_id?: string
  tags?: string[]
  delivery_method?: 'file' | 'link' | 'license_key' | 'gated'
  download_url?: string
  file_name?: string
  file_size?: number
  file_type?: string
  image_url?: string
  marketing_templates?: { id: string; type: string; content: string }[]
  faq_blocks?: { question: string; answer: string }[]
}

// Fetch products for the marketplace
export function useMarketplaceProducts(options?: {
  categoryId?: string | null
  tags?: string[]
  sortBy?: 'hype' | 'newest' | 'price-low' | 'price-high' | 'sales'
  search?: string
}) {
  return useQuery({
    queryKey: ['marketplace-products', options],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('status', 'active')
        .not('blockchain_link_id', 'is', null)

      if (options?.categoryId) {
        query = query.eq('category_id', options.categoryId)
      }

      if (options?.tags && options.tags.length > 0) {
        query = query.overlaps('tags', options.tags)
      }

      if (options?.search) {
        query = query.ilike('name', `%${options.search}%`)
      }

      // Sorting
      switch (options?.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false })
          break
        case 'price-low':
          query = query.order('price_usdc', { ascending: true })
          break
        case 'price-high':
          query = query.order('price_usdc', { ascending: false })
          break
        case 'sales':
          query = query.order('sales_count', { ascending: false })
          break
        case 'hype':
        default:
          query = query.order('hype_score', { ascending: false })
          break
      }

      const { data, error } = await query

      if (error) throw error
      return data as ProductWithCategory[]
    },
  })
}

// Fetch products for the current user (seller dashboard)
export function useMyProducts() {
  const { address } = useAuth()

  return useQuery({
    queryKey: ['my-products', address],
    queryFn: async () => {
      if (!address) return []

      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('seller_wallet', address)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as ProductWithCategory[]
    },
    enabled: !!address,
  })
}

// Fetch a single product by ID
export function useProduct(productId: string | undefined) {
  return useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      if (!productId) return null

      const { data, error } = await supabase
        .from('products')
        .select('*, category:categories(*)')
        .eq('id', productId)
        .single()

      if (error) throw error
      return data as ProductWithCategory
    },
    enabled: !!productId,
  })
}

// Create a new product (draft)
export function useCreateProduct() {
  const { address } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (formData: ProductFormData) => {
      if (!address) throw new Error('Not connected')

      const slug = generateSlug(formData.name)

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            seller_wallet: address,
            name: formData.name,
            slug,
            one_liner: formData.one_liner,
            description: formData.description,
            price_usdc: formData.price_usdc,
            category_id: formData.category_id,
            tags: formData.tags || [],
            delivery_method: formData.delivery_method,
            download_url: formData.download_url,
            file_name: formData.file_name,
            file_size: formData.file_size,
            file_type: formData.file_type,
            image_url: formData.image_url,
            marketing_templates: formData.marketing_templates,
            faq_blocks: formData.faq_blocks,
            status: 'draft',
          },
        ])
        .select()
        .single()

      if (error) throw error
      return data as Product
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
    },
  })
}

// Update a product (including activation)
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      productId,
      updates,
    }: {
      productId: string
      updates: Partial<Product>
    }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId)
        .select()
        .single()

      if (error) throw error
      return data as Product
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      queryClient.invalidateQueries({ queryKey: ['product', data.id] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] })
    },
  })
}

// Activate a product (set blockchain_link_id and hashtag)
export function useActivateProduct() {
  const updateProduct = useUpdateProduct()

  return useMutation({
    mutationFn: async ({
      productId,
      blockchainLinkId,
      txHash,
    }: {
      productId: string
      blockchainLinkId: number
      txHash: string
    }) => {
      const hashtag = generateHashtag(productId)

      return updateProduct.mutateAsync({
        productId,
        updates: {
          blockchain_link_id: blockchainLinkId,
          activation_tx_hash: txHash,
          hashtag,
          status: 'active',
        },
      })
    },
  })
}

// Delete a product
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-products'] })
      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] })
    },
  })
}
