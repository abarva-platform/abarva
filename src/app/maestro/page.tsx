'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClientContext } from '@/lib/use-client-context'

export default function MaestroHome() {
  const router = useRouter()
  const { clientId, isLoaded } = useClientContext()

  useEffect(() => {
    if (isLoaded) {
      router.replace(`/maestro/${clientId}`)
    }
  }, [isLoaded, clientId, router])

  return <div style={{ minHeight: '100vh', background: '#060A12' }} />
}
