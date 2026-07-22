import { azureRead, type AzureReadClient } from "@/lib/data-plane/azureRead";
import {
  evaluatePromotion,
  type ReadinessRow,
} from "@/lib/governance/promotion-evaluator";
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";

import {
  MOVES_LEARNING_RECORD_TYPE,
  MOVES_LEARNING_SOURCE_SYSTEM,
  MOVES_LEARNING_CONTEXT_TABLE,
  type MovesLearningPayload,
  type MovesLearningSourceBasis,
} from "./types";

export interface MovesLearningReviewCandidate {
  readonly id: string;
  readonly tenantKey: string;
  readonly objectTable: string;
  readonly objectId: string;
  readonly tenantId: string | null;
  readonly canonicalRecordId: string;
  readonly moveId: string | null;
  readonly moveName: string | null;
  readonly phase: number | null;
  readonly title: string;
  readonly summary: string;
  readonly sourceBasis: string;
  readonly sourceId: string | null;
  readonly claimType: string | null;
  readonly confidenceLevel: string | null;
  readonly evidenceRefs: readonly string[];
  readonly readinessStatus: string;
  readonly retrievability: string;
  readonly policyValidationStatus: string;
  readonly sourceLayer: string;
  readonly classification: string;
  readonly readinessSourceBasis: string | null;
  readonly applicableAgents: readonly string[];
  readonly citedRenderVerifiedAt: string | null;
  readonly readinessProvenance: Record<string, unknown> | null;
  readonly confidenceRationale: string | null;
  readonly lastSyncedAt: string | null;
}

export interface MovesLearningReviewQueue {
  readonly tenantKey: string;
  readonly canonicalTenantKey: string;
  readonly candidates: readonly MovesLearningReviewCandidate[];
  readonly counts: {
    readonly total: number;
    readonly bySourceBasis: Record<string, number>;
    readonly byReadiness: Record<string, number>;
  };
}

export type MovesLearningReviewAction =
  | "investigate_active_promotion_violation"
  | "review_source_lineage"
  | "hold_for_policy_review"
  | "ready_for_policy_promotion_preview";

export interface MovesLearningReviewPacket {
  readonly action: MovesLearningReviewAction;
  readonly actionLabel: string;
  readonly whyHere: string;
  readonly inspect: readonly string[];
  readonly blockers: readonly string[];
  readonly safeNextStep: string;
}

export type MovesLearningPromotionPreviewStatus =
  | "blocked"
  | "investigate"
  | "preview_ready";

export interface MovesLearningPromotionPreviewCheck {
  readonly label: string;
  readonly status: "pass" | "blocked" | "pending" | "investigate";
  readonly detail: string;
}

export interface MovesLearningPromotionPreview {
  readonly status: MovesLearningPromotionPreviewStatus;
  readonly statusLabel: string;
  readonly summary: string;
  readonly checks: readonly MovesLearningPromotionPreviewCheck[];
  readonly nextAction: string;
}

export interface MovesLearningPromotionRollupCheck {
  readonly label: string;
  readonly passed: number;
  readonly blocked: number;
  readonly pending: number;
  readonly investigate: number;
}

export interface MovesLearningPromotionRollup {
  readonly status: "empty" | "blocked" | "investigate" | "preview_ready";
  readonly statusLabel: string;
  readonly summary: string;
  readonly totals: {
    readonly candidates: number;
    readonly blockedCandidates: number;
    readonly investigateCandidates: number;
    readonly previewReadyCandidates: number;
  };
  readonly checks: readonly MovesLearningPromotionRollupCheck[];
  readonly topBlockers: readonly string[];
  readonly nextAction: string;
}

interface MovesLearningReviewRow {
  readonly id?: string | null;
  readonly tenant_key?: string | null;
  readonly canonical_record_id?: string | null;
  readonly record_subtype?: string | null;
  readonly title?: string | null;
  readonly source_record_id?: string | null;
  readonly last_synced_at?: string | Date | null;
  readonly payload?: MovesLearningPayload | Record<string, unknown> | null;
  readonly agent_readiness_status?: string | null;
  readonly retrievability?: string | null;
  readonly policy_validation_status?: string | null;
  readonly object_table?: string | null;
  readonly object_id?: string | null;
  readonly tenant_id?: string | null;
  readonly source_layer?: string | null;
  readonly classification?: string | null;
  readonly readiness_source_basis?: string | null;
  readonly confidence_level?: string | null;
  readonly applicable_agents?: readonly string[] | null;
  readonly cited_render_verified_at?: string | Date | null;
  readonly provenance?: Record<string, unknown> | null;
  readonly confidence_rationale?: string | null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function asIso(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  return asString(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asStringArray(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function increment(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

function readPayload(row: MovesLearningReviewRow): Record<string, unknown> {
  return row.payload && typeof row.payload === "object"
    ? (row.payload as Record<string, unknown>)
    : {};
}

function toCandidate(row: MovesLearningReviewRow): MovesLearningReviewCandidate {
  const payload = readPayload(row);
  const sourceBasis =
    asString(payload.sourceBasis) ?? asString(row.record_subtype) ?? "unknown";
  const title = asString(payload.title) ?? asString(row.title) ?? "Untitled Move learning";
  return {
    id: asString(row.id) ?? asString(row.canonical_record_id) ?? title,
    tenantKey: asString(row.tenant_key) ?? "unknown",
    objectTable: asString(row.object_table) ?? MOVES_LEARNING_CONTEXT_TABLE,
    objectId:
      asString(row.object_id) ??
      asString(row.id) ??
      asString(row.canonical_record_id) ??
      title,
    tenantId: asString(row.tenant_id),
    canonicalRecordId: asString(row.canonical_record_id) ?? "unknown",
    moveId: asString(payload.moveId),
    moveName: asString(payload.moveName),
    phase: asNumber(payload.phase),
    title,
    summary: asString(payload.summary) ?? "No summary captured.",
    sourceBasis,
    sourceId: asString(payload.sourceId) ?? asString(row.source_record_id),
    claimType: asString(payload.claimType),
    confidenceLevel:
      asString(payload.confidenceLevel) ?? asString(row.confidence_level),
    evidenceRefs: asStringArray(payload.evidenceRefs),
    readinessStatus: asString(row.agent_readiness_status) ?? "missing_readiness",
    retrievability: asString(row.retrievability) ?? "not_available",
    policyValidationStatus: asString(row.policy_validation_status) ?? "missing",
    sourceLayer: asString(row.source_layer) ?? "tenant_context",
    classification: asString(row.classification) ?? "internal",
    readinessSourceBasis:
      asString(row.readiness_source_basis) ?? asString(payload.sourceBasis),
    applicableAgents: asStringArray(row.applicable_agents),
    citedRenderVerifiedAt: asIso(row.cited_render_verified_at),
    readinessProvenance: asObject(row.provenance),
    confidenceRationale: asString(row.confidence_rationale),
    lastSyncedAt: asIso(row.last_synced_at),
  };
}

function sourceBasisLabel(value: string): string {
  return value.replace(/_/g, " ");
}

function reviewPhaseLabel(phase: number | null): string {
  return typeof phase === "number" ? `P${phase}` : "Phase unknown";
}

function isKnownLearningSourceBasis(value: string): boolean {
  return (
    value === "approved_evidence" ||
    value === "client_approved_deliverable" ||
    value === "gate_decision"
  );
}

function toPromotionReadinessRow(
  candidate: MovesLearningReviewCandidate,
): ReadinessRow {
  return {
    object_table: candidate.objectTable,
    object_id: candidate.objectId,
    client_key: canonicalTenantKey(candidate.tenantKey),
    tenant_id: candidate.tenantId,
    source_layer: candidate.sourceLayer,
    agent_readiness_status: candidate.readinessStatus,
    retrievability: candidate.retrievability,
    classification: candidate.classification,
    source_basis: candidate.readinessSourceBasis ?? candidate.sourceBasis,
    confidence_level: candidate.confidenceLevel,
    applicable_agents: [...candidate.applicableAgents],
    cited_render_verified_at: candidate.citedRenderVerifiedAt,
    policy_validation_status: candidate.policyValidationStatus,
    provenance: candidate.readinessProvenance,
  };
}

function missingEligibilityReasons(row: ReadinessRow): string[] {
  const evaluation = evaluatePromotion(row);
  const criteria = evaluation.criteria;
  const missing: string[] = [];
  if (!criteria.source_basis_present) missing.push("source basis");
  if (!criteria.confidence_present) missing.push("confidence");
  if (!criteria.provenance_present) missing.push("provenance");
  if (!criteria.applicable_agents_valid) missing.push("valid applicable agents");
  return missing;
}

export function buildMovesLearningReviewPacket(
  candidate: MovesLearningReviewCandidate,
): MovesLearningReviewPacket {
  const evaluation = evaluatePromotion(toPromotionReadinessRow(candidate));
  const inspect = [
    candidate.moveName
      ? `Move: ${candidate.moveName}`
      : candidate.moveId
        ? `Move id: ${candidate.moveId}`
        : "Move lineage missing",
    candidate.sourceId
      ? `Source id: ${candidate.sourceId}`
      : "Source artifact id missing",
    candidate.evidenceRefs.length > 0
      ? `Evidence refs: ${candidate.evidenceRefs.join(", ")}`
      : "Evidence refs missing",
    candidate.confidenceLevel
      ? `Confidence: ${candidate.confidenceLevel}`
      : "Confidence not stated",
  ];

  const blockers: string[] = [];
  if (!isKnownLearningSourceBasis(candidate.sourceBasis)) {
    blockers.push("Unknown source basis; cannot route to context promotion.");
  }
  if (!candidate.sourceId) {
    blockers.push("Source artifact/file reference is missing.");
  }
  if (candidate.evidenceRefs.length === 0) {
    blockers.push("No evidence references are recorded.");
  }
  if (candidate.retrievability !== "search_indexed") {
    blockers.push("Not indexed in Azure retrieval.");
  }
  if (candidate.policyValidationStatus !== "pass") {
    blockers.push("Context/corpus policy has not passed.");
  }
  for (const missing of missingEligibilityReasons(toPromotionReadinessRow(candidate))) {
    blockers.push(`Missing ${missing}; canonical promotion eligibility is incomplete.`);
  }
  if (candidate.readinessStatus !== "agent_ready") {
    blockers.push("Not agent-ready; held for stewardship.");
  }

  if (candidate.readinessStatus === "agent_ready") {
    return {
      action: "investigate_active_promotion_violation",
      actionLabel: "Investigate before use",
      whyHere: `${reviewPhaseLabel(candidate.phase)} ${sourceBasisLabel(candidate.sourceBasis)} from Moves appears marked agent-ready.`,
      inspect,
      blockers:
        blockers.length > 0
          ? blockers
          : ["Row is already active; verify promotion evidence immediately."],
      safeNextStep:
        "Confirm there is an explicit steward decision, retrieval proof, and cite-render proof before any agent consumes this row.",
    };
  }

  if (!candidate.sourceId || candidate.evidenceRefs.length === 0) {
    return {
      action: "review_source_lineage",
      actionLabel: "Fix lineage first",
      whyHere: `${reviewPhaseLabel(candidate.phase)} ${sourceBasisLabel(candidate.sourceBasis)} was persisted by the Moves learning ledger.`,
      inspect,
      blockers,
      safeNextStep:
        "Resolve source artifact and evidence references before this candidate can enter promotion preview.",
    };
  }

  if (
    candidate.readinessStatus === "not_reviewed" ||
    candidate.policyValidationStatus !== "pass" ||
    candidate.retrievability === "committed_not_indexed" ||
    evaluation.recommendation === "remain_not_reviewed"
  ) {
    return {
      action: "hold_for_policy_review",
      actionLabel: "Review required",
      whyHere: `${reviewPhaseLabel(candidate.phase)} ${sourceBasisLabel(candidate.sourceBasis)} was persisted from governed Move activity.`,
      inspect,
      blockers,
      safeNextStep:
        "Steward reviews the source, classification, evidence refs, and confidence. Promotion remains separate and requires indexing plus cite-render proof.",
    };
  }

  return {
    action: "ready_for_policy_promotion_preview",
    actionLabel: "Ready for preview",
    whyHere: `${reviewPhaseLabel(candidate.phase)} ${sourceBasisLabel(candidate.sourceBasis)} has lineage and policy signals ready for a promotion preview.`,
    inspect,
    blockers,
    safeNextStep:
      "Run the read-only context/corpus promotion preview. Do not mark agent-ready without steward sign-off and retrieval proof.",
  };
}

export function buildMovesLearningPromotionPreview(
  candidate: MovesLearningReviewCandidate,
): MovesLearningPromotionPreview {
  const readinessRow = toPromotionReadinessRow(candidate);
  const evaluation = evaluatePromotion(readinessRow);
  const criteria = evaluation.criteria;
  const hasLineage =
    isKnownLearningSourceBasis(candidate.sourceBasis) &&
    Boolean(candidate.sourceId) &&
    candidate.evidenceRefs.length > 0;
  const policyPassed =
    candidate.policyValidationStatus === "pass" &&
    criteria.policy_valid &&
    criteria.tenant_scoped &&
    criteria.classification_allowed;
  const eligibilityReady =
    criteria.source_basis_present &&
    criteria.confidence_present &&
    criteria.provenance_present &&
    criteria.applicable_agents_valid;
  const agentReady = evaluation.recommendation === "agent_ready";

  const policyStatus: MovesLearningPromotionPreviewCheck["status"] = policyPassed
    ? "pass"
    : candidate.policyValidationStatus === "pending" ||
        candidate.policyValidationStatus === "missing" ||
        candidate.policyValidationStatus === "warn"
      ? "pending"
      : "blocked";

  const checks: MovesLearningPromotionPreviewCheck[] = [
    {
      label: "Source lineage",
      status: hasLineage ? "pass" : "blocked",
      detail: hasLineage
        ? "Move, source artifact, and evidence references are present."
        : "Move source, source artifact, or evidence references are missing.",
    },
    {
      label: "Context policy",
      status: policyStatus,
      detail: policyPassed
        ? "Context/corpus policy status is pass, tenant scope is present, and classification is allowed."
        : evaluation.failure_reasons.length > 0
          ? `Policy status is ${candidate.policyValidationStatus}; ${evaluation.failure_reasons.join("; ")}.`
          : `Policy status is ${candidate.policyValidationStatus}; steward policy validation is still required.`,
    },
    {
      label: "Agent context eligibility",
      status: eligibilityReady ? "pass" : "blocked",
      detail: eligibilityReady
        ? "Source basis, confidence, provenance, and applicable-agent metadata are present."
        : `Missing ${missingEligibilityReasons(readinessRow).join(", ")} before this can enter active context.`,
    },
    {
      label: "Azure retrieval index",
      status: criteria.indexed_or_retrievable ? "pass" : "blocked",
      detail: criteria.indexed_or_retrievable
        ? `Candidate is retrievable (${candidate.retrievability}).`
        : `Retrievability is ${candidate.retrievability}; it is not citeable by agents yet.`,
    },
    {
      label: "Citation rendering proof",
      status: criteria.citation_renderable ? "pass" : "pending",
      detail: criteria.citation_renderable
        ? `Cite-render proof recorded at ${candidate.citedRenderVerifiedAt}.`
        : "No end-to-end cite-render proof is recorded on the Moves learning candidate yet.",
    },
    {
      label: "Steward decision",
      status:
        candidate.readinessStatus === "agent_ready"
          ? agentReady
            ? "investigate"
            : "investigate"
          : evaluation.recommendation === "promotion_candidate"
            ? "pending"
            : "blocked",
      detail: agentReady
        ? "Candidate is marked agent-ready; verify the explicit steward approval audit trail before use."
        : evaluation.recommendation === "promotion_candidate"
          ? "Canonical gates pass; steward sign-off is still required before changing active context."
          : `Readiness is ${candidate.readinessStatus}; active context use is blocked.`,
    },
  ];

  if (candidate.readinessStatus === "agent_ready") {
    return {
      status: "investigate",
      statusLabel: "Investigate",
      summary:
        "This candidate already has an active-use signal. Verify explicit steward approval, retrieval proof, and citation proof before any agent consumes it.",
      checks,
      nextAction:
        "Audit the promotion trail. If approval, indexing, and cite-render proof are missing, remove active-use signals before release.",
    };
  }

  if (
    evaluation.recommendation !== "promotion_candidate" ||
    !hasLineage ||
    !policyPassed
  ) {
    return {
      status: "blocked",
      statusLabel: "Not ready",
      summary:
        "This candidate is safely persisted for stewardship, but canonical promotion gates are not complete.",
      checks,
      nextAction:
        "Complete source review, context policy validation, canonical eligibility metadata, indexing, cite-render verification, and steward approval as separate controlled steps.",
    };
  }

  return {
    status: "preview_ready",
    statusLabel: "Preview ready",
    summary:
      "Canonical promotion gates are satisfied for a read-only preview. Do not mark agent-ready until a steward signs off.",
    checks,
    nextAction:
      "Run a read-only promotion preview and capture retrieval/citation proof before any active-context update.",
  };
}

export function buildMovesLearningPromotionRollup(
  candidates: readonly MovesLearningReviewCandidate[],
): MovesLearningPromotionRollup {
  if (candidates.length === 0) {
    return {
      status: "empty",
      statusLabel: "No candidates",
      summary:
        "No Moves learning candidates are visible for this tenant yet. Run governed Move writeback after approved evidence, signed-off deliverables, or gate decisions exist.",
      totals: {
        candidates: 0,
        blockedCandidates: 0,
        investigateCandidates: 0,
        previewReadyCandidates: 0,
      },
      checks: [],
      topBlockers: [],
      nextAction:
        "Complete a governed Move phase and verify the learning ledger writes reviewable context candidates.",
    };
  }

  const previews = candidates.map(buildMovesLearningPromotionPreview);
  const checkMap = new Map<string, MovesLearningPromotionRollupCheck>();
  const blockerCounts = new Map<string, number>();

  for (const preview of previews) {
    for (const check of preview.checks) {
      const current =
        checkMap.get(check.label) ?? {
          label: check.label,
          passed: 0,
          blocked: 0,
          pending: 0,
          investigate: 0,
        };
      const next = {
        ...current,
        passed: current.passed + (check.status === "pass" ? 1 : 0),
        blocked: current.blocked + (check.status === "blocked" ? 1 : 0),
        pending: current.pending + (check.status === "pending" ? 1 : 0),
        investigate:
          current.investigate + (check.status === "investigate" ? 1 : 0),
      };
      checkMap.set(check.label, next);
      if (check.status !== "pass") {
        blockerCounts.set(check.label, (blockerCounts.get(check.label) ?? 0) + 1);
      }
    }
  }

  const blockedCandidates = previews.filter(
    (preview) => preview.status === "blocked",
  ).length;
  const investigateCandidates = previews.filter(
    (preview) => preview.status === "investigate",
  ).length;
  const previewReadyCandidates = previews.filter(
    (preview) => preview.status === "preview_ready",
  ).length;
  const status: MovesLearningPromotionRollup["status"] =
    investigateCandidates > 0
      ? "investigate"
      : blockedCandidates > 0
        ? "blocked"
        : "preview_ready";
  const topBlockers = Array.from(blockerCounts.entries())
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, 3)
    .map(([label, count]) => `${label}: ${count}`);

  return {
    status,
    statusLabel:
      status === "investigate"
        ? "Investigate"
        : status === "preview_ready"
          ? "Preview ready"
          : "Not ready",
    summary:
      status === "investigate"
        ? "One or more Moves learning candidates already show active-use signals. Stewardship should verify the promotion trail before agents consume them."
        : status === "preview_ready"
          ? "All deterministic checks are present for a read-only promotion preview. Steward approval and retrieval/citation proof must still be captured before active use."
          : "Moves learning is persisted for stewardship, but active enterprise-context promotion is blocked until policy, indexing, citation proof, and steward decision checks are complete.",
    totals: {
      candidates: candidates.length,
      blockedCandidates,
      investigateCandidates,
      previewReadyCandidates,
    },
    checks: Array.from(checkMap.values()),
    topBlockers,
    nextAction:
      status === "investigate"
        ? "Audit active-looking rows first; remove active-use signals if explicit steward approval, indexing, and cite-render proof are missing."
        : status === "preview_ready"
          ? "Run the read-only context/corpus promotion preview and capture retrieval plus citation evidence before any write to agent-ready context."
          : "Resolve the top blockers, starting with policy validation and Azure retrieval indexing, while keeping all candidates out of default agent context.",
  };
}

export function summarizeMovesLearningReviewCandidates(
  tenantKey: string,
  rows: readonly MovesLearningReviewRow[],
): MovesLearningReviewQueue {
  const candidates = rows.map(toCandidate);
  const bySourceBasis: Record<MovesLearningSourceBasis | string, number> = {};
  const byReadiness: Record<string, number> = {};
  for (const candidate of candidates) {
    increment(bySourceBasis, candidate.sourceBasis);
    increment(
      byReadiness,
      [
        candidate.readinessStatus,
        candidate.retrievability,
        candidate.policyValidationStatus,
      ].join(" / "),
    );
  }
  return {
    tenantKey,
    canonicalTenantKey: canonicalTenantKey(tenantKey),
    candidates,
    counts: {
      total: candidates.length,
      bySourceBasis: Object.fromEntries(
        Object.entries(bySourceBasis).map(([key, value]) => [
          sourceBasisLabel(key),
          value,
        ]),
      ),
      byReadiness,
    },
  };
}

export async function getMovesLearningReviewQueue(
  tenantKey: string,
  options: {
    readonly limit?: number;
    readonly reader?: AzureReadClient;
  } = {},
): Promise<MovesLearningReviewQueue> {
  const reader = options.reader ?? azureRead;
  const canonical = canonicalTenantKey(tenantKey);
  const aliases = Array.from(new Set([canonical, ...tenantAliasesFor(tenantKey)]));
  const rows = await reader.query<MovesLearningReviewRow>(
    `select
       r.id::text,
       r.tenant_key,
       r.canonical_record_id,
       r.record_subtype,
       r.title,
       r.source_record_id,
       r.last_synced_at,
       r.payload,
       g.object_table,
       g.object_id,
       g.tenant_id,
       g.source_layer,
       g.agent_readiness_status,
       g.retrievability,
       g.classification,
       g.source_basis as readiness_source_basis,
       g.policy_validation_status,
       g.confidence_level,
       g.applicable_agents,
       g.cited_render_verified_at,
       g.provenance,
       g.confidence_rationale
     from enterprise_context_records r
     left join governed_object_readiness g
       on g.object_table = 'enterprise_context_records'
      and g.object_id = r.id::text
      and g.client_key = any($1::text[])
     where r.tenant_key = any($1::text[])
       and r.record_type = $2
       and r.source_system = $3
     order by r.last_synced_at desc nulls last, r.title asc
     limit $4`,
    [
      aliases,
      MOVES_LEARNING_RECORD_TYPE,
      MOVES_LEARNING_SOURCE_SYSTEM,
      options.limit ?? 50,
    ],
    { missingTable: "empty" },
  );
  return summarizeMovesLearningReviewCandidates(tenantKey, rows);
}
