'use client'
import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePostHog } from 'posthog-js/react'

function InvestorRedirect() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const posthog = usePostHog()

  useEffect(() => {
    posthog?.capture('investor_page_loaded', {
      ref: searchParams?.get('ref') ?? null,
    })
    router.replace('/')
  }, [router, posthog, searchParams])

  return null
}

export default function InvestorPage() {
  return (
    <Suspense fallback={null}>
      <InvestorRedirect />
    </Suspense>
  )
}
