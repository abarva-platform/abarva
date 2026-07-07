import { NextRequest } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  contextCorpusExplorerDisabledResponse,
  isContextCorpusExplorerEnabled,
} from "@/lib/intelligence/context-explorer-access";
import { recordQaAudit, routeQuestion } from "@/lib/intelligence/qa-router";
import { canonicalTenantKey } from "@/lib/tenant/aliases";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function ndjson(value: unknown): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(value)}\n`);
}

export async function POST(request: NextRequest) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  if (!tenancy.clientKey) {
    return Response.json({ error: "tenant_key_required" }, { status: 403 });
  }
  if (!isContextCorpusExplorerEnabled(tenancy)) {
    return contextCorpusExplorerDisabledResponse();
  }

  const body = await request.json().catch(() => ({}));
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) {
    return Response.json({ error: "query_required" }, { status: 400 });
  }

  const tenantKey = canonicalTenantKey(tenancy.clientKey);

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const answer = await routeQuestion({
          query,
          tenantKey,
          clientId: tenancy.clientId,
        });
        controller.enqueue(
          ndjson({
            type: "route",
            routeUsed: answer.routeUsed,
            confidence: answer.confidence,
            freshnessStatus: answer.freshnessStatus,
            citationCount: answer.citations.length,
            missingContext: answer.missingContext,
            viewDirective: answer.viewDirective ?? null,
          }),
        );
        controller.enqueue(ndjson({ type: "delta", text: answer.answer }));
        controller.enqueue(
          ndjson({
            type: "done",
            answer,
          }),
        );
        await recordQaAudit({
          clientId: tenancy.clientId,
          tenantKey,
          question: query,
          answer,
        });
      } catch (error) {
        controller.enqueue(
          ndjson({
            type: "error",
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
