'use client'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { usePostHog } from 'posthog-js/react'

export default function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    if (!pathname || !posthog) return

    const qs = searchParams?.toString() ?? ''
    const url = `${window.location.origin}${pathname}${qs ? `?${qs}` : ''}`

    const ref = searchParams?.get('ref')
    if (ref) {
      posthog.identify(ref, {
        name: ref,
        first_seen: new Date().toISOString(),
      })
    }

    posthog.capture('$pageview', { $current_url: url })
  }, [pathname, searchParams, posthog])

  return null
}
