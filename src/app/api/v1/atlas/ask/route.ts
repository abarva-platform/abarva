import { NextRequest } from "next/server";
import {
  requireAtlasTenancy,
  tenancyErrorResponse,
} from "@/app/api/v1/atlas/_auth";
import { buildAtlasRenderedResponse } from "@/lib/atlas/rendered-response";
import { runAtlasTurnDetailed } from "@/lib/atlas/orchestrator";
import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as {
      message?: string;
      threadId?: string | null;
      signalId?: string | null;
      clientId?: string | null;
      surfaceContext?: Record<string, unknown>;
    };

    const ctx = await requireAtlasTenancy(body.clientId);
    const message = body.message?.trim();
    if (!message) {
      return Response.json(
        { error: "bad_request", detail: "message required" },
        { status: 400 },
      );
    }

    const result = await runAtlasTurnDetailed({
      ctx,
      message,
      threadId: body.threadId,
      signalId: body.signalId,
      surfaceContext: body.surfaceContext,
    });
    const renderedResponse = buildAtlasRenderedResponse({
      clientName: result.toolResults.portfolio?.clientName ?? "Active client",
      message,
      result,
    });
    const visibleContract = assertVisibleAnswerContract(
      renderedResponse.response_text,
    );
    if (!visibleContract.passed) {
      return Response.json(
        {
          error: "visible_answer_contract_failed",
          detail:
            "aVa blocked this answer before display because it exposed non-user-facing answer language.",
          version: visibleContract.version,
          violations: visibleContract.violations,
        },
        { status: 422 },
      );
    }

    return Response.json(
      {
        threadId: result.threadId,
        signalId: result.signalId ?? null,
        observationId: result.observationId ?? null,
        routeType: result.routeType,
        intent: result.intent,
        atlasMode: result.atlasMode,
        fallbackReason: result.fallbackReason ?? null,
        groundingDisclosure: result.groundingDisclosure,
        renderedResponse,
      },
      {
        headers: {
          "x-atlas-mode": result.atlasMode,
        },
      },
    );
  } catch (err) {
    try {
      return tenancyErrorResponse(err);
    } catch {
      return Response.json(
        { error: "internal_error", message: (err as Error).message },
        { status: 500 },
      );
    }
  }
}
