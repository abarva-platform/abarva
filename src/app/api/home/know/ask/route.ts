import { NextRequest, NextResponse } from "next/server";

import {
  buildHomeKnowResponse,
  validateHomeKnowResponse,
} from "@/lib/home/know/home-know-engine";
import type {
  HomeKnowAskRequest,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import { resolveTenant } from "@/lib/tenant/resolveTenant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const payload = await parsePayload(req);
  if (!payload.question.trim()) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }
  const includeTrace = shouldLogHomeKnowTrace(req);

  const tenant = await resolveTenant({
    requestedClient: payload.tenantKey ?? payload.client ?? null,
    surfaceClientKey: payload.client ?? payload.tenantKey ?? null,
    allowFallback: false,
  }).catch(() => null);

  const response = await buildHomeKnowResponse({
    question: payload.question,
    tenantKey:
      tenant?.canonicalKey ?? payload.tenantKey ?? payload.client ?? null,
    client: tenant?.appClientKey ?? payload.client ?? null,
    operatorTrace: includeTrace,
  }).catch((error): HomeKnowResponse => {
    const tenantKey =
      tenant?.canonicalKey ?? payload.tenantKey ?? payload.client ?? "unknown";
    return validateHomeKnowResponse({
      mode: "KNOW",
      tenantKey,
      question: payload.question,
      intent: "browse",
      answerStatus: "blocked",
      prose:
        error instanceof Error
          ? "I could not use the Home context views for this tenant."
          : "I could not use the Home context views for this tenant.",
      dimensionsUsed: [],
      facts: [],
      tables: [],
      charts: [],
      graphs: [],
      gaps: [],
      conflicts: [],
      citations: [],
      handoff: null,
      safety: {
        serverValidated: true,
        blockedExperts: true,
        blockedDecisionFrames: true,
        blockedInternalCodes: true,
        unsupportedClaimsRemoved: 0,
        frontendTripwireShouldFire: false,
      },
    });
  });

  if (includeTrace) {
    console.info("[home-know.trace]", {
      route: "/api/home/know/ask",
      tenantKey: response.tenantKey,
      intent: response.intent,
      answerStatus: response.answerStatus,
      composerTrace: response.safety.composerTrace ?? null,
      packetShape: {
        facts: response.facts.length,
        tables: response.tables.map((table) => ({
          id: table.id,
          rows: table.rows.length,
        })),
        charts: response.charts.length,
        graphs: response.graphs.length,
        gaps: response.gaps.length,
      },
    });
  }

  return NextResponse.json(
    includeTrace
      ? {
          ...response,
          trace: {
            composerTrace: response.safety.composerTrace ?? null,
            finalPrompt:
              response.safety.composerTrace?.anthropicTrace?.finalPrompt ??
              response.safety.composerTrace?.promptSnapshot ??
              null,
            claudeRaw:
              response.safety.composerTrace?.anthropicTrace?.claudeRaw ?? null,
            model:
              response.safety.composerTrace?.anthropicTrace?.model ?? null,
            params:
              response.safety.composerTrace?.anthropicTrace?.params ?? null,
          },
        }
      : response,
    {
      status: response.answerStatus === "blocked" ? 503 : 200,
    },
  );
}

function shouldLogHomeKnowTrace(req: NextRequest): boolean {
  return (
    process.env.ABARVA_HOME_KNOW_TRACE === "1" ||
    req.headers.get("x-abarva-debug-home-know") === "1"
  );
}

async function parsePayload(req: NextRequest): Promise<HomeKnowAskRequest> {
  let body: unknown = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }
  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  return {
    question: readString(record.question) ?? readString(record.q) ?? "",
    tenantKey: readString(record.tenantKey),
    client: readString(record.client),
  };
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
