import { getActiveClientRow } from "@/lib/active-client";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import type { CioTowerVisibleContextCriteria } from "@/lib/tower/current-layer-answer-contract";
import { canonicalCioTowerTenantKey } from "@/lib/tower/metric-packet";
import { towerProgressEventsForQuestion } from "@/lib/tower/visual-contract";
import { answerCurrentTowerQuestion } from "@/lib/tower/current-layer-answer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TowerChatResult = Awaited<ReturnType<typeof answerCurrentTowerQuestion>>;

const TOWER_VISIBLE_CONTEXT_CRITERIA: CioTowerVisibleContextCriteria = {
  renderingPolicy: [
    "Use the supplied client context and Tower facts to produce a compelling executive value proposition.",
    "Put structured comparison data in tables so the renderer can create high-quality charts instead of parsing prose.",
    "Use board-readable labels and concise cells; do not rely on oversized headings to carry the story.",
  ],
  artifactCapabilities: [
    "Recharts-first charts",
    "SVG-compatible rendered visuals where applicable",
    "board-grade tables",
    "multi-pane insight tabs",
  ],
  exportTargets: ["PDF", "HTML"],
  valueProposition:
    "AbarVa combines client context, governed facts, and Claude judgment to show which AI outcomes are claimable, blocked, or ready for executive action.",
};

function buildTowerChatPayload(result: TowerChatResult) {
  return {
    response: result.response,
    modelOutput: result.modelOutput,
    modelOutputRaw: result.modelOutputRaw,
    promptPackageKey: result.promptPackageKey,
    traceKey: result.traceKey,
    promptHash: result.promptHash,
    model: result.model,
    validationStatus: result.validationStatus,
    validationErrors: result.validationErrors,
    latencyMs: result.latencyMs,
    metricCards: result.metricCards,
    gaps: result.gaps,
    rendererPolicy: {
      purePlacementOnly: true,
      proseRewritten: false,
      labelsReplaced: false,
      summaryGenerated: false,
      scrubbed: false,
    },
  };
}

function towerChatFailurePayload(message: string) {
  return {
    error: "tower_current_chat_failed",
    detail: message,
    response:
      "aVa could not complete the Tower advisory synthesis. Use the visible dashboard measures as the governed read and try again.",
    modelOutput: {
      version: "cio_tower_visible_answer_v1",
      answer:
        "aVa could not complete the Tower advisory synthesis. Use the visible dashboard measures as the governed read and try again.",
      tables: [],
      tabs: [],
      followUpQuestion: null,
    },
    rendererPolicy: {
      purePlacementOnly: true,
      fallbackAnswerGenerated: true,
    },
  };
}

function ndjsonEvent(type: string, payload: object = {}) {
  return `${JSON.stringify({ type, ...payload })}\n`;
}

export async function POST(request: Request) {
  let tenancy;
  try {
    tenancy = await requireTenancy();
  } catch (error) {
    return tenancyErrorResponse(error);
  }

  const body = (await request.json().catch(() => ({}))) as {
    message?: string;
    stream?: boolean;
  };
  const question = body.message?.trim();
  if (!question) {
    return Response.json(
      { error: "bad_request", detail: "message required" },
      { status: 400 },
    );
  }

  const activeClient = await getActiveClientRow().catch(() => null);
  const tenantKey = canonicalCioTowerTenantKey(
    tenancy.clientKey ?? activeClient?.key ?? tenancy.clientId,
  );
  const tenantName = activeClient?.name ?? tenantKey;
  const wantsStream =
    request.headers.get("accept")?.includes("application/x-ndjson") ||
    request.headers.get("accept")?.includes("text/event-stream") ||
    body.stream === true;

  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const emit = (type: string, payload: object = {}) => {
          controller.enqueue(encoder.encode(ndjsonEvent(type, payload)));
        };
        try {
          emit("status", {
            phase: "accepted",
            label: "Reading your Tower question...",
          });
          for (const event of towerProgressEventsForQuestion(question)) {
            emit("status", event);
          }
          const result = await answerCurrentTowerQuestion({
            tenantId: tenancy.clientId,
            userId: tenancy.userId,
            tenantKey,
            tenantName,
            question,
            visibleContextCriteria: TOWER_VISIBLE_CONTEXT_CRITERIA,
          });
          emit("status", {
            phase: "validation",
            label: "Validating supporting evidence...",
          });
          emit("tower-answer", buildTowerChatPayload(result));
          emit("done", {
            traceKey: result.traceKey,
            latencyMs: result.latencyMs,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          emit("error", towerChatFailurePayload(message));
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        "X-AbarVa-Tower-Layer": "tower-current",
      },
    });
  }

  try {
    const result = await answerCurrentTowerQuestion({
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      tenantKey,
      tenantName,
      question,
      visibleContextCriteria: TOWER_VISIBLE_CONTEXT_CRITERIA,
    });
    return Response.json(buildTowerChatPayload(result), {
      headers: {
        "X-AbarVa-Tower-Layer": "tower-current",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return Response.json(towerChatFailurePayload(message), { status: 502 });
  }
}
