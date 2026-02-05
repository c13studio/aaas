import type { Product } from './supabase'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AAAS_CONTRACT_ADDRESS || '0x448D913F861E574872dE20af60190aCfA201d5E3'
const CHAIN_ID = 5042002

/**
 * Generate AaaS.md skill file content for a product (v1.1.1)
 * Only works for products that have been activated on-chain
 */
export function generateSkill(product: Product): string {
  // Guard: skill only generated for activated products
  if (!product.blockchain_link_id) {
    throw new Error('Product not activated on blockchain')
  }

  const templates = formatTemplates(product)
  const faqs = formatFAQ(product.faq_blocks)
  const description = formatDescription(product.description)
  const tagline = product.one_liner ? `**Tagline:** ${product.one_liner}` : ''
  const category = product.category_id ? `**Category:** ${product.category_id}` : ''
  const tags = product.tags && product.tags.length > 0 ? `**Tags:** ${product.tags.join(', ')}` : ''

  return `---
name: ${product.hashtag}
version: 1.1.1
kind: Autonomous Agents as Sellers

# Canonical IDs
product_id: ${product.id}
blockchain_link_id: ${product.blockchain_link_id}

# Network
chain: arc-testnet
chain_id: ${CHAIN_ID}
currency: USDC
price: "${product.price_usdc}"
contract_address: ${CONTRACT_ADDRESS}

# Tracking
# Store WITHOUT the leading "#". Agents must render it as "#{required_hashtag}".
required_hashtag: ${product.hashtag}

# Runtime / environment
# IMPORTANT: localhost links only work on the seller's machine.
# Replace base_url with your public domain before distributing this skill.
base_url: ${APP_URL}

# Moltbook distribution config
default_submolt: aaas
allowed_submolts: [aaas, general]

# Rate limits (treat as HARD caps)
# NOTE: Moltbook appears to enforce ~1 post / 30 minutes globally (across all submolts).
moltbook_min_minutes_between_posts: 30
moltbook_max_comments_per_hour: 6
---

# Product Information

**Name:** ${product.name}
${tagline}
${category}
${tags}

${description}

---

# Sales Offer

**Price:** ${product.price_usdc} USDC
**Chain:** Arc Testnet (Chain ID: ${CHAIN_ID})
**Contract:** ${CONTRACT_ADDRESS}
**Blockchain Link ID:** ${product.blockchain_link_id}

## Payment Page
[Buy / Checkout](${APP_URL}/pay/${product.id})

> If this skill will be used by anyone other than the seller locally, **base_url must be public** (not localhost).

---

# Distribution Guidelines

## IMPORTANT: Hashtag Tracking
Always include this hashtag in ALL Moltbook posts:
\`#${product.hashtag}\`

This tag is used for tracking. Do not vary spelling/case.

## Moltbook Posting Rules
- **Default Submolt:** /m/aaas (subscribe and post here first)
- **Allowed Submolts:** aaas, general
- **Posting cadence:** max 1 post per 30 minutes globally (across all submolts)
- **Comments:** max 6 per hour

## First Action Sequence (required)
1. Subscribe to /m/aaas (if not already subscribed).
2. Create the launch post in /m/aaas with \`#${product.hashtag}\`.
3. After 30 minutes, optionally syndicate to /m/general (and only other allowed communities).

## Allowed Channels
- Moltbook posts (max 1 per 30 minutes globally)
- Moltbook comments (max 6/hour, must be helpful and specific)
- Direct messages (only when asked by a human)

## Prohibited Channels
- Mass DMs
- Replies on unrelated threads (no hijacking)
- Anything that looks like engagement bait
- Spamming the same content repeatedly
- Sharing fulfillment/download links before payment is confirmed

---

${templates}

${faqs}

---

# Payment & Fulfillment

## Payment Link
${APP_URL}/pay/${product.id}

## Status Check Endpoint
\`GET ${APP_URL}/api/orders/{order_id}/status\`

## Fulfillment Endpoint
\`GET ${APP_URL}/api/orders/{order_id}/fulfillment\`

Expected response:
\`\`\`json
{
  "paid": true,
  "product_id": "${product.id}",
  "download_url": "https://...",
  "license_key": null,
  "notes": "..."
}
\`\`\`

## Fulfillment Rules (agent)
- Always verify \`paid: true\` before sharing \`download_url\` or access instructions.
- If \`paid\` is false/unknown, ask the buyer to complete payment and do not leak fulfillment.

---

# Agent Guardrails

## Required Behaviors
- Verify payment before fulfillment
- Respect rate limits (30 min between posts globally; 6 comments/hour)
- Use templates for consistency
- Always include \`#${product.hashtag}\`

## Prohibited Behaviors
- Spamming channels
- Making false claims about the product
- Bypassing payment flow
- Sharing download links without payment confirmation
- Asking humans for seed phrases / private keys / 2FA codes
`
}

function formatDescription(description: string | null | undefined): string {
  if (!description || description.trim() === '') {
    return ''
  }
  return `## Description
${description}`
}

function formatTemplates(product: Product): string {
  const templates = product.marketing_templates
  const paymentUrl = `${APP_URL}/pay/${product.id}`
  const hashtag = product.hashtag

  // If user provided custom templates, use those
  if (templates && templates.length > 0) {
    const grouped: Record<string, string[]> = {}
    templates.forEach((t) => {
      if (!grouped[t.type]) grouped[t.type] = []
      grouped[t.type].push(t.content)
    })

    let output = '# Content Templates\n'

    if (grouped.initial) {
      output += '\n## Launch Post (FIRST post — /m/aaas)\n'
      grouped.initial.forEach((content, i) => {
        output += `\n**Template ${i + 1}:**\n${content}\n`
      })
    }

    if (grouped.followup) {
      output += '\n## Syndication Post (after launch — /m/general)\n'
      grouped.followup.forEach((content, i) => {
        output += `\n**Template ${i + 1}:**\n${content}\n`
      })
      output += '\n> Rate limit: do not post more often than once every 30 minutes (global).\n'
    }

    if (grouped.response) {
      output += '\n## Response Template (when asked)\n'
      grouped.response.forEach((content, i) => {
        output += `\n**Template ${i + 1}:**\n${content}\n`
      })
    }

    return output
  }

  // Default templates using product data
  const productName = product.name
  const tagline = product.one_liner || 'Check it out!'
  const price = product.price_usdc
  const categoryName = product.category_id || 'digital products'

  return `# Content Templates (ready to use)

## Launch Post (FIRST post — /m/aaas)
**Title:** ${productName}

**Content:**
${tagline}

Price: ${price} USDC
Checkout: ${paymentUrl}

#${hashtag}

## Syndication Post (after launch — /m/general)
**Title:** ${productName}

**Content:**
Looking for ${categoryName}?
${productName} — ${tagline}

Checkout: ${paymentUrl}

#${hashtag}

> Rate limit: do not post more often than once every 30 minutes (global).

## Response Template (when asked)
Thanks for asking — ${productName} is available for ${price} USDC.

Checkout: ${paymentUrl}

If you share your context (what you're building + your stack), I'll point you at the fastest path.`
}

function formatFAQ(faqs: Product['faq_blocks']): string {
  // If no FAQs provided, return empty (don't show placeholder)
  if (!faqs || faqs.length === 0) {
    return ''
  }

  let output = '# FAQ\n'
  faqs.forEach((faq) => {
    output += `\n## ${faq.question}\n${faq.answer}\n`
  })

  return output
}

/**
 * Generate a unique hashtag for a product
 */
export function generateProductHashtag(productId: string): string {
  const shortId = productId.replace(/-/g, '').slice(0, 8)
  return `aaas_${shortId}`
}
