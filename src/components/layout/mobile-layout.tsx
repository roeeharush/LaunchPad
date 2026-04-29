'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { cn } from '@/lib/utils'
import type { Plan } from '@/types/profile'

export function MobileLayout({ children, plan }: { children: React.ReactNode; plan?: Plan }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-ambient">
      {/* Desktop sidebar — always visible on md+ */}
      <div className="hidden md:block">
        <Sidebar plan={plan} onNavigate={() => {}} />
      </div>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer — slides in from the right (RTL) */}
      <div
        className={cn(
          'fixed top-0 right-0 z-50 h-full transition-transform duration-300 md:hidden',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <Sidebar plan={plan} onNavigate={() => setOpen(false)} />
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 md:p-8 overflow-auto min-w-0">
        {/* Mobile header bar */}
        <div className="flex items-center justify-between mb-4 md:hidden">
          <span className="font-bold text-base">לאנצ׳פד</span>
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
            aria-label="פתח תפריט"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {children}
      </main>
    </div>
  )
}
