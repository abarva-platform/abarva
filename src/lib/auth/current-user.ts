import { auth } from '@clerk/nextjs/server';
import { resolveSessionRole } from '@/lib/auth/access-routing';
import { getCurrentPerson } from '@/lib/auth/maestro';
import { getServerSupabase } from '@/lib/supabase-server';

export type UserRole = 'maestro' | 'client_viewer' | 'observer';

export interface AccessibleClient {
  clientId: string;
  name: string;
  role: UserRole;
}

export interface CurrentUser {
  personId: string | null;
  // Clerk user id · always present for signed-in users. Used as a stable
  // userId fallback by tenancy resolvers when the Clerk account has no
  // linked `persons` row yet (common for demo / test accounts).
  clerkUserId: string;
  // Clerk publicMetadata.clientId · the tenant key pinned to the Clerk
  // session (e.g. `meridian`). Used as a client-access fallback when the
  // user has no rows in `person_client_memberships`.
  metadataClientKey: string | null;
  name: string;
  email: string | null;
  primaryRole: UserRole;
  accessibleClients: AccessibleClient[];
  defaultClientId: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const claims = sessionClaims as
    | {
        publicMetadata?: { person_id?: string; role?: string; clientId?: string };
        email_addresses?: Array<{ emailAddress: string }>;
        emailAddresses?: Array<{ emailAddress: string }>;
        email?: string;
        firstName?: string;
        lastName?: string;
        emailAddress?: string;
      }
    | undefined;

  const personIdFromClaims = claims?.publicMetadata?.person_id ?? null;
  const fallbackEmail =
    claims?.emailAddress ??
    claims?.email ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    null;
  const legacyRole = resolveSessionRole(claims?.publicMetadata?.role ?? null, fallbackEmail);
  const metadataClientKey = claims?.publicMetadata?.clientId ?? null;
  const fallbackName =
    [claims?.firstName, claims?.lastName].filter(Boolean).join(' ') ||
    claims?.emailAddress ||
    'User';
  const resolvedPerson = personIdFromClaims ? null : await getCurrentPerson();
  const personId = personIdFromClaims ?? resolvedPerson?.id ?? null;

  if (!personId) {
    // No linked persons row yet. Best-effort fallback based on legacy Clerk role.
    // Demo/test Clerk users routinely hit this path — they are signed in and
    // scoped to a clientId via publicMetadata, but the graph's `persons` table
    // has no matching row. The tenancy resolvers still treat them as
    // authenticated and scope their client via Clerk metadata.
    const role: UserRole = legacyRole === 'maestro' || legacyRole === 'admin' || legacyRole === 'investor'
      ? 'maestro'
      : 'client_viewer';
    return {
      personId: null,
      clerkUserId: userId,
      metadataClientKey,
      name: fallbackName,
      email: fallbackEmail,
      primaryRole: role,
      accessibleClients: [],
      defaultClientId: null,
    };
  }

  const sb = getServerSupabase();

  const { data: person } = await sb
    .from('persons')
    .select('id, name, email, primary_role')
    .eq('id', personId)
    .maybeSingle();

  const primaryRole: UserRole = ((person as { primary_role?: UserRole } | null)?.primary_role
    ?? (legacyRole === 'maestro' || legacyRole === 'admin' || legacyRole === 'investor'
      ? 'maestro'
      : 'client_viewer')) as UserRole;

  let accessibleClients: AccessibleClient[] = [];

  if (primaryRole === 'maestro') {
    const { data: allClients } = await sb.from('clients').select('id, name').order('name');
    accessibleClients = ((allClients as Array<{ id: string; name: string }> | null) ?? []).map((c) => ({
      clientId: c.id,
      name: c.name,
      role: 'maestro',
    }));
  } else {
    const { data: memberships } = await sb
      .from('person_client_memberships')
      .select('role, client:clients(id, name)')
      .eq('person_id', personId);
    accessibleClients = ((memberships as Array<{ role: UserRole; client: { id: string; name: string } | null }> | null)
      ?? [])
      .filter((m) => m.client)
      .map((m) => ({ clientId: m.client!.id, name: m.client!.name, role: m.role }));
  }

  const defaultClientId = accessibleClients[0]?.clientId ?? null;

  return {
    personId: (person as { id?: string } | null)?.id ?? resolvedPerson?.id ?? personId,
    clerkUserId: userId,
    metadataClientKey,
    name: (person as { name?: string } | null)?.name ?? resolvedPerson?.name ?? fallbackName,
    email: (person as { email?: string | null } | null)?.email ?? resolvedPerson?.email ?? fallbackEmail,
    primaryRole,
    accessibleClients,
    defaultClientId,
  };
}

export function userCanAccessClient(user: CurrentUser | null, clientId: string | null): boolean {
  if (!user || !clientId) return false;
  if (user.primaryRole === 'maestro') return true;
  return user.accessibleClients.some((c) => c.clientId === clientId);
}
