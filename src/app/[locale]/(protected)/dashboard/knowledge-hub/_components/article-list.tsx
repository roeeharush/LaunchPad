import { LibraryBig } from 'lucide-react'
import { ArticleCard } from './article-card'
import type { KnowledgeArticle } from '@/types/knowledge'

interface ArticleListProps {
  articles: KnowledgeArticle[]
  sectionTitle: string
}

export function ArticleList({ articles, sectionTitle }: ArticleListProps) {
  return (
    <div className="space-y-5">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'oklch(0.65 0.15 211 / 12%)' }}
        >
          <LibraryBig className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
        </div>
        <h2 className="font-bold text-base">{sectionTitle}</h2>
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: 'oklch(0.65 0.15 211 / 12%)',
            color: 'oklch(0.65 0.15 211)',
          }}
        >
          {articles.length}
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
