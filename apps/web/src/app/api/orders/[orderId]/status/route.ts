import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * GET /api/orders/[orderId]/status
 * 
 * Returns order status for agent polling.
 * Agents use this endpoint to check if a payment has been completed.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params

    // Fetch order with product info
    const { data: order, error } = await supabase
      .from('orders')
      .select(`
        id,
        status,
        tx_hash,
        payment_confirmed_at,
        product:products(
          id,
          name,
          download_url,
          delivery_method
        )
      `)
      .eq('id', orderId)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Prepare response
    const response: {
      order_id: string
      status: string
      tx_hash: string | null
      payment_confirmed_at: string | null
      product_name: string | null
      download_url?: string | null
    } = {
      order_id: order.id,
      status: order.status,
      tx_hash: order.tx_hash,
      payment_confirmed_at: order.payment_confirmed_at,
      product_name: (order.product as any)?.name || null,
    }

    // Only include download URL if payment is confirmed
    if (order.status === 'completed' && (order.product as any)?.download_url) {
      const product = order.product as any

      // For file delivery, generate a signed URL
      if (product.delivery_method === 'file' && product.download_url) {
        try {
          const url = new URL(product.download_url)
          const filePath = url.pathname.split('/').slice(-2).join('/')

          const { data } = await supabase.storage
            .from('digital-products')
            .createSignedUrl(filePath, 3600) // 1 hour expiry

          response.download_url = data?.signedUrl || product.download_url
        } catch {
          response.download_url = product.download_url
        }
      } else {
        response.download_url = product.download_url
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching order status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order status' },
      { status: 500 }
    )
  }
}
