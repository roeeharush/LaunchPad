import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ambient">
      <NextTopLoader color="#6366f1" height={2} showSpinner={false} shadow={false} />
      <Toaster position="top-left" dir="rtl" theme="dark" />
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
