'use client'
/**
 * useClientContext
 *
 * Single source of truth for the active client selection across all module pages.
 * Enforces account isolation: role='client' users are locked to their assigned account.
 * Admin and investor users can toggle freely between the canonical 4 accounts.
 *
 * Persistence order: URL param → localStorage → user metadata → first allowed client
 * Switching via the nav dropdown writes to localStorage so selection survives page navigation.
 */

import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ALL_CLIENTS, DEFAULT_CLIENT_KEY, isClientKey, type ClientOption } from '@/lib/client-config'

export { ALL_CLIENTS, type ClientOption } from '@/lib/client-config'

const LS_KEY = 'abarva_selected_client'

function readLocalStorage(): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(LS_KEY) } catch { return null }
}

function writeLocalStorage(id: string) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_KEY, id) } catch { /* ignore */ }
}

// Mirror active client in a cookie so server components can filter data
// without a client-round-trip. 1-year max-age; path-scoped to root so
// every page sees it.
function writeCookie(id: string) {
  if (typeof document === 'undefined') return
  try {
    document.cookie = `abarva_active_client=${encodeURIComponent(id)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  } catch { /* ignore */ }
}

export function useClientContext() {
  const { user, isLoaded } = useUser()
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const role        = user?.publicMetadata?.role        as string | undefined
  const metaClient  = user?.publicMetadata?.clientId    as string | undefined

  // Admin and investor can access all accounts
  const isElevated = !isLoaded || !user || role === 'admin' || role === 'investor'

  // Account-level users are locked to their single account
  const allowedClients = isElevated
    ? ALL_CLIENTS
    : ALL_CLIENTS.filter(c => c.id === metaClient)

  // Resolve active client: URL param → localStorage → user metadata → default to first allowed
  const urlClient   = searchParams.get('client')
  const lsClient    = readLocalStorage()
  let clientId = urlClient || lsClient || metaClient || allowedClients[0]?.id || DEFAULT_CLIENT_KEY

  // Enforce isolation: if the resolved client is one the user can't see, override
  if (!isElevated && metaClient && clientId !== metaClient) {
    clientId = metaClient
  }

  if (!isClientKey(clientId)) {
    clientId = allowedClients[0]?.id || DEFAULT_CLIENT_KEY
  }

  // Sync URL param → localStorage + cookie so future navigations remember
  if (urlClient && urlClient !== lsClient) {
    writeLocalStorage(urlClient)
    writeCookie(urlClient)
  }

  const currentClient = ALL_CLIENTS.find(c => c.id === clientId) ?? ALL_CLIENTS[0]

  function switchClient(newId: string) {
    if (!allowedClients.find(c => c.id === newId)) return // silently ignore unauthorized switch
    writeLocalStorage(newId)
    writeCookie(newId)
    const params = new URLSearchParams(searchParams.toString())
    params.set('client', newId)
    const targetPath = pathname || '/home'
    router.replace(`${targetPath}?${params.toString()}`)
    // Force server-render refresh so pages filtered by active client reload
    router.refresh()
  }

  const isAdmin = isLoaded && !!user && role === 'admin'

  return {
    clientId,
    currentClient,
    allowedClients,
    canSwitch: isElevated && ALL_CLIENTS.length > 1,
    canSwitchInline: isAdmin,
    switchClient,
    isLoaded,
    role,
    isElevated,
    isAdmin,
  }
}
