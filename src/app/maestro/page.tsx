'use client'
import { useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useClientContext } from '@/lib/use-client-context'

function MaestroRedirect() {
  const router = useRouter()
  const { clientId, isLoaded } = useClientContext()

  useEffect(() => {
    if (isLoaded) {
      router.replace(`/maestro/${clientId}`)
    }
  }, [isLoaded, clientId, router])

  return <div style={{ minHeight: '100vh', background: '#060A12' }} />
}

export default function MaestroHome() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#060A12' }} />}>
      <MaestroRedirect />
    </Suspense>
  )
}
