import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ClerkProvider } from '@clerk/nextjs'
import { Fraunces, Inter } from 'next/font/google'
import './globals.css'
import PostHogProvider from '@/components/PostHogProvider'
import PostHogPageView from './posthog-pageview'
import MobileGuard from '@/components/MobileGuard'
import { ToastProvider } from '@/components/shell/Toast'

// Fraunces — canonical display serif (v3 design system). Used for all page
// titles, section headings, and KPI numerals across the product.
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
      <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#0066CC" />
          <meta name="theme-color" content="#0066CC" />
        </head>
        <body>
          <PostHogProvider>
            <Suspense fallback={null}>
              <PostHogPageView />
            </Suspense>
            <MobileGuard>
              <ToastProvider>
                {children}
              </ToastProvider>
            </MobileGuard>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
