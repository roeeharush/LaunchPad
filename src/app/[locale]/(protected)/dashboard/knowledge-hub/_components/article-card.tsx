'use client'

import Link from 'next/link'
import { Clock, ArrowLeft } from 'lucide-react'
import { getCategoryColor } from './category-colors'
import type { KnowledgeArticle } from '@/types/knowledge'

interface ArticleCardProps {
  article: KnowledgeArticle
}

export function ArticleCard({ article }: ArticleCardProps) {
  const color = getCategoryColor(article.category)

  function handleMouseEnter(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.style.boxShadow = `0 0 0 1px ${color.replace(')', ' / 30%)')}, 0 4px 20px ${color.replace(')', ' / 15%)')}`
    e.currentTarget.style.background = color.replace(')', ' / 5%)')
  }

  function handleMouseLeave(e: React.MouseEvent<HTMLAnchorElement>) {
    e.currentTarget.style.boxShadow = ''
    e.currentTarget.style.background = 'var(--card)'
  }

  return (
    <Link
      href={`/dashboard/knowledge-hub/${article.id}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="block rounded-2xl border p-5 flex flex-col gap-3 transition-[box-shadow,background-color] duration-200 no-underline"
      style={{
        background: 'var(--card)',
        borderColor: color.replace(')', ' / 20%)'),
        borderInlineStartWidth: '3px',
        borderInlineStartColor: color,
      }}
    >
      {/* Header: category badge + read time */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: color.replace(')', ' / 15%)'), color }}
        >
          {article.category}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {article.readTime} דקות
        </span>
      </div>

      {/* Title */}
      <h3
        className="font-bold text-base leading-snug line-clamp-2"
        style={{ color: 'oklch(0.93 0.008 252)' }}
      >
        {article.title}
      </h3>

      {/* Excerpt */}
      <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 flex-1">
        {article.excerpt}
      </p>

      {/* Footer */}
      <div className="flex items-center gap-1 text-xs font-medium" style={{ color }}>
        קרא עוד
        <ArrowLeft className="w-3 h-3" />
      </div>
    </Link>
  )
}
