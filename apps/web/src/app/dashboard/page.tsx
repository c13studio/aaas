'use client'

import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

// Loading skeleton for SSR
function DashboardSkeleton() {
  return (
    <div className="container py-16 text-center">
      <Skeleton className="h-12 w-12 mx-auto rounded-full mb-4" />
      <Skeleton className="h-8 w-48 mx-auto mb-4" />
      <Skeleton className="h-4 w-64 mx-auto" />
    </div>
  )
}

// Dynamically import the actual content to avoid SSR issues with wagmi
const DashboardContent = dynamic(() => import('./dashboard-content'), {
  ssr: false,
  loading: () => <DashboardSkeleton />,
})

export default function DashboardPage() {
  return <DashboardContent />
}
