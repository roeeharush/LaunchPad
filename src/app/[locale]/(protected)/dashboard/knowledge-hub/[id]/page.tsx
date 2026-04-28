import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { ArrowRight, Clock, ChevronLeft } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { KnowledgeArticle } from '@/types/knowledge'
import { getCategoryColor } from '../_components/category-colors'

export const dynamic = 'force-dynamic'

export function renderParagraph(chunk: string, color: string, index: number) {
  const trimmed = chunk.trimStart()
  const isNumberedDot = /^\d+\./.test(trimmed)
  const isNumberedParen = /^\(\d+\)/.test(trimmed)
  const isDash = trimmed.startsWith('-')

  if (isNumberedDot || isNumberedParen) {
    return (
      <p
        key={index}
        dir="rtl"
        className="text-sm leading-relaxed font-medium pr-4"
        style={{
          borderRightWidth: '2px',
          borderRightStyle: 'solid',
          borderRightColor: color.replace(')', ' / 50%)'),
          color: 'oklch(0.85 0.01 252)',
        }}
      >
        {chunk}
      </p>
    )
  }

  if (isDash) {
    return (
      <p key={index} dir="rtl" className="text-sm text-muted-foreground leading-relaxed pr-4">
        <span className="font-bold ml-1" style={{ color }}>
          ·
        </span>
        {chunk.replace(/^-\s*/, '')}
      </p>
    )
  }

  return (
    <p key={index} dir="rtl" className="text-sm text-muted-foreground leading-relaxed">
      {chunk}
    </p>
  )
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const { id } = await params
  const t = await getTranslations('knowledge')
  const items = t.raw('articles.items') as KnowledgeArticle[]
  const article = items.find((a) => a.id === id)

  if (!article) notFound()

  const color = getCategoryColor(article.category)
  const paragraphs = article.content.split('\n\n').filter(Boolean)

  return (
    <div className="min-h-screen bg-ambient" dir="rtl">
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link
            href="/dashboard/knowledge-hub"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            מרכז הידע
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 opacity-40" />
          <span className="truncate max-w-xs" style={{ color: 'oklch(0.80 0.01 252)' }}>
            {article.title}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 mb-4">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: color.replace(')', ' / 15%)'), color }}
          >
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            {article.readTime} דקות קריאה
          </span>
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-extrabold tracking-tight mb-5"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          {article.title}
        </h1>

        {/* Divider */}
        <div className="border-t mb-6" style={{ borderColor: 'oklch(1 0 0 / 9%)' }} />

        {/* Body */}
        <div className="space-y-4">
          {paragraphs.map((chunk, i) => renderParagraph(chunk, color, i))}
        </div>

        {/* Back button */}
        <div className="mt-10 pt-6 border-t" style={{ borderColor: 'oklch(1 0 0 / 9%)' }}>
          <Link
            href="/dashboard/knowledge-hub"
            className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'gap-2')}
          >
            <ArrowRight className="w-4 h-4" />
            חזרה למרכז הידע
          </Link>
        </div>
      </div>
    </div>
  )
}
