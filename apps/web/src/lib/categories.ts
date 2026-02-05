import type { Category } from './supabase'

// Static category definitions (also seeded in database)
export const CATEGORIES: Category[] = [
  { id: 'audio', name: 'Audio', icon: 'music', display_order: 1 },
  { id: 'video', name: 'Video', icon: 'video', display_order: 2 },
  { id: 'design', name: 'Design', icon: 'palette', display_order: 3 },
  { id: 'photos', name: 'Photos', icon: 'image', display_order: 4 },
  { id: '3d', name: '3D', icon: 'box', display_order: 5 },
  { id: 'code', name: 'Code', icon: 'code', display_order: 6 },
  { id: 'documents', name: 'Documents', icon: 'file-text', display_order: 7 },
  { id: 'education', name: 'Education', icon: 'graduation-cap', display_order: 8 },
  { id: 'ai', name: 'AI', icon: 'sparkles', display_order: 9 },
  { id: 'gaming', name: 'Gaming', icon: 'gamepad-2', display_order: 10 },
]

// Tag options by category
export const TAG_OPTIONS: Record<string, string[]> = {
  audio: ['Music', 'Beats', 'Sound Effects', 'Sample Packs', 'Loops', 'Podcasts', 'Audiobooks', 'Hip-Hop', 'EDM', 'Lo-Fi'],
  video: ['Stock Video', 'After Effects', 'Motion Graphics', 'LUTs', 'Premiere Pro', 'Final Cut', 'Transitions', 'Intros'],
  design: ['Templates', 'Graphics', 'Fonts', 'Icons', 'UI Kits', 'Mockups', 'Illustrations', 'Figma', 'Canva', 'Notion'],
  photos: ['Stock Photos', 'Lightroom Presets', 'Photo Packs', 'Portraits', 'Nature', 'Abstract'],
  '3d': ['3D Models', 'Textures', 'Unity Assets', 'Unreal Assets', 'Blender', 'Characters', 'Environments'],
  code: ['Scripts', 'Plugins', 'Themes', 'APIs', 'Boilerplates', 'Components', 'WordPress', 'Shopify'],
  documents: ['Ebooks', 'Guides', 'Spreadsheets', 'Contracts', 'Checklists', 'Business Plans', 'Resumes'],
  education: ['Courses', 'Tutorials', 'Workshops', 'Certifications', 'Masterclass'],
  ai: ['Prompts', 'GPT Templates', 'Midjourney', 'Stable Diffusion', 'Claude', 'Workflows'],
  gaming: ['Game Assets', 'Sprites', 'Tilesets', 'Character Packs', 'Sound Effects', 'Music Packs'],
}

// Hype badge thresholds
export const HYPE_THRESHOLDS = {
  hot: 100,       // 10 sales or 20 posts or mix
  trending: 500,  // 50 sales or 100 posts or mix  
  viral: 1000,    // 100 sales or 200 posts or mix
}

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find(cat => cat.id === id)
}

export function getTagsForCategory(categoryId: string): string[] {
  return TAG_OPTIONS[categoryId] || []
}
