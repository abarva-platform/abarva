'use client'
/**
 * useClientContext
 *
 * Single source of truth for the active client selection across all module pages.
 * Enforces account isolation: role='client' users are locked to their assigned account.
 * Admin and investor users can toggle freely between all 3 accounts.
 *
 * The active client is reflected in the URL via ?client= param so pages are deep-linkable
 * and server-side searchParams remain consistent.
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

  // Resolve active client: URL param → user metadata → default to first allowed
  const urlClient = searchParams.get('client')
  let clientId = urlClient || metaClient || allowedClients[0]?.id || 'meridian'

  // Enforce isolation: if the URL tries to access an account the user can't see, override
  if (!isElevated && metaClient && clientId !== metaClient) {
    clientId = metaClient
  }

  const currentClient = ALL_CLIENTS.find(c => c.id === clientId) ?? ALL_CLIENTS[0]

  function switchClient(newId: string) {
    if (!allowedClients.find(c => c.id === newId)) return // silently ignore unauthorized switch
    const params = new URLSearchParams(searchParams.toString())
    params.set('client', newId)
    router.push(`${pathname}?${params.toString()}`)
  }

  const isAdmin = isLoaded && !!user && role === 'admin'

  return {
    clientId,
    currentClient,
    allowedClients,          // what the user is permitted to see and switch to
    canSwitch: isElevated && ALL_CLIENTS.length > 1,
    canSwitchInline: isAdmin, // only admins get inline page-level tab strips; investors use the nav
    switchClient,
    isLoaded,
    role,
    isElevated,
    isAdmin,
  }
}
