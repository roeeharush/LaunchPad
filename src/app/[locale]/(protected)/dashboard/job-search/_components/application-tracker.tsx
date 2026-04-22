'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { he } from 'date-fns/locale'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { updateApplicationStatusAction, deleteApplicationAction } from '../actions'
import type { JobApplication, ApplicationStatus } from '@/types/jobs'

interface ApplicationTrackerProps {
  applications: JobApplication[]
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void
  onDelete: (id: string) => void
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  applied: { label: 'הגשתי', color: 'oklch(0.585 0.212 264.4)' },
  interviewing: { label: 'ראיון', color: 'oklch(0.75 0.16 60)' },
  offer: { label: 'הצעה', color: 'oklch(0.60 0.17 162)' },
  rejected: { label: 'נדחיתי', color: 'oklch(0.62 0.22 27)' },
}

const ALL_STATUSES: ApplicationStatus[] = ['applied', 'interviewing', 'offer', 'rejected']

function ApplicationCard({
  application,
  onStatusChange,
  onDelete,
}: {
  application: JobApplication
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void
  onDelete: (id: string) => void
}) {
  const [isUpdating, startUpdateTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()
  const config = STATUS_CONFIG[application.status]

  function handleStatusChange(newStatus: ApplicationStatus) {
    const formData = new FormData()
    formData.set('id', application.id)
    formData.set('status', newStatus)
    startUpdateTransition(async () => {
      const result = await updateApplicationStatusAction(formData)
      if (result.ok) onStatusChange(application.id, newStatus)
    })
  }

  function handleDelete() {
    const formData = new FormData()
    formData.set('id', application.id)
    startDeleteTransition(async () => {
      const result = await deleteApplicationAction(formData)
      if (result.ok) onDelete(application.id)
    })
  }

  return (
    <div
      className="rounded-xl p-4 border flex flex-col gap-2 group"
      style={{
        background: 'var(--card)',
        borderColor: config.color.replace(')', ' / 18%)'),
        opacity: isDeleting ? 0.4 : 1,
        transition: 'opacity 150ms ease',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-snug truncate">{application.job_title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{application.company}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting || isUpdating}
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'px-1.5 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0'
          )}
          aria-label="מחק"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {application.location && (
        <p className="text-xs text-muted-foreground">
          {application.is_remote ? '🌐 Remote' : `📍 ${application.location}`}
        </p>
      )}

      {application.tech_stack.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {application.tech_stack.slice(0, 3).map((tech) => (
            <span
              key={tech}
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: 'oklch(1 0 0 / 7%)', color: 'oklch(0.75 0.05 252)' }}
            >
              {tech}
            </span>
          ))}
        </div>
      )}

      {/* Status change dropdown */}
      <div className="pt-1 border-t" style={{ borderColor: 'oklch(1 0 0 / 8%)' }}>
        <select
          value={application.status}
          onChange={(e) => handleStatusChange(e.target.value as ApplicationStatus)}
          disabled={isUpdating || isDeleting}
          className="w-full text-xs rounded-lg px-2 py-1.5 border bg-transparent cursor-pointer disabled:opacity-50"
          style={{
            borderColor: config.color.replace(')', ' / 30%)'),
            color: config.color,
          }}
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s} style={{ color: 'inherit', background: 'var(--background)' }}>
              {STATUS_CONFIG[s].label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(application.applied_at), { addSuffix: true, locale: he })}
      </p>
    </div>
  )
}

export function ApplicationTracker({
  applications,
  onStatusChange,
  onDelete,
}: ApplicationTrackerProps) {
  if (applications.length === 0) {
    return (
      <div
        className="rounded-2xl p-10 border flex flex-col items-center justify-center text-center gap-3"
        style={{ background: 'var(--card)', borderColor: 'oklch(1 0 0 / 9%)' }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'oklch(0.75 0.16 60 / 10%)' }}
        >
          <span className="text-2xl">📋</span>
        </div>
        <p className="font-semibold">טרם שמרת בקשות עבודה</p>
        <p className="text-muted-foreground text-sm max-w-xs">
          עבור ללשונית &quot;גילוי משרות&quot;, מצא משרות מתאימות ולחץ + להוספה לטראקר
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{applications.length} בקשות</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {ALL_STATUSES.map((status) => {
          const config = STATUS_CONFIG[status]
          const statusApps = applications.filter((a) => a.status === status)
          return (
            <div key={status} className="space-y-3">
              <div
                className="flex items-center gap-2 pb-1 border-b"
                style={{ borderColor: config.color.replace(')', ' / 25%)') }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: config.color }}
                />
                <span className="text-xs font-semibold" style={{ color: config.color }}>
                  {config.label}
                </span>
                <span className="text-xs text-muted-foreground mr-auto">{statusApps.length}</span>
              </div>

              {statusApps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onStatusChange={onStatusChange}
                  onDelete={onDelete}
                />
              ))}

              {statusApps.length === 0 && (
                <div
                  className="rounded-xl p-4 border text-center"
                  style={{ borderColor: 'oklch(1 0 0 / 6%)', borderStyle: 'dashed' }}
                >
                  <p className="text-xs text-muted-foreground">ריק</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
