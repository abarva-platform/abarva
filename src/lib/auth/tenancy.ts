import {
  getActiveClientRow,
  TenantLookupUnavailableError,
} from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentPerson } from "@/lib/auth/maestro";
import { ensureOperatorPersonProvisioned } from "@/lib/auth/operator-persona-provisioning";
import { checkTenantAccessByKey } from "@/lib/auth/tenant-access";
import { resolveClientRow, resolveTenant } from "@/lib/tenant/resolveTenant";
import { getClientOption, type ClientKey } from "@/lib/client-config";
import type { TenancyCtx } from "@/lib/programs/types.db";

export class TenancyError extends Error {
  constructor(
    public readonly code:
      | "unauthenticated"
      | "no_client"
      | "forbidden"
      | "tenant_lookup_unavailable",
  ) {
    super(code);
  }
}

function isUuidLike(value: string | null | undefined): value is string {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value ?? "",
  );
}

export async function requireTenancy(
  input: { requestedClientKey?: ClientKey } = {},
): Promise<TenancyCtx> {
  // Auth helpers (Clerk) can throw on missing/invalid session rather than returning null.
  const [person, user] = await Promise.all([
    getCurrentPerson().catch(() => null),
    getCurrentUser().catch(() => null),
  ]);
  const userId =
    (isUuidLike(person?.id) ? person?.id : null) ??
    (isUuidLike(user?.personId) ? user?.personId : null) ??
    (user?.clerkUserId ? `clerk:${user.clerkUserId}` : null);
  if (!userId) throw new TenancyError("unauthenticated");
  // Fix B: distinguish a retryable tenant-lookup outage from a real "no client". A DB blip
  // now throws TenantLookupUnavailableError (instead of collapsing to null), which we map to
  // a distinct 503 below rather than a misleading `no_client` 403.
  let client: Awaited<ReturnType<typeof getActiveClientRow>>;
  try {
    if (input.requestedClientKey) {
      const access = await checkTenantAccessByKey(input.requestedClientKey);
      if (!access.ok) {
        throw new TenancyError(
          access.reason === "unauthenticated" ? "unauthenticated" : "forbidden",
        );
      }
      const row = await resolveClientRow(input.requestedClientKey);
      client = row
        ? {
            ...row,
            name: row.name ?? getClientOption(input.requestedClientKey).name,
            key: input.requestedClientKey,
          }
        : null;
    } else {
      client = await getActiveClientRow();
    }
  } catch (error) {
    if (error instanceof TenancyError) throw error;
    if (error instanceof TenantLookupUnavailableError || input.requestedClientKey) {
      throw new TenancyError("tenant_lookup_unavailable");
    }
    throw error;
  }
  if (!client && !input.requestedClientKey && user?.clerkUserId.startsWith("private-proof:")) {
    const tenant = await resolveTenant();
    client = {
      id: "00000000-0000-4000-8000-000000000102",
      key: tenant.appClientKey,
      name: tenant.displayName,
      industry_code: tenant.industryCode,
    };
  }
  if (!client) throw new TenancyError("no_client");

  // Authenticated operator personas may have no person row or an existing row
  // whose placeholder name predates the governed-review identity contract.
  // Reconcile both through the same idempotent, canonical-tenant provisioner.
  // Identity-only and fail-safe: on any failure we keep the resolved identity and
  // the downstream "operator person row required" safe error.
  let resolvedUserId = userId;
  let resolvedRole = person?.role ?? user?.primaryRole ?? undefined;
  if (
    user?.clerkUserId &&
    !user.clerkUserId.startsWith("private-proof:")
  ) {
    const provisioned = await ensureOperatorPersonProvisioned({
      clerkUserId: user.clerkUserId,
      email: user.email ?? null,
      name: user.name ?? null,
      clerkRole: user.primaryRole ?? null,
      tenantRoles: user.tenantRoles ?? null,
      clientId: client.id,
      clientKey: client.key,
      clientName: (client as { name?: string | null }).name ?? null,
    });
    if (provisioned && isUuidLike(provisioned.personId)) {
      resolvedUserId = provisioned.personId;
      resolvedRole = provisioned.role;
    }
  }

  return {
    clientId: client.id,
    clientKey: client.key,
    userId: resolvedUserId,
    clerkUserId: user?.clerkUserId,
    tenantRole: client.key ? (user?.tenantRoles?.[client.key] ?? null) : null,
    role: resolvedRole,
    email: user?.email ?? person?.email ?? null,
  };
}

export function tenancyErrorResponse(err: unknown): Response {
  if (err instanceof TenancyError) {
    if (err.code === "unauthenticated") {
      return Response.json({ error: "unauthenticated" }, { status: 401 });
    }
    if (err.code === "tenant_lookup_unavailable") {
      // Retryable: the tenant lookup hit a DB/infra failure, not a missing client. 503 so
      // clients back off and retry instead of treating it as a hard "no client" 403.
      return Response.json(
        {
          error: "tenant_lookup_unavailable",
          detail: "Tenant lookup is temporarily unavailable. Retry shortly.",
        },
        { status: 503 },
      );
    }
    if (err.code === "forbidden") {
      return Response.json({ error: "forbidden" }, { status: 403 });
    }
    return Response.json(
      { error: "no_client", detail: "No active client for this user" },
      { status: 403 },
    );
  }
  throw err;
}
