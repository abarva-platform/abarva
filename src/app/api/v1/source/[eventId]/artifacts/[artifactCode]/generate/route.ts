// POST /api/v1/source/:eventId/artifacts/:artifactCode/generate
//
// Body: {} (no inputs — context is bound server-side)
//
// Generates an artifact body via Anthropic using bound tenant + event +
// upstream-artifact context. Persists the body to
// source_event_artifact_states.body and an audit receipt to
// body_generation_metadata.
//
// Auth: requireTenancy + canGenerateSourcingArtifacts (or canonical
// admin fallback).
//
// Returns the updated artifact view-model. Non-streaming for
// simplicity in this slice; streaming arrives when the canvas surfaces
// a progress UI.

import { createHash, randomUUID } from "node:crypto";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  preflightAnthropicDirectClient,
  type AnthropicTool,
} from "@/lib/integrations/ai-egress";
import type { NextRequest } from "next/server";
import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import { getActiveClientRow } from "@/lib/active-client";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isFeatureEnabled } from "@/lib/features/is-feature-enabled";
import { captureReasoningEnvelope } from "@/lib/source/reasoning/capture";
import { CANONICAL_CLIENT_ADMIN_EMAILS } from "@/lib/auth/canonical-auth-roster";
import { loadUserSourceAccessPolicy } from "@/lib/auth/source-access-policy";
import { getObjectStorageAdapter } from "@/lib/data-plane/objectStorage";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { clientKeyToInventorySubstrateKey } from "@/lib/agent/tools/intelligence/_shared";
import {
  buildSourceGenerationContext,
  collectUpstreamBodies,
  getPromptTemplate,
  type SourceGenerationContext,
  type SourceArtifactBodyGenerationMetadata,
} from "@/lib/source/agent-generation/server";
import {
  findUnsatisfiedDraftableUpstream,
  findUnsatisfiedRequiredUpstream,
} from "@/lib/source/contracts/upstream-satisfaction";
import { sanitizeClientFacingSourceDraft } from "@/lib/source/agent-generation/client-facing-hygiene";
import { completeD09RfpGovernanceSections } from "@/lib/source/agent-generation/d09-completion";
import { generateD09ViaMapReduce } from "@/lib/source/agent-generation/d09-map-reduce";
import {
  normalizeRequiredSectionHeadings,
  verifyArtifactSections,
  withSectionVerificationMetadata,
} from "@/lib/source/agent-generation/section-conformance";
import {
  buildSourceConsultingGradeReviewPrompt,
  buildSourceConsultingGradeCompactRetryPrompt,
  buildSourceConsultingGradeRewritePrompt,
  buildMalformedSourceConsultingGradeReview,
  buildSourceQualityGateMetadata,
  buildSourceQualitySourceContext,
  parseSourceConsultingGradeReview,
  requiresSourceConsultingGradeGate,
  shortSourceArtifactCode,
  type SourceArtifactQualityGateMetadata,
} from "@/lib/source/agent-generation/quality-review";
import {
  scanForBannedTerms,
  appendLanguagePolicyBlock,
} from "@/lib/source/documentation-standards/source-documentation-standards";
import {
  CONSULTING_GRADE_DIMENSIONS,
  CONSULTING_GRADE_MIN_SCORE,
  CONSULTING_GRADE_STANDARD_ID,
} from "@/lib/deliverables/quality/consulting-grade-rubric";
import {
  artifactStateRowToView,
  type SourceEventArtifactState,
  type SourceEventArtifactStateRow,
} from "@/lib/source/canvas-substrate/types";
import {
  buildSourceArtifactBlobPath,
  registerSourceArtifactUpload,
  type SourceArtifactRegistryRecord,
} from "@/lib/source/artifact-registry";
import {
  getCurrentArtifacts,
  supersedePriorVersions,
} from "@/lib/source/file-cabinet/repository";
import { specByCode } from "@/lib/source/canonical-specs";
import {
  ensurePersistedSourceEventForClient,
  scaffoldNewEventSubstrate,
} from "@/lib/source/queries";
import {
  renderGeneratedSourceArtifactFormats,
  type GeneratedArtifactFormat,
  type RenderedGeneratedArtifact,
} from "@/lib/source/generated-artifact-rendering";
import {
  SOURCE_AI_DRAFT_GOVERNANCE_DETAIL,
  withComplianceReviewFlag,
} from "@/lib/source/artifact-governance";
import { evaluateGenerationEligibility } from "@/lib/source/contracts/generation-eligibility";

const REGISTRY_STORAGE_BUCKET = "source-artifacts";
const SOURCE_QUALITY_REVIEW_TOOL_NAME = "record_source_quality_review";
// Board-grade artifacts (e.g. d09 with 128k maxTokens) take 450-550s for the
// first draft — far beyond the original 110s budget, which meant the
// quality-gate rewrite never fired (stuck at 7/10). The X-Abarva-Json-Heartbeat
// wrapper keeps the ACA ingress alive for the full duration, so the practical
// limit is the ACA replica session timeout (no forced cut at 150s). Setting
// the budget to 20 min lets rewrite always attempt for any artifact that
// completes draft generation within that window.
const SOURCE_SYNC_GENERATION_BUDGET_MS = 1_200_000;
const SOURCE_JSON_HEARTBEAT_INTERVAL_MS = 12_000;
const SOURCE_QUALITY_REVIEW_MAX_TOKENS = 3_200;
const SOURCE_QUALITY_REWRITE_MIN_REMAINING_MS = 45_000;
const SOURCE_QUALITY_REVIEW_TOOL: AnthropicTool = {
  name: SOURCE_QUALITY_REVIEW_TOOL_NAME,
  description:
    "Record the strict partner-grade quality review as compact structured data.",
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      standardId: { type: "string", const: CONSULTING_GRADE_STANDARD_ID },
      minRequiredScore: { type: "number", const: CONSULTING_GRADE_MIN_SCORE },
      artifactCode: { type: "string" },
      artifactName: { type: "string" },
      pass: { type: "boolean" },
      overallScore: { type: "number", minimum: 0, maximum: 10 },
      dimensionScores: {
        type: "array",
        minItems: CONSULTING_GRADE_DIMENSIONS.length,
        maxItems: CONSULTING_GRADE_DIMENSIONS.length,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            id: {
              type: "string",
              enum: CONSULTING_GRADE_DIMENSIONS.map(
                (dimension) => dimension.id,
              ),
            },
            score: { type: "number", minimum: 0, maximum: 10 },
            rationale: { type: "string", maxLength: 280 },
            requiredFixes: {
              type: "array",
              maxItems: 3,
              items: { type: "string", maxLength: 180 },
            },
          },
          required: ["id", "score", "rationale", "requiredFixes"],
        },
      },
      unsupportedClaims: {
        type: "array",
        maxItems: 8,
        items: { type: "string", maxLength: 220 },
      },
      missingEvidence: {
        type: "array",
        maxItems: 8,
        items: { type: "string", maxLength: 220 },
      },
      rewriteGuidance: {
        type: "array",
        maxItems: 8,
        items: { type: "string", maxLength: 220 },
      },
    },
    required: [
      "standardId",
      "minRequiredScore",
      "artifactCode",
      "artifactName",
      "pass",
      "overallScore",
      "dimensionScores",
      "unsupportedClaims",
      "missingEvidence",
      "rewriteGuidance",
    ],
  },
};

function registryMimeType(format: GeneratedArtifactFormat): string {
  switch (format) {
    case "docx":
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    case "html":
      return "text/html";
    case "md":
      return "text/markdown";
  }
}

function registrySourceFormat(
  format: GeneratedArtifactFormat,
): "docx" | "html" | "markdown" {
  return format === "md" ? "markdown" : format;
}

function registryArtifactKind(
  artifactCode: string,
  artifact: RenderedGeneratedArtifact,
): string {
  if (artifact.role === "preview") return `${artifactCode}__preview`;
  if (artifact.role === "source") return `${artifactCode}__source`;
  return artifactCode;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Extended ceiling for board-grade artifacts (d09 RFP at 40k tokens ≈ 4–8 min
// on Opus 4.8). ACA runtime; not subject to Vercel's 300s cap.
export const maxDuration = 600;

type RouteCtx = { params: Promise<{ eventId: string; artifactCode: string }> };

function isCanonicalClientAdminEmail(
  email: string | null | undefined,
): boolean {
  const normalized = email?.trim().toLowerCase() ?? "";
  return CANONICAL_CLIENT_ADMIN_EMAILS.includes(
    normalized as (typeof CANONICAL_CLIENT_ADMIN_EMAILS)[number],
  );
}

export async function POST(req: NextRequest, { params }: RouteCtx) {
  const resolvedParams = await params;
  const invoke = () =>
    generateSourceArtifactDraft(req, {
      params: Promise.resolve(resolvedParams),
    });
  // Wrap EVERY generation in the JSON heartbeat stream (previously d09-only).
  // A synchronous Anthropic generate sends no bytes to the client for 60-240s;
  // without a heartbeat the ACA ingress idle-times-out and 504s before the
  // artifact persists (observed live on d02/d03). The heartbeat keeps the
  // connection alive (whitespace every 12s) until the final JSON payload —
  // JSON.parse ignores the leading whitespace, so no client change is needed.
  return streamJsonHeartbeat(invoke);
}

function streamJsonHeartbeat(run: () => Promise<Response>): Response {
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  const clearHeartbeat = () => {
    if (heartbeat) clearInterval(heartbeat);
    heartbeat = null;
  };
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode("\n"));
      heartbeat = setInterval(() => {
        controller.enqueue(encoder.encode(" \n"));
      }, SOURCE_JSON_HEARTBEAT_INTERVAL_MS);

      run()
        .then(async (response) => {
          const body = await response.text();
          clearHeartbeat();
          controller.enqueue(encoder.encode(body || "null"));
          controller.close();
        })
        .catch((error) => {
          clearHeartbeat();
          console.error(
            "[source artifact generation heartbeat] generation failed",
            error,
          );
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                error: "generation_failed",
                detail:
                  error instanceof Error
                    ? error.message
                    : "Source artifact generation failed.",
              }),
            ),
          );
          controller.close();
        });
    },
    cancel() {
      clearHeartbeat();
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Abarva-Json-Heartbeat": "source-d09",
    },
  });
}

export async function generateSourceArtifactDraft(
  _req: Request,
  { params }: RouteCtx,
) {
  // When called from the async worker (X-Source-Worker-Call: 1), the 110s sync
  // budget does not apply — the worker has no web-request deadline, so the
  // quality-gate rewrite can always run regardless of how long generation took.
  const isWorkerCall = _req.headers.get("x-source-worker-call") === "1";
  let tenancy;
  let tenancyError: unknown = null;
  try {
    tenancy = await requireTenancy();
  } catch (err) {
    tenancyError = err;
  }

  const { eventId, artifactCode } = await params;

  // Resolve template up front so unknown artifact codes 404 fast.
  const template = getPromptTemplate(artifactCode);
  if (!template) {
    return Response.json(
      {
        error: "unsupported_artifact",
        detail: `Generation is not yet wired for ${artifactCode}. Supported codes are listed in the prompt registry.`,
      },
      { status: 404 },
    );
  }
  // Canonical artifact-quality contract, appended additively. Each prompt
  // template's own systemPrompt keeps its full hand-tuned structural
  // instructions unchanged; appendLanguagePolicyBlock appends the audience/
  // depth/evidence-mode/banned-terms guidance from source-artifact-profiles.ts
  // (the same registry section-conformance.ts derives its required-section
  // headings from) so every artifact carries this policy even where no
  // template author wrote an equivalent by hand. No-ops for an unregistered
  // artifact code — the template's own systemPrompt is used unchanged.
  const effectiveSystemPrompt = appendLanguagePolicyBlock(
    template.systemPrompt,
    shortSourceArtifactCode(artifactCode),
  );

  // Generation is a write surface. If we cannot bind the request to an
  // active tenant, fail here instead of falling through to a misleading 404.
  if (!tenancy) {
    return tenancyErrorResponse(tenancyError);
  }
  const tenantClientKey = tenancy.clientKey;
  if (!tenantClientKey) {
    return Response.json(
      { error: "no_client", detail: "No active client for this user" },
      { status: 403 },
    );
  }

  const currentUser = await getCurrentUser().catch(() => null);

  // Legacy golden-shell routes can exist before a matching persisted
  // source_events row does. Materialize the seeded event into the
  // UUID-backed substrate on first write so generation, exports, and the
  // stored-document registry all have a real event row to bind to.
  await ensurePersistedSourceEventForClient(
    eventId,
    tenantClientKey,
    currentUser?.clerkUserId ?? tenancy.userId,
  ).catch((error) => {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate] seed materialization failed",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  });

  // Bind context (event + tenant + substrate).
  const ctx = await buildSourceGenerationContext(eventId);
  if (!ctx) {
    return Response.json(
      { error: "not_found", detail: `No source event with slug ${eventId}` },
      { status: 404 },
    );
  }

  await scaffoldNewEventSubstrate(ctx.event.id, ctx.tenantKey).catch(
    (error) => {
      console.warn(
        "[source generate] substrate scaffold repair failed:",
        error instanceof Error ? error.message : String(error),
      );
    },
  );

  // Auth check using the resolved event's UUID.
  const activeClient = await getActiveClientRow().catch(() => null);
  const accessPolicy =
    tenancy && activeClient
      ? await loadUserSourceAccessPolicy(tenancy, {
          activeClientKey: activeClient.key,
          sourceEventId: ctx.event.id,
        }).catch(() => null)
      : null;
  const canonicalAdminFallbackAllowed =
    !activeClient &&
    isCanonicalClientAdminEmail(currentUser?.email) &&
    ctx.tenantKey === "unknown"; // canonical-admin path skips active-client gating

  const canGenerate = Boolean(
    accessPolicy?.canGenerateSourcingArtifacts ||
    accessPolicy?.canUploadSourceArtifacts ||
    canonicalAdminFallbackAllowed,
  );
  if (!canGenerate) {
    if (tenancyError) return tenancyErrorResponse(tenancyError);
    return Response.json(
      {
        error: "forbidden",
        detail: "Generation rights (canGenerateSourcingArtifacts) required.",
      },
      { status: 403 },
    );
  }

  // Contract-driven eligibility (PR 4B/4C, ADR-0015): stage eligibility (PR
  // 4B) plus the upstream-required gate — PR 4C replaces the original "does
  // a non-empty body exist" check (findMissingUpstreamCodes) with the real
  // upstream-satisfaction resolver: a required upstream artifact must be
  // ACCEPTED, AUTHORITATIVE, and non-superseded, not merely have a body. A
  // candidate draft, a review-pending artifact, a rejected/blocked one, or a
  // superseded version no longer satisfies the requirement — this is the
  // shared resolver ask #6 required, so no route implements its own
  // interpretation of "satisfied."
  const stageAutoDraft = _req.headers.get("x-source-stage-autodraft") === "1";
  const missingUpstream = stageAutoDraft
    ? findUnsatisfiedDraftableUpstream(ctx, template.upstreamRequired)
    : await findUnsatisfiedRequiredUpstream(ctx, template.upstreamRequired);
  const eligibility = evaluateGenerationEligibility({
    artifactCode,
    currentStage: ctx.event.currentStageKey,
    missingRequiredUpstreamCodes: missingUpstream,
  });
  const stageBlocker = eligibility.blockers.find(
    (b) => b.code === "stage_not_eligible",
  );
  if (stageBlocker) {
    return Response.json(
      {
        error: stageBlocker.code,
        detail: stageBlocker.detail,
        ...stageBlocker.meta,
      },
      { status: 409 },
    );
  }
  if (missingUpstream.length > 0) {
    return Response.json(
      {
        error: "upstream_required",
        detail: `Cannot generate ${artifactCode} — author and approve these upstream artifacts first: ${missingUpstream.join(", ")}.`,
        missingUpstream,
      },
      { status: 409 },
    );
  }

  // Find the substrate row for the artifact we're generating into.
  const supabase = getAzureReadFluentClient();
  const { data: artifactRow, error: artifactFetchError } = await supabase
    .from("source_event_artifact_states")
    .select("*")
    .eq("source_event_id", ctx.event.id)
    .eq("artifact_code", artifactCode)
    .maybeSingle<SourceEventArtifactStateRow>();
  if (artifactFetchError) {
    return Response.json(
      { error: "lookup_failed", detail: artifactFetchError.message },
      { status: 500 },
    );
  }
  if (!artifactRow) {
    return Response.json(
      {
        error: "artifact_not_found",
        detail: `No artifact ${artifactCode} on event ${ctx.event.code}.`,
      },
      { status: 404 },
    );
  }
  if (artifactRow.status === "locked" || artifactRow.status === "superseded") {
    return Response.json(
      {
        error: "terminal_state",
        detail: `Artifact ${artifactCode} is ${artifactRow.status}; body cannot be regenerated.`,
      },
      { status: 409 },
    );
  }

  // Collect upstream bodies + build the user message.
  const upstreamBound = collectUpstreamBodies(ctx, [
    ...template.upstreamRequired,
    ...template.upstreamOptional,
  ]);
  const userMessage = template.buildUserMessage(ctx, upstreamBound);
  const requiresQualityGate = requiresSourceConsultingGradeGate(artifactCode);
  if (requiresQualityGate && !process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      {
        error: "quality_gate_requires_anthropic",
        detail:
          "Flagship Source artifacts require Claude generation plus consulting-grade review; deterministic fallback is disabled for this artifact.",
      },
      { status: 503 },
    );
  }

  // Call Anthropic when configured. If ANTHROPIC_API_KEY is absent, write a
  // deterministic Source draft so the canvas remains useful in local/dev
  // environments without silently routing to another provider.
  const startedAt = Date.now();
  let body = "";
  let stopReason: string | null = null;
  let tokensIn: number | null = null;
  let tokensOut: number | null = null;
  let model = template.model;
  try {
    if (!tenancy) {
      return tenancyErrorResponse(tenancyError);
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      model = "source-deterministic-fallback";
      stopReason = "missing_anthropic_api_key";
      body = buildDeterministicFallbackBody({
        artifactCode,
        ctx,
        upstreamBound,
      });
    } else {
      const preflight = await preflightAnthropicDirectClient({
        tenantId: tenancy.clientId,
        userId: tenancy.userId,
        workflow: "source-artifact-generate",
        artifactId: artifactRow.id,
        artifactType: artifactCode,
        model: template.model,
        prompt: [effectiveSystemPrompt, userMessage].join("\n\n"),
        dataClass: "confidential",
        metadata: {
          eventId: ctx.event.id,
          sourceEventId: ctx.event.id,
          artifactCode,
        },
      });
      if (!preflight.ok) {
        return Response.json(
          {
            error: "ai_egress_denied",
            detail: preflight.reason,
            auditId: preflight.auditId,
          },
          { status: 403 },
        );
      }
      // Parallel map-reduce path for d09: generates §2-§11 concurrently
      // then stitches + writes §1 in a fast assembly pass. ~2-3 min vs
      // 8-9 min for the monolithic single call.
      const useD09MapReduce =
        artifactCode === "d09_rfp_pack" &&
        process.env.ABARVA_SOURCE_D09_MAP_REDUCE !== "0";

      if (useD09MapReduce) {
        const mapReduceResult = await generateD09ViaMapReduce({
          ctx,
          upstreamBound,
          client: preflight.client,
        });
        body = mapReduceResult.body;
        model = "claude-opus-4-8";
        stopReason = "end_turn";
        tokensOut = mapReduceResult.tokensTotal;
        if (mapReduceResult.failedSections.length > 0) {
          console.warn(
            `[d09-map-reduce] failed sections: ${mapReduceResult.failedSections.join(", ")}`,
          );
        }
      } else {
        const sdkStream = preflight.client.messages.stream({
          model: template.model,
          max_tokens: template.maxTokens,
          system: effectiveSystemPrompt,
          messages: [{ role: "user", content: userMessage }],
        });
        const parts: string[] = [];
        for await (const chunk of sdkStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            parts.push(chunk.delta.text);
          }
        }
        body = parts.join("").trim();
        const finalMsg = await sdkStream.finalMessage();
        model = finalMsg.model ?? template.model;
        stopReason = finalMsg.stop_reason ?? null;
        tokensIn = finalMsg.usage?.input_tokens ?? null;
        tokensOut = finalMsg.usage?.output_tokens ?? null;
      }
    }
  } catch (err) {
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate] Anthropic error",
      err,
    );
    return Response.json(
      {
        error: "generation_failed",
        detail: err instanceof Error ? err.message : "Anthropic call failed",
      },
      { status: 502 },
    );
  }

  if (body.trim().length === 0) {
    return Response.json(
      {
        error: "empty_generation",
        detail:
          "Anthropic returned an empty body. Retry, or surface a gap in the upstream context.",
      },
      { status: 502 },
    );
  }
  body = completeD09RfpGovernanceSections({ artifactCode, body, ctx });
  body = sanitizeClientFacingSourceDraft(body, {
    artifactCode,
    companyName: ctx.tenantName,
  });

  let qualityGate: SourceArtifactQualityGateMetadata | undefined;
  let qualityGateFailedDetail: string | null = null;
  if (requiresQualityGate) {
    const qualityResult = await runConsultingGradeQualityGate({
      artifactCode,
      artifactName: specByCode(artifactCode)?.name ?? artifactCode,
      body,
      ctx,
      upstreamBound,
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      artifactId: artifactRow.id,
      model: template.model,
      maxTokens: template.maxTokens,
      // Worker calls have no sync deadline — reset the clock so the rewrite
      // always has the full budget regardless of how long generation took.
      requestStartedAtMs: isWorkerCall ? Date.now() : startedAt,
    });
    if (!qualityResult.ok) {
      if (
        qualityResult.error !== "quality_gate_failed" ||
        !qualityResult.qualityGate
      ) {
        return Response.json(
          {
            error: qualityResult.error,
            detail: qualityResult.detail,
            qualityGate: qualityResult.qualityGate ?? null,
            // Include the artifact row ID so callers can enqueue an async worker
            // retry without needing a separate lookup.
            artifactId: artifactRow.id,
          },
          { status: qualityResult.status },
        );
      }
      // Preserve quality-failed drafts as reviewable artifacts. Clients still
      // need a durable draft to review, edit, supersede with a client-final
      // document, and audit later; discarding it breaks the authority chain.
      body = qualityResult.body ?? body;
      qualityGate = qualityResult.qualityGate;
      qualityGateFailedDetail = qualityResult.detail;
    } else {
      body = qualityResult.body;
      qualityGate = qualityResult.qualityGate;
    }
  }

  // Persist body + provenance.
  const nowIso = new Date().toISOString();
  body = normalizeRequiredSectionHeadings(artifactCode, body);
  const sectionVerification = verifyArtifactSections(
    artifactCode,
    body,
    nowIso,
  );
  // Slice 1.6: optionally capture a validated Reasoning Envelope (flag
  // `source_reasoning_spine`, default OFF). This NEVER changes the generated body
  // — captureReasoningEnvelope is fully guarded, so any failure (or flag off)
  // degrades to no envelope and generation is byte-identical to the legacy path.
  const reasoningCapture = captureReasoningEnvelope(ctx, {
    enabled: isFeatureEnabled(
      {
        clientKey: activeClient?.key ?? ctx.tenantKey,
        clientId: activeClient?.id ?? null,
      },
      "source_reasoning_spine",
    ),
    envelopeId: randomUUID(),
    now: nowIso,
  });
  // Deterministic backstop: catches literal banned-term leakage
  // (d-codes, "AI generated", "substrate", etc.) that survived the LLM
  // quality gate's judgment-based review. Non-blocking by design — this
  // is a visibility signal for human review, not a generation failure.
  const bannedTermMatches = scanForBannedTerms(
    body,
    shortSourceArtifactCode(artifactCode),
  );
  const generationMetadata = withSectionVerificationMetadata(
    {
      model,
      promptTemplateId: template.artifactCode,
      promptTemplateVersion: template.version,
      upstreamBoundCodes: Object.keys(upstreamBound),
      generatedAt: nowIso,
      generatedByUserId: currentUser?.clerkUserId ?? null,
      tokensIn,
      tokensOut,
      stopReason,
      qualityGate: qualityGate as unknown as
        | Record<string, unknown>
        | undefined,
      reasoningStatus: reasoningCapture.status,
      reasoningEnvelope: reasoningCapture.envelope ?? undefined,
      bannedTermMatches,
    },
    sectionVerification,
  ) satisfies SourceArtifactBodyGenerationMetadata;

  const update: Partial<SourceEventArtifactStateRow> = {
    body,
    body_format: "markdown",
    body_authored_by: currentUser?.clerkUserId ?? null,
    body_updated_at: nowIso,
    body_generation_metadata: generationMetadata as unknown as Record<
      string,
      unknown
    >,
    status: qualityGateFailedDetail
      ? "needs_review"
      : artifactRow.status === "not_started"
        ? "drafting"
        : artifactRow.status,
    updated_at: nowIso,
  };
  if (artifactRow.tier === "stub") update.tier = "outline";

  // DB write routed through the data-plane write seam (Slice 3b). The
  // Anthropic call above stays route-side; the seam owns only the body persist.
  const sourceWrite = selectSourceWriteAdapter(undefined, ctx.tenantKey);
  const bodyWrite = await sourceWrite.updateArtifactBody({
    artifactRowId: artifactRow.id,
    columns: update as Record<string, unknown>,
  });
  if (!bodyWrite.ok || !bodyWrite.data) {
    return Response.json(
      { error: "update_failed", detail: bodyWrite.error },
      { status: 500 },
    );
  }

  let view: SourceEventArtifactState = artifactStateRowToView(
    bodyWrite.data as unknown as SourceEventArtifactStateRow,
  );

  // Also persist rendered generated artifacts to Blob + source_artifacts so the
  // File Cabinet/download route can retrieve real bytes. The substrate markdown
  // body remains canonical. DOCX is the client-facing primary artifact when the
  // renderer succeeds; HTML is a preview sibling; Markdown is retained as an
  // internal source copy for re-rendering/lineage. Blob/registry failure is
  // non-fatal and logged.
  let registryArtifact: SourceArtifactRegistryRecord | null = null;
  const registryArtifacts: SourceArtifactRegistryRecord[] = [];
  let renderErrors: string[] = [];
  let registryPersistError: string | null = null;
  try {
    const spec = specByCode(artifactCode);
    const family = spec?.family ?? "other";
    const substrateTenantKey = clientKeyToInventorySubstrateKey(ctx.tenantKey);
    const rendered = await renderGeneratedSourceArtifactFormats({
      artifactCode,
      artifactId: artifactRow.id,
      body,
      ctx,
      generatedAt: nowIso,
    });
    renderErrors = rendered.errors;
    const formats = [
      rendered.primary,
      ...(rendered.preview ? [rendered.preview] : []),
      ...(rendered.source ? [rendered.source] : []),
    ];

    for (const renderedArtifact of formats) {
      const renderedArtifactId = randomUUID();
      const fileCabinetArtifactType =
        renderedArtifact.role === "preview"
          ? `${artifactCode}__preview`
          : artifactCode;
      const artifactKind = registryArtifactKind(artifactCode, renderedArtifact);
      const sha256 = createHash("sha256")
        .update(renderedArtifact.bytes)
        .digest("hex");
      const blobUri = buildSourceArtifactBlobPath({
        tenantKey: substrateTenantKey,
        sourceEventId: ctx.event.id,
        artifactId: renderedArtifactId,
        filename: renderedArtifact.filename,
      });

      await getObjectStorageAdapter().upload(
        REGISTRY_STORAGE_BUCKET,
        blobUri,
        renderedArtifact.bytes,
        {
          contentType: renderedArtifact.contentType,
          cacheControl: "private, max-age=0",
          upsert: false,
        },
      );

      let fileCabinetVersion = 1;
      let supersedesArtifactId: string | null = null;
      if (activeClient?.id && renderedArtifact.role !== "source") {
        try {
          const prior = await getCurrentArtifacts(
            ctx.event.id,
            fileCabinetArtifactType,
            "generated",
          );
          fileCabinetVersion =
            prior.reduce((max, item) => Math.max(max, item.version), 0) + 1;
          supersedesArtifactId = prior[0]?.id ?? null;
        } catch (fileCabinetReadError) {
          console.error(
            "[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate] file cabinet prior-version read failed",
            fileCabinetReadError instanceof Error
              ? fileCabinetReadError.message
              : String(fileCabinetReadError),
          );
        }
      }

      const record = await registerSourceArtifactUpload({
        artifactId: renderedArtifactId,
        tenantKey: substrateTenantKey,
        sourceEventId: ctx.event.id,
        sourceEventRowId: ctx.event.id,
        stageKey: artifactRow.stage_key,
        artifactFamily: family,
        artifactKind,
        sourceOrigin: "generated",
        sourceFormat: registrySourceFormat(renderedArtifact.format),
        originalName: renderedArtifact.filename,
        blobUri,
        uploaderUserId: currentUser?.clerkUserId ?? tenancy.userId,
        mimeType: registryMimeType(renderedArtifact.format),
        sizeBytes: renderedArtifact.bytes.byteLength,
        sha256,
        dataClassification: "Confidential",
        createdBy: currentUser?.clerkUserId ?? tenancy.userId,
        ...(supersedesArtifactId
          ? { supersedesArtifactVersionId: supersedesArtifactId }
          : {}),
        ...(activeClient?.id && renderedArtifact.role !== "source"
          ? {
              fileCabinet: {
                clientId: activeClient.id,
                sourcingStage: artifactRow.stage_key,
                artifactGroup: "generated",
                artifactType: fileCabinetArtifactType,
                title:
                  renderedArtifact.role === "preview"
                    ? `${spec?.name ?? artifactCode} — Preview`
                    : (spec?.name ?? artifactCode),
                description: (() => {
                  const base =
                    renderedArtifact.role === "preview"
                      ? `HTML preview of the generated Source deliverable. ${SOURCE_AI_DRAFT_GOVERNANCE_DETAIL}`
                      : `${spec?.description ?? "Generated Source deliverable."} ${SOURCE_AI_DRAFT_GOVERNANCE_DETAIL}`;
                  // Never enumerate the matched term(s) here — this field can
                  // be read by clients/vendors, and some banned terms exist
                  // specifically to stay hidden from that audience. The raw
                  // match list stays internal-only, in
                  // body_generation_metadata.bannedTermMatches on the
                  // canonical substrate row.
                  return bannedTermMatches.length > 0
                    ? withComplianceReviewFlag(base)
                    : base;
                })(),
                fileName: renderedArtifact.filename,
                fileFormat: renderedArtifact.format,
                blobContainer: REGISTRY_STORAGE_BUCKET,
                blobPath: blobUri,
                fileSize: renderedArtifact.bytes.byteLength,
                version: fileCabinetVersion,
                status: "draft",
                generatedBy: currentUser?.clerkUserId ?? tenancy.userId,
                sourceBasis: `source_event_artifact_states:${artifactRow.id}`,
                citationReady: false,
                evidenceFamiliesUsed: [],
                missingInputs: [],
                clientCompleteItems: [],
                assumptions: [],
                supersedesArtifactId,
                blobSha256: sha256,
              },
            }
          : {}),
      });
      registryArtifacts.push(record);
      if (renderedArtifact.role === "primary") {
        registryArtifact = record;
      }
      if (
        activeClient?.id &&
        renderedArtifact.role !== "source" &&
        supersedesArtifactId
      ) {
        await supersedePriorVersions(
          ctx.event.id,
          fileCabinetArtifactType,
          "generated",
          record.id,
        );
      }
    }
  } catch (registryError) {
    registryPersistError =
      registryError instanceof Error
        ? registryError.message
        : String(registryError);
    console.error(
      "[POST /api/v1/source/:eventId/artifacts/:artifactCode/generate] registry persist failed",
      registryPersistError,
    );
  }

  if (!registryArtifact) {
    return Response.json(
      {
        error: "registry_persist_failed",
        detail:
          registryPersistError ??
          "Generated artifact body was created, but the primary File Cabinet artifact was not persisted.",
        artifact: view,
        renderErrors,
      },
      { status: 502 },
    );
  }

  const linkedWrite = await sourceWrite.updateArtifactBody({
    artifactRowId: artifactRow.id,
    columns: {
      linked_artifact_id: registryArtifact.id,
      updated_at: nowIso,
    },
  });
  if (!linkedWrite.ok || !linkedWrite.data) {
    return Response.json(
      {
        error: "linked_artifact_update_failed",
        detail:
          linkedWrite.error ??
          "Generated artifact was persisted, but the canvas state did not link to it.",
      },
      { status: 500 },
    );
  }
  view = artifactStateRowToView(
    linkedWrite.data as unknown as SourceEventArtifactStateRow,
  );

  const activityWrite = await sourceWrite.insertActivityLog({
    eventId: ctx.event.id,
    clientKey: ctx.tenantKey,
    actorUserId: currentUser?.personId ?? currentUser?.clerkUserId ?? null,
    actorDisplayName: currentUser?.name ?? currentUser?.email ?? null,
    actorRole: currentUser?.primaryRole ?? null,
    actionType: "artifact_generated",
    actionLabel: `Generated AI draft for ${artifactCode}`,
    stageKey: artifactRow.stage_key,
    artifactCode,
    reason: null,
    metadata: {
      model,
      promptTemplateVersion: template.version,
      stopReason,
      tokensIn,
      tokensOut,
      latencyMs: Date.now() - startedAt,
      renderedFormats: registryArtifacts.map((artifact) => ({
        id: artifact.id,
        sourceFormat: artifact.sourceFormat,
        blobUri: artifact.blobUri,
      })),
      renderErrors,
      qualityGate: qualityGate
        ? {
            standardId: qualityGate.standardId,
            passed: qualityGate.passed,
            attempts: qualityGate.attempts,
            rewriteAttempted: qualityGate.rewriteAttempted,
          }
        : null,
      sectionVerification: generationMetadata.sectionVerification ?? null,
    },
    occurredAtIso: nowIso,
  });
  if (!activityWrite.ok) {
    console.error(
      "[source artifact generation activity] insert failed:",
      activityWrite.error,
    );
  }

  // Slice 1.8: persist the validated reasoning envelope to source_reasoning_envelopes
  // for durable audit lineage. Non-fatal — if this fails, the envelope is still present
  // in body_generation_metadata.reasoningEnvelope and generation succeeds normally.
  if (
    reasoningCapture.status !== "disabled" &&
    reasoningCapture.envelope !== null
  ) {
    const env = reasoningCapture.envelope;
    const { error: envelopeInsertError } = await supabase
      .from("source_reasoning_envelopes")
      .insert({
        envelope_id: env.envelopeId,
        source_event_id: ctx.event.id,
        artifact_code: artifactCode,
        tenant_key: ctx.tenantKey,
        stage: env.stage,
        status: reasoningCapture.status,
        archetype: env.archetype ?? null,
        rigor: env.rigor ?? null,
        confidence_label: env.confidence?.label ?? null,
        confidence_score: env.confidence?.score ?? null,
        refusal_reason: env.refusal?.reason ?? null,
        missing_evidence: env.refusal?.missingEvidence
          ? JSON.stringify(env.refusal.missingEvidence)
          : null,
        claims: env.claims?.length ? JSON.stringify(env.claims) : null,
        envelope: JSON.stringify(env),
        generated_by_user_id: currentUser?.clerkUserId ?? null,
        generated_at: nowIso,
      });
    if (envelopeInsertError) {
      console.error(
        "[source reasoning envelope persist] insert failed:",
        envelopeInsertError.message,
      );
    }
  }

  return Response.json({
    ok: true,
    qualityGateFailed: Boolean(qualityGateFailedDetail),
    detail: qualityGateFailedDetail,
    artifact: view,
    registryArtifact,
    registryArtifacts,
    renderErrors,
    generation: {
      ...generationMetadata,
      latencyMs: Date.now() - startedAt,
    },
  });
}

type QualityGateResult =
  | {
      ok: true;
      body: string;
      qualityGate: SourceArtifactQualityGateMetadata;
    }
  | {
      ok: false;
      error: string;
      detail: string;
      status: number;
      body?: string;
      qualityGate?: SourceArtifactQualityGateMetadata;
    };

async function runConsultingGradeQualityGate(args: {
  artifactCode: string;
  artifactName: string;
  body: string;
  ctx: SourceGenerationContext;
  upstreamBound: Record<string, string>;
  tenantId: string;
  userId: string;
  artifactId: string;
  model: string;
  maxTokens: number;
  requestStartedAtMs: number;
}): Promise<QualityGateResult> {
  const sourceContext = buildSourceQualitySourceContext({
    ctx: args.ctx,
    upstreamBound: args.upstreamBound,
    artifactCode: args.artifactCode,
  });
  const reviews = [];
  const firstReview = await runConsultingGradeReview({
    artifactCode: args.artifactCode,
    artifactName: args.artifactName,
    body: args.body,
    sourceContext,
    tenantId: args.tenantId,
    userId: args.userId,
    artifactId: args.artifactId,
    model: args.model,
  });
  if (!firstReview.ok) return firstReview;
  reviews.push(firstReview.review);
  if (firstReview.review.pass) {
    return {
      ok: true,
      body: args.body,
      qualityGate: buildSourceQualityGateMetadata({
        reviews,
        rewriteAttempted: false,
      }),
    };
  }

  const remainingBudgetMs =
    SOURCE_SYNC_GENERATION_BUDGET_MS - (Date.now() - args.requestStartedAtMs);
  if (remainingBudgetMs < SOURCE_QUALITY_REWRITE_MIN_REMAINING_MS) {
    const qualityGate = buildSourceQualityGateMetadata({
      reviews,
      rewriteAttempted: false,
    });
    return {
      ok: false,
      error: "quality_gate_failed",
      detail: [
        qualityGate.finalSummary,
        "Skipped automatic rewrite because the synchronous request budget was nearly exhausted; regenerate after strengthening the upstream evidence or artifact prompt.",
      ].join(" "),
      status: 422,
      body: args.body,
      qualityGate,
    };
  }

  const rewritePrompt = buildSourceConsultingGradeRewritePrompt({
    artifactCode: args.artifactCode,
    artifactName: args.artifactName,
    bodyMarkdown: args.body,
    sourceContext,
    review: firstReview.review,
  });
  const rewritePreflight = await preflightAnthropicDirectClient({
    tenantId: args.tenantId,
    userId: args.userId,
    workflow: "source-artifact-quality-rewrite",
    artifactId: args.artifactId,
    artifactType: args.artifactCode,
    model: args.model,
    prompt: rewritePrompt,
    dataClass: "confidential",
    metadata: {
      eventId: args.ctx.event.id,
      sourceEventId: args.ctx.event.id,
      artifactCode: args.artifactCode,
      qualityStandard: "partner-grade-consulting-deliverable-v1",
    },
  });
  if (!rewritePreflight.ok) {
    return {
      ok: false,
      error: "ai_egress_denied",
      detail: rewritePreflight.reason,
      status: 403,
      qualityGate: buildSourceQualityGateMetadata({
        reviews,
        rewriteAttempted: true,
      }),
    };
  }
  const rewriteStream = rewritePreflight.client.messages.stream({
    model: args.model,
    max_tokens: args.maxTokens,
    system:
      "You are Ava writing a client-ready, evidence-disciplined Source deliverable. Return markdown only.",
    messages: [{ role: "user", content: rewritePrompt }],
  });
  const rewriteParts: string[] = [];
  for await (const chunk of rewriteStream) {
    if (
      chunk.type === "content_block_delta" &&
      chunk.delta.type === "text_delta"
    ) {
      rewriteParts.push(chunk.delta.text);
    }
  }
  await rewriteStream.finalMessage();
  let rewrittenBody = rewriteParts.join("").trim();
  if (!rewrittenBody) {
    return {
      ok: false,
      error: "quality_rewrite_empty",
      detail: "Claude returned an empty quality-rewrite body.",
      status: 502,
      qualityGate: buildSourceQualityGateMetadata({
        reviews,
        rewriteAttempted: true,
      }),
    };
  }
  rewrittenBody = completeD09RfpGovernanceSections({
    artifactCode: args.artifactCode,
    body: rewrittenBody,
    ctx: args.ctx,
  });
  rewrittenBody = sanitizeClientFacingSourceDraft(rewrittenBody, {
    artifactCode: args.artifactCode,
    companyName: args.ctx.tenantName,
  });

  const secondReview = await runConsultingGradeReview({
    artifactCode: args.artifactCode,
    artifactName: args.artifactName,
    body: rewrittenBody,
    sourceContext,
    tenantId: args.tenantId,
    userId: args.userId,
    artifactId: args.artifactId,
    model: args.model,
  });
  if (!secondReview.ok) return secondReview;
  reviews.push(secondReview.review);
  const qualityGate = buildSourceQualityGateMetadata({
    reviews,
    rewriteAttempted: true,
  });
  if (!qualityGate.passed) {
    return {
      ok: false,
      error: "quality_gate_failed",
      detail: qualityGate.finalSummary,
      status: 422,
      body: rewrittenBody,
      qualityGate,
    };
  }
  return { ok: true, body: rewrittenBody, qualityGate };
}

async function runConsultingGradeReview(args: {
  artifactCode: string;
  artifactName: string;
  body: string;
  sourceContext: string;
  tenantId: string;
  userId: string;
  artifactId: string;
  model: string;
}): Promise<
  | { ok: true; review: ReturnType<typeof parseSourceConsultingGradeReview> }
  | {
      ok: false;
      error: string;
      detail: string;
      status: number;
    }
> {
  const reviewPrompt = buildSourceConsultingGradeReviewPrompt({
    artifactCode: args.artifactCode,
    artifactName: args.artifactName,
    bodyMarkdown: args.body,
    sourceContext: args.sourceContext,
  });
  const preflight = await preflightAnthropicDirectClient({
    tenantId: args.tenantId,
    userId: args.userId,
    workflow: "source-artifact-quality-review",
    artifactId: args.artifactId,
    artifactType: args.artifactCode,
    model: args.model,
    prompt: reviewPrompt,
    dataClass: "confidential",
    metadata: {
      artifactCode: args.artifactCode,
      qualityStandard: "partner-grade-consulting-deliverable-v1",
    },
  });
  if (!preflight.ok) {
    return {
      ok: false,
      error: "ai_egress_denied",
      detail: preflight.reason,
      status: 403,
    };
  }
  const reviewStream = preflight.client.messages.stream({
    model: args.model,
    max_tokens: SOURCE_QUALITY_REVIEW_MAX_TOKENS,
    system:
      "You are a strict consulting-deliverable quality evaluator. Use the record_source_quality_review tool exactly once.",
    tools: [SOURCE_QUALITY_REVIEW_TOOL],
    tool_choice: {
      type: "tool",
      name: SOURCE_QUALITY_REVIEW_TOOL_NAME,
    },
    messages: [{ role: "user", content: reviewPrompt }],
  });
  const response = await reviewStream.finalMessage();
  const raw = extractSourceQualityReviewPayload(response.content);
  try {
    return {
      ok: true,
      review: parseSourceConsultingGradeReview({
        artifactCode: args.artifactCode,
        artifactName: args.artifactName,
        raw,
      }),
    };
  } catch (error) {
    const firstError =
      error instanceof Error
        ? error.message
        : "Claude returned invalid quality-review JSON.";
    const retryPrompt = buildSourceConsultingGradeCompactRetryPrompt({
      artifactCode: args.artifactCode,
      artifactName: args.artifactName,
      bodyMarkdown: args.body,
      sourceContext: args.sourceContext,
      previousError: firstError,
    });
    const retryStream = preflight.client.messages.stream({
      model: args.model,
      max_tokens: SOURCE_QUALITY_REVIEW_MAX_TOKENS,
      system: [
        "You are a strict consulting-deliverable quality evaluator.",
        "Your previous response was not parseable as the required structured review.",
        "Use the record_source_quality_review tool exactly once.",
        "The tool input must include all 10 dimensionScores entries.",
        "Keep rationales and fixes concise.",
      ].join(" "),
      tools: [SOURCE_QUALITY_REVIEW_TOOL],
      tool_choice: {
        type: "tool",
        name: SOURCE_QUALITY_REVIEW_TOOL_NAME,
      },
      messages: [{ role: "user", content: retryPrompt }],
    });
    const retryResponse = await retryStream.finalMessage();
    const retryRaw = extractSourceQualityReviewPayload(retryResponse.content);
    try {
      return {
        ok: true,
        review: parseSourceConsultingGradeReview({
          artifactCode: args.artifactCode,
          artifactName: args.artifactName,
          raw: retryRaw,
        }),
      };
    } catch (retryError) {
      const retryMessage =
        retryError instanceof Error
          ? retryError.message
          : "Claude returned invalid quality-review JSON on retry.";
      console.warn("[source quality review] invalid JSON after retry", {
        artifactCode: args.artifactCode,
        firstError,
        retryError: retryMessage,
      });
      return {
        ok: true,
        review: buildMalformedSourceConsultingGradeReview({
          artifactCode: args.artifactCode,
          artifactName: args.artifactName,
          reason: `${firstError}; retry failed: ${retryMessage}`,
        }),
      };
    }
  }
}

function extractSourceQualityReviewPayload(
  content: Array<{
    type: string;
    name?: string;
    input?: unknown;
    text?: string;
  }>,
): string {
  const toolUse = content.find(
    (block) =>
      block.type === "tool_use" &&
      block.name === SOURCE_QUALITY_REVIEW_TOOL_NAME,
  );
  if (toolUse) return JSON.stringify(toolUse.input ?? {});
  return content
    .map((block) => (block.type === "text" ? (block.text ?? "") : ""))
    .join("")
    .trim();
}

function buildDeterministicFallbackBody(args: {
  artifactCode: string;
  ctx: SourceGenerationContext;
  upstreamBound: Record<string, string>;
}): string {
  const event = args.ctx.event;
  const upstreamCodes = Object.keys(args.upstreamBound);
  return [
    `# ${event.name} · ${args.artifactCode}`,
    "",
    "## §1 · Deterministic Source draft",
    "ANTHROPIC_API_KEY is not configured, so Source produced this deterministic draft from the tenant-scoped event substrate instead of calling a model.",
    "",
    "## §2 · Event facts",
    `- Tenant: ${args.ctx.tenantName} (${args.ctx.tenantKey})`,
    `- Event code: ${event.code}`,
    `- Stage: ${event.currentStageKey}`,
    event.owner ? `- Owner: ${event.owner}` : "- Owner: not recorded",
    event.archetype
      ? `- Archetype: ${event.archetype}`
      : "- Archetype: not recorded",
    event.rigor ? `- Rigor: ${event.rigor}` : "- Rigor: not recorded",
    event.estimatedValueUsd
      ? `- Estimated value: $${event.estimatedValueUsd.toLocaleString()}`
      : "- Estimated value: not recorded",
    "",
    "## §3 · Bound context",
    upstreamCodes.length
      ? `Bound upstream artifacts: ${upstreamCodes.join(", ")}.`
      : "No upstream artifact bodies were bound for this draft.",
    "",
    "## §4 · Human review required",
    "This fallback is decision-support scaffolding only. Configure ANTHROPIC_API_KEY and regenerate before treating the artifact as a model-authored Source draft.",
  ].join("\n");
}
