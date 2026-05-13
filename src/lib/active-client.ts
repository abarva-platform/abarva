import { cookies } from 'next/headers';
import { currentUser } from '@clerk/nextjs/server';
import { resolvePinnedSessionClientKey, resolveSessionRole } from '@/lib/auth/access-routing';
import {
  CLIENT_KEY_TO_INDUSTRY_CODE,
  CLIENT_KEY_TO_DB_NAME,
  DEFAULT_CLIENT_KEY,
  canonicalClientDisplayName,
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
// Isolation: locked account users ignore requested client ids and resolve
// from server-trusted session/cookie fallbacks. Admin + investor can switch
// via the top-nav dropdown.

export const ACTIVE_CLIENT_COOKIE = 'abarva_active_client';

const CLIENT_KEY_TO_DB_SLUGS: Record<ClientKey, string[]> = {
  meridian: ['meridian', 'meridian-health'],
  arcturus: ['arcturus', 'first-capital', 'first-capital-financial'],
  apexretail: ['apexretail', 'apex-retail'],
};

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

function resolvePinnedClientKey(session: SessionClientContext): ClientKey | null {
  return resolvePinnedSessionClientKey({
    clientId: session.clientId,
    defaultClientId: session.defaultClientId,
    email: session.email,
  });
}

export async function getActiveClientKey(requestedClientId?: string | null): Promise<ClientKey> {
  const session = await getSessionClientContext();
  const role = resolveSessionRole(session.role, session.email);
  const pinnedClientKey = resolvePinnedClientKey(session);

  // Real demo/client personas use tenant-specific email domains. Those
  // identities must stay pinned to exactly one client even when Clerk metadata
  // has an admin-ish role or an old active-client cookie exists from a prior
  // session. Cookie-first resolution here produced Meridian users with Apex
  // Setup chrome during the live Programs E2E crawl.
  if (pinnedClientKey) return pinnedClientKey;

  const isLockedRole = role === 'client' || role === 'maestro';

  // SEC-P1-2 / SEC-P1-6 fix (audit 2026-05-13):
  //
  // Locked-role users (client / maestro) MUST resolve from server-trusted
  // sources only — Clerk metadata pinning, the active-client cookie, or
  // email inference. They MUST NOT be re-bound by `requestedClientId`
  // (URL / body input), because that would let a misconfigured demo
  // account whose Clerk metadata pin is missing get pivoted to another
  // tenant by anyone who controls the request payload.
  //
  // Previously the order was: pinned → (locked + requestedClientId) →
  // (locked + cookie) → requestedClientId → cookie → metadata → email →
  // default. That second step honored URL input as authoritative for
  // locked roles whenever metadata pinning happened to be absent. The
  // new order, for locked roles, is: pinned → cookie → metadata
  // (clientId, defaultClientId) → email → default. `requestedClientId`
  // is ignored entirely.
  if (isLockedRole) {
    try {
      const store = await cookies();
      const fromCookie = store.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
      if (isClientKey(fromCookie)) return fromCookie;
    } catch {
      // cookies() fails outside request scope — fall through to default.
    }
    if (isClientKey(session.clientId)) return session.clientId;
    if (isClientKey(session.defaultClientId)) return session.defaultClientId;
    const inferred = inferClientKeyFromEmail(session.email);
    if (inferred) return inferred;
    return DEFAULT_CLIENT_KEY;
  }

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

  for (const tenantKey of [key, ...CLIENT_KEY_TO_DB_SLUGS[key]]) {
    const { data } = await sb
      .from('clients')
      .select('id, name, industry_code')
      .eq('tenant_key', tenantKey)
      .limit(1)
      .maybeSingle();
    if (data) {
      const row = data as { id: string; name: string; industry_code: string | null };
      return {
        id: row.id,
        name: canonicalClientDisplayName({ key, name: row.name }) ?? row.name,
        industry_code: row.industry_code?.trim() || CLIENT_KEY_TO_INDUSTRY_CODE[key],
        key,
      };
    }
  }

  for (const slug of CLIENT_KEY_TO_DB_SLUGS[key]) {
    const { data } = await sb
      .from('clients')
      .select('id, name, industry_code')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();
    if (data) {
      const row = data as { id: string; name: string; industry_code: string | null };
      return {
        id: row.id,
        name: canonicalClientDisplayName({ key, name: row.name }) ?? row.name,
        industry_code: row.industry_code?.trim() || CLIENT_KEY_TO_INDUSTRY_CODE[key],
        key,
      };
    }
  }

  const candidates = CLIENT_KEY_TO_DB_NAME[key];
  for (const candidate of candidates) {
    const { data } = await sb
      .from('clients')
      .select('id, name, industry_code')
      .ilike('name', candidate)
      .maybeSingle();
    if (data) {
      const row = data as { id: string; name: string; industry_code: string | null };
      return {
        id: row.id,
        name: canonicalClientDisplayName({ key, name: row.name }) ?? row.name,
        industry_code: row.industry_code?.trim() || CLIENT_KEY_TO_INDUSTRY_CODE[key],
        key,
      };
    }
  }
  for (const candidate of candidates) {
    const { data } = await sb
      .from('clients')
      .select('id, name, industry_code')
      .ilike('name', `${candidate}%`)
      .limit(1)
      .maybeSingle();
    if (data) {
      const row = data as { id: string; name: string; industry_code: string | null };
      return {
        id: row.id,
        name: canonicalClientDisplayName({ key, name: row.name }) ?? row.name,
        industry_code: row.industry_code?.trim() || CLIENT_KEY_TO_INDUSTRY_CODE[key],
        key,
      };
    }
  }
  return null;
}
