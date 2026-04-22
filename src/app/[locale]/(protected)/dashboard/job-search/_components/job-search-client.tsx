'use client'

import { useState } from 'react'
import { Briefcase, ClipboardList } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { JobDiscoveryPanel } from './job-discovery-panel'
import { ApplicationTracker } from './application-tracker'
import type { JobApplication, ApplicationStatus } from '@/types/jobs'

interface JobSearchClientProps {
  initialApplications: JobApplication[]
}

export function JobSearchClient({ initialApplications }: JobSearchClientProps) {
  const [activeTab, setActiveTab] = useState('discover')
  const [applications, setApplications] = useState<JobApplication[]>(initialApplications)

  function handleApplicationSaved(application: JobApplication) {
    setApplications((prev) => [application, ...prev])
  }

  function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setApplications((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)))
  }

  function handleDelete(id: string) {
    setApplications((prev) => prev.filter((a) => a.id !== id))
  }

  const TAB_CONFIG = [
    { value: 'discover', label: 'גילוי משרות', icon: Briefcase, color: 'oklch(0.75 0.16 60)' },
    {
      value: 'tracker',
      label: `טראקר${applications.length > 0 ? ` (${applications.length})` : ''}`,
      icon: ClipboardList,
      color: 'oklch(0.585 0.212 264.4)',
    },
  ]

  return (
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
              activeTab === value ? { background: color.replace(')', ' / 15%)'), color } : undefined
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
  )
}
