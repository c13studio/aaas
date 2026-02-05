'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ConnectButton } from './connect-button'
import { cn } from '@/lib/utils'
import { Store, PlusCircle, LayoutDashboard } from 'lucide-react'

const navItems = [
  { href: '/marketplace', label: 'Marketplace', icon: Store },
  { href: '/create', label: 'Create', icon: PlusCircle },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 items-center py-4 pl-10 pr-4">
        <Link href="/" className="mr-16 flex items-center">
          <Image 
            src="/logo.png" 
            alt="AaaS" 
            width={160} 
            height={52} 
            className="h-14 w-auto"
            priority
          />
        </Link>
        
        <nav className="flex items-center space-x-8 text-sm font-medium">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 transition-colors hover:text-foreground/80',
                  pathname === item.href || pathname?.startsWith(item.href + '/')
                    ? 'text-foreground'
                    : 'text-foreground/60'
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="ml-auto flex items-center space-x-4">
          <ConnectButton />
        </div>
      </div>
    </header>
  )
}
