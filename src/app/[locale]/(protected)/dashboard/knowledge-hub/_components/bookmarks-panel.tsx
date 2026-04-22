'use client'

import { useTransition } from 'react'
import { Bookmark, Trash2, Zap, GraduationCap } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { deleteBookmarkAction } from '../actions'
import type { KnowledgeBookmark } from '@/types/knowledge'

interface BookmarksPanelProps {
  bookmarks: KnowledgeBookmark[]
  onDelete: (id: string) => void
}

const SOURCE_CONFIG = {
  trend: {
    label: 'Tech Pulse',
    icon: Zap,
    color: 'oklch(0.65 0.15 211)',
  },
  interview: {
    label: 'ראיון',
    icon: GraduationCap,
    color: 'oklch(0.585 0.212 264.4)',
  },
}

function BookmarkCard({
  bookmark,
  onDelete,
}: {
  bookmark: KnowledgeBookmark
  onDelete: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const config = SOURCE_CONFIG[bookmark.source]
  const Icon = config.icon

  function handleDelete() {
    const formData = new FormData()
    formData.set('id', bookmark.id)
    startTransition(async () => {
      const result = await deleteBookmarkAction(formData)
      if (result.ok) onDelete(bookmark.id)
    })
  }

  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3 group"
      style={{
        background: 'var(--card)',
        borderColor: config.color.replace(')', ' / 15%)'),
        opacity: isPending ? 0.5 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-1"
            style={{
              background: config.color.replace(')', ' / 12%)'),
              color: config.color,
            }}
          >
            <Icon className="w-3 h-3" />
            {config.label}
          </span>
        </div>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'px-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity'
          )}
          title="מחק סימניה"
          aria-label="מחק סימניה"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="font-semibold text-sm leading-tight">{bookmark.title}</h3>

      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
        {bookmark.content}
      </p>

      <p className="text-xs text-muted-foreground mt-auto">
        {formatDistanceToNow(new Date(bookmark.created_at), { addSuffix: true, locale: he })}
      </p>
    </div>
  )
}

export function BookmarksPanel({ bookmarks, onDelete }: BookmarksPanelProps) {
  if (bookmarks.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
        style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'oklch(0.65 0.15 211 / 10%)' }}
        >
          <Bookmark className="w-7 h-7" style={{ color: 'oklch(0.65 0.15 211)' }} />
        </div>
        <p className="font-semibold">אין סימניות עדיין</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          לחץ על כפתור הסימניה בכרטיסי הטרנדים ושאלות הראיון כדי לשמור תכנים מעניינים
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{bookmarks.length} סימניות שמורות</p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
