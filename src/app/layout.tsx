import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'
import PostHogProvider from '@/components/PostHogProvider'
import MobileGuard from '@/components/MobileGuard'

export const metadata: Metadata = {
  title: 'AbarVa',
  description: 'Intelligence. Now act on it.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'AbarVa — Intelligence. Now act on it.',
    description: 'AbarVa gives you what consultants never could — intelligence from your own data, accountable to your actual outcomes.',
    type: 'website',
    url: 'https://nexus-vert-kappa.vercel.app',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <PostHogProvider>
            <MobileGuard>
              {children}
            </MobileGuard>
          </PostHogProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}