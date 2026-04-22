'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DEFAULT_CLIENT_KEY, isClientKey } from '@/lib/client-config'

const BG = '#060A12'
const TEAL = '#14B8A6'
const MONO = 'JetBrains Mono, monospace'

function persistClientContext(clientId: string) {
  try {
    localStorage.setItem('abarva_selected_client', clientId)
  } catch {}
  try {
    document.cookie = `abarva_active_client=${encodeURIComponent(clientId)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  } catch {}
}

export default function AuthRedirect() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) { router.push('/sign-in'); return }

    const role              = user.publicMetadata?.role              as string | undefined
    const clientId          = user.publicMetadata?.clientId          as string | undefined
    const defaultClientId   = user.publicMetadata?.defaultClientId   as string | undefined
    const resolvedClientId  = [clientId, defaultClientId, DEFAULT_CLIENT_KEY].find((candidate) => isClientKey(candidate)) ?? DEFAULT_CLIENT_KEY

    if (role === 'investor') {
      persistClientContext(resolvedClientId)
      router.replace(`/investor?client=${resolvedClientId}`)
      return
    }

    if (role === 'admin') {
      persistClientContext(resolvedClientId)
      router.replace(`/home?client=${resolvedClientId}`)
      return
    }

    if ((role === 'client' || role === 'maestro') && isClientKey(clientId)) {
      persistClientContext(clientId)
      router.replace(`/home?client=${clientId}`)
      return
    }

    // Default fallback
    persistClientContext(resolvedClientId)
    router.replace(`/home?client=${resolvedClientId}`)
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
