// GET /api/v1/source/:eventId/vendor-proposals/:vendorKey/facts?status=candidate|accepted|rejected|superseded
//
// The review queue: every fact extracted for this event+vendor, with its
// derived current status attached. Facts with no review row are
// 'candidate'. Filter with ?status=; omit to see all four states at once
// (a review UI needs to show what's already been decided, not just the
// queue). Read-only — no permission beyond ordinary Source read access is
// required (matches the evidence-state read routes, not the mutating
// accept/reject routes below).

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { inferClientKeyFromEmail, isClientKey } from "@/lib/client-config";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  deriveVendorProposalFactStatus,
  getLatestVendorProposalFactReviewsByFactIds,
  listVendorProposalFacts,
} from "@/lib/source/vendor-proposals/vendor-proposal-facts";
import type { VendorProposalFactCurrentStatus } from "@/lib/source/vendor-proposals/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = {
  params: Promise<{ eventId: string; vendorKey: string }>;
};

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

const VALID_STATUSES: VendorProposalFactCurrentStatus[] = [
  "candidate",
  "accepted",
  "rejected",
  "superseded",
];

export async function GET(request: Request, { params }: RouteCtx) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>> | undefined;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  try {
    const { eventId, vendorKey } = await params;
    const [activeClient, currentUser] = await Promise.all([
      getActiveClientRow().catch(() => null),
      getCurrentUser().catch(() => null),
    ]);

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

    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get("status");
    const statusFilter =
      requestedStatus && (VALID_STATUSES as string[]).includes(requestedStatus)
        ? (requestedStatus as VendorProposalFactCurrentStatus)
        : null;

    const identity = {
      tenantKey: effectiveClientKey,
      role: tenancy?.role ?? "member",
      userId: tenancy?.userId ?? currentUser?.clerkUserId ?? "unknown",
    };
    const facts = await listVendorProposalFacts(identity, {
      eventId: persistedEvent.id,
      vendorKey,
    });
    const reviews = await getLatestVendorProposalFactReviewsByFactIds(
      identity,
      facts.map((f) => f.id),
    );

    const withStatus = facts.map((fact) => ({
      ...fact,
      status: deriveVendorProposalFactStatus(reviews.get(fact.id)),
    }));
    const filtered = statusFilter
      ? withStatus.filter((f) => f.status === statusFilter)
      : withStatus;

    return Response.json({ ok: true, facts: filtered });
  } catch (err) {
    console.error(
      "[GET /api/v1/source/:eventId/vendor-proposals/:vendorKey/facts]",
      err,
    );
    return jsonError(500, "internal_error");
  }
}
