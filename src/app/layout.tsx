import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import PostHogProvider from '@/components/PostHogProvider'
import PostHogPageView from './posthog-pageview'
import MobileGuard from '@/components/MobileGuard'

export const metadata: Metadata = {
  title: 'AbarVa',
  description: 'Intelligence. Now act on it.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'AbarVa — Intelligence. Now act on it.',
    description: 'AbarVa gives you what consultants never could — intelligence from your own data, accountable to your actual outcomes.',
    type: 'website',
    url: 'https://app.abarva.ai',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider signInUrl="/sign-in" afterSignOutUrl="/" signInForceRedirectUrl="/auth-redirect" signUpForceRedirectUrl="/auth-redirect">
      <html lang="en">
        <body>
          <PostHogProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <MobileGuard>
              {children}
            </MobileGuard>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}