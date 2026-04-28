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
        className="text-lg leading-relaxed font-medium pr-5"
        style={{
          borderRightWidth: '3px',
          borderRightStyle: 'solid',
          borderRightColor: color.replace(')', ' / 50%)'),
          color: 'oklch(0.88 0.01 252)',
        }}
      >
        {chunk}
      </p>
    )
  }

  if (isDash) {
    return (
      <div key={index} dir="rtl" className="flex items-start gap-2.5">
        <span className="text-lg font-bold leading-none mt-1.5 shrink-0" style={{ color }}>
          ·
        </span>
        <p className="text-lg text-muted-foreground leading-relaxed">
          {chunk.replace(/^-\s*/, '')}
        </p>
      </div>
    )
  }

  return (
    <p key={index} dir="rtl" className="text-lg text-muted-foreground leading-relaxed">
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
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link
            href="/dashboard/knowledge-hub"
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            מרכז הידע
          </Link>
          <ChevronLeft className="w-3.5 h-3.5 opacity-40" />
          <span className="truncate max-w-xs opacity-70">{article.title}</span>
        </nav>

        {/* Article header */}
        <header className="mb-8 space-y-5" dir="rtl">
          {/* Pills */}
          <div className="flex items-center gap-3">
            <span
              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide"
              style={{ background: color.replace(')', ' / 15%)'), color }}
            >
              {article.category}
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'oklch(1 0 0 / 6%)', color: 'oklch(0.65 0.01 252)' }}
            >
              <Clock className="w-3.5 h-3.5" />
              {article.readTime} דקות קריאה
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-right"
            style={{ color: 'oklch(0.95 0.005 252)' }}
          >
            {article.title}
          </h1>

          {/* Excerpt as styled intro */}
          <p
            className="text-xl leading-relaxed text-right"
            style={{ color: 'oklch(0.70 0.012 252)' }}
          >
            {article.excerpt}
          </p>
        </header>

        {/* Gradient separator anchored to the RTL start (right) */}
        <div
          className="h-px mb-10"
          style={{
            background: `linear-gradient(to left, ${color.replace(')', ' / 45%)')}, oklch(1 0 0 / 6%), transparent)`,
          }}
        />

        {/* Body */}
        <div className="space-y-6">
          {paragraphs.map((chunk, i) => renderParagraph(chunk, color, i))}
        </div>

        {/* Back */}
        <div className="mt-12 pt-6 border-t" style={{ borderColor: 'oklch(1 0 0 / 9%)' }}>
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
