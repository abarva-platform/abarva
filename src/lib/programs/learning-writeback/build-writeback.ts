import { createHash } from "node:crypto";
import { canonicalTenantKey } from "@/lib/tenant-keys";
import {
  MOVES_LEARNING_RECORD_TYPE,
  MOVES_LEARNING_SOURCE_SYSTEM,
  MOVES_LEARNING_WRITEBACK_SCHEMA_VERSION,
  type MovesLearningClaimType,
  type MovesLearningDeliverableInput,
  type MovesLearningEnterpriseContextFactDraft,
  type MovesLearningEnterpriseContextRecordRow,
  type MovesLearningEvidenceInput,
  type MovesLearningGateDecisionInput,
  type MovesLearningMove,
  type MovesLearningPayload,
  type MovesLearningReadinessDraft,
  type MovesLearningSourceBasis,
  type MovesLearningWritebackPlan,
  type MovesLearningWritebackSkip,
} from "./types";

function hashJson(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function compact(value: string | null | undefined, max = 1200): string {
  return (value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

function numberConfidence(value: number | string | null | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.min(1, value > 1 ? value / 100 : value));
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return numberConfidence(parsed);
    if (value.toLowerCase() === "high") return 0.9;
    if (value.toLowerCase() === "medium") return 0.74;
    if (value.toLowerCase() === "low") return 0.52;
  }
  return 0.68;
}

function confidenceLevel(
  confidence: number,
): MovesLearningReadinessDraft["confidence_level"] {
  if (confidence >= 0.82) return "high";
  if (confidence >= 0.62) return "medium";
  return "low";
}

function canonicalRecordId(args: {
  moveId: string;
  sourceBasis: MovesLearningSourceBasis;
  sourceId: string;
}): string {
  return `moves-learning-${args.moveId}-${args.sourceBasis}-${args.sourceId}`;
}

function evidencePointer(args: {
  moveId: string;
  sourceBasis: MovesLearningSourceBasis;
  sourceId: string;
}): string {
  return `moves-learning://${args.moveId}/${args.sourceBasis}/${args.sourceId}`;
}

function skip(
  sourceBasis: MovesLearningWritebackSkip["sourceBasis"],
  sourceId: string,
  reason: MovesLearningWritebackSkip["reason"],
): MovesLearningWritebackSkip {
  return { sourceBasis, sourceId, reason };
}

function sourceFileFor(
  sourceBasis: MovesLearningSourceBasis,
  sourceId: string,
): string {
  return `${sourceBasis}:${sourceId}`;
}

function addRecord(args: {
  move: MovesLearningMove;
  sourceBasis: MovesLearningSourceBasis;
  sourceId: string;
  sourceArtifactVersion?: number | null;
  phase: number | null;
  title: string;
  summary: string;
  claimType: MovesLearningClaimType;
  evidenceRefs: readonly string[];
  confidence: number;
  committedAt: string;
  records: MovesLearningEnterpriseContextRecordRow[];
  factDrafts: MovesLearningEnterpriseContextFactDraft[];
  readinessDrafts: MovesLearningReadinessDraft[];
}): void {
  const tenantKey = canonicalTenantKey(args.move.tenantKey);
  const canonical_record_id = canonicalRecordId({
    moveId: args.move.id,
    sourceBasis: args.sourceBasis,
    sourceId: args.sourceId,
  });
  const pointer = evidencePointer({
    moveId: args.move.id,
    sourceBasis: args.sourceBasis,
    sourceId: args.sourceId,
  });
  const confidence_level = confidenceLevel(args.confidence);
  const payload: MovesLearningPayload = {
    moveId: args.move.id,
    moveName: args.move.name,
    tenantKey,
    phase: args.phase,
    sourceBasis: args.sourceBasis,
    sourceId: args.sourceId,
    sourceArtifactVersion: args.sourceArtifactVersion ?? null,
    claimType: args.claimType,
    title: args.title,
    summary: args.summary,
    evidenceRefs: args.evidenceRefs,
    confidenceLevel: confidence_level,
    functionPackKey: args.move.functionPackKey ?? null,
    archetype: args.move.archetype ?? null,
    writebackSchemaVersion: MOVES_LEARNING_WRITEBACK_SCHEMA_VERSION,
  };

  args.records.push({
    client_id: args.move.clientId,
    tenant_key: tenantKey,
    canonical_record_id,
    record_type: MOVES_LEARNING_RECORD_TYPE,
    record_subtype: args.sourceBasis,
    title: `Move learning - ${args.title}`,
    source_system: MOVES_LEARNING_SOURCE_SYSTEM,
    source_record_id: args.sourceId,
    source_file: sourceFileFor(args.sourceBasis, args.sourceId),
    source_sheet: null,
    source_row_number: null,
    last_synced_at: args.committedAt,
    confidence: args.confidence,
    freshness_status: "fresh",
    evidence_pointer: pointer,
    lifecycle_state: "active",
    payload_hash: hashJson(payload),
    payload,
  });

  args.factDrafts.push({
    canonical_record_id,
    client_id: args.move.clientId,
    tenant_key: tenantKey,
    fact_key: `moves.${args.sourceBasis}.${args.claimType}`,
    fact_type: "text",
    fact_value: {
      title: args.title,
      summary: args.summary,
      phase: args.phase,
      sourceBasis: args.sourceBasis,
      sourceId: args.sourceId,
    },
    fact_text: args.summary,
    source_system: MOVES_LEARNING_SOURCE_SYSTEM,
    source_record_id: args.sourceId,
    source_file: sourceFileFor(args.sourceBasis, args.sourceId),
    source_sheet: null,
    source_row_number: null,
    last_synced_at: args.committedAt,
    confidence: args.confidence,
    freshness_status: "fresh",
    evidence_pointer: pointer,
    lifecycle_state: "active",
    value_hash: hashJson({
      sourceBasis: args.sourceBasis,
      sourceId: args.sourceId,
      title: args.title,
      summary: args.summary,
    }),
  });

  args.readinessDrafts.push({
    canonical_record_id,
    object_table: "enterprise_context_records",
    object_id: "",
    client_key: tenantKey,
    tenant_id: args.move.clientId,
    source_layer: "tenant_context",
    agent_readiness_status: "not_reviewed",
    retrievability: "committed_not_indexed",
    classification: "internal",
    source_basis: args.sourceBasis,
    confidence_level,
    confidence_rationale:
      "Move-derived learning is persisted with source lineage, but remains not_reviewed until context policy, indexing, and cite-render verification promote it.",
    applicable_agents: ["nexus", "tower", "steward"],
    policy_validation_status: "pending",
    provenance: {
      sourceSystem: MOVES_LEARNING_SOURCE_SYSTEM,
      moveId: args.move.id,
      moveName: args.move.name,
      phase: args.phase,
      sourceBasis: args.sourceBasis,
      sourceId: args.sourceId,
      sourceArtifactVersion: args.sourceArtifactVersion ?? null,
      evidenceRefs: args.evidenceRefs,
      writebackSchemaVersion: MOVES_LEARNING_WRITEBACK_SCHEMA_VERSION,
    },
    backfill_reason:
      "Moves learning candidate; active enterprise context requires separate human/context-corpus promotion.",
  });
}

export function buildMovesLearningWritebackPlan(input: {
  readonly move: MovesLearningMove;
  readonly evidence: readonly MovesLearningEvidenceInput[];
  readonly deliverables: readonly MovesLearningDeliverableInput[];
  readonly gateDecisions: readonly MovesLearningGateDecisionInput[];
  readonly committedAt: string;
}): MovesLearningWritebackPlan {
  const tenantKey = canonicalTenantKey(input.move.tenantKey);
  const records: MovesLearningEnterpriseContextRecordRow[] = [];
  const factDrafts: MovesLearningEnterpriseContextFactDraft[] = [];
  const readinessDrafts: MovesLearningReadinessDraft[] = [];
  const skipped: MovesLearningWritebackSkip[] = [];

  for (const evidence of input.evidence) {
    if (canonicalTenantKey(evidence.tenantKey) !== tenantKey || evidence.moveId !== input.move.id) {
      skipped.push(skip("approved_evidence", evidence.id, "wrong_tenant"));
      continue;
    }
    if (evidence.reviewDecision !== "approved") {
      skipped.push(skip("approved_evidence", evidence.id, "not_approved"));
      continue;
    }
    if (evidence.classification === "restricted") {
      skipped.push(skip("approved_evidence", evidence.id, "restricted"));
      continue;
    }
    const summary = compact(evidence.summary || evidence.extractedText);
    if (!summary) {
      skipped.push(skip("approved_evidence", evidence.id, "missing_summary"));
      continue;
    }
    addRecord({
      move: input.move,
      sourceBasis: "approved_evidence",
      sourceId: evidence.id,
      phase: evidence.phase,
      title: evidence.title,
      summary,
      claimType: "evidence",
      evidenceRefs: [
        evidence.id,
        ...(evidence.attachmentId ? [evidence.attachmentId] : []),
      ],
      confidence: numberConfidence(evidence.confidence),
      committedAt: input.committedAt,
      records,
      factDrafts,
      readinessDrafts,
    });
  }

  for (const deliverable of input.deliverables) {
    if (canonicalTenantKey(deliverable.tenantKey) !== tenantKey || deliverable.moveId !== input.move.id) {
      skipped.push(skip("client_approved_deliverable", deliverable.id, "wrong_tenant"));
      continue;
    }
    if (deliverable.status !== "signed_off" || !deliverable.signedOffVersion) {
      skipped.push(skip("client_approved_deliverable", deliverable.id, "not_signed_off"));
      continue;
    }
    const summary = compact(deliverable.latestContent, 1600);
    if (!summary) {
      skipped.push(skip("client_approved_deliverable", deliverable.id, "missing_summary"));
      continue;
    }
    addRecord({
      move: input.move,
      sourceBasis: "client_approved_deliverable",
      sourceId: deliverable.id,
      sourceArtifactVersion: deliverable.signedOffVersion,
      phase: deliverable.phase,
      title: deliverable.title,
      summary,
      claimType: "deliverable",
      evidenceRefs: [
        deliverable.id,
        ...(deliverable.approvedArtifactId ? [deliverable.approvedArtifactId] : []),
      ],
      confidence: 0.86,
      committedAt: input.committedAt,
      records,
      factDrafts,
      readinessDrafts,
    });
  }

  for (const gate of input.gateDecisions) {
    if (canonicalTenantKey(gate.tenantKey) !== tenantKey || gate.moveId !== input.move.id) {
      skipped.push(skip("gate_decision", gate.id, "wrong_tenant"));
      continue;
    }
    if (gate.sourceBasis !== "governed_gate_evaluation" || gate.status !== "approved") {
      skipped.push(skip("gate_decision", gate.id, "not_gate_decision"));
      continue;
    }
    const summary = compact(
      [
        gate.title,
        typeof gate.metadata?.softGapsCarried === "boolean"
          ? `soft_gaps_carried=${gate.metadata.softGapsCarried}`
          : null,
        Array.isArray(gate.metadata?.carriedGaps)
          ? `carried_gaps=${gate.metadata.carriedGaps.length}`
          : null,
      ]
        .filter(Boolean)
        .join("; "),
    );
    if (!summary) {
      skipped.push(skip("gate_decision", gate.id, "missing_summary"));
      continue;
    }
    addRecord({
      move: input.move,
      sourceBasis: "gate_decision",
      sourceId: gate.id,
      phase: gate.phase,
      title: gate.title,
      summary,
      claimType: "gate",
      evidenceRefs: [gate.id],
      confidence: 0.9,
      committedAt: input.committedAt,
      records,
      factDrafts,
      readinessDrafts,
    });
  }

  return { records, factDrafts, readinessDrafts, skipped };
}
