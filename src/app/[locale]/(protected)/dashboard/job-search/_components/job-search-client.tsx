'use client'

import { useState } from 'react'
import { Briefcase, ClipboardList, Upload, X } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { JobDiscoveryPanel } from './job-discovery-panel'
import { ApplicationTracker } from './application-tracker'
import { UploadForm } from '../../resume-analyzer/_components/upload-form'
import type { JobApplication, ApplicationStatus } from '@/types/jobs'
import type { ResumeRecord } from '@/types/resume'

interface ResumeInfo {
  hasResume: boolean
  score: number | null
  skills: string[]
}

interface JobSearchClientProps {
  initialApplications: JobApplication[]
  resumeInfo: ResumeInfo
}

const YELLOW = 'oklch(0.75 0.16 60)'
const GREEN = 'oklch(0.60 0.17 162)'

function StepRow({
  num,
  title,
  desc,
  state,
}: {
  num: number | '✓'
  title: string
  desc: string
  state: 'done' | 'current' | 'locked'
}) {
  const colors = {
    done: GREEN,
    current: YELLOW,
    locked: 'oklch(0.45 0 0)',
  }
  const color = colors[state]

  return (
    <div
      className="flex items-start gap-3 rounded-2xl px-4 py-3.5 border"
      style={{
        background: color.replace(')', ' / 6%)'),
        borderColor: color.replace(')', ' / 25%)'),
      }}
    >
      <span
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
        style={{ background: color.replace(')', ' / 20%)'), color }}
      >
        {num}
      </span>
      <div>
        <p
          className="text-sm font-bold"
          style={{ color: state === 'locked' ? 'oklch(0.55 0 0)' : undefined }}
        >
          {title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </div>
  )
}

function ResumeUploadModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: (record: ResumeRecord) => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'oklch(0 0 0 / 60%)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-2xl p-6 shadow-2xl"
        style={{ background: 'var(--card)', border: '1px solid oklch(1 0 0 / 10%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">העלאת קורות חיים</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <UploadForm onResult={onSuccess} />
      </div>
    </div>
  )
}

export function JobSearchClient({
  initialApplications,
  resumeInfo: initialResumeInfo,
}: JobSearchClientProps) {
  const [activeTab, setActiveTab] = useState('discover')
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications)
  const [resumeInfo, setResumeInfo] = useState(initialResumeInfo)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  function handleResumeUploaded(record: ResumeRecord) {
    setResumeInfo({
      hasResume: true,
      score: record.score,
      skills: record.analysis_json?.strengths ?? [],
    })
    setUploadModalOpen(false)
  }

  function handleApplicationSaved(application: JobApplication) {
    setApplications((prev) => [application, ...prev])
  }

  function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
  }

  function handleDelete(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  const step1Desc = resumeInfo.hasResume
    ? `ציון: ${resumeInfo.score ?? '—'}/100${resumeInfo.skills.length > 0 ? ` · ${resumeInfo.skills.slice(0, 3).join(', ')}` : ''}`
    : 'ה-AI צריך לנתח את הפרופיל שלך לפני שיוכל למצוא משרות מתאימות'

  if (!resumeInfo.hasResume) {
    return (
      <>
        <div className="space-y-6 max-w-lg">
          <div className="space-y-3">
            <StepRow num={1} title="העלה קורות חיים" desc={step1Desc} state="current" />
            <StepRow
              num={2}
              title="מצא משרות מתאימות"
              desc="ה-AI יציע 10 משרות רלוונטיות בהייטק הישראלי"
              state="locked"
            />
          </div>

          <div
            className="rounded-2xl border-2 border-dashed p-8 flex flex-col items-center text-center gap-4"
            style={{
              borderColor: YELLOW.replace(')', ' / 40%)'),
              background: YELLOW.replace(')', ' / 5%)'),
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: YELLOW.replace(')', ' / 15%)') }}
            >
              <Upload className="w-7 h-7" style={{ color: YELLOW }} />
            </div>
            <div>
              <p className="font-bold text-base mb-1">קורות חיים לא נמצאו</p>
              <p className="text-sm text-muted-foreground max-w-xs">
                כדי שנוכל למצוא משרות מתאימות, נצטרך לנתח את קורות החיים שלך תחילה
              </p>
            </div>
            <button
              onClick={() => setUploadModalOpen(true)}
              className={cn(buttonVariants({ size: 'default' }), 'gap-2 font-semibold mt-1')}
              style={{ background: YELLOW, color: 'oklch(0.15 0.02 60)' }}
            >
              <Upload className="w-4 h-4" />
              העלה קורות חיים עכשיו
            </button>
          </div>
        </div>

        {uploadModalOpen && (
          <ResumeUploadModal
            onClose={() => setUploadModalOpen(false)}
            onSuccess={handleResumeUploaded}
          />
        )}
      </>
    )
  }

  const TAB_CONFIG = [
    { value: 'discover', label: 'גילוי משרות', icon: Briefcase, color: YELLOW },
    {
      value: 'tracker',
      label: `טראקר${applications.length > 0 ? ` (${applications.length})` : ''}`,
      icon: ClipboardList,
      color: 'oklch(0.585 0.212 264.4)',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
        <StepRow num="✓" title="קורות חיים מנותחים" desc={step1Desc} state="done" />
        <StepRow
          num={2}
          title="מצא משרות מתאימות"
          desc="לחץ על הכפתור כדי למצוא משרות"
          state="current"
        />
      </div>

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

        <TabsContent value="discover">
          <JobDiscoveryPanel onApplicationSaved={handleApplicationSaved} />
        </TabsContent>

        <TabsContent value="tracker">
          <ApplicationTracker
            applications={applications}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
