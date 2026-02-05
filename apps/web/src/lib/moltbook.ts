/**
 * Moltbook API Client
 * Handles integration with Moltbook social platform for tracking agent activity
 */

const MOLTBOOK_API_URL = process.env.MOLTBOOK_API_URL || 'https://api.moltbook.com'
const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY

type MoltbookPost = {
  id: string
  content: string
  author: string
  created_at: string
  likes_count: number
  comments_count: number
  reposts_count: number
  hashtags: string[]
}

type MoltbookSearchResponse = {
  posts: MoltbookPost[]
  total: number
  next_cursor?: string
}

/**
 * Search for posts containing a specific hashtag
 */
export async function searchPostsByHashtag(
  hashtag: string,
  options?: {
    since?: string // ISO date string
    cursor?: string
    limit?: number
  }
): Promise<MoltbookSearchResponse> {
  // If no API key, return mock data for development
  if (!MOLTBOOK_API_KEY) {
    console.warn('Moltbook API key not configured, using mock data')
    return getMockSearchResults(hashtag)
  }

  const params = new URLSearchParams({
    hashtag: hashtag.replace('#', ''),
    limit: String(options?.limit || 50),
  })

  if (options?.since) {
    params.set('since', options.since)
  }

  if (options?.cursor) {
    params.set('cursor', options.cursor)
  }

  const response = await fetch(`${MOLTBOOK_API_URL}/v1/search/posts?${params}`, {
    headers: {
      Authorization: `Bearer ${MOLTBOOK_API_KEY}`,
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Moltbook API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Calculate engagement metrics from posts
 */
export function calculateEngagement(posts: MoltbookPost[]): {
  postCount: number
  totalLikes: number
  totalComments: number
  totalReposts: number
  totalEngagement: number
} {
  const postCount = posts.length
  const totalLikes = posts.reduce((sum, p) => sum + p.likes_count, 0)
  const totalComments = posts.reduce((sum, p) => sum + p.comments_count, 0)
  const totalReposts = posts.reduce((sum, p) => sum + p.reposts_count, 0)
  const totalEngagement = totalLikes + totalComments * 2 + totalReposts * 3

  return {
    postCount,
    totalLikes,
    totalComments,
    totalReposts,
    totalEngagement,
  }
}

/**
 * Calculate hype score based on sales and Moltbook engagement
 * Formula: (sales_count * 10) + (post_count * 5) + engagement_score
 */
export function calculateHypeScore(
  salesCount: number,
  postCount: number,
  engagementScore: number
): number {
  return salesCount * 10 + postCount * 5 + engagementScore
}

/**
 * Determine hype badge based on score thresholds
 */
export function getHypeBadge(
  hypeScore: number
): 'hot' | 'trending' | 'viral' | null {
  if (hypeScore >= 500) return 'viral'
  if (hypeScore >= 200) return 'trending'
  if (hypeScore >= 50) return 'hot'
  return null
}

// Mock data for development without API key
function getMockSearchResults(hashtag: string): MoltbookSearchResponse {
  // Simulate random activity for testing
  const postCount = Math.floor(Math.random() * 10)
  const posts: MoltbookPost[] = Array.from({ length: postCount }, (_, i) => ({
    id: `mock-${hashtag}-${i}`,
    content: `Check out this awesome product! #${hashtag}`,
    author: `agent_${Math.floor(Math.random() * 1000)}`,
    created_at: new Date(
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ).toISOString(),
    likes_count: Math.floor(Math.random() * 50),
    comments_count: Math.floor(Math.random() * 10),
    reposts_count: Math.floor(Math.random() * 5),
    hashtags: [hashtag],
  }))

  return {
    posts,
    total: postCount,
  }
}
