import { getAzureReadFluentClient } from '@/lib/data-plane/postgresCompat';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { resolveSessionRole } from '@/lib/auth/access-routing';
import { getCurrentPerson } from '@/lib/auth/maestro';
import type { ClientKey } from '@/lib/client-config';
import { appClientKeyForTenant } from '@/lib/tenant/aliases';

export type UserRole = 'maestro' | 'client_viewer' | 'observer';

export interface AccessibleClient {
  // UUID from the clients table. Keep this for data-plane joins and policy
  // checks that scope by client_id.
  clientId: string;
  // App tenant key (for example, "meridian"). Tenant route guards compare
  // against this value; clientId is a UUID in production membership rows.
  clientKey: ClientKey | null;
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
  metadataClientKey: ClientKey | null;
  name: string;
  email: string | null;
  primaryRole: UserRole;
  accessibleClients: AccessibleClient[];
  defaultClientId: ClientKey | null;
}

interface ClientMembershipClientRow {
  id: string;
  name: string;
  tenant_key?: string | null;
  slug?: string | null;
}

function clientKeyForRow(client: Pick<ClientMembershipClientRow, 'tenant_key' | 'slug' | 'name'>): ClientKey | null {
  return (
    appClientKeyForTenant(client.tenant_key) ??
    appClientKeyForTenant(client.slug) ??
    appClientKeyForTenant(client.name)
  );
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
  const claimEmail =
    claims?.emailAddress ??
    claims?.email ??
    claims?.emailAddresses?.[0]?.emailAddress ??
    claims?.email_addresses?.[0]?.emailAddress ??
    null;
  // Clerk session JWTs do not always include an email claim. For demo
  // /clerk_test accounts in particular, the JWT payload often only carries
  // the `sub` (Clerk user id) and publicMetadata. When that happens, the
  // email-based tenant inference in tenant-access.ts cannot fire and
  // signed-in users hit a 403 even on their own tenant. Fall through to
  // Clerk's authoritative user record to recover the email.
  let fallbackEmail = claimEmail;
  if (!fallbackEmail) {
    try {
      const clerkUser = await clerkCurrentUser();
      fallbackEmail =
        clerkUser?.primaryEmailAddress?.emailAddress
        ?? clerkUser?.emailAddresses?.[0]?.emailAddress
        ?? null;
    } catch {
      // Clerk currentUser may throw outside a request context. Leave email
      // null — downstream code will treat the user as un-emailed and fall
      // back to publicMetadata.clientId.
    }
  }
  const legacyRole = resolveSessionRole(claims?.publicMetadata?.role ?? null, fallbackEmail);
  const metadataClientKey = appClientKeyForTenant(claims?.publicMetadata?.clientId);
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

  const sb = getAzureReadFluentClient();

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
    const { data: allClients } = await sb.from('clients').select('id, name, tenant_key, slug').order('name');
    accessibleClients = ((allClients as ClientMembershipClientRow[] | null) ?? []).map((c) => ({
      clientId: c.id,
      clientKey: clientKeyForRow(c),
      name: c.name,
      role: 'maestro',
    }));
  } else {
    const { data: memberships } = await sb
      .from('person_client_memberships')
      .select('role, client:clients(id, name, tenant_key, slug)')
      .eq('person_id', personId);
    accessibleClients = ((memberships as Array<{ role: UserRole; client: ClientMembershipClientRow | null }> | null)
      ?? [])
      .filter((m) => m.client)
      .map((m) => ({
        clientId: m.client!.id,
        clientKey: clientKeyForRow(m.client!),
        name: m.client!.name,
        role: m.role,
      }));
  }

  const defaultClientId = accessibleClients.find((client) => client.clientKey)?.clientKey ?? null;

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
  return user.accessibleClients.some((c) => c.clientId === clientId || c.clientKey === clientId);
}
