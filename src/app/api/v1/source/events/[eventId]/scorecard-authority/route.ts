import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getSourcingEventForResolvedClient } from "@/lib/source/queries";
import { buildScorecardAuthorityView } from "@/lib/source/proposal-intelligence/scorecard-authority";
import { readSourceScorecardAuthorityRecords } from "@/lib/source/proposal-intelligence/scorecard-authority-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteCtx = { params: Promise<{ eventId: string }> };

export async function GET(_request: NextRequest, { params }: RouteCtx) {
  let tenancy: Awaited<ReturnType<typeof requireTenancy>>;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  if (!activeClient) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const { eventId } = await params;
  const event = await getSourcingEventForResolvedClient(eventId, {
    activeClientKey: activeClient.key,
    activeClientName: activeClient.name ?? activeClient.key,
    tenancy,
  }).catch(() => null);
  if (!event || event.id !== eventId) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const records = await readSourceScorecardAuthorityRecords(
    eventId,
    activeClient.key,
  );
  if (records.kind === "unavailable") {
    return Response.json(
      { error: "authority_unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      eventId,
      clientKey: activeClient.key,
      authority: buildScorecardAuthorityView({
        tenantKey: activeClient.key,
        sourceEventId: eventId,
        criteria: records.criteria,
        scores: records.scores,
      }),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
