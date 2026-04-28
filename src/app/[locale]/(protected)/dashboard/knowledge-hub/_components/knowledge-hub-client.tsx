'use client'

import { useState, useTransition } from 'react'
import { Zap, GraduationCap, Bookmark, LibraryBig } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { saveBookmarkAction } from '../actions'
import { TechPulsePanel } from './tech-pulse-panel'
import { InterviewPrepPanel } from './interview-prep-panel'
import { BookmarksPanel } from './bookmarks-panel'
import { ArticleList } from './article-list'
import type { KnowledgeBookmark, KnowledgeArticle } from '@/types/knowledge'

interface KnowledgeHubClientProps {
  initialBookmarks: KnowledgeBookmark[]
  articles: KnowledgeArticle[]
  articlesSectionTitle: string
}

export function KnowledgeHubClient({
  initialBookmarks,
  articles,
  articlesSectionTitle,
}: KnowledgeHubClientProps) {
  const [activeTab, setActiveTab] = useState('pulse')
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

  const TAB_CONFIG = [
    {
      value: 'pulse',
      label: 'Daily Tech Pulse',
      icon: Zap,
      color: 'oklch(0.65 0.15 211)',
    },
    {
      value: 'interview',
      label: 'הכנה לראיונות',
      icon: GraduationCap,
      color: 'oklch(0.585 0.212 264.4)',
    },
    {
      value: 'bookmarks',
      label: `הסימניות שלי${bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}`,
      icon: Bookmark,
      color: 'oklch(0.65 0.15 211)',
    },
    {
      value: 'articles',
      label: 'מאמרים',
      icon: LibraryBig,
      color: 'oklch(0.65 0.15 211)',
    },
  ]

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-6 h-auto p-1 gap-1 bg-card border border-border/50 rounded-2xl w-full sm:w-auto">
        {TAB_CONFIG.map(({ value, label, icon: Icon, color }) => (
          <TabsTrigger
            key={value}
            value={value}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              'data-active:text-foreground text-muted-foreground'
            )}
            style={
              activeTab === value ? { background: color.replace(')', ' / 15%)'), color } : undefined
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="pulse">
        <TechPulsePanel onBookmark={handleBookmark} />
      </TabsContent>

      <TabsContent value="interview">
        <InterviewPrepPanel onBookmark={handleBookmark} />
      </TabsContent>

      <TabsContent value="bookmarks">
        <BookmarksPanel bookmarks={bookmarks} onDelete={handleDeleteBookmark} />
      </TabsContent>

      <TabsContent value="articles">
        <ArticleList articles={articles} sectionTitle={articlesSectionTitle} />
      </TabsContent>
    </Tabs>
  )
}
