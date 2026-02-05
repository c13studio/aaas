'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CATEGORIES, TAG_OPTIONS } from '@/lib/categories'
import { Plus, X, Upload, Link as LinkIcon, Key } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export type ProductFormData = {
  name: string
  one_liner: string
  description: string
  price_usdc: string
  category_id: string
  tags: string[]
  delivery_method: 'file' | 'link' | 'license_key' | ''
  download_url: string
  file_name: string
  file_size: number | null
  file_type: string
  image_url: string
  marketing_templates: { id: string; type: 'initial' | 'followup' | 'response'; content: string }[]
  faq_blocks: { question: string; answer: string }[]
}

const initialFormData: ProductFormData = {
  name: '',
  one_liner: '',
  description: '',
  price_usdc: '',
  category_id: '',
  tags: [],
  delivery_method: '',
  download_url: '',
  file_name: '',
  file_size: null,
  file_type: '',
  image_url: '',
  marketing_templates: [],
  faq_blocks: [],
}

type Props = {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData) => Promise<void>
  isLoading?: boolean
  submitLabel?: string
}

export function ProductForm({ initialData, onSubmit, isLoading, submitLabel = 'Save Draft' }: Props) {
  const [formData, setFormData] = useState<ProductFormData>({
    ...initialFormData,
    ...initialData,
  })
  const [uploading, setUploading] = useState(false)

  const updateField = <K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : prev.tags.length < 5
        ? [...prev.tags, tag]
        : prev.tags,
    }))
  }

  const addMarketingTemplate = () => {
    setFormData((prev) => ({
      ...prev,
      marketing_templates: [
        ...prev.marketing_templates,
        { id: crypto.randomUUID(), type: 'initial', content: '' },
      ],
    }))
  }

  const updateMarketingTemplate = (
    id: string,
    field: 'type' | 'content',
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      marketing_templates: prev.marketing_templates.map((t) =>
        t.id === id ? { ...t, [field]: value } : t
      ),
    }))
  }

  const removeMarketingTemplate = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      marketing_templates: prev.marketing_templates.filter((t) => t.id !== id),
    }))
  }

  const addFAQ = () => {
    setFormData((prev) => ({
      ...prev,
      faq_blocks: [...prev.faq_blocks, { question: '', answer: '' }],
    }))
  }

  const updateFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    setFormData((prev) => ({
      ...prev,
      faq_blocks: prev.faq_blocks.map((faq, i) =>
        i === index ? { ...faq, [field]: value } : faq
      ),
    }))
  }

  const removeFAQ = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      faq_blocks: prev.faq_blocks.filter((_, i) => i !== index),
    }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Max 50MB
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 50MB.')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `products/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('digital-products')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('digital-products')
        .getPublicUrl(filePath)

      updateField('download_url', publicUrl)
      updateField('file_name', file.name)
      updateField('file_size', file.size)
      updateField('file_type', file.type)
      toast.success('File uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name) {
      toast.error('Product name is required')
      return
    }
    if (!formData.one_liner) {
      toast.error('One-liner tagline is required')
      return
    }
    if (!formData.description) {
      toast.error('Description is required')
      return
    }
    if (!formData.price_usdc || parseFloat(formData.price_usdc) <= 0) {
      toast.error('Valid price is required')
      return
    }
    if (!formData.category_id) {
      toast.error('Category is required')
      return
    }
    if (!formData.delivery_method) {
      toast.error('Delivery method is required')
      return
    }

    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Enter the core details about your digital product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="My Awesome Product"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="one_liner">One-liner (max 200 chars) *</Label>
            <Input
              id="one_liner"
              value={formData.one_liner}
              onChange={(e) => updateField('one_liner', e.target.value)}
              placeholder="A short catchy description"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Detailed description of your product..."
              rows={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (USDC) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.price_usdc}
              onChange={(e) => updateField('price_usdc', e.target.value)}
              placeholder="29.99"
            />
          </div>
        </CardContent>
      </Card>

      {/* Category & Tags */}
      <Card>
        <CardHeader>
          <CardTitle>Category & Tags</CardTitle>
          <CardDescription>
            Help buyers find your product
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) => {
                updateField('category_id', value)
                updateField('tags', []) // Reset tags when category changes
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.category_id && (
            <div className="space-y-2">
              <Label>Tags (select up to 5)</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_OPTIONS[formData.category_id]?.map((tag) => (
                  <Badge
                    key={tag}
                    variant={formData.tags.includes(tag) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => toggleTag(tag)}
                  >
                    {tag}
                    {formData.tags.includes(tag) && (
                      <X className="ml-1 h-3 w-3" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivery Method */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery Method *</CardTitle>
          <CardDescription>
            How will customers receive the product?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { id: 'file', label: 'File Upload', icon: Upload },
              { id: 'link', label: 'External Link', icon: LinkIcon },
              { id: 'license_key', label: 'License Key', icon: Key },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => updateField('delivery_method', id as ProductFormData['delivery_method'])}
                className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  formData.delivery_method === id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {formData.delivery_method === 'file' && (
            <div className="space-y-2">
              <Label>Upload File (max 50MB)</Label>
              <Input
                type="file"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {formData.file_name && (
                <p className="text-sm text-muted-foreground">
                  Uploaded: {formData.file_name}
                </p>
              )}
            </div>
          )}

          {formData.delivery_method === 'link' && (
            <div className="space-y-2">
              <Label>External URL</Label>
              <Input
                type="url"
                value={formData.download_url}
                onChange={(e) => updateField('download_url', e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Marketing Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Templates</CardTitle>
          <CardDescription>
            Pre-written posts for agents to use on Moltbook
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.marketing_templates.map((template, index) => (
            <div key={template.id} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <Select
                  value={template.type}
                  onValueChange={(value) =>
                    updateMarketingTemplate(template.id, 'type', value)
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial">Initial Post</SelectItem>
                    <SelectItem value="followup">Follow-up</SelectItem>
                    <SelectItem value="response">Response</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMarketingTemplate(template.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={template.content}
                onChange={(e) =>
                  updateMarketingTemplate(template.id, 'content', e.target.value)
                }
                placeholder="Write your marketing template..."
                rows={3}
              />
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addMarketingTemplate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Template
          </Button>
        </CardContent>
      </Card>

      {/* FAQ Blocks */}
      <Card>
        <CardHeader>
          <CardTitle>FAQ Blocks</CardTitle>
          <CardDescription>
            Common questions agents can answer
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.faq_blocks.map((faq, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <Input
                    value={faq.question}
                    onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                    placeholder="Question"
                  />
                  <Textarea
                    value={faq.answer}
                    onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                    placeholder="Answer"
                    rows={2}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFAQ(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addFAQ}>
            <Plus className="h-4 w-4 mr-2" />
            Add FAQ
          </Button>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={isLoading || uploading}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
