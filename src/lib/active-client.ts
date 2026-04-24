import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import { resolveSessionRole } from '@/lib/auth/access-routing';
import {
  CLIENT_KEY_TO_DB_NAME,
  DEFAULT_CLIENT_KEY,
  inferClientKeyFromEmail,
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

type SessionClientContext = {
  role?: string;
  clientId?: string;
  defaultClientId?: string;
  email?: string;
};

async function getSessionClientContext(): Promise<SessionClientContext> {
  try {
    const user = await currentUser();
    return {
      role: user?.publicMetadata?.role as string | undefined,
      clientId: user?.publicMetadata?.clientId as string | undefined,
      defaultClientId: user?.publicMetadata?.defaultClientId as string | undefined,
      email: user?.primaryEmailAddress?.emailAddress
        ?? user?.emailAddresses?.[0]?.emailAddress
        ?? undefined,
    };
  } catch {
    return {};
  }
}

function resolvePinnedClientKey(session: SessionClientContext): ClientKey {
  const resolved = [
    session.clientId,
    session.defaultClientId,
    inferClientKeyFromEmail(session.email),
    DEFAULT_CLIENT_KEY,
  ].find((candidate) => isClientKey(candidate));
  return resolved ?? DEFAULT_CLIENT_KEY;
}

export async function getActiveClientKey(requestedClientId?: string | null): Promise<ClientKey> {
  const session = await getSessionClientContext();
  const role = resolveSessionRole(session.role, session.email);
  const pinnedClientKey = resolvePinnedClientKey(session);

  const isLockedRole = role === 'client' || role === 'maestro';
  if (isLockedRole) return pinnedClientKey;

  if (isClientKey(requestedClientId)) return requestedClientId;

  // 1 · cookie
  try {
    const store = await cookies();
    const fromCookie = store.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
    if (isClientKey(fromCookie)) return fromCookie;
  } catch {
    // cookies() fails outside request scope — fall through to metadata/default
  }

  // 2 · Clerk metadata / fallback alias
  if (isClientKey(session.clientId)) return session.clientId;
  if (isClientKey(session.defaultClientId)) return session.defaultClientId;
  const inferred = inferClientKeyFromEmail(session.email);
  if (inferred) return inferred;

  // 3 · fallback
  return DEFAULT_CLIENT_KEY;
}

/**
 * Resolve the active client's UUID from the `clients` table. Returns null
 * when no matching row exists (e.g. Pack H/J seeds not yet applied on prod).
 * Callers should treat null as "no active client" and render an empty-state
 * rather than silently showing cross-client data.
 */
export async function getActiveClientRow(requestedClientId?: string | null): Promise<{ id: string; name: string; industry_code: string | null; key: ClientKey } | null> {
  const key = await getActiveClientKey(requestedClientId);
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
