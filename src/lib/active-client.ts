import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import {
  CLIENT_KEY_TO_DB_NAME,
  DEFAULT_CLIENT_KEY,
  isClientKey,
  type ClientKey,
} from '@/lib/client-config';

// Server-side resolution of the active client for the signed-in user.
// Mirrors useClientContext's precedence but reads from cookie (not
// localStorage) so server components can filter without a round-trip.
//
// Precedence: cookie → Clerk metadata.clientId → first allowed fallback.
//
// Isolation: locked account users are pinned to their clientId regardless
// of cookie. Admin + investor can switch via the top-nav dropdown.

export const ACTIVE_CLIENT_COOKIE = 'abarva_active_client';

export async function getActiveClientKey(): Promise<ClientKey> {
  // 1 · cookie
  try {
    const store = await cookies();
    const fromCookie = store.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
    if (isClientKey(fromCookie)) return fromCookie;
  } catch {
    // cookies() fails outside request scope — fall through to metadata
  }

  // 2 · Clerk metadata
  try {
    const user = await currentUser();
    const role = user?.publicMetadata?.role as string | undefined;
    const meta = user?.publicMetadata?.clientId as string | undefined;
    const isLockedRole = role === 'client' || role === 'maestro';
    if (isLockedRole && isClientKey(meta)) return meta;
    if (isClientKey(meta)) return meta;
  } catch {
    // currentUser() fails outside Clerk context — fall through to default
  }

  // 3 · fallback
  return DEFAULT_CLIENT_KEY;
}

/**
 * Resolve the active client's UUID from the `clients` table. Returns null
 * when no matching row exists (e.g. Pack H/J seeds not yet applied on prod).
 * Callers should treat null as "no active client" and render an empty-state
 * rather than silently showing cross-client data.
 */
export async function getActiveClientRow(): Promise<{ id: string; name: string; industry_code: string | null; key: ClientKey } | null> {
  const key = await getActiveClientKey();
  const { getServerSupabase } = await import('@/lib/supabase-server');
  const sb = getServerSupabase();
  const candidates = CLIENT_KEY_TO_DB_NAME[key];
  for (const candidate of candidates) {
    const { data } = await sb
      .from('clients')
      .select('id, name, industry_code')
      .ilike('name', candidate)
      .maybeSingle();
    if (data) {
      return {
        id: (data as { id: string }).id,
        name: (data as { name: string }).name,
        industry_code: (data as { industry_code: string | null }).industry_code,
        key,
      };
    }
  }
  return null;
}
