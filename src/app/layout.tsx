import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { Cormorant_Garamond, Fraunces, Inter } from 'next/font/google'
import './globals.css'
import PostHogProvider from '@/components/PostHogProvider'
import PostHogPageView from './posthog-pageview'
import MobileGuard from '@/components/MobileGuard'

// Cormorant Garamond — canonical AbarVa serif for wordmark + admin headings.
// Application of the variable lands in ADMIN2; this slice only registers the
// font so subsequent slices can opt in via `var(--font-cormorant)`.
const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-cormorant',
  display: 'swap',
})

// Fraunces — shell serif for agent quotes, badges, and surface headings.
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-fraunces',
  display: 'swap',
})

// Inter — shell sans-serif for body and UI labels.
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

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
      <html lang="en" className={`${cormorantGaramond.variable} ${fraunces.variable} ${inter.variable}`}>
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
