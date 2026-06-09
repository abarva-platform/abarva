// =============================================================================
// Operator-persona JIT identity provisioning
// -----------------------------------------------------------------------------
// IDENTITY-GRAPH ONLY. Some operator/demo personas exist as Clerk identities
// (publicMetadata.role/tenantRoles) but have NO `persons` row, so requireTenancy
// resolves ctx.userId = "clerk:<id>" (a non-UUID string). That breaks every
// write into a uuid-typed actor column (e.g. the Move phase-advance approver) and
// makes role/access resolve wrong. This module creates the missing identity rows
// JIT, so ctx.userId is always a real persons.id UUID.
//
// HARD BOUNDARIES (do not violate — see feedback_operator_persona_provisioning):
//  - Writes ONLY identity rows: `persons` + ONE `person_client_memberships` + an
//    audit row. NEVER touches context/corpus facts (those load via the governed
//    Admin path only).
//  - ONE login -> exactly ONE tenant. Exactly one membership, for the single
//    active canonical client. No tenant switcher, no multi-client, no cross-tenant
//    grant. If the tenant is not a single CANONICAL_TENANTS entry -> refuse (null).
//  - Idempotent (dedupe persons by email; membership by person_id+client_id) and
//    audited.
//  - FAIL-SAFE: any error returns null; the caller keeps its existing behavior
//    (the safe "operator person row required" path). This never throws.
// =============================================================================

import "server-only";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import { createPerson } from "@/lib/db/person";
import { CANONICAL_TENANT_KEYS } from "@/config/tenants/CANONICAL_TENANTS";
import { canonicalTenantKey } from "@/lib/tenant-keys";

export interface ProvisionInput {
  clerkUserId: string;
  email: string | null;
  name: string | null;
  clerkRole: string | null; // publicMetadata.role
  tenantRoles?: Record<string, string> | null; // publicMetadata.tenantRoles
  clientId: string; // resolved clients.id (uuid) for the active tenant
  clientKey: string; // active tenant key (must be canonical)
  clientName?: string | null;
}

export interface ProvisionResult {
  personId: string;
  role: "maestro" | "client_viewer";
  accessLevel: "client_admin" | "program_viewer";
}

function isCanonical(key: string | null | undefined): boolean {
  return !!key && (CANONICAL_TENANT_KEYS as readonly string[]).includes(key);
}

function deriveIsAdmin(input: ProvisionInput, canonicalKey: string): boolean {
  const r = (input.clerkRole ?? "").toLowerCase();
  if (r === "maestro" || r === "admin") return true;
  // tenantRoles may be keyed by the app-form key ("skyharbor") or the canonical
  // form ("skyharbor-air"); accept either.
  const tr =
    input.tenantRoles?.[input.clientKey] ?? input.tenantRoles?.[canonicalKey];
  return tr === "tenant_admin" || tr === "admin";
}

/**
 * Ensure the persona has a persons row + one membership for the active canonical
 * tenant. Returns the real persons.id (+ derived role), or null if it cannot be
 * provisioned safely (non-canonical tenant, missing email, or any error).
 */
export async function ensureOperatorPersonProvisioned(
  input: ProvisionInput,
): Promise<ProvisionResult | null> {
  try {
    // Single-tenant, canonical-only. The active tenant key may arrive in app
    // form ("skyharbor") while CANONICAL_TENANT_KEYS holds the dashed canonical
    // form ("skyharbor-air"); normalize before the guard so a real canonical
    // tenant in either form is accepted, and a truly unknown tenant is refused.
    const canonicalKey = canonicalTenantKey(input.clientKey);
    if (!isCanonical(canonicalKey)) return null;
    const email = input.email?.trim().toLowerCase();
    if (!email) return null; // email is our idempotency key — no email, no provision
    if (!input.clientId) return null;

    const isAdmin = deriveIsAdmin(input, canonicalKey);
    const primaryRole: ProvisionResult["role"] = isAdmin
      ? "maestro"
      : "client_viewer";
    const accessLevel: ProvisionResult["accessLevel"] = isAdmin
      ? "client_admin"
      : "program_viewer";

    const sb = getAzureWriteFluentClient();

    // 1) persons — dedupe by email (idempotent).
    const { data: existing } = await sb
      .from("persons")
      .select("id, primary_role")
      .eq("email", email)
      .maybeSingle();

    let personId: string;
    if (existing?.id) {
      personId = existing.id as string;
      // Repair role only upward to admin if Clerk says admin (never downgrade).
      if (isAdmin && existing.primary_role !== "maestro") {
        await sb
          .from("persons")
          .update({ primary_role: "maestro" })
          .eq("id", personId);
      }
    } else {
      const created = await createPerson({
        name: input.name?.trim() || email,
        email,
        role: primaryRole,
        organization: input.clientName ?? input.clientKey,
      });
      personId = created.id;
      // Ensure primary_role is set (createPerson may default it).
      await sb
        .from("persons")
        .update({ primary_role: primaryRole })
        .eq("id", personId);
    }

    // 2) person_client_memberships — exactly ONE, for the single active tenant.
    const { data: membership } = await sb
      .from("person_client_memberships")
      .select("id")
      .eq("person_id", personId)
      .eq("client_id", input.clientId)
      .maybeSingle();
    if (!membership?.id) {
      await sb.from("person_client_memberships").insert({
        person_id: personId,
        client_id: input.clientId,
        role: primaryRole,
        access_level: accessLevel,
        financial_visibility: isAdmin,
      });
    }

    // 3) audit (best-effort; never fatal).
    try {
      await sb.from("audit_log").insert({
        action: "operator_persona.provisioned",
        target_table: "persons",
        target_id: personId,
        actor: input.clerkUserId,
        client_id: input.clientId,
        detail: {
          email,
          clientKey: input.clientKey,
          accessLevel,
          primaryRole,
          source: "jit_requireTenancy",
        },
      });
    } catch {
      // audit table shape may differ; do not fail provisioning on audit.
    }

    return { personId, role: primaryRole, accessLevel };
  } catch {
    // Fail-safe: caller keeps the existing clerk-fallback + safe-error behavior.
    return null;
  }
}
