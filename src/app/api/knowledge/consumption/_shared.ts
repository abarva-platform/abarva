/**
 * Shared plumbing for the governed consumption API. Every route:
 *  - runs on nodejs, force-dynamic, no-store;
 *  - authenticates + resolves the tenant SERVER-SIDE via requireTenancy();
 *  - NEVER trusts a browser-supplied tenant key — the body's tenantKey is
 *    overwritten with the session-resolved canonical key;
 *  - returns a ConsumptionEnvelope (or the typed tenancy error response).
 */

import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { canonicalTenantKey } from "@/lib/tenant/aliases";
import { getConsumptionReader, ConsumptionReader } from "@/lib/knowledge/consumption-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export interface ConsumptionContext {
  reader: ConsumptionReader;
  /** Session-resolved canonical tenant key (e.g. "airline-demo-new"). */
  tenantKey: string;
  body: Record<string, unknown>;
}

/**
 * Run a consumption handler with tenancy resolved. The handler receives the
 * reader + the trusted canonical tenantKey + the parsed body.
 */
export async function handleConsumption(
  req: NextRequest,
  fn: (ctx: ConsumptionContext) => Promise<unknown>,
): Promise<Response> {
  let tenantKey: string;
  try {
    const ctx = await requireTenancy();
    // Canonical key from the authenticated session — the only trusted source.
    tenantKey = canonicalTenantKey(ctx.clientKey ?? "");
    if (!tenantKey) throw new Error("no_client");
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json({ error: "unauthenticated" }, { status: 401 });
    }
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    body = {};
  }

  try {
    const reader = getConsumptionReader();
    const envelope = await fn({ reader, tenantKey, body });
    return Response.json(envelope, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return Response.json(
      { error: "consumption_read_failed", detail: String((err as Error)?.message ?? err) },
      { status: 500 },
    );
  }
}
