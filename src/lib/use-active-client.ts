'use client'
/**
 * useActiveClient
 *
 * Lightweight hook for pages that need the active client ID but don't
 * need the full useClientContext (e.g. pages using raw useSearchParams).
 *
 * Resolution order: URL ?client= param → localStorage → 'meridian'
 */
import { useSearchParams } from 'next/navigation'

const LS_KEY = 'abarva_selected_client'

function readLS(): string | null {
  if (typeof window === 'undefined') return null
  try { return localStorage.getItem(LS_KEY) } catch { return null }
}

export function useActiveClient(fallback = 'meridian'): string {
  const searchParams = useSearchParams()
  return searchParams.get('client') || readLS() || fallback
}
