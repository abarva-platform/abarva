import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { auth, currentUser as clerkCurrentUser } from "@clerk/nextjs/server";
import { resolveSessionRole } from "@/lib/auth/access-routing";
import { getCurrentPerson } from "@/lib/auth/maestro";
import {
  PRIVATE_BROWSER_PROOF_SESSION_COOKIE,
  readPrivateBrowserProofSessionValue,
} from "@/lib/auth/private-browser-proof-session";
import { cookies } from "next/headers";

export type UserRole = "maestro" | "client_viewer" | "observer";

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
  tenantRoles: Record<string, string>;
  name: string;
  email: string | null;
  primaryRole: UserRole;
  accessibleClients: AccessibleClient[];
  defaultClientId: string | null;
}

function normalizeTenantRoles(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const roles: Record<string, string> = {};
  for (const [key, role] of Object.entries(value as Record<string, unknown>)) {
    if (typeof role === "string" && role.trim().length > 0) {
      roles[key] = role;
    }
  }
  return roles;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const store = await cookies();
    const proofSession = await readPrivateBrowserProofSessionValue(
      store.get(PRIVATE_BROWSER_PROOF_SESSION_COOKIE)?.value,
    );
    if (proofSession) {
      return {
        personId: "00000000-0000-4000-8000-000000000101",
        clerkUserId: `private-proof:${proofSession.email}`,
        metadataClientKey: proofSession.clientId,
        tenantRoles: proofSession.tenantRoles,
        name: `${proofSession.tenantName} Proof Viewer`,
        email: proofSession.email,
        primaryRole: "client_viewer",
        accessibleClients: [],
        defaultClientId: proofSession.clientId,
      };
    }
  } catch {
    // Fall through to Clerk.
  }

  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const claims = sessionClaims as
    | {
        publicMetadata?: {
          person_id?: string;
          role?: string;
          clientId?: string;
          tenantRoles?: unknown;
        };
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
        clerkUser?.primaryEmailAddress?.emailAddress ??
        clerkUser?.emailAddresses?.[0]?.emailAddress ??
        null;
    } catch {
      // Clerk currentUser may throw outside a request context. Leave email
      // null — downstream code will treat the user as un-emailed and fall
      // back to publicMetadata.clientId.
    }
  }
  const legacyRole = resolveSessionRole(
    claims?.publicMetadata?.role ?? null,
    fallbackEmail,
  );
  const metadataClientKey = claims?.publicMetadata?.clientId ?? null;
  let tenantRoles = normalizeTenantRoles(claims?.publicMetadata?.tenantRoles);
  if (Object.keys(tenantRoles).length === 0) {
    try {
      const clerkUser = await clerkCurrentUser();
      tenantRoles = normalizeTenantRoles(
        clerkUser?.publicMetadata?.tenantRoles,
      );
    } catch {
      tenantRoles = {};
    }
  }
  const fallbackName =
    [claims?.firstName, claims?.lastName].filter(Boolean).join(" ") ||
    claims?.emailAddress ||
    "User";
  const resolvedPerson = personIdFromClaims ? null : await getCurrentPerson();
  const personId = personIdFromClaims ?? resolvedPerson?.id ?? null;

  if (!personId) {
    // No linked persons row yet. Best-effort fallback based on legacy Clerk role.
    // Demo/test Clerk users routinely hit this path — they are signed in and
    // scoped to a clientId via publicMetadata, but the graph's `persons` table
    // has no matching row. The tenancy resolvers still treat them as
    // authenticated and scope their client via Clerk metadata.
    const role: UserRole =
      legacyRole === "maestro" ||
      legacyRole === "admin" ||
      legacyRole === "investor"
        ? "maestro"
        : "client_viewer";
    return {
      personId: null,
      clerkUserId: userId,
      metadataClientKey,
      tenantRoles,
      name: fallbackName,
      email: fallbackEmail,
      primaryRole: role,
      accessibleClients: [],
      defaultClientId: null,
    };
  }

  const sb = getAzureReadFluentClient();

  const { data: person } = await sb
    .from("persons")
    .select("id, name, email, primary_role")
    .eq("id", personId)
    .maybeSingle();

  const primaryRole: UserRole = ((person as { primary_role?: UserRole } | null)
    ?.primary_role ??
    (legacyRole === "maestro" ||
    legacyRole === "admin" ||
    legacyRole === "investor"
      ? "maestro"
      : "client_viewer")) as UserRole;

  let accessibleClients: AccessibleClient[] = [];

  if (primaryRole === "maestro") {
    const { data: allClients } = await sb
      .from("clients")
      .select("id, name")
      .order("name");
    accessibleClients = (
      (allClients as Array<{ id: string; name: string }> | null) ?? []
    ).map((c) => ({
      clientId: c.id,
      name: c.name,
      role: "maestro",
    }));
  } else {
    const { data: memberships } = await sb
      .from("person_client_memberships")
      .select("role, client:clients(id, name)")
      .eq("person_id", personId);
    accessibleClients = (
      (memberships as Array<{
        role: UserRole;
        client: { id: string; name: string } | null;
      }> | null) ?? []
    )
      .filter((m) => m.client)
      .map((m) => ({
        clientId: m.client!.id,
        name: m.client!.name,
        role: m.role,
      }));
  }

  const defaultClientId = accessibleClients[0]?.clientId ?? null;

  return {
    personId:
      (person as { id?: string } | null)?.id ?? resolvedPerson?.id ?? personId,
    clerkUserId: userId,
    metadataClientKey,
    tenantRoles,
    name:
      (person as { name?: string } | null)?.name ??
      resolvedPerson?.name ??
      fallbackName,
    email:
      (person as { email?: string | null } | null)?.email ??
      resolvedPerson?.email ??
      fallbackEmail,
    primaryRole,
    accessibleClients,
    defaultClientId,
  };
}

export function userCanAccessClient(
  user: CurrentUser | null,
  clientId: string | null,
): boolean {
  if (!user || !clientId) return false;
  if (user.primaryRole === "maestro") return true;
  return user.accessibleClients.some((c) => c.clientId === clientId);
}
