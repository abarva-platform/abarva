import { NextRequest, NextResponse } from "next/server";

import { assertVisibleAnswerContract } from "@/lib/agent/visible-answer-contract";
import type {
  HomeKnowAskRequest,
  HomeKnowResponse,
} from "@/lib/home/know/home-know-contract";
import { sanitizeHomeKnowVisiblePayloadWithAudit } from "@/lib/home/know/home-demo-safe-response";
import { applyHomeV6ExecutiveSynthesis } from "@/lib/home/know/home-v6-executive-synthesis";
import { answerHomeKnowFromV6 } from "@/lib/home/know/v6-home-ask";
import { toHomeKnowResponseFromV6 } from "@/lib/home/know/v6-home-know-response";
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

  const tenantKey =
    tenant?.canonicalKey ?? payload.tenantKey ?? payload.client ?? null;
  const response = await buildV6HomeKnowResponse({
    question: payload.question,
    tenantKey,
    tenantDisplayName: tenant?.displayName ?? null,
    includeTrace,
  }).catch((error): Promise<HomeKnowResponse> | HomeKnowResponse => {
    return blockedHomeKnowResponse({
      question: payload.question,
      tenantKey: tenantKey ?? "unknown",
      reason:
        error instanceof Error
          ? `V6 Home contract unavailable: ${error.message}`
          : "V6 Home contract unavailable.",
    });
  });

  const { payload: safeResponse, audit: visibleSanitizer } =
    sanitizeHomeKnowVisiblePayloadWithAudit(response);
  safeResponse.safety.visibleSanitizer = visibleSanitizer;

  if (includeTrace) {
    console.info("[home-know.trace]", {
      route: "/api/home/know/ask",
      tenantKey: safeResponse.tenantKey,
      intent: safeResponse.intent,
      answerStatus: safeResponse.answerStatus,
      artifactStatus: safeResponse.artifactStatus ?? null,
      visibleSanitizer,
      composerTrace: safeResponse.safety.composerTrace ?? null,
      packetShape: {
        facts: safeResponse.facts.length,
        tables: safeResponse.tables.map((table) => ({
          id: table.id,
          rows: table.rows.length,
        })),
        charts: safeResponse.charts.length,
        graphs: safeResponse.graphs.length,
        gaps: safeResponse.gaps.length,
      },
    });
  }

  const visibleContract = assertVisibleAnswerContract(safeResponse.prose);
  if (!visibleContract.passed) {
    return NextResponse.json(
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

  return NextResponse.json(
    includeTrace
      ? {
          ...safeResponse,
          trace: {
            composerTrace: safeResponse.safety.composerTrace ?? null,
            visibleSanitizer,
            finalPrompt:
              safeResponse.safety.composerTrace?.anthropicTrace?.finalPrompt ??
              safeResponse.safety.composerTrace?.promptSnapshot ??
              null,
            claudeRaw:
              safeResponse.safety.composerTrace?.anthropicTrace?.claudeRaw ??
              null,
            model:
              safeResponse.safety.composerTrace?.anthropicTrace?.model ?? null,
            params:
              safeResponse.safety.composerTrace?.anthropicTrace?.params ?? null,
          },
        }
      : safeResponse,
    {
      status: safeResponse.answerStatus === "blocked" ? 503 : 200,
    },
  );
}

async function buildV6HomeKnowResponse(input: {
  question: string;
  tenantKey: string | null;
  tenantDisplayName: string | null;
  includeTrace: boolean;
}): Promise<HomeKnowResponse> {
  const result = answerHomeKnowFromV6({
    question: input.question,
    tenantKey: input.tenantKey ?? "apexretail",
    tenantDisplayName: input.tenantDisplayName,
    includeTrace: input.includeTrace,
  });
  const response = toHomeKnowResponseFromV6(result, {
    question: input.question,
  });
  const synthesized = await applyHomeV6ExecutiveSynthesis({
    response,
    v6Result: result,
    question: input.question,
    tenantKey: result.tenant.canonicalKey,
    includeTrace: input.includeTrace,
  });
  return synthesized.response;
}

function blockedHomeKnowResponse(input: {
  question: string;
  tenantKey: string;
  reason: string;
}): HomeKnowResponse {
  return {
    mode: "KNOW",
    tenantKey: input.tenantKey,
    question: input.question,
    intent: "browse",
    answerStatus: "blocked",
    prose:
      "I could not use the V6 Home contract pack for this tenant, so I am not falling back to retired legacy Home layers.",
    dimensionsUsed: [],
    facts: [],
    tables: [],
    charts: [],
    graphs: [],
    gaps: [
      {
        id: "home-v6-unavailable",
        dimensionId: "home-v6-contract",
        objectType: "runtime_contract",
        expectedField: "v6_dataset_pack",
        displayLabel: "V6 Home contract unavailable",
        severity: "critical",
        message: input.reason,
        citationIds: [],
      },
    ],
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
      usableEvidence: false,
      evidenceStatus: "empty_dossier",
      evidenceReason: input.reason,
      evidenceChannels: {
        facts: 0,
        tables: 0,
        charts: 0,
        graphs: 0,
        citations: 0,
        sourceCoverage: 0,
        sections: 0,
        rollups: 0,
        relationshipPaths: 0,
        metrics: 0,
        gaps: 1,
      },
      composerTrace: {
        route: "/api/home/know/ask",
        composer: "home_v6_dataset_contract",
        goldenComposerAttempted: false,
        goldenComposerUsed: false,
        fallbackUsed: false,
        dimensionsUsed: [],
        factsBound: 0,
        tablesBound: 0,
        chartsBound: 0,
        graphsBound: 0,
        citationsBound: 0,
        sourceCoverageBound: 0,
        sectionsBound: 0,
        rollupsBound: 0,
        relationshipPathsBound: 0,
        metricsBound: 0,
        gapsBound: 1,
        usableEvidence: false,
        evidenceChannels: {
          facts: 0,
          tables: 0,
          charts: 0,
          graphs: 0,
          citations: 0,
          sourceCoverage: 0,
          sections: 0,
          rollups: 0,
          relationshipPaths: 0,
          metrics: 0,
          gaps: 1,
        },
        answerStatus: "blocked",
        reason: input.reason,
      },
    },
  };
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
