import { BookOpen } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { KnowledgeHubClient } from './_components/knowledge-hub-client'
import type { KnowledgeBookmark, KnowledgeArticle } from '@/types/knowledge'

export default async function KnowledgeHubPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let initialBookmarks: KnowledgeBookmark[] = []
  if (user) {
    const { data } = await supabase
      .from('knowledge_bookmarks')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    initialBookmarks = (data ?? []) as KnowledgeBookmark[]
  }

  const t = await getTranslations('knowledge')
  const articlesData = t.raw('articles') as {
    sectionTitle: string
    items: KnowledgeArticle[]
  }

  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <BookOpen className="w-4 h-4" style={{ color: 'oklch(0.65 0.15 211)' }} />
          <span>למידה ושיפור עצמי</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          מרכז הידע
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          טרנדים יומיים · הכנה לראיונות · סימניות חכמות — הכל מופעל ע&quot;י AI
        </p>
      </div>

      <KnowledgeHubClient
        initialBookmarks={initialBookmarks}
        articles={articlesData.items}
        articlesSectionTitle={articlesData.sectionTitle}
      />
    </div>
  )
}
