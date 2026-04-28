'use client'

import { useState } from 'react'
import { Zap, GraduationCap, LibraryBig } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { TechPulsePanel } from './tech-pulse-panel'
import { InterviewPrepPanel } from './interview-prep-panel'
import { ArticleList } from './article-list'
import type { KnowledgeArticle } from '@/types/knowledge'

interface KnowledgeHubClientProps {
  articles: KnowledgeArticle[]
  articlesSectionTitle: string
}

export function KnowledgeHubClient({ articles, articlesSectionTitle }: KnowledgeHubClientProps) {
  const [activeTab, setActiveTab] = useState('articles')

  const TAB_CONFIG = [
    {
      value: 'articles',
      label: 'מאמרים',
      icon: LibraryBig,
      color: 'oklch(0.65 0.15 211)',
    },
    {
      value: 'pulse',
      label: 'מגמות ענף',
      icon: Zap,
      color: 'oklch(0.60 0.17 162)',
    },
    {
      value: 'interview',
      label: 'הכנה לראיונות',
      icon: GraduationCap,
      color: 'oklch(0.585 0.212 264.4)',
    },
  ]

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <div className="mb-6 overflow-x-auto pb-1 -mx-1 px-1">
        <TabsList className="h-auto p-1 gap-1 bg-card border border-border/50 rounded-2xl w-max">
          {TAB_CONFIG.map(({ value, label, icon: Icon, color }) => (
            <TabsTrigger
              key={value}
              value={value}
              className={cn(
                'flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 whitespace-nowrap',
                'data-active:text-foreground text-muted-foreground'
              )}
              style={
                activeTab === value
                  ? { background: color.replace(')', ' / 15%)'), color }
                  : undefined
              }
            >
              <Icon className="w-4 h-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      <TabsContent value="articles">
        <ArticleList articles={articles} sectionTitle={articlesSectionTitle} />
      </TabsContent>

      <TabsContent value="pulse">
        <TechPulsePanel />
      </TabsContent>

      <TabsContent value="interview">
        <InterviewPrepPanel />
      </TabsContent>
    </Tabs>
  )
}
