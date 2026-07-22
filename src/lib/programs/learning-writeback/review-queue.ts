import { azureRead, type AzureReadClient } from "@/lib/data-plane/azureRead";
import { canonicalTenantKey, tenantAliasesFor } from "@/lib/tenant/aliases";

import {
  MOVES_LEARNING_RECORD_TYPE,
  MOVES_LEARNING_SOURCE_SYSTEM,
  type MovesLearningPayload,
  type MovesLearningSourceBasis,
} from "./types";

export interface MovesLearningReviewCandidate {
  readonly id: string;
  readonly tenantKey: string;
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
  readonly confidence_level?: string | null;
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

export function buildMovesLearningReviewPacket(
  candidate: MovesLearningReviewCandidate,
): MovesLearningReviewPacket {
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
  if (candidate.readinessStatus !== "agent_ready") {
    blockers.push("Not agent-ready; held for stewardship.");
  }

  if (
    candidate.readinessStatus === "agent_ready" ||
    candidate.retrievability === "search_indexed"
  ) {
    return {
      action: "investigate_active_promotion_violation",
      actionLabel: "Investigate before use",
      whyHere: `${reviewPhaseLabel(candidate.phase)} ${sourceBasisLabel(candidate.sourceBasis)} from Moves appears promoted or indexed.`,
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
    candidate.retrievability === "committed_not_indexed"
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
  const hasLineage =
    isKnownLearningSourceBasis(candidate.sourceBasis) &&
    Boolean(candidate.sourceId) &&
    candidate.evidenceRefs.length > 0;
  const policyPassed = candidate.policyValidationStatus === "pass";
  const retrievalReady = candidate.retrievability === "search_indexed";
  const agentReady = candidate.readinessStatus === "agent_ready";
  const activeLooking = agentReady || retrievalReady;

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
      status: policyPassed ? "pass" : "blocked",
      detail: policyPassed
        ? "Context/corpus policy status is pass."
        : `Policy status is ${candidate.policyValidationStatus}; steward review is required.`,
    },
    {
      label: "Azure retrieval index",
      status: retrievalReady ? "pass" : "blocked",
      detail: retrievalReady
        ? "Candidate reports search-indexed retrievability."
        : `Retrievability is ${candidate.retrievability}; it is not citeable by agents yet.`,
    },
    {
      label: "Citation rendering proof",
      status: "pending",
      detail:
        "No cite-render proof is recorded on the Moves learning candidate yet.",
    },
    {
      label: "Steward decision",
      status: agentReady ? "pass" : "blocked",
      detail: agentReady
        ? "Candidate is marked agent-ready; verify the approval audit trail before use."
        : `Readiness is ${candidate.readinessStatus}; active context use is blocked.`,
    },
  ];

  if (activeLooking) {
    return {
      status: "investigate",
      statusLabel: "Investigate",
      summary:
        "This candidate already has an active-use signal. Verify explicit steward approval, retrieval proof, and citation proof before any agent consumes it.",
      checks: checks.map((check) =>
        check.label === "Azure retrieval index" || check.label === "Steward decision"
          ? { ...check, status: "investigate" }
          : check,
      ),
      nextAction:
        "Audit the promotion trail. If approval, indexing, and cite-render proof are missing, remove active-use signals before release.",
    };
  }

  const blocked = checks.some((check) => check.status === "blocked");
  if (blocked) {
    return {
      status: "blocked",
      statusLabel: "Not ready",
      summary:
        "This candidate is safely persisted for stewardship, but it is not ready for active enterprise context or model retrieval.",
      checks,
      nextAction:
        "Complete source review, policy validation, indexing, cite-render verification, and steward approval as separate controlled steps.",
    };
  }

  return {
    status: "preview_ready",
    statusLabel: "Preview ready",
    summary:
      "All deterministic checks are present for a read-only promotion preview. Do not mark agent-ready until a steward signs off.",
    checks,
    nextAction:
      "Run a read-only promotion preview and capture retrieval/citation proof before any active-context update.",
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
       g.agent_readiness_status,
       g.retrievability,
       g.policy_validation_status,
       g.confidence_level,
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
