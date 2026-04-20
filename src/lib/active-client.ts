import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';

// Server-side resolution of the active client for the signed-in user.
// Mirrors useClientContext's precedence but reads from cookie (not
// localStorage) so server components can filter without a round-trip.
//
// Precedence: cookie → Clerk metadata.clientId → first allowed fallback
// (meridian, since Pack J + Pack H + VIP demo all ride on Meridian).
//
// Isolation: role='client' users are pinned to their clientId regardless
// of cookie. Admin + investor can switch via the top-nav dropdown.

export const ACTIVE_CLIENT_COOKIE = 'abarva_active_client';
export const ALLOWED_CLIENT_KEYS = ['meridian', 'arcturus', 'apexretail'] as const;
export type ClientKey = (typeof ALLOWED_CLIENT_KEYS)[number];

export const CLIENT_KEY_TO_DB_NAME: Record<ClientKey, string[]> = {
  // Multiple candidate names per key handles naming variance in Pack H/J seeds
  meridian: ['Meridian Health', 'Meridian Health System'],
  arcturus: ['Arcturus Financial', 'Arcturus Financial Group', 'First Capital', 'First Capital Financial'],
  apexretail: ['Apex Retail', 'Apex Retail Group'],
};

function isAllowedKey(k: string | null | undefined): k is ClientKey {
  return !!k && (ALLOWED_CLIENT_KEYS as readonly string[]).includes(k);
}

export async function getActiveClientKey(): Promise<ClientKey> {
  // 1 · cookie
  try {
    const store = await cookies();
    const fromCookie = store.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
    if (isAllowedKey(fromCookie)) return fromCookie;
  } catch {
    // cookies() fails outside request scope — fall through to metadata
  }

  // 2 · Clerk metadata
  try {
    const user = await currentUser();
    const role = user?.publicMetadata?.role as string | undefined;
    const meta = user?.publicMetadata?.clientId as string | undefined;
    // Client role: always pinned to their metadata regardless of cookie
    if (role === 'client' && isAllowedKey(meta)) return meta;
    if (isAllowedKey(meta)) return meta;
  } catch {
    // currentUser() fails outside Clerk context — fall through to default
  }

  // 3 · fallback
  return 'meridian';
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
