'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading skeleton for SSR
function CreatePageSkeleton() {
  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-8">
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <Card>
        <CardContent className="py-12">
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-8 w-full mb-4" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// Dynamically import the actual content to avoid SSR issues with wagmi
const CreatePageContent = dynamic(() => import('./create-content'), {
  ssr: false,
  loading: () => <CreatePageSkeleton />,
})

export default function CreatePage() {
  return <CreatePageContent />
}
