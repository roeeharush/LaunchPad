import { Skeleton } from './skeleton'

export function JobCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      {/* Header row: title + company + bookmark placeholder */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <Skeleton className="h-7 w-7 rounded-md shrink-0" />
      </div>

      {/* Location + type badges */}
      <div className="flex gap-1.5">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>

      {/* Tech stack pills */}
      <div className="flex gap-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-14 rounded-full" />
        <Skeleton className="h-5 w-10 rounded-full" />
      </div>

      {/* Description lines */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>

      {/* Match reason footer */}
      <div className="pt-2 border-t space-y-1" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  )
}

export function TrendCardSkeleton() {
  return (
    <div
      className="rounded-2xl p-5 border flex flex-col gap-3"
      style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
    >
      {/* Tag pill + title + bookmark placeholder */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <Skeleton className="h-7 w-7 rounded-md shrink-0" />
      </div>

      {/* Summary */}
      <div className="space-y-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="h-3 w-4/6" />
      </div>

      {/* Why now / relevance footer */}
      <div className="pt-1 border-t space-y-1.5" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </div>
  )
}
