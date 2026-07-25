// POST /api/v1/source/:eventId/vendor-proposals/facts/:factId/accept
//
// Body: { rationale: string }
//
// Accept one candidate VendorProposalFact as authoritative. If the fact
// declares supersedesFactId (set automatically at ingest time when a new
// candidate shares the same vendor+factKey as an already-accepted fact),
// this ALSO writes a 'superseded' review row for the fact it replaces —
// atomically, in the same repository call. Never mutates either fact's own
// row; both remain in the append-only ledger with full lineage.
//
// Auth: requireTenancy + canApproveSourceStages — the same stronger
// permission the artifact-accept route uses (Source integrity fix,
// 2026-07-23): accepting a fact as authoritative is a stronger claim than
// uploading the proposal it came from.

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import { acceptVendorProposalFact } from "@/lib/source/vendor-proposals/vendor-proposal-facts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string; factId: string }> };

function jsonError(status: number, code: string, detail?: string): Response {
  return Response.json(
    { ok: false, error: code, ...(detail ? { detail } : {}) },
    { status },
  );
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function POST(request: Request, { params }: RouteCtx) {
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId, factId } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

    const body = (await request.json().catch(() => null)) as {
      rationale?: unknown;
    } | null;
    const rationale =
      typeof body?.rationale === "string" ? body.rationale.trim() : "";
    if (!rationale) {
      return jsonError(400, "bad_request", "rationale is required.");
    }

    const supabase = getAzureReadFluentClient();
    const { data: persistedEvent, error: fetchError } = isUuid(eventId)
      ? await supabase
          .from("source_events")
          .select("id, client_key")
          .eq("id", eventId)
          .maybeSingle()
      : { data: null, error: null };
    if (fetchError) return jsonError(500, "lookup_failed", fetchError.message);
    if (!persistedEvent) {
      return jsonError(404, "not_found", `No source event with id ${eventId}`);
    }

    const fallbackClientKey =
      (isClientKey(currentUser?.metadataClientKey)
        ? currentUser.metadataClientKey
        : null) ?? inferClientKeyFromEmail(currentUser?.email);
    const effectiveClientKey = activeClient?.key ?? fallbackClientKey;
    if (!effectiveClientKey) {
      if (tenancyError) return tenancyErrorResponse(tenancyError);
      return jsonError(403, "no_client");
    }
    if (persistedEvent.client_key !== effectiveClientKey) {
      return jsonError(404, "not_found", `No source event with id ${eventId}`);
    }

    const accessPolicy =
      tenancy && activeClient
        ? await loadUserSourceAccessPolicy(tenancy, {
            activeClientKey: activeClient.key,
            sourceEventId: persistedEvent.id,
          }).catch(() => null)
        : null;
    const canonicalAdminFallbackAllowed =
      !activeClient &&
      isCanonicalClientAdminEmail(currentUser?.email) &&
      persistedEvent.client_key === effectiveClientKey;
    const canMutate = Boolean(
      accessPolicy?.canApproveSourceStages || canonicalAdminFallbackAllowed,
    );
    if (!canMutate) {
      return jsonError(
        403,
        "forbidden",
        "Stage-approval rights are required to accept a vendor proposal fact as authoritative.",
      );
    }

    const result = await acceptVendorProposalFact({
      factId,
      eventId: persistedEvent.id,
      clientKey: effectiveClientKey,
      rationale,
      reviewedBy: tenancy?.userId ?? currentUser?.clerkUserId ?? "unknown",
    });
    if (!result.ok) {
      const status = result.error === "fact_not_found" ? 404 : 500;
      return jsonError(status, result.error);
    }

    return Response.json({ ok: true, review: result.record });
  } catch (err) {
    console.error(
      "[POST /api/v1/source/:eventId/vendor-proposals/facts/:factId/accept]",
      err,
    );
    return jsonError(500, "internal_error");
  }
}
