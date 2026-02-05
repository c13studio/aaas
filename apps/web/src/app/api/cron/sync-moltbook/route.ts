import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import {
  searchPostsByHashtag,
  calculateEngagement,
  calculateHypeScore,
  getHypeBadge,
} from '@/lib/moltbook'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/sync-moltbook
 * 
 * Syncs Moltbook activity for all active products and recalculates hype scores.
 * Should be called by a cron job (e.g., every hour).
 * 
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all active products with hashtags
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, hashtag, sales_count')
      .eq('status', 'active')
      .not('hashtag', 'is', null)

    if (productsError) throw productsError

    if (!products || products.length === 0) {
      return NextResponse.json({ message: 'No products to sync', synced: 0 })
    }

    const results = {
      synced: 0,
      errors: [] as string[],
    }

    // Process each product
    for (const product of products) {
      if (!product.hashtag) continue

      try {
        // Search Moltbook for posts with this hashtag
        const searchResult = await searchPostsByHashtag(product.hashtag, {
          limit: 100,
        })

        // Calculate engagement metrics
        const engagement = calculateEngagement(searchResult.posts)

        // Calculate hype score
        const hypeScore = calculateHypeScore(
          product.sales_count || 0,
          engagement.postCount,
          engagement.totalEngagement
        )

        // Determine badge
        const hypeBadge = getHypeBadge(hypeScore)

        // Update product with new metrics
        const { error: updateError } = await supabase
          .from('products')
          .update({
            moltbook_post_count: engagement.postCount,
            moltbook_engagement: engagement.totalEngagement,
            hype_score: hypeScore,
            hype_badge: hypeBadge,
          })
          .eq('id', product.id)

        if (updateError) {
          results.errors.push(`Product ${product.id}: ${updateError.message}`)
        } else {
          // Log activity to moltbook_activity table
          if (searchResult.posts.length > 0) {
            const activityRecords = searchResult.posts.map((post) => ({
              product_id: product.id,
              hashtag: product.hashtag,
              post_id: post.id,
              author: post.author,
              content: post.content.slice(0, 500),
              likes_count: post.likes_count,
              comments_count: post.comments_count,
              reposts_count: post.reposts_count,
              posted_at: post.created_at,
            }))

            // Upsert to avoid duplicates
            await supabase
              .from('moltbook_activity')
              .upsert(activityRecords, {
                onConflict: 'post_id',
                ignoreDuplicates: true,
              })
          }

          results.synced++
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`Product ${product.id}: ${message}`)
      }
    }

    return NextResponse.json({
      message: `Synced ${results.synced} products`,
      ...results,
    })
  } catch (error) {
    console.error('Moltbook sync error:', error)
    return NextResponse.json(
      { error: 'Failed to sync Moltbook activity' },
      { status: 500 }
    )
  }
}

// Also support GET for manual triggering in development
export async function GET(request: NextRequest) {
  return POST(request)
}
