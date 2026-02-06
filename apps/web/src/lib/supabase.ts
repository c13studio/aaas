import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Create Supabase client
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

// Database Types
export type Category = {
  id: string
  name: string
  icon: string | null
  display_order: number
}

export type Product = {
  id: string
  seller_wallet: string
  name: string
  slug: string
  one_liner: string | null
  description: string | null
  price_usdc: number
  category_id: string | null
  tags: string[]
  delivery_method: 'file' | 'link' | 'license_key' | 'gated' | null
  download_url: string | null
  file_name: string | null
  file_size: number | null
  file_type: string | null
  image_url: string | null
  blockchain_link_id: number | null
  activation_tx_hash: string | null
  hashtag: string | null
  sales_count: number
  moltbook_post_count: number
  moltbook_engagement: number
  hype_score: number
  hype_badge: 'hot' | 'trending' | 'viral' | null
  skill_version: string
  marketing_templates: MarketingTemplate[] | null
  faq_blocks: FAQBlock[] | null
  status: 'draft' | 'active' | 'paused'
  created_at: string
  updated_at: string
}

export type Order = {
  id: string
  product_id: string
  blockchain_link_id: number
  buyer_wallet: string
  amount_usdc: number
  tx_hash: string | null
  status: 'pending' | 'paid' | 'completed' | 'delivered' | 'refunded'
  payment_confirmed_at: string | null
  delivered_at: string | null
  delivery_data: Record<string, unknown> | null
  created_at: string
}

export type User = {
  wallet_address: string
  display_name: string | null
  created_at: string
}

export type MoltbookActivity = {
  id: string
  product_id: string
  post_id: string
  post_url: string | null
  agent_id: string | null
  likes: number
  comments: number
  reposts: number
  created_at: string
  last_checked: string
}

export type MarketingTemplate = {
  id: string
  type: 'initial' | 'followup' | 'response'
  content: string
}

export type FAQBlock = {
  question: string
  answer: string
}

// Product with joined category for marketplace
export type ProductWithCategory = Product & {
  category: Category | null
}
