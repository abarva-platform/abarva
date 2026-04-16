'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

function Redirect() {
  const router = useRouter()
  const params = useSearchParams()
  const client = params.get('client') ?? 'meridian'
  useEffect(() => {
    router.replace(`/intelligence?client=${client}#ai-unlock`)
  }, [router, client])
  return null
}

export default function AIUnlockRedirect() {
  return <Suspense><Redirect /></Suspense>
}
