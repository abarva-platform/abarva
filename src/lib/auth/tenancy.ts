import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentPerson } from "@/lib/auth/maestro";
import { ensureOperatorPersonProvisioned } from "@/lib/auth/operator-persona-provisioning";
import type { TenancyCtx } from "@/lib/programs/types.db";

export class TenancyError extends Error {
  constructor(public readonly code: "unauthenticated" | "no_client") {
    super(code);
  }
}

export async function requireTenancy(): Promise<TenancyCtx> {
  // Auth helpers (Clerk) can throw on missing/invalid session rather than returning null.
  const [person, user] = await Promise.all([
    getCurrentPerson(),
    getCurrentUser(),
  ]).catch(() => {
    throw new TenancyError("unauthenticated");
  });
  const userId =
    person?.id ??
    user?.personId ??
    (user?.clerkUserId ? `clerk:${user.clerkUserId}` : null);
  if (!userId) throw new TenancyError("unauthenticated");
  const client = await getActiveClientRow();
  if (!client) throw new TenancyError("no_client");

  // Operator/demo personas can authenticate via Clerk metadata without a graph
  // `persons` row, leaving userId as a non-UUID "clerk:<id>" fallback — which
  // breaks uuid-typed actor writes (e.g. the Move phase-advance approver) and
  // role/access resolution. JIT-provision the identity rows (persons + ONE
  // membership) for the single active canonical tenant so userId is always a real
  // UUID. Identity-only and fail-safe: on any failure we keep the clerk fallback
  // and the downstream "operator person row required" safe error.
  let resolvedUserId = userId;
  let resolvedRole = person?.role ?? user?.primaryRole ?? undefined;
  if (userId.startsWith("clerk:") && user?.clerkUserId) {
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
    if (provisioned) {
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
    return Response.json(
      { error: "no_client", detail: "No active client for this user" },
      { status: 403 },
    );
  }
  throw err;
}
