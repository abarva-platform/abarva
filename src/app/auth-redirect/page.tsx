'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const BG = '#060A12'
const TEAL = '#2DD4C8'
const MONO = 'JetBrains Mono, monospace'

export default function AuthRedirect() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }

    const role              = user.publicMetadata?.role              as string | undefined
    const clientId          = user.publicMetadata?.clientId          as string | undefined
    const preferredSolution = user.publicMetadata?.preferredSolution as string | undefined

    if (role === 'investor') {
      router.push('/investor')
      return
    }

    if (role === 'admin') {
      router.push('/admin')
      return
    }

    if (role === 'client' && clientId) {
      const sol = preferredSolution || 'delivery'
      router.push(`/portal/${sol}?client=${clientId}`)
      return
    }

    // Default fallback
    router.push('/admin')
  }, [isLoaded, user, router])

  return (
    <div style={{
      minHeight: '100vh', background: BG,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column' as const, gap: '12px',
    }}>
      <div style={{ fontFamily: MONO, fontSize: '11px', color: TEAL, letterSpacing: '.1em', textTransform: 'uppercase' as const }}>
        Loading your workspace...
      </div>
      <div style={{ width: '32px', height: '2px', background: TEAL, borderRadius: '1px', opacity: 0.7 }} />
    </div>
  )
}
