import type { NextRequest } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "../../../../_intel-auth";
import { getActiveClientRow } from "@/lib/active-client";
import { getSourcingEvent } from "@/lib/source/queries";
import {
  buildContractOptimizationBriefMarkdown,
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
} from "@/lib/source/contract-optimization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ eventId?: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  try {
    await requireTenancy();
    const { eventId } = await params;
    if (!eventId) {
      return Response.json({ ok: false, error: "missing_event" }, { status: 400 });
    }
    const [event, activeClient] = await Promise.all([
      getSourcingEvent(eventId),
      getActiveClientRow().catch(() => null),
    ]);
    if (!event) {
      return Response.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    if (
      !shouldBindSkyHarborContractOptimization({
        activeClientKey: activeClient?.key,
        eventCode: event.code,
        eventName: event.name,
      })
    ) {
      return Response.json(
        {
          ok: false,
          error: "not_available",
          detail:
            "No existing-contract optimization profile is available for this Source event.",
        },
        { status: 404 },
      );
    }
    const profile = buildContractOptimizationMveProfile(
      buildSkyHarborAmsExistingContractInput({
        sourceEventId: event.id,
        tenantKey: activeClient?.key ?? "skyharbor-air",
      }),
    );
    const markdown = buildContractOptimizationBriefMarkdown(profile);
    return new Response(markdown, {
      status: 200,
      headers: {
        "content-type": "text/markdown; charset=utf-8",
        "content-disposition":
          'attachment; filename="skyharbor-ams-contract-optimization-brief.md"',
      },
    });
  } catch (error) {
    try {
      return tenancyErrorResponse(error);
    } catch {
      return Response.json(
        {
          ok: false,
          error: "internal_error",
          detail:
            error instanceof Error
              ? error.message
              : "Unknown Source contract optimization brief error",
        },
        { status: 500 },
      );
    }
  }
}

function shouldBindSkyHarborContractOptimization(args: {
  activeClientKey?: string | null;
  eventCode: string;
  eventName: string;
}): boolean {
  if (args.activeClientKey !== "skyharbor-air") return false;
  const text = `${args.eventCode} ${args.eventName}`.toLowerCase();
  return (
    text.includes("ams") ||
    text.includes("application managed") ||
    text.includes("contract") ||
    text.includes("outsourcing") ||
    text.includes("renewal")
  );
}
