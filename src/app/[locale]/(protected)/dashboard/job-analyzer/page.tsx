import { Wand2 } from 'lucide-react'
import { JobAnalyzerClient } from './_components/job-analyzer-client'

export default function JobAnalyzerPage() {
  return (
    <div className="min-h-screen bg-ambient">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
          <Wand2 className="w-4 h-4" style={{ color: 'oklch(0.58 0.21 291)' }} />
          <span>ניתוח משרות</span>
        </div>
        <h1
          className="text-3xl font-extrabold tracking-tight"
          style={{ color: 'oklch(0.93 0.008 252)' }}
        >
          מנתח משרות AI
        </h1>
        <p className="text-muted-foreground mt-1.5 text-sm">
          הדבק מודעת עבודה · קבל מכתב פנייה מותאם · כישורים קריטיים · שאלות ראיון
        </p>
      </div>

      <JobAnalyzerClient />
    </div>
  )
}
