import type { NextRequest } from "next/server";

import { requireTenancy, tenancyErrorResponse } from "../../../../_intel-auth";
import {
  createSourceNexusApiStubResponse,
  normalizeSourceNexusApiRequestBody,
} from "@/lib/source/nexus-api";
import { maybeCreateSourceSentinelChatLlmResponse } from "@/lib/source/sentinel-chat-llm";
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
import { getSourcingEvent, sourceEventRowToDetail } from "@/lib/source/queries";
import { selectSourceWriteAdapter } from "@/lib/data-plane/write-adapters/sourceWriteAdapter";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  buildVendorBafoInstructionPack,
  buildVendorChallengeIntelligence,
  buildVendorEvaluationDecisionView,
  buildVendorResponseMveProfiles,
} from "@/lib/source/proposal-intelligence";
import {
  buildContractOptimizationMveProfile,
  buildSkyHarborAmsExistingContractInput,
  isSkyHarborContractOptimizationEvent,
} from "@/lib/source/contract-optimization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SourceNexusRouteContext = {
  params: Promise<{ eventId?: string }>;
};

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
    const activeClient = await getActiveClientRow().catch(() => null);
    const apexContext = await loadApexRetailSourceIntelligence({
      eventId,
      userId: tenancy.userId,
      prompt: normalizedBody.prompt,
      selectedAttachmentIds: normalizedBody.selectedAttachmentIds,
      clientId: tenancy.clientId,
      clientKey: activeClient?.key,
    });
    const fallbackLiveEventDetail = eventId
      ? await getSourcingEvent(eventId).catch(() => null)
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
    const liveTenantContext =
      apexLiveTenantContext ??
      (fallbackLiveEventDetail
        ? await buildEventIntakeTenantContextSnapshot({
            activeClientKey: activeClient?.key,
            activeClientName: activeClient?.name,
            event: fallbackLiveEventDetail,
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

    const deterministicResponse = createSourceNexusApiStubResponse({
      ...normalizedBody,
      eventId,
      tenant: apexContext?.input.tenant ?? {
        tenantId: tenancy.clientId,
        tenantKey: activeClient?.key,
        tenantName: activeClient?.name,
        activeClientId: tenancy.clientId,
        activeClientName: activeClient?.name,
      },
      user: {
        id: tenancy.userId,
      },
      liveEventDetail,
      liveTenantContext,
    });
    const response = await maybeCreateSourceSentinelChatLlmResponse({
      fallbackResponse: deterministicResponse,
      tenantId: tenancy.clientId,
      userId: tenancy.userId,
      prompt:
        normalizedBody.prompt ?? "Provide the current Source command read.",
      event: liveEventDetail,
      liveTenantContext,
    });

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

type SourceArtifactContextRow = {
  id: string;
  source_event_id: string;
  stage_key: string | null;
  artifact_family: string | null;
  artifact_kind: string | null;
  source_origin: string | null;
  source_format: string | null;
  original_name: string | null;
  parse_status: string | null;
  evidence_state: string | null;
  approval_state: string | null;
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

async function buildEventIntakeTenantContextSnapshot(args: {
  activeClientKey?: string;
  activeClientName?: string;
  event: SourcingEventDetail;
}): Promise<SourceLiveTenantContextSnapshot> {
  const clientKey = args.activeClientKey ?? "unknown";
  const brokerTenantKey =
    clientKey === APEX_RETAIL_BROKER_TENANT_KEY
      ? APEX_RETAIL_BROKER_TENANT_KEY
      : clientKey;
  const artifactContext = await loadSourceEventArtifactContext(args.event.id);
  const vendorProfiles = buildVendorResponseMveProfiles({
    id: args.event.id,
    code: args.event.code,
    name: args.event.name,
    accountName: args.event.accountName,
  });
  const vendorChallenges = buildVendorChallengeIntelligence(vendorProfiles);
  const vendorBafoPack = buildVendorBafoInstructionPack(vendorChallenges);
  const vendorEvaluationView = buildVendorEvaluationDecisionView(
    vendorProfiles,
    vendorChallenges,
    vendorBafoPack,
  );
  const contractOptimizationProfile = isSkyHarborContractOptimizationEvent({
    activeClientKey: clientKey,
    eventCode: args.event.code,
    eventName: args.event.name,
  })
    ? buildContractOptimizationMveProfile(
        buildSkyHarborAmsExistingContractInput({
          sourceEventId: args.event.id,
          tenantKey: clientKey,
        }),
      )
    : null;
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
    ...(vendorEvaluationView?.scoreImprovementScenarios.map((scenario, index) => ({
      recordId: `${scenario.vendorId}-score-impact`,
      title: `${scenario.vendorName} score impact scenario`,
      excerpt: [
        `Score movement: ${scenario.currentScore.toFixed(1)} to ${scenario.potentialScore.toFixed(1)} if cured; delta +${scenario.scoreDelta.toFixed(1)}.`,
        `BAFO cure: ${scenario.bafoCure}`,
        `Required evidence: ${scenario.requiredEvidence}`,
        `Decision impact: ${scenario.decisionImpact}`,
      ].join(" "),
      score: 27 - index,
    })) ?? []),
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
    ...(contractOptimizationProfile?.findings.slice(0, 8).map((finding, index) => ({
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
  ].filter((item) => item.excerpt.trim().length > 0);
  const evidence = [
    ...eventEvidence.map((item) => ({
      ...item,
      id: `source-event:${args.event.id}:${item.recordId}`,
      segmentId: "sourcing_artifacts",
      sourceDoc: "source_events",
      confidence: "high" as const,
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
    segmentCounts.set(item.segmentId, (segmentCounts.get(item.segmentId) ?? 0) + 1);
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
      `${args.activeClientName ?? clientKey} persisted Source event: trigger, scope, value basis, decision owner and gate criteria from source_events.`,
      ...(artifactContext.artifacts.length
        ? [
            `${uploadedCount} uploaded Source evidence artifact(s), ${generatedCount} generated artifact(s), ${artifactContext.chunks.length} parsed excerpt(s), and ${artifactContext.facts.length} structured fact(s) are bound from the Source artifact registry for this event.`,
          ]
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
    ],
  };
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
        "stage_key",
        "artifact_family",
        "artifact_kind",
        "source_origin",
        "source_format",
        "original_name",
        "parse_status",
        "evidence_state",
        "approval_state",
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
  const artifacts = ((artifactRows as SourceArtifactContextRow[] | null) ?? []).filter(
    (artifact) => artifact.id,
  );
  const artifactIds = artifacts.map((artifact) => artifact.id);
  if (!artifactIds.length) {
    return { artifacts, chunks: [], facts: [], artifactEvidence: [] };
  }

  const [{ data: chunkRows, error: chunkError }, { data: factRows, error: factError }] =
    await Promise.all([
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
    console.warn("[source-nexus-ask] Source artifact chunk context load failed", {
      sourceEventId,
      message: chunkError.message,
    });
  }
  if (factError) {
    console.warn("[source-nexus-ask] Source artifact fact context load failed", {
      sourceEventId,
      message: factError.message,
    });
  }
  const chunks = ((chunkRows as SourceArtifactChunkContextRow[] | null) ?? [])
    .filter((chunk) => chunk.artifact_id && chunk.chunk_text);
  const facts = ((factRows as SourceArtifactFactContextRow[] | null) ?? [])
    .filter((fact) => fact.artifact_id);
  const artifactNameById = new Map(
    artifacts.map((artifact) => [artifact.id, artifact.original_name ?? artifact.id]),
  );
  const artifactEvidence = [
    ...artifacts.map((artifact, index) => ({
      id: `source-artifact:${artifact.id}`,
      segmentId: inferSourceArtifactSegment(artifact),
      recordId: artifact.id,
      title: artifact.original_name ?? "Source artifact",
      sourceDoc: "source_artifacts",
      excerpt: [
        `${artifact.source_origin ?? "artifact"} ${artifact.artifact_family ?? "other"} evidence for ${artifact.stage_key ?? "source"} stage.`,
        `Format: ${artifact.source_format ?? "unknown"}; parse: ${artifact.parse_status ?? "unknown"}; evidence state: ${artifact.evidence_state ?? "unknown"}; approval: ${artifact.approval_state ?? "unknown"}.`,
      ].join(" "),
      confidence:
        artifact.parse_status === "parsed" || artifact.source_origin === "generated"
          ? ("high" as const)
          : ("medium" as const),
      score: scoreSourceArtifactEvidence(artifact, index, "artifact"),
    })),
    ...chunks.slice(0, 18).map((chunk, index) => ({
      id: `source-artifact-chunk:${chunk.chunk_id}`,
      segmentId: inferSourceArtifactSegmentById(chunk.artifact_id, artifacts),
      recordId: chunk.chunk_id,
      title: `${artifactNameById.get(chunk.artifact_id) ?? "Source artifact"} excerpt`,
      sourceDoc: "source_artifact_chunks",
      excerpt: cleanContextText(chunk.chunk_text ?? ""),
      confidence: confidenceFromNumber(chunk.confidence),
      score: scoreSourceArtifactEvidence(
        artifacts.find((artifact) => artifact.id === chunk.artifact_id),
        index,
        "chunk",
      ),
    })),
    ...facts.slice(0, 18).map((fact, index) => ({
      id: `source-artifact-fact:${fact.artifact_id}:${fact.fact_key ?? index}`,
      segmentId: inferSourceArtifactSegmentById(fact.artifact_id, artifacts),
      recordId: `${fact.artifact_id}:${fact.fact_key ?? index}`,
      title: `${artifactNameById.get(fact.artifact_id) ?? "Source artifact"} fact`,
      sourceDoc: "source_artifact_facts",
      excerpt: `${fact.fact_type ?? "artifact_fact"} ${fact.fact_key ?? ""}: ${summarizeFactValue(fact.fact_value)}`,
      confidence: confidenceFromNumber(fact.confidence),
      score: scoreSourceArtifactEvidence(
        artifacts.find((artifact) => artifact.id === fact.artifact_id),
        index,
        "fact",
      ) - (fact.fact_type === "artifact_summary" ? 18 : 0),
    })),
  ];
  return { artifacts, chunks, facts, artifactEvidence };
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

  if (/\b(agreement|contract|vendor|change[-_ ]?order|amendment|commercial)\b/.test(text)) {
    return "vendor_contracts";
  }
  if (/\b(ticket|servicenow|sla|service[-_ ]?level|blackout|ops|operation|incident|request|change)\b/.test(text)) {
    return "operating_telemetry";
  }
  if (/\b(finance|financial|budget|cost|run[-_ ]?vs[-_ ]?change|rate|pricing)\b/.test(text)) {
    return "it_financials";
  }
  if (/\b(security|compliance|risk|control|ciso|audit)\b/.test(text)) {
    return "compliance";
  }
  if (/\b(evaluation|weight|transition|dependency|sponsor|authorization|roadmap|program)\b/.test(text)) {
    return "program_inventory";
  }
  if (/\b(application|app|scope|tower|service[-_ ]?catalog|data[-_ ]?center|infrastructure|network|topology|circuit|cmdb)\b/.test(text)) {
    return "it_landscape";
  }
  if (/\b(generated|rfp[_ -]?package|response[_ -]?checklist|preview|source\\.md|artifact)\b/.test(text)) {
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
  await selectSourceWriteAdapter().linkAttachments({
    attachmentIds,
    tenantId,
    eventId,
  });
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
