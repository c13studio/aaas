import { NextRequest, NextResponse } from 'next/server'
import { supabase, type Product } from '@/lib/supabase'
import { generateSkill } from '@/lib/skill-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params

    // Fetch product from database
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is activated
    if (!product.blockchain_link_id) {
      return NextResponse.json(
        { error: 'Product not activated. Sign the blockchain transaction first.' },
        { status: 400 }
      )
    }

    // Generate skill file content
    const skillContent = generateSkill(product as Product)

    // Return as downloadable markdown file
    return new NextResponse(skillContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${product.hashtag}.md"`,
      },
    })
  } catch (error) {
    console.error('Error generating skill:', error)
    return NextResponse.json(
      { error: 'Failed to generate skill file' },
      { status: 500 }
    )
  }
}
