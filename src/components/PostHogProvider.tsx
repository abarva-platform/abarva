'use client'
import posthog from 'posthog-js'
import { PostHogProvider as PHProvider } from 'posthog-js/react'

function ensurePostHogInitialized() {
  if (typeof window === 'undefined') return

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  if (!key || posthog.__loaded) return

  posthog.init(key, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
    person_profiles: 'identified_only',
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    session_recording: {
      maskAllInputs: true,
      maskInputOptions: { password: true },
    },
  })
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  ensurePostHogInitialized()
  return <PHProvider client={posthog}>{children}</PHProvider>
}
