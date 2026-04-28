import NextTopLoader from 'nextjs-toploader'
import { Toaster } from 'sonner'
import { MobileLayout } from '@/components/layout/mobile-layout'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextTopLoader color="#6366f1" height={2} showSpinner={false} shadow={false} />
      <Toaster position="top-left" dir="rtl" theme="dark" />
      <MobileLayout>{children}</MobileLayout>
    </>
  )
}
