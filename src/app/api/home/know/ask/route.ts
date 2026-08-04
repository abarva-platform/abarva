import { NextRequest, NextResponse } from "next/server";

import {
  assertVisibleAnswerContract,
  type VisibleAnswerContractResult,
} from "@/lib/agent/visible-answer-contract";
import type {
  HomeKnowAskRequest,
  HomeKnowResponse,
  HomeKnowSafety,
} from "@/lib/home/know/home-know-contract";
import { sanitizeHomeKnowVisiblePayloadWithAudit } from "@/lib/home/know/home-demo-safe-response";
import { buildHomeKnowResponse } from "@/lib/home/know/home-know-engine";
import { scrubHomePublicAnswerText } from "@/lib/home/know/home-public-answer-scrub";
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
  let homeKnowFallbackReason: string | null = null;
  const response = await buildEnterpriseHomeKnowResponse({
    question: payload.question,
    tenantKey,
    client: payload.client ?? payload.tenantKey ?? tenantKey,
    includeTrace,
  })
    .catch((error) => {
      homeKnowFallbackReason =
        error instanceof Error ? error.message : String(error ?? "unknown");
      if (includeTrace) {
        console.warn("[home-know.enterprise-fallback]", {
          route: "/api/home/know/ask",
          tenantKey,
          reason: homeKnowFallbackReason,
        });
      }
      return blockedHomeKnowResponse({
        question: payload.question,
        tenantKey: tenantKey ?? "unknown",
        reason:
          error instanceof Error
            ? `Current governed Home context unavailable: ${error.message}`
            : "Current governed Home context unavailable.",
      });
    });

  const { payload: safeResponse, audit: visibleSanitizer } =
    sanitizeHomeKnowVisiblePayloadWithAudit(response);
  if (homeKnowFallbackReason && safeResponse.safety.composerTrace) {
    safeResponse.safety.composerTrace = {
      ...safeResponse.safety.composerTrace,
      fallbackUsed: true,
      reason: [
        safeResponse.safety.composerTrace.reason,
        `Enterprise Home current-layer block: ${homeKnowFallbackReason}`,
      ]
        .filter(Boolean)
        .join(" "),
    };
  }
  safeResponse.safety.visibleSanitizer = visibleSanitizer;
  const finalResponse = recoverVisibleHomeKnowResponse(safeResponse);

  if (includeTrace) {
    console.info("[home-know.trace]", {
      route: "/api/home/know/ask",
      tenantKey: finalResponse.tenantKey,
      intent: finalResponse.intent,
      answerStatus: finalResponse.answerStatus,
      artifactStatus: finalResponse.artifactStatus ?? null,
      visibleSanitizer,
      composerTrace: finalResponse.safety.composerTrace ?? null,
      packetShape: {
        facts: finalResponse.facts.length,
        tables: finalResponse.tables.map((table) => ({
          id: table.id,
          rows: table.rows.length,
        })),
        charts: finalResponse.charts.length,
        graphs: finalResponse.graphs.length,
        gaps: finalResponse.gaps.length,
      },
    });
  }

  const visibleContract = assertVisibleAnswerContract(finalResponse.prose);
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
          ...finalResponse,
          trace: {
            composerTrace: finalResponse.safety.composerTrace ?? null,
            homeKnowFallbackReason,
            visibleSanitizer,
            finalPrompt:
              finalResponse.safety.composerTrace?.anthropicTrace?.finalPrompt ??
              finalResponse.safety.composerTrace?.promptSnapshot ??
              null,
            claudeRaw:
              finalResponse.safety.composerTrace?.anthropicTrace?.claudeRaw ??
              null,
            model:
              finalResponse.safety.composerTrace?.anthropicTrace?.model ?? null,
            params:
              finalResponse.safety.composerTrace?.anthropicTrace?.params ??
              null,
          },
        }
      : finalResponse,
    {
      status: finalResponse.answerStatus === "blocked" ? 503 : 200,
    },
  );
}

function recoverVisibleHomeKnowResponse(
  response: HomeKnowResponse,
): HomeKnowResponse {
  const scrubbedProse = scrubHomePublicAnswerText(response.prose);
  const scrubbedResponse =
    scrubbedProse === response.prose
      ? response
      : withVisibleContractRecovery(response, {
          prose: scrubbedProse,
          removedClaims: 1,
          reason: "final visible-answer scrub applied",
        });

  const scrubbedContract = assertVisibleAnswerContract(scrubbedResponse.prose);
  if (scrubbedContract.passed) return scrubbedResponse;

  return withVisibleContractRecovery(scrubbedResponse, {
    prose: buildVisibleContractRecoveryProse(
      scrubbedResponse,
      scrubbedContract,
    ),
    removedClaims: scrubbedContract.violations.length,
    reason: `final visible-answer fallback applied: ${scrubbedContract.violations
      .map((violation) => violation.id)
      .join(", ")}`,
    demoteAnsweredToPartial: true,
  });
}

function buildVisibleContractRecoveryProse(
  response: HomeKnowResponse,
  contract: VisibleAnswerContractResult,
): string {
  const artifactSummary = summarizeVisibleArtifacts(response);
  const gapSummary =
    response.gaps.length > 0
      ? ` It also preserves ${response.gaps.length === 1 ? "one caveat" : "the caveats"} where the current business material is not ready for decision use.`
      : "";
  const rewriteReason = contract.violations.length
    ? " I tightened the wording before display because the first draft exposed answer-construction language instead of executive prose."
    : "";

  return [
    `I can answer this at Home level.${rewriteReason}`,
    `The safest view is the structured one below: ${artifactSummary}.${gapSummary}`,
    "Use this as a leadership navigation layer for review. It is not approval to write, publish, activate a baseline, or promote anything into production.",
  ].join("\n\n");
}

function summarizeVisibleArtifacts(response: HomeKnowResponse): string {
  const artifacts: string[] = [];
  if (response.tables.length > 0) {
    artifacts.push(response.tables.length === 1 ? "one table" : "tables");
  }
  if (response.charts.length > 0) {
    artifacts.push(response.charts.length === 1 ? "one chart" : "charts");
  }
  if (response.graphs.length > 0) {
    artifacts.push(
      response.graphs.length === 1
        ? "one relationship view"
        : "relationship views",
    );
  }
  if (response.facts.length > 0) {
    artifacts.push(
      response.facts.length === 1 ? "one cited fact" : "cited facts",
    );
  }
  return artifacts.length > 0
    ? artifacts.join(", ")
    : "the caveats and handoff guidance";
}

function withVisibleContractRecovery(
  response: HomeKnowResponse,
  input: {
    prose: string;
    removedClaims: number;
    reason: string;
    demoteAnsweredToPartial?: boolean;
  },
): HomeKnowResponse {
  const answerStatus =
    input.demoteAnsweredToPartial && response.answerStatus === "answered"
      ? "partial"
      : response.answerStatus;
  return {
    ...response,
    answerStatus,
    prose: input.prose,
    safety: {
      ...response.safety,
      unsupportedClaimsRemoved:
        response.safety.unsupportedClaimsRemoved + input.removedClaims,
      frontendTripwireShouldFire: false,
      composerTrace: appendHomeKnowComposerReason(
        response.safety.composerTrace,
        input.reason,
        answerStatus,
      ),
    },
  };
}

function appendHomeKnowComposerReason(
  trace: HomeKnowSafety["composerTrace"] | undefined,
  reason: string,
  answerStatus: HomeKnowResponse["answerStatus"],
): HomeKnowSafety["composerTrace"] | undefined {
  if (!trace) return undefined;
  return {
    ...trace,
    fallbackUsed: true,
    answerStatus,
    reason: [trace.reason, reason].filter(Boolean).join(" "),
  };
}

async function buildEnterpriseHomeKnowResponse(input: {
  question: string;
  tenantKey: string | null;
  client: string | null;
  includeTrace: boolean;
}): Promise<HomeKnowResponse> {
  if (!input.tenantKey && !input.client) {
    throw new Error("tenant key required for Enterprise Home dossier");
  }
  return buildHomeKnowResponse({
    question: input.question,
    tenantKey: input.tenantKey,
    client: input.client,
    operatorTrace: input.includeTrace,
  });
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
      "I could not use the current governed Home context for this tenant. Retired V6 and V7 layers are disabled for Home aVa, so I am not falling back to old packs.",
    dimensionsUsed: [],
    facts: [],
    tables: [],
    charts: [],
    graphs: [],
    gaps: [
      {
        id: "home-current-context-unavailable",
        dimensionId: "home-current-context",
        objectType: "runtime_contract",
        expectedField: "current_governed_home_context",
        displayLabel: "Current governed Home context unavailable",
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
        composer: "home_know_blocked",
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
        reason: `${input.reason} Retired V6/V7 fallbacks are disabled.`,
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
