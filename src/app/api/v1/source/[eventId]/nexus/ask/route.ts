import type { NextRequest } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "@/lib/auth/tenancy";
import {
  createSourceNexusApiStubResponse,
  normalizeSourceNexusApiRequestBody,
} from "@/lib/source/nexus-api";
import { getActiveClientRow } from "@/lib/active-client";
import {
  APEX_RETAIL_BROKER_TENANT_KEY,
  APEX_RETAIL_CLIENT_KEY,
  buildApexRetailSourceContextAssemblyInput,
  toApexRetailLiveTenantContextSnapshot,
  type ApexRetailAdapterResult,
} from "@/lib/source/adapters/apex-retail-adapter";
import type { SourceLiveTenantContextSnapshot } from "@/lib/source/agent-context";
import type { SourcingEventDetail } from "@/lib/source/types";
import {
  getSourcingEvent,
  getSourcingEventForResolvedClient,
  sourceEventRowToDetail,
} from "@/lib/source/queries";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { preflightAnthropicDirectClient } from "@/lib/integrations/ai-egress";
import { composeSentinelSystemPrompt } from "@/lib/agent/voice-doctrine/sentinel";
import { loadContractEvidenceRuntimeSummary } from "@/lib/source/contract-evidence/read-model";
import type { ContractEvidenceMetricSummary } from "@/lib/source/contract-evidence/read-model";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  buildVendorResponseMveProfiles,
  buildVendorChallengeIntelligence,
  buildVendorBafoInstructionPack,
  buildVendorEvaluationDecisionView,
} from "@/lib/source/proposal-intelligence/mve-profile";
import { getContractOptimizationProfile } from "@/lib/source/contract-optimization/read";
import { enforceSourceExistingEventWriteTruth } from "@/lib/source/ava/answer-quality-gate";
import { buildSourceArtifactStandardsContext } from "@/lib/source/artifact-lifecycle-matrix";
import { buildVendorCoverageGovernedAnswer } from "@/lib/source/ava/vendor-coverage-governed-answer";
import {
  buildArtifactQualityGovernedAnswer,
  looksLikeArtifactQualityQuestion,
} from "@/lib/source/ava/artifact-quality-governed-answer";
import {
  buildEvidenceReadinessGovernedAnswer,
  looksLikeEvidenceReadinessQuestion,
} from "@/lib/source/ava/evidence-readiness-governed-answer";
import {
  buildValueLedgerGovernedAnswer,
  looksLikeValueLedgerQuestion,
} from "@/lib/source/ava/value-ledger-governed-answer";
import {
  resolveAuthoritativeArtifactSlots,
  type AuthoritativeArtifactCandidate,
} from "@/lib/source/client-final-artifacts";
import { getLatestArtifactAcceptancesByArtifactIds } from "@/lib/source/artifact-acceptances";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mirrors the intent-heuristic pattern in structured-exhibits.ts (a keyword
 * regex, not a new NLU system) — matches a question about vendor response
 * coverage on this event's value levers. */
function looksLikeVendorCoverageQuestion(prompt: string | undefined): boolean {
  if (!prompt) return false;
  const q = prompt.toLowerCase();
  const hasParticipantOrProposal =
    /\b(vendor|vendors|supplier|suppliers|bidder|bidders|respondent|respondents|proposal|proposals)\b/.test(
      q,
    );
  const hasResponseCoverageLanguage =
    /\b(coverage|addressed|dodged|respond|responded|response|responses|answer|answered|cover|covered)\b/.test(
      q,
    );
  const hasUnsupportedClaimLanguage =
    /\b(claim|claims|assertion|assertions)\b/.test(q) &&
    /\b(unsupported|unsubstantiated|unproven|not supported|lacks evidence|lack evidence|without evidence|no evidence)\b/.test(
      q,
    );
  return (
    (hasParticipantOrProposal && hasResponseCoverageLanguage) ||
    hasUnsupportedClaimLanguage
  );
}

function formatContractEvidenceMetricValue(
  metric: ContractEvidenceMetricSummary,
): string {
  const value = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(metric.value);
  return metric.unit ? `${value} ${metric.unit}` : value;
}

type SourceNexusRouteContext = {
  params: Promise<{ eventId?: string }>;
};

const SOURCE_ASK_EVENT_CACHE_TTL_MS = 10 * 60 * 1000;
const sourceAskEventCache = new Map<
  string,
  { event: SourcingEventDetail; cachedAt: number }
>();

export async function POST(
  request: NextRequest,
  { params }: SourceNexusRouteContext,
) {
  try {
    const tenancy = await requireTenancy();
    const { eventId } = await params;
    const bodyResult = await parseSourceNexusRequestBody(request);

    if (!bodyResult.ok) {
      return Response.json(bodyResult.body, { status: bodyResult.status });
    }

    const normalizedBody = normalizeSourceNexusApiRequestBody(bodyResult.body);
    const activeClient = (await getActiveClientRow(tenancy.clientKey).catch(
      () => null,
    )) ?? {
      id: tenancy.clientId,
      name: tenancy.clientKey,
      industry_code: null,
      key: tenancy.clientKey,
    };
    const activeClientKey = (
      activeClient.key ??
      tenancy.clientKey ??
      "unknown"
    ).trim();
    const activeClientName =
      (activeClient.name ?? activeClientKey).trim() || activeClientKey;
    const apexContext = await loadApexRetailSourceIntelligence({
      eventId,
      userId: tenancy.userId,
      prompt: normalizedBody.prompt,
      selectedAttachmentIds: normalizedBody.selectedAttachmentIds,
      clientId: tenancy.clientId,
      clientKey: activeClientKey,
    });
    const fallbackLiveEventDetail = eventId
      ? await getSourcingEventForAskWithRetry(eventId, {
          activeClientKey,
          activeClientName,
          tenancy,
        })
      : null;
    const apexLiveEventDetailCandidate = apexContext?.liveContext.sourceEvent
      ? sourceEventRowToDetail(
          apexContext.liveContext.sourceEvent,
          "Apex Retail Group",
        )
      : undefined;
    const apexLiveEventMatches = sourceEventMatchesRequestedEvent({
      requestedEventId: eventId,
      candidate: apexLiveEventDetailCandidate,
      fallback: fallbackLiveEventDetail,
    });
    const apexLiveEventDetail = apexLiveEventMatches
      ? apexLiveEventDetailCandidate
      : undefined;
    const apexLiveTenantContext =
      apexContext && apexLiveEventMatches
        ? toApexRetailLiveTenantContextSnapshot(apexContext.liveContext)
        : undefined;
    const liveEventDetail =
      apexLiveEventDetail ?? fallbackLiveEventDetail ?? undefined;
    const displayTenantName = activeClientName;
    const liveTenantContext =
      apexLiveTenantContext ??
      (fallbackLiveEventDetail
        ? await buildEventIntakeTenantContextSnapshot({
            activeClientKey,
            activeClientName: displayTenantName,
            event: fallbackLiveEventDetail,
            prompt: normalizedBody.prompt,
          })
        : undefined);

    if (eventId && !liveEventDetail) {
      return Response.json(
        {
          ok: false,
          error: "not_found",
          detail: "No Source event found for the active client.",
          noModel: true,
        },
        { status: 404 },
      );
    }

    // Source canvas migration · before invoking the (unchanged) deterministic
    // runtime, link any attachments from this turn to the source event so the
    // canvas owns them across turns and a future Atlas read can join on
    // linked_event_id. The DB column is nullable + tenant-isolated via RLS,
    // so a no-op is safe when no attachments are present.
    if (
      eventId &&
      normalizedBody.selectedAttachmentIds &&
      normalizedBody.selectedAttachmentIds.length > 0
    ) {
      await linkAttachmentsToEvent({
        attachmentIds: normalizedBody.selectedAttachmentIds,
        tenantId: tenancy.clientId,
        eventId,
      });
    }

    const stubInput = {
      ...normalizedBody,
      eventId,
      tenant: apexContext?.input.tenant ?? {
        tenantId: tenancy.clientId,
        tenantKey: activeClientKey,
        tenantName: displayTenantName,
        activeClientId: tenancy.clientId,
        activeClientName: displayTenantName,
      },
      user: { id: tenancy.userId },
      liveEventDetail,
      liveTenantContext,
    };

    // Build context + deterministic briefing (always needed for fallback + suggested actions).
    const stubResponse = createSourceNexusApiStubResponse(stubInput);

    // Attempt a real Claude call. Falls back to stub summary on any failure.
    const claudeSummary = await callSentinelWithClaude({
      prompt: normalizedBody.prompt ?? "",
      briefingContext: stubResponse.summary ?? "",
      tenantKey: activeClient?.key ?? null,
      tenantId: tenancy.clientId,
    }).catch(() => null);

    const guardedClaudeSummary =
      claudeSummary && eventId
        ? enforceSourceExistingEventWriteTruth(claudeSummary)
        : claudeSummary;

    const response = guardedClaudeSummary
      ? { ...stubResponse, summary: guardedClaudeSummary, noModel: false }
      : stubResponse;

    // Opt-in structured-answer branch (mirrors /api/intelligence/ask's
    // Accept: application/x-ndjson convention). Every existing caller sends
    // the default Accept header and gets the exact unchanged JSON response
    // above — this branch only engages for a caller that explicitly asks for
    // NDJSON, and even then it always still carries the prose summary as its
    // first line so nothing about today's chat behavior is lost.
    const wantsNdjson =
      request.headers.get("accept")?.includes("application/x-ndjson") ?? false;
    if (wantsNdjson) {
      let agentAnswer = null;
      if (eventId && looksLikeVendorCoverageQuestion(normalizedBody.prompt)) {
        agentAnswer = await buildVendorCoverageGovernedAnswer({
          eventId,
          clientKey: activeClientKey,
          tenantId: tenancy.clientId ?? null,
          question: normalizedBody.prompt ?? "",
          eventType: liveEventDetail?.archetype ?? null,
        }).catch((err) => {
          // A failure here must never break the chat turn — the caller
          // still gets the prose summary line. But swallowing silently
          // makes an honest `null` (no signal / no archetype / no vendor
          // rows) indistinguishable from a real bug — log so the two
          // are distinguishable in Log Analytics.
          console.error(
            "[source.nexus-ask.vendor-coverage-governed-answer.failed]",
            JSON.stringify({
              eventId,
              clientKey: activeClientKey,
              eventType: liveEventDetail?.archetype ?? null,
              message: err instanceof Error ? err.message : String(err),
              stack: err instanceof Error ? err.stack : undefined,
            }),
          );
          return null;
        });
      } else if (
        eventId &&
        looksLikeValueLedgerQuestion(normalizedBody.prompt)
      ) {
        agentAnswer = await buildValueLedgerGovernedAnswer({
          eventId,
          eventName: liveEventDetail?.name ?? null,
          clientKey: activeClientKey,
          tenantId: tenancy.clientId ?? null,
          question: normalizedBody.prompt ?? "",
        }).catch((err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : JSON.stringify(err);
          console.error(
            "[source.nexus-ask.value-ledger-governed-answer.failed]",
            JSON.stringify({
              eventId,
              resolvedEventId: liveEventDetail?.id ?? eventId,
              eventCode: liveEventDetail?.code ?? null,
              clientKey: activeClientKey,
              message: errorMessage,
              stack: err instanceof Error ? err.stack : undefined,
            }),
          );
          return null;
        });
      } else if (
        eventId &&
        looksLikeArtifactQualityQuestion(normalizedBody.prompt)
      ) {
        agentAnswer = await buildArtifactQualityGovernedAnswer({
          eventId: liveEventDetail?.id ?? eventId,
          clientKey: activeClientKey,
          tenantId: tenancy.clientId ?? null,
          question: normalizedBody.prompt ?? "",
        }).catch((err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : JSON.stringify(err);
          console.error(
            "[source.nexus-ask.artifact-quality-governed-answer.failed]",
            JSON.stringify({
              eventId,
              resolvedEventId: liveEventDetail?.id ?? eventId,
              clientKey: activeClientKey,
              message: errorMessage,
              stack: err instanceof Error ? err.stack : undefined,
            }),
          );
          return null;
        });
      } else if (
        eventId &&
        looksLikeEvidenceReadinessQuestion(normalizedBody.prompt)
      ) {
        agentAnswer = await buildEvidenceReadinessGovernedAnswer({
          eventId: liveEventDetail?.id ?? eventId,
          eventAliases: [
            eventId,
            liveEventDetail?.id,
            liveEventDetail?.code,
          ].filter((value): value is string => Boolean(value)),
          clientKey: activeClientKey,
          tenantId: tenancy.clientId ?? null,
          question: normalizedBody.prompt ?? "",
        }).catch((err) => {
          const errorMessage =
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : JSON.stringify(err);
          console.error(
            "[source.nexus-ask.evidence-readiness-governed-answer.failed]",
            JSON.stringify({
              eventId,
              resolvedEventId: liveEventDetail?.id ?? eventId,
              eventCode: liveEventDetail?.code ?? null,
              clientKey: activeClientKey,
              message: errorMessage,
              stack: err instanceof Error ? err.stack : undefined,
            }),
          );
          return null;
        });
      }
      const ndjsonSummary = agentAnswer
        ? {
            ...response,
            summary: agentAnswer.directAnswer,
            noModel: true,
          }
        : response;
      const lines = [JSON.stringify({ type: "summary", ...ndjsonSummary })];
      if (agentAnswer) {
        lines.push(
          JSON.stringify({ type: "agent-answer", answer: agentAnswer }),
        );
      }
      return new Response(lines.join("\n") + "\n", {
        status: response.httpStatus,
        headers: {
          "Content-Type": "application/x-ndjson",
          "Cache-Control": "no-cache",
        },
      });
    }

    return Response.json(response, { status: response.httpStatus });
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
              : "Unknown Source Nexus API stub error",
          noModel: true,
        },
        { status: 500 },
      );
    }
  }
}

function sourceEventMatchesRequestedEvent(args: {
  requestedEventId?: string;
  candidate?: SourcingEventDetail;
  fallback: SourcingEventDetail | null;
}): boolean {
  if (!args.candidate) return false;
  if (!args.requestedEventId) return true;

  const requestedAliases = new Set(
    [args.requestedEventId, args.fallback?.id, args.fallback?.code]
      .filter((value): value is string => Boolean(value))
      .map((value) => value.trim().toLowerCase()),
  );
  const candidateIds = [args.candidate.id, args.candidate.code].map((value) =>
    value.trim().toLowerCase(),
  );
  return candidateIds.some((candidateId) => requestedAliases.has(candidateId));
}

async function getSourcingEventForAskWithRetry(
  eventId: string,
  args: {
    activeClientKey: string;
    activeClientName: string;
    tenancy: Awaited<ReturnType<typeof requireTenancy>>;
  },
): Promise<SourcingEventDetail | null> {
  const cacheKey = `${args.activeClientKey.trim().toLowerCase()}:${eventId
    .trim()
    .toLowerCase()}`;
  const cached = sourceAskEventCache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < SOURCE_ASK_EVENT_CACHE_TTL_MS) {
    return cached.event;
  }

  const retryDelaysMs = [0, 150, 450];

  for (const delayMs of retryDelaysMs) {
    if (delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const event = await getSourcingEventForResolvedClient(eventId, {
      activeClientKey: args.activeClientKey,
      activeClientName: args.activeClientName,
      tenancy: args.tenancy,
      enforceSourcePolicy: false,
    }).catch(() => null);
    if (event) {
      sourceAskEventCache.set(cacheKey, { event, cachedAt: Date.now() });
      return event;
    }

    const seededOrPolicyEvent = await getSourcingEvent(
      eventId,
      args.activeClientKey,
    ).catch(() => null);
    if (seededOrPolicyEvent) {
      sourceAskEventCache.set(cacheKey, {
        event: seededOrPolicyEvent,
        cachedAt: Date.now(),
      });
      return seededOrPolicyEvent;
    }
  }

  const staleCached = sourceAskEventCache.get(cacheKey);
  if (staleCached) return staleCached.event;

  return null;
}

type SourceArtifactContextRow = {
  id: string;
  source_event_id: string;
  title: string | null;
  stage_key: string | null;
  artifact_family: string | null;
  artifact_kind: string | null;
  source_origin: string | null;
  source_format: string | null;
  original_name: string | null;
  file_name: string | null;
  file_format: string | null;
  blob_uri: string | null;
  blob_container: string | null;
  blob_path: string | null;
  version: number | string | null;
  status: string | null;
  parse_status: string | null;
  evidence_state: string | null;
  approval_state: string | null;
  lifecycle_state: string | null;
  blob_sha256: string | null;
  is_client_final: boolean | null;
  is_current_authoritative: boolean | null;
  source_generated_artifact_id: string | null;
  supersedes_artifact_id: string | null;
  superseded_by_artifact_id: string | null;
  client_final_uploaded_at: string | null;
  client_final_accepted_at: string | null;
  client_final_note: string | null;
  client_final_stakeholder_group: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type SourceArtifactChunkContextRow = {
  artifact_id: string;
  chunk_id: string;
  chunk_text: string | null;
  chunk_kind: string | null;
  confidence: number | null;
};

type SourceArtifactFactContextRow = {
  artifact_id: string;
  fact_type: string | null;
  fact_key: string | null;
  fact_value: unknown;
  confidence: number | null;
};

type SourceEventArtifactContext = {
  artifacts: SourceArtifactContextRow[];
  chunks: SourceArtifactChunkContextRow[];
  facts: SourceArtifactFactContextRow[];
};

const PROPOSAL_EVIDENCE_PATTERN =
  /\b(bafo|bid|bidder|commercial response|evaluation|finalist|pricing workbook|proposal|scorecard|supplier response|vendor response)\b/i;

const PROPOSAL_FACT_PATTERN =
  /\b(bafo|bid|committed_value|concession|proposal|response_addressed|score|vendor_(?:bid|headline|response))\b/i;

function hasEventSpecificProposalEvidence(
  context: SourceEventArtifactContext,
): boolean {
  const hasProposalArtifact = context.artifacts.some((artifact) => {
    const text = [
      artifact.title,
      artifact.artifact_family,
      artifact.artifact_kind,
      artifact.original_name,
      artifact.file_name,
      artifact.file_format,
      artifact.stage_key,
    ]
      .filter((value): value is string => Boolean(value))
      .join(" ");
    if (!PROPOSAL_EVIDENCE_PATTERN.test(text)) return false;
    return (
      artifact.source_origin === "uploaded" ||
      artifact.is_client_final === true ||
      Boolean(artifact.client_final_accepted_at) ||
      artifact.parse_status === "parsed"
    );
  });
  if (hasProposalArtifact) return true;

  return context.facts.some((fact) =>
    PROPOSAL_FACT_PATTERN.test(
      [fact.fact_type, fact.fact_key]
        .filter((value): value is string => Boolean(value))
        .join(" "),
    ),
  );
}

async function buildEventIntakeTenantContextSnapshot(args: {
  activeClientKey?: string;
  activeClientName?: string;
  event: SourcingEventDetail;
  prompt?: string;
}): Promise<SourceLiveTenantContextSnapshot> {
  const clientKey = args.activeClientKey ?? "unknown";
  const brokerTenantKey =
    clientKey === APEX_RETAIL_BROKER_TENANT_KEY
      ? APEX_RETAIL_BROKER_TENANT_KEY
      : clientKey;
  const artifactContext = await loadSourceEventArtifactContext(args.event.id);
  const artifactStandards = buildSourceArtifactStandardsContext({
    artifacts: artifactContext.artifacts.map((artifact) => ({
      artifactKind: artifact.artifact_kind,
      artifactType: artifact.artifact_kind,
      artifactGroup: artifact.artifact_family,
      sourceOrigin: artifact.source_origin,
      status: artifact.status,
      approvalState: artifact.approval_state,
      evidenceState: artifact.evidence_state,
      isClientFinal: artifact.is_client_final,
    })),
    stageKey: args.event.currentStageKey,
    prompt: args.prompt,
    limit: 10,
  });
  const structuredEvidenceContext = await loadContractEvidenceRuntimeSummary({
    db: getAzureReadFluentClient(),
    tenantKey: clientKey,
    sourceEventId: args.event.id,
  });
  const vendorProfiles = hasEventSpecificProposalEvidence(artifactContext)
    ? buildVendorResponseMveProfiles({
        id: args.event.id,
        code: args.event.code,
        name: args.event.name,
        accountName: args.event.accountName,
      })
    : null;
  const vendorChallenges = buildVendorChallengeIntelligence(vendorProfiles);
  const vendorBafoPack = buildVendorBafoInstructionPack(vendorChallenges);
  const vendorEvaluationView = buildVendorEvaluationDecisionView(
    vendorProfiles,
    vendorChallenges,
    vendorBafoPack,
  );
  const contractOptimizationProfile = await getContractOptimizationProfile(
    clientKey,
    args.event.id,
  ).catch(() => null);
  const eventEvidence = [
    {
      recordId: "trigger",
      title: "Source intake trigger",
      excerpt: `Trigger: ${args.event.problemStatement}`,
      score: 16,
    },
    {
      recordId: "scope",
      title: "Source intake scope and value basis",
      excerpt: `Scope and value basis: ${args.event.synopsis}`,
      score: 15,
    },
    {
      recordId: "decision-owner",
      title: "Source intake decision owner",
      excerpt: `Decision owner: ${args.event.scorecard.decisionOwner || args.event.owner}`,
      score: 14,
    },
    ...args.event.scorecard.criteria.map((criterion, index) => ({
      recordId: criterion.id,
      title: criterion.label,
      excerpt: `${criterion.label}: ${criterion.note ?? criterion.status}`,
      score: 12 - index,
    })),
    ...(vendorChallenges?.challengeLog.slice(0, 8).map((challenge, index) => ({
      recordId: challenge.challengeId,
      title: `${challenge.vendorName} challenge`,
      excerpt: [
        `${challenge.issueCategory.replaceAll("_", " ")}: ${challenge.finding}`,
        `Ask: ${challenge.clarificationQuestion}`,
        `Scoring implication: ${challenge.scoringImplication}`,
      ].join(" "),
      score: 22 - index,
    })) ?? []),
    ...(vendorChallenges?.leverageSeeds.slice(0, 8).map((seed, index) => ({
      recordId: seed.seedId,
      title: `${seed.vendorName} BAFO leverage seed`,
      excerpt: [
        `${seed.leverType.replaceAll("_", " ")}: ${seed.finding}`,
        `Recommended ask: ${seed.recommendedAsk}`,
        `BAFO language: ${seed.bafoLanguage}`,
      ].join(" "),
      score: 18 - index,
    })) ?? []),
    ...(vendorBafoPack?.vendorInstructions.flatMap((instruction, vendorIndex) =>
      instruction.questions.slice(0, 4).map((question, questionIndex) => ({
        recordId: question.questionId,
        title: `${instruction.vendorName} BAFO instruction`,
        excerpt: [
          `${question.category}: ${question.question}`,
          `Required response: ${question.requiredResponseFormat}`,
          `Scoring holdback: ${question.scoringDisposition}`,
        ].join(" "),
        score: 26 - vendorIndex * 4 - questionIndex,
      })),
    ) ?? []),
    ...(vendorEvaluationView?.vendorSummaries.map((summary, index) => ({
      recordId: `${summary.vendorId}-evaluation-summary`,
      title: `${summary.vendorName} evaluation summary`,
      excerpt: [
        `Rank ${summary.rank}; weighted score ${summary.weightedScore.toFixed(1)}/10; recommendation ${summary.recommendation.replaceAll("_", " ")}.`,
        summary.decisionRationale,
        `Finalist posture: ${summary.finalistPosture}`,
        `Tradeoffs: ${summary.tradeoffs.join(" ")}`,
        summary.conditions.length
          ? `Conditions: ${summary.conditions.join(" ")}`
          : "Conditions: no additional conditions beyond human score lock.",
      ].join(" "),
      score: 30 - index,
    })) ?? []),
    ...(vendorEvaluationView?.scoreImprovementScenarios.map(
      (scenario, index) => ({
        recordId: `${scenario.vendorId}-score-impact`,
        title: `${scenario.vendorName} score impact scenario`,
        excerpt: [
          `Score movement: ${scenario.currentScore.toFixed(1)} to ${scenario.potentialScore.toFixed(1)} if cured; delta +${scenario.scoreDelta.toFixed(1)}.`,
          `BAFO cure: ${scenario.bafoCure}`,
          `Required evidence: ${scenario.requiredEvidence}`,
          `Decision impact: ${scenario.decisionImpact}`,
        ].join(" "),
        score: 27 - index,
      }),
    ) ?? []),
    ...(vendorEvaluationView
      ? [
          {
            recordId: "evaluation-finalist-recommendation",
            title: "Finalist recommendation",
            excerpt: vendorEvaluationView.finalistRecommendation,
            score: 26,
          },
        ]
      : []),
    ...(vendorEvaluationView?.comparisonRows.slice(0, 6).map((row, index) => ({
      recordId: `evaluation-comparison-${row.comparisonId}`,
      title: `Normalized vendor comparison - ${row.label}`,
      excerpt: [
        `${row.label}: ${row.decisionUse}`,
        ...row.values.map(
          (value) =>
            `${value.vendorName}: ${value.value}; posture ${value.posture}; ${value.caveat}`,
        ),
      ].join(" "),
      score: 24 - index,
    })) ?? []),
    ...(vendorEvaluationView?.executiveTradeoffs.map((tradeoff, index) => ({
      recordId: `evaluation-tradeoff-${index + 1}`,
      title: "Executive tradeoff summary",
      excerpt: tradeoff,
      score: 20 - index,
    })) ?? []),
    ...(contractOptimizationProfile
      ? [
          {
            recordId: "contract-optimization-recommended-path",
            title: "Existing contract optimization recommended path",
            excerpt: [
              `Immediate action: ${contractOptimizationProfile.recommendedPath.immediateAction}`,
              `Primary path: ${contractOptimizationProfile.recommendedPath.primaryPath}`,
              `Fallback path: ${contractOptimizationProfile.recommendedPath.fallbackPath}`,
              `Do not do: ${contractOptimizationProfile.recommendedPath.doNotDo}`,
            ].join(" "),
            score: 36,
          },
        ]
      : []),
    ...(contractOptimizationProfile?.findings
      .slice(0, 8)
      .map((finding, index) => ({
        recordId: `contract-optimization-finding-${finding.findingId}`,
        title: `Contract optimization finding - ${finding.title}`,
        excerpt: [
          `${finding.category.replaceAll("_", " ")}: ${finding.currentState}`,
          `Implication: ${finding.sourcingImplication}`,
          `Recommended action: ${finding.recommendedAction}`,
          `Evidence: ${finding.evidenceLabels.join("; ")}`,
        ].join(" "),
        score: 34 - index,
      })) ?? []),
    ...(contractOptimizationProfile?.levers.slice(0, 8).map((lever, index) => ({
      recordId: `contract-optimization-lever-${lever.leverId}`,
      title: `Contract optimization lever - ${lever.leverType.replaceAll("_", " ")}`,
      excerpt: [
        `Buyer ask: ${lever.buyerAsk}`,
        `Negotiation language: ${lever.negotiationLanguage}`,
        `Value basis: ${lever.valueBasis.replaceAll("_", " ")}`,
        lever.annualImpactHighUsd
          ? `Annual impact high: ${lever.annualImpactHighUsd}`
          : "Annual impact: value to test before asserting savings",
      ].join(" "),
      score: 30 - index,
    })) ?? []),
    ...structuredEvidenceContext.families.map((family, index) => ({
      recordId: `structured-evidence-family-${family.family}`,
      title: `Structured evidence - ${family.label}`,
      excerpt: `${family.label}: ${family.acceptedRows} accepted evidence record(s) out of ${family.rowCount}; status ${family.status}.`,
      score: 38 - index,
      segmentId: structuredEvidenceSegmentForFamily(family.family),
      sourceDoc: "Source structured evidence",
    })),
    ...structuredEvidenceContext.metrics.map((metric, index) => ({
      recordId: `structured-evidence-metric-${metric.key}`,
      title: `Calculated metric - ${metric.label}`,
      excerpt: `${metric.label}: ${formatContractEvidenceMetricValue(metric)}, calculated from ${
        structuredEvidenceContext.families.find(
          (family) => family.family === metric.family,
        )?.label ?? "structured evidence"
      }.`,
      score: 37 - index,
      segmentId: structuredEvidenceSegmentForFamily(metric.family),
      sourceDoc: "Source structured evidence",
    })),
    ...structuredEvidenceContext.findings.map((finding, index) => ({
      recordId: `structured-evidence-finding-${finding.key}`,
      title: `Supported finding - ${finding.label}`,
      excerpt: `${finding.evidence} ${finding.implication}`,
      score: 39 - index,
      segmentId: structuredEvidenceSegmentForFamily(finding.evidenceFamily),
      sourceDoc: "Source structured evidence",
    })),
  ].filter((item) => item.excerpt.trim().length > 0);
  const evidence = [
    ...eventEvidence.map((item) => ({
      ...item,
      id: `source-event:${args.event.id}:${item.recordId}`,
      segmentId: sourceEventEvidenceSegment(item),
      sourceDoc: sourceEventEvidenceDoc(item),
      confidence: "high" as const,
    })),
    ...artifactStandards.map((item) => ({
      id: `source-artifact-standard:${item.code}`,
      segmentId: "artifact_standards",
      recordId: item.code,
      title: item.title,
      sourceType: "contextChunk" as const,
      sourceDoc: "Source artifact standards registry",
      excerpt: item.excerpt,
      confidence: "high" as const,
      score: item.score,
    })),
    ...artifactContext.artifactEvidence,
  ];
  const uploadedCount = artifactContext.artifacts.filter(
    (artifact) => artifact.source_origin === "uploaded",
  ).length;
  const generatedCount = artifactContext.artifacts.filter(
    (artifact) => artifact.source_origin === "generated",
  ).length;
  const segmentCounts = new Map<string, number>();
  for (const item of evidence) {
    segmentCounts.set(
      item.segmentId,
      (segmentCounts.get(item.segmentId) ?? 0) + 1,
    );
  }
  const segments = Array.from(segmentCounts.entries()).map(
    ([segmentId, contextChunks]) => ({
      segmentId,
      inventoryRecords: 0,
      contextChunks,
      embeddedChunks: 0,
    }),
  );

  return {
    clientKey,
    brokerTenantKey,
    inventoryRecordCount: 0,
    contextChunkCount: evidence.length,
    embeddedContextChunkCount: 0,
    sourceEventFound: true,
    segments,
    currentStateAreas: segments
      .filter((segment) => segment.segmentId !== "sourcing_artifacts")
      .map((segment) => formatSourceSegmentLabel(segment.segmentId))
      .concat(
        segmentCounts.has("sourcing_artifacts") ? ["Sourcing Artifacts"] : [],
      )
      .slice(0, 8),
    evidenceBasis: [
      `${args.activeClientName ?? clientKey} persisted Source event: trigger, scope, value basis, decision owner and gate criteria from the governed Source intake record.`,
      ...(artifactContext.artifacts.length
        ? [
            `${uploadedCount} uploaded Source evidence artifact(s), ${generatedCount} generated artifact(s), ${artifactContext.chunks.length} parsed excerpt(s), and ${artifactContext.facts.length} structured fact(s) are bound from the Source artifact registry for this event.`,
          ]
        : []),
      artifactStandards.length
        ? `Canonical standards for ${artifactStandards.length} Source artifact(s) are bound from the Source artifact standards registry, including audience, exhibits, page guidance, token budget, evidence controls, and human-review rules.`
        : "Canonical Source artifact standards were not bound for this event context.",
      ...(structuredEvidenceContext.manifests.length
        ? [structuredEvidenceContext.userFacingSummary]
        : []),
    ],
    retrievedEvidence: evidence.map((item) => ({
      id: item.id,
      segmentId: item.segmentId,
      recordId: item.recordId,
      title: item.title,
      sourceType: "contextChunk",
      sourceDoc: item.sourceDoc,
      excerpt: item.excerpt,
      confidence: item.confidence,
      score: item.score,
    })),
    warnings: [
      artifactContext.artifacts.length
        ? "Using persisted Source event facts plus Source artifact registry/chunk/fact evidence for this event; raw blob contents are not exposed unless parsed into governed Source evidence."
        : "Using persisted Source intake facts for this newly-created event; no uploaded or generated Source artifacts were found for the active event.",
      ...structuredEvidenceContext.warnings,
    ],
  };
}

function structuredEvidenceSegmentForFamily(family: string): string {
  if (/invoice|price|spend/i.test(family)) return "it_financials";
  if (/sla|ticket|staffing|change_order/i.test(family)) {
    return "operating_telemetry";
  }
  if (/contract|renewal/i.test(family)) return "vendor_contracts";
  return "uploaded_source_evidence";
}

function sourceEventEvidenceSegment(item: unknown): string {
  const record =
    item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  return typeof record.segmentId === "string"
    ? record.segmentId
    : "sourcing_artifacts";
}

function sourceEventEvidenceDoc(item: unknown): string {
  const record =
    item && typeof item === "object" ? (item as Record<string, unknown>) : {};
  return typeof record.sourceDoc === "string"
    ? record.sourceDoc
    : "Source intake record";
}

async function loadSourceEventArtifactContext(sourceEventId: string): Promise<{
  artifacts: SourceArtifactContextRow[];
  chunks: SourceArtifactChunkContextRow[];
  facts: SourceArtifactFactContextRow[];
  artifactEvidence: Array<{
    id: string;
    segmentId: string;
    recordId: string;
    title: string;
    sourceDoc: string;
    excerpt: string;
    confidence: "low" | "medium" | "high";
    score: number;
  }>;
}> {
  const db = getAzureReadFluentClient();
  const { data: artifactRows, error: artifactError } = await db
    .from("source_artifacts")
    .select(
      [
        "id",
        "source_event_id",
        "title",
        "stage_key",
        "artifact_family",
        "artifact_kind",
        "source_origin",
        "source_format",
        "original_name",
        "file_name",
        "file_format",
        "blob_uri",
        "blob_container",
        "blob_path",
        "version",
        "status",
        "parse_status",
        "evidence_state",
        "approval_state",
        "lifecycle_state",
        "blob_sha256",
        "is_client_final",
        "is_current_authoritative",
        "source_generated_artifact_id",
        "supersedes_artifact_id",
        "superseded_by_artifact_id",
        "client_final_uploaded_at",
        "client_final_accepted_at",
        "client_final_note",
        "client_final_stakeholder_group",
        "created_at",
        "updated_at",
      ].join(","),
    )
    .eq("source_event_id", sourceEventId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
    .limit(60);
  if (artifactError) {
    console.warn("[source-nexus-ask] Source artifact context load failed", {
      sourceEventId,
      message: artifactError.message,
    });
    return { artifacts: [], chunks: [], facts: [], artifactEvidence: [] };
  }
  const artifacts = (
    (artifactRows as SourceArtifactContextRow[] | null) ?? []
  ).filter((artifact) => artifact.id);
  // PR 4C (ADR-0015): populate hasActiveAcceptance for real — previously
  // no caller of resolveAuthoritativeArtifact(Slots) ever populated this
  // field, so the SOURCE-SHELL-004 acceptance ledger had zero effect on
  // which artifact d16/d19/d22/d24 and the rest of aVa's downstream context
  // treats as authoritative. This is the single highest-leverage fix for
  // downstream-context enforcement: the pool-based resolver was already
  // correctly designed (hasActiveAcceptance outranks status/isCurrentAuthoritative),
  // it just needed real data.
  const acceptanceByArtifactId =
    await getLatestArtifactAcceptancesByArtifactIds(
      artifacts.map((artifact) => artifact.id),
    );
  const artifactAuthoritySlots = resolveAuthoritativeArtifactSlots(
    artifacts.map((artifact) =>
      toArtifactAuthorityCandidate(artifact, acceptanceByArtifactId),
    ),
    (artifact) => artifact.slotKey,
  );
  const authoritativeArtifactIdSet = new Set(
    artifactAuthoritySlots.map((slot) => slot.authoritative.id),
  );
  const authoritativeArtifacts = artifactAuthoritySlots
    .map((slot) =>
      artifacts.find((artifact) => artifact.id === slot.authoritative.id),
    )
    .filter((artifact): artifact is SourceArtifactContextRow =>
      Boolean(artifact),
    );
  const auditOnlyArtifacts = artifacts.filter(
    (artifact) => !authoritativeArtifactIdSet.has(artifact.id),
  );
  const artifactIds = authoritativeArtifacts.map((artifact) => artifact.id);
  if (!artifactIds.length) {
    return { artifacts, chunks: [], facts: [], artifactEvidence: [] };
  }

  const [
    { data: chunkRows, error: chunkError },
    { data: factRows, error: factError },
  ] = await Promise.all([
    db
      .from("source_artifact_chunks")
      .select("artifact_id, chunk_id, chunk_text, chunk_kind, confidence")
      .in("artifact_id", artifactIds)
      .order("created_at", { ascending: false })
      .limit(50),
    db
      .from("source_artifact_facts")
      .select("artifact_id, fact_type, fact_key, fact_value, confidence")
      .in("artifact_id", artifactIds)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);
  if (chunkError) {
    console.warn(
      "[source-nexus-ask] Source artifact chunk context load failed",
      {
        sourceEventId,
        message: chunkError.message,
      },
    );
  }
  if (factError) {
    console.warn(
      "[source-nexus-ask] Source artifact fact context load failed",
      {
        sourceEventId,
        message: factError.message,
      },
    );
  }
  const chunks = (
    (chunkRows as SourceArtifactChunkContextRow[] | null) ?? []
  ).filter(
    (chunk) =>
      chunk.artifact_id &&
      authoritativeArtifactIdSet.has(chunk.artifact_id) &&
      chunk.chunk_text,
  );
  const facts = (
    (factRows as SourceArtifactFactContextRow[] | null) ?? []
  ).filter(
    (fact) =>
      fact.artifact_id && authoritativeArtifactIdSet.has(fact.artifact_id),
  );
  const artifactNameById = new Map(
    artifacts.map((artifact) => [
      artifact.id,
      artifact.original_name ?? artifact.id,
    ]),
  );
  const artifactEvidence = [
    ...authoritativeArtifacts.map((artifact, index) => ({
      id: `source-artifact:${artifact.id}`,
      segmentId: inferSourceArtifactSegment(artifact),
      recordId: artifact.id,
      title:
        artifact.title ??
        artifact.file_name ??
        artifact.original_name ??
        "Source artifact",
      sourceDoc: "source_artifacts",
      excerpt: formatSourceArtifactAuthorityExcerpt(artifact),
      confidence:
        artifact.is_current_authoritative === true ||
        artifact.parse_status === "parsed" ||
        artifact.source_origin === "generated"
          ? ("high" as const)
          : ("medium" as const),
      score: scoreSourceArtifactEvidence(artifact, index, "artifact"),
    })),
    ...auditOnlyArtifacts.slice(0, 8).map((artifact, index) => ({
      id: `source-artifact-audit:${artifact.id}`,
      segmentId: "sourcing_artifacts",
      recordId: artifact.id,
      title:
        artifact.title ??
        artifact.file_name ??
        artifact.original_name ??
        "Source artifact history",
      sourceDoc: "source_artifacts",
      excerpt: formatSourceArtifactAuditExcerpt(artifact),
      confidence: "medium" as const,
      score: 3 - Math.min(index, 8) * 0.25,
    })),
    ...chunks.slice(0, 18).map((chunk, index) => ({
      id: `source-artifact-chunk:${chunk.chunk_id}`,
      segmentId: inferSourceArtifactSegmentById(
        chunk.artifact_id,
        authoritativeArtifacts,
      ),
      recordId: chunk.chunk_id,
      title: `${artifactNameById.get(chunk.artifact_id) ?? "Source artifact"} excerpt`,
      sourceDoc: "source_artifact_chunks",
      excerpt: cleanContextText(chunk.chunk_text ?? ""),
      confidence: confidenceFromNumber(chunk.confidence),
      score: scoreSourceArtifactEvidence(
        authoritativeArtifacts.find(
          (artifact) => artifact.id === chunk.artifact_id,
        ),
        index,
        "chunk",
      ),
    })),
    ...facts.slice(0, 18).map((fact, index) => ({
      id: `source-artifact-fact:${fact.artifact_id}:${fact.fact_key ?? index}`,
      segmentId: inferSourceArtifactSegmentById(
        fact.artifact_id,
        authoritativeArtifacts,
      ),
      recordId: `${fact.artifact_id}:${fact.fact_key ?? index}`,
      title: `${artifactNameById.get(fact.artifact_id) ?? "Source artifact"} fact`,
      sourceDoc: "source_artifact_facts",
      excerpt: `${fact.fact_type ?? "artifact_fact"} ${fact.fact_key ?? ""}: ${summarizeFactValue(fact.fact_value)}`,
      confidence: confidenceFromNumber(fact.confidence),
      score:
        scoreSourceArtifactEvidence(
          authoritativeArtifacts.find(
            (artifact) => artifact.id === fact.artifact_id,
          ),
          index,
          "fact",
        ) - (fact.fact_type === "artifact_summary" ? 18 : 0),
    })),
  ];
  return { artifacts, chunks, facts, artifactEvidence };
}

function toArtifactAuthorityCandidate(
  artifact: SourceArtifactContextRow,
  acceptanceByArtifactId: Map<string, unknown>,
): AuthoritativeArtifactCandidate & { slotKey: string } {
  return {
    id: artifact.id,
    version:
      typeof artifact.version === "number"
        ? artifact.version
        : Number(artifact.version ?? 0),
    lifecycleState: artifact.lifecycle_state,
    status: artifact.status,
    sourceOrigin: artifact.source_origin,
    isClientFinal: artifact.is_client_final,
    isCurrentAuthoritative: artifact.is_current_authoritative,
    createdAt: artifact.created_at,
    updatedAt: artifact.updated_at,
    clientFinalAcceptedAt: artifact.client_final_accepted_at,
    // PR 4C: real, not always-empty — see the loadSourceEventArtifactContext
    // call site for why this now has actual data.
    hasActiveAcceptance: acceptanceByArtifactId.has(artifact.id),
    slotKey: `${artifact.stage_key ?? "unknown"}::${artifact.artifact_kind ?? artifact.id}`,
  };
}

function formatSourceArtifactAuthorityExcerpt(
  artifact: SourceArtifactContextRow,
): string {
  const displayName =
    artifact.file_name ??
    artifact.original_name ??
    artifact.title ??
    "Source artifact";
  const hasBlob =
    Boolean(artifact.blob_container && artifact.blob_path) ||
    Boolean(artifact.blob_uri);
  const status = artifact.status ?? artifact.parse_status ?? "unknown";
  const version = artifact.version ?? "unknown";
  const current = artifact.is_current_authoritative === true;
  const clientFinal = artifact.is_client_final === true;
  const generatedDraft =
    artifact.source_origin === "generated" &&
    artifact.artifact_kind === "d09_rfp_pack";
  const lineage = [
    artifact.source_generated_artifact_id
      ? "links to the prior generated draft"
      : null,
    artifact.supersedes_artifact_id
      ? "supersedes a prior artifact version"
      : null,
    artifact.superseded_by_artifact_id
      ? "has been superseded by a later artifact version"
      : null,
  ]
    .filter(Boolean)
    .join("; ");

  return [
    `Artifact authority record: "${displayName}" is ${clientFinal ? "a client-final upload" : generatedDraft ? "an AbarVa-generated draft" : `${artifact.source_origin ?? "a Source"} artifact`}.`,
    `Artifact type: ${artifact.artifact_kind ?? "unknown"}; stage: ${artifact.stage_key ?? "unknown"}; status: ${status}; lifecycle: ${artifact.lifecycle_state ?? "unknown"}; version: ${version}.`,
    `Authority: clientFinal=${clientFinal ? "true" : "false"}; currentAuthoritative=${current ? "true" : "false"}; blobBacked=${hasBlob ? "true" : "false"}.`,
    lineage ? `Lineage: ${lineage}.` : "",
    artifact.client_final_note
      ? `Client-final note: ${artifact.client_final_note}`
      : "",
    artifact.client_final_stakeholder_group
      ? `Client-final stakeholder group: ${artifact.client_final_stakeholder_group}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function formatSourceArtifactAuditExcerpt(
  artifact: SourceArtifactContextRow,
): string {
  const displayName =
    artifact.file_name ??
    artifact.original_name ??
    artifact.title ??
    "Source artifact";
  const version = artifact.version ?? "unknown";
  return [
    `Artifact audit record: "${displayName}" is retained for lineage only and is not the authoritative artifact for downstream Source answers.`,
    `Artifact type: ${artifact.artifact_kind ?? "unknown"}; stage: ${artifact.stage_key ?? "unknown"}; status: ${artifact.status ?? "unknown"}; lifecycle: ${artifact.lifecycle_state ?? "unknown"}; version: ${version}.`,
    artifact.superseded_by_artifact_id
      ? "Lineage: has been superseded by a later authoritative artifact version."
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function scoreSourceArtifactEvidence(
  artifact: SourceArtifactContextRow | undefined,
  index: number,
  evidenceKind: "artifact" | "chunk" | "fact",
): number {
  if (!artifact) return 8 - Math.min(index, 10);

  const segment = inferSourceArtifactSegment(artifact);
  const isUploaded = artifact.source_origin === "uploaded";
  const isGenerated = artifact.source_origin === "generated";
  const isParsed = artifact.parse_status === "parsed";
  const isFactBearing = evidenceKind === "fact" || evidenceKind === "chunk";
  const isBusinessEvidence = segment !== "sourcing_artifacts";

  let score = 18;
  if (isUploaded) score += 24;
  if (artifact.is_client_final === true) score += 30;
  if (artifact.is_current_authoritative === true) score += 30;
  if (isParsed) score += 8;
  if (isBusinessEvidence) score += 10;
  if (isFactBearing) score += 6;
  if (evidenceKind === "fact") score += 2;
  if (isGenerated) score -= 14;

  return score - Math.min(index, 20) * 0.25;
}

function inferSourceArtifactSegmentById(
  artifactId: string,
  artifacts: SourceArtifactContextRow[],
): string {
  return inferSourceArtifactSegment(
    artifacts.find((artifact) => artifact.id === artifactId),
  );
}

function inferSourceArtifactSegment(
  artifact: SourceArtifactContextRow | undefined,
): string {
  if (!artifact) return "sourcing_artifacts";

  const text = [
    artifact.original_name,
    artifact.artifact_family,
    artifact.artifact_kind,
    artifact.source_origin,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[_/.-]+/g, " ");

  if (
    /\b(agreement|contract|vendor|change[-_ ]?order|amendment|commercial)\b/.test(
      text,
    )
  ) {
    return "vendor_contracts";
  }
  if (
    /\b(ticket|servicenow|sla|service[-_ ]?level|blackout|ops|operation|incident|request|change)\b/.test(
      text,
    )
  ) {
    return "operating_telemetry";
  }
  if (
    /\b(finance|financial|budget|cost|run[-_ ]?vs[-_ ]?change|rate|pricing)\b/.test(
      text,
    )
  ) {
    return "it_financials";
  }
  if (/\b(security|compliance|risk|control|ciso|audit)\b/.test(text)) {
    return "compliance";
  }
  if (
    /\b(evaluation|weight|transition|dependency|sponsor|authorization|roadmap|program)\b/.test(
      text,
    )
  ) {
    return "program_inventory";
  }
  if (
    /\b(application|app|scope|tower|service[-_ ]?catalog|data[-_ ]?center|infrastructure|network|topology|circuit|cmdb)\b/.test(
      text,
    )
  ) {
    return "it_landscape";
  }
  if (
    /\b(generated|rfp[_ -]?package|response[_ -]?checklist|preview|source\\.md|artifact)\b/.test(
      text,
    )
  ) {
    return "sourcing_artifacts";
  }

  return "sourcing_artifacts";
}

function formatSourceSegmentLabel(segmentId: string): string {
  return segmentId
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function cleanContextText(value: string): string {
  return value.replace(/\s+/g, " ").trim().slice(0, 700);
}

function confidenceFromNumber(value: number | null): "low" | "medium" | "high" {
  if (typeof value !== "number") return "medium";
  if (value >= 0.8) return "high";
  if (value >= 0.55) return "medium";
  return "low";
}

function summarizeFactValue(value: unknown): string {
  if (value === null || value === undefined) return "available";
  if (typeof value === "string") return cleanContextText(value);
  try {
    return cleanContextText(JSON.stringify(value));
  } catch {
    return "available";
  }
}

async function loadApexRetailSourceIntelligence(args: {
  eventId?: string;
  userId: string;
  prompt?: string;
  selectedAttachmentIds?: string[];
  clientId?: string;
  clientKey?: string;
}): Promise<ApexRetailAdapterResult | null> {
  const { eventId, clientId, clientKey } = args;
  if (!shouldUseApexRetailAdapter(eventId, clientId, clientKey)) return null;

  try {
    return await buildApexRetailSourceContextAssemblyInput({
      eventId,
      user: { id: args.userId },
      userPrompt: args.prompt ?? "Provide the current Source command read.",
      surface: "nexusPanel",
      selectedAttachmentIds: args.selectedAttachmentIds ?? [],
    });
  } catch (error) {
    console.error(
      "[source-nexus-ask] Apex Retail source intelligence load failed",
      error instanceof Error ? error.message : error,
    );
    return null;
  }
}

export function shouldUseApexRetailAdapter(
  eventId: string | undefined,
  clientId: string | undefined,
  clientKey: string | undefined,
): boolean {
  const normalizedClientId = clientId?.trim().toLowerCase();
  const normalizedClientKey = clientKey?.trim().toLowerCase();
  const hasKnownClientBoundary = Boolean(
    normalizedClientId || normalizedClientKey,
  );
  const isApexClient =
    normalizedClientId === APEX_RETAIL_CLIENT_KEY ||
    normalizedClientId === APEX_RETAIL_BROKER_TENANT_KEY ||
    normalizedClientKey === APEX_RETAIL_CLIENT_KEY ||
    normalizedClientKey === APEX_RETAIL_BROKER_TENANT_KEY;
  if (hasKnownClientBoundary) return isApexClient;

  const normalizedEventId = eventId?.trim().toUpperCase() ?? "";
  return (
    normalizedEventId.startsWith("APX-") ||
    normalizedEventId.startsWith("SRC-APX-")
  );
}

/**
 * Stamp `linked_event_id` on AgentDock attachment rows referenced by this
 * turn so the canvas owns them across the conversation. Tenant-scoped to
 * keep the update honest under RLS.
 *
 * Best-effort: persistence failures must not block the agent runtime —
 * the attachment metadata is recoverable, the user-facing response is not.
 */
async function linkAttachmentsToEvent(args: {
  attachmentIds: string[];
  tenantId: string;
  eventId: string;
}): Promise<void> {
  const { attachmentIds, tenantId, eventId } = args;
  if (attachmentIds.length === 0) return;
  // DB write routed through the data-plane write seam (Slice 3b). The seam's
  // linkAttachments is best-effort and never throws — the agent turn must
  // still respond even if attachment metadata persistence fails. The
  // attachment row keeps its other context and a retention sweeper can
  // reconcile from telemetry if needed.
  await selectSourceWriteAdapter(undefined, tenantId).linkAttachments({
    attachmentIds,
    tenantId,
    eventId,
  });
}

/**
 * Call Claude with Sentinel voice for Source canvas chat.
 * Returns the answer string, or throws so the caller can fall back to stub.
 */
async function callSentinelWithClaude(args: {
  prompt: string;
  briefingContext: string;
  tenantKey: string | null;
  tenantId: string;
}): Promise<string> {
  if (!args.prompt.trim()) throw new Error("empty prompt");

  const preflight = await preflightAnthropicDirectClient({
    tenantId: args.tenantId,
    workflow: "source-canvas-chat",
    model: "claude-sonnet-4-6",
    prompt: args.prompt,
    dataClass: "confidential",
    metadata: { surface: "source", tenantKey: args.tenantKey ?? "unknown" },
  });
  if (!preflight.ok) throw new Error(`egress blocked: ${preflight.reason}`);

  const systemPrompt = composeSentinelSystemPrompt({
    mode: "tenant",
    tenantKey: args.tenantKey,
    surface: "/source",
    vectorIndexPending: false,
    worldviewPending: false,
    worldviewHitsPresent: false,
  });

  const userMessage = args.briefingContext
    ? `${args.briefingContext}\n\nUser question: ${args.prompt}`
    : args.prompt;

  const msg = await preflight.client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 512,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = msg.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  if (!text.trim()) throw new Error("empty Claude response");
  return text;
}

async function parseSourceNexusRequestBody(request: NextRequest): Promise<
  | { ok: true; body: unknown }
  | {
      ok: false;
      status: number;
      body: { ok: false; error: string; detail: string; noModel: true };
    }
> {
  const raw = await request.text();
  if (!raw.trim()) {
    return { ok: true, body: {} };
  }

  try {
    return { ok: true, body: JSON.parse(raw) as unknown };
  } catch {
    return {
      ok: false,
      status: 400,
      body: {
        ok: false,
        error: "bad_request",
        detail: "Malformed JSON request body.",
        noModel: true,
      },
    };
  }
}
