'use client'
import { useUser } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import {
  isExternalOnlyRole,
  isNewClientSetupEmail,
  resolvePostSignInPath,
  resolveSessionClientKey,
  resolveSessionRole,
} from '@/lib/auth/access-routing'
import { clearActiveClientContext, persistActiveClientContext } from '@/lib/auth/client-context-storage'

const BG = '#060A12'
const TEAL = '#14B8A6'
const MONO = 'JetBrains Mono, monospace'

export default function AuthRedirect() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoaded) return
    if (!user) {
      clearActiveClientContext()
      router.replace('/sign-in')
      return
    }

    const role = user.publicMetadata?.role as string | undefined
    const clientId = user.publicMetadata?.clientId as string | undefined
    const defaultClientId = user.publicMetadata?.defaultClientId as string | undefined
    const email = user.primaryEmailAddress?.emailAddress
      ?? user.emailAddresses?.[0]?.emailAddress
      ?? undefined
    const resolvedRole = resolveSessionRole(role, email)
    const resolvedClientId = resolveSessionClientKey({ clientId, defaultClientId, email })
    const destination = resolvePostSignInPath(resolvedRole, { clientId, defaultClientId, email })

    if (!isExternalOnlyRole(resolvedRole) && !isNewClientSetupEmail(email)) {
      persistActiveClientContext(resolvedClientId)
    } else {
      clearActiveClientContext()
    }

    router.replace(destination)
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
