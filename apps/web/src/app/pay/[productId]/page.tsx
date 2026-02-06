'use client'

import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

// Loading skeleton for SSR
function PayPageSkeleton() {
  return (
    <div className="container py-8 max-w-2xl">
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    </div>
  )
}

// Dynamically import to avoid SSR issues with react-query and wagmi
const PayPageContent = dynamic(() => import('./pay-content'), {
  ssr: false,
  loading: () => <PayPageSkeleton />,
})

export default function PayPage() {
  return <PayPageContent />
}
