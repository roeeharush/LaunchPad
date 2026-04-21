import type { Metadata } from 'next'
import { Heebo } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import '../globals.css'

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
})

export const metadata: Metadata = {
  title: 'LaunchPad | לאנצ׳פד',
  description: 'פלטפורמת הקריירה לסטודנטים להנדסת תוכנה',
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale} dir="rtl" className={heebo.variable}>
      <body className="font-sans bg-background text-foreground antialiased">
        <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  )
}
