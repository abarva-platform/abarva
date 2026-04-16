'use client'
/**
 * useClientContext
 *
 * Single source of truth for the active client selection across all module pages.
 * Enforces account isolation: role='client' users are locked to their assigned account.
 * Admin and investor users can toggle freely between all 3 accounts.
 *
 * Persistence order: URL param → localStorage → user metadata → first allowed client
 * Switching via the nav dropdown writes to localStorage so selection survives page navigation.
 */

import { useUser } from '@clerk/nextjs'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export interface ClientOption {
  id: string
  name: string
  shortName: string
  color: string
  vertical: string
}

export const ALL_CLIENTS: ClientOption[] = [
  { id: 'meridian',   name: 'Meridian Health System',  shortName: 'Meridian Health',     color: '#2DD4C8', vertical: 'Healthcare'         },
  { id: 'arcturus',   name: 'Arcturus Financial Group', shortName: 'Arcturus Financial',  color: '#818CF8', vertical: 'Financial Services' },
  { id: 'apexretail', name: 'Apex Retail Group',        shortName: 'Apex Retail',         color: '#F59E0B', vertical: 'Retail'             },
]

const LS_KEY = 'abarva_selected_client'

function readLocalStorage(): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(LS_KEY) } catch { return null }
}

function writeLocalStorage(id: string) {
  if (typeof window === 'undefined') return
  try { localStorage.setItem(LS_KEY, id) } catch { /* ignore */ }
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
  let clientId = urlClient || lsClient || metaClient || allowedClients[0]?.id || 'meridian'

  // Enforce isolation: if the resolved client is one the user can't see, override
  if (!isElevated && metaClient && clientId !== metaClient) {
    clientId = metaClient
  }

  // Sync URL param → localStorage so future navigations remember the choice
  if (urlClient && urlClient !== lsClient) {
    writeLocalStorage(urlClient)
  }

  const currentClient = ALL_CLIENTS.find(c => c.id === clientId) ?? ALL_CLIENTS[0]

  function switchClient(newId: string) {
    if (!allowedClients.find(c => c.id === newId)) return // silently ignore unauthorized switch
    writeLocalStorage(newId)
    // On the Maestro home, switching client goes directly to that client's workspace
    if (pathname === '/maestro') {
      router.push(`/maestro/${newId}`)
      return
    }
    const params = new URLSearchParams(searchParams.toString())
    params.set('client', newId)
    router.push(`${pathname}?${params.toString()}`)
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
