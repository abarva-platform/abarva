import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

export const metadata: Metadata = {
  title: 'Abarva — Enterprise AI Brain',
  description: 'AI-native enterprise transformation platform. Strategy, diagnostics, roadmaps, and outcome tracking in hours, not months.',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    title: 'Abarva — Enterprise AI Brain',
    description: 'AI-native enterprise transformation. $292M in value identified from real client data.',
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
        <body>{children}</body>
      </html>
    </ClerkProvider>
  )
}