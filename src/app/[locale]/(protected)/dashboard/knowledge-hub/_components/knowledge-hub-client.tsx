'use client'

import { useState, useTransition } from 'react'
import { Zap, GraduationCap, Bookmark } from 'lucide-react'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { saveBookmarkAction } from '../actions'
import { TechPulsePanel } from './tech-pulse-panel'
import { InterviewPrepPanel } from './interview-prep-panel'
import { BookmarksPanel } from './bookmarks-panel'
import type { KnowledgeBookmark } from '@/types/knowledge'

interface KnowledgeHubClientProps {
  initialBookmarks: KnowledgeBookmark[]
}

const MODULE_CONFIG = [
  {
    value: 'pulse',
    label: 'Daily Tech Pulse',
    desc: 'טרנדים מותאמים לשפות ה-GitHub שלך',
    tooltip: 'מנתח את שפות ה-GitHub שלך ומייצר 5 טרנדים יומיים רלוונטיים',
    icon: Zap,
    color: 'oklch(0.65 0.15 211)',
  },
  {
    value: 'interview',
    label: 'הכנה לראיונות',
    desc: 'שאלות ותשובות לכל נושא טכני',
    tooltip: 'הזן נושא (React, SQL, System Design...) וקבל 5 שאלות ראיון עם תשובות מפורטות',
    icon: GraduationCap,
    color: 'oklch(0.585 0.212 264.4)',
  },
  {
    value: 'bookmarks',
    label: 'הסימניות שלי',
    desc: 'תכנים ששמרת לחזרה עתידית',
    tooltip: 'שמור טרנדים ושאלות מהכלים האחרים — ניתן לעיין בהם בכל עת',
    icon: Bookmark,
    color: 'oklch(0.75 0.16 60)',
  },
] as const

export function KnowledgeHubClient({ initialBookmarks }: KnowledgeHubClientProps) {
  const [activeTab, setActiveTab] = useState<string>('pulse')
  const [bookmarks, setBookmarks] = useState<KnowledgeBookmark[]>(initialBookmarks)
  const [, startTransition] = useTransition()

  function handleBookmark(title: string, content: string, source: 'trend' | 'interview') {
    const formData = new FormData()
    formData.set('title', title)
    formData.set('content', content)
    formData.set('source', source)
    startTransition(async () => {
      const result = await saveBookmarkAction(formData)
      if (result.ok) {
        setBookmarks((prev) => [result.bookmark, ...prev])
      }
    })
  }

  function handleDeleteBookmark(id: string) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {MODULE_CONFIG.map(({ value, label, desc, tooltip, icon: Icon, color }) => {
          const isActive = activeTab === value
          const bg = color.replace(')', ' / 12%)')
          const border = color.replace(')', ' / 30%)')

          return (
            <button
              key={value}
              onClick={() => setActiveTab(value)}
              title={tooltip}
              className={cn(
                'flex flex-col items-start gap-3 rounded-2xl p-5 border w-full text-right',
                'transition-all duration-200 cursor-pointer',
                isActive ? '' : 'hover:bg-white/5'
              )}
              style={
                isActive
                  ? { background: bg, borderColor: border }
                  : { background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }
              }
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200"
                style={{
                  background: isActive ? bg : 'oklch(1 0 0 / 5%)',
                  color: isActive ? color : 'oklch(0.60 0 0)',
                }}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex-1 text-right w-full">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold">{label}</h3>
                  {value === 'bookmarks' && bookmarks.length > 0 && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: color.replace(')', ' / 15%)'), color }}
                    >
                      {bookmarks.length}
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>

              <span
                className="text-xs px-2 py-0.5 rounded-full self-end"
                style={{ background: 'oklch(1 0 0 / 6%)', color: 'oklch(0.55 0 0)' }}
              >
                ? כיצד זה עובד
              </span>
            </button>
          )
        })}
      </div>

      <TabsContent value="pulse">
        <TechPulsePanel onBookmark={handleBookmark} />
      </TabsContent>
      <TabsContent value="interview">
        <InterviewPrepPanel onBookmark={handleBookmark} />
      </TabsContent>
      <TabsContent value="bookmarks">
        <BookmarksPanel bookmarks={bookmarks} onDelete={handleDeleteBookmark} />
      </TabsContent>
    </Tabs>
  )
}
