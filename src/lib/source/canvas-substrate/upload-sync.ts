// Upload → canvas-substrate sync (durable).
//
// Audit finding F1 (2026-06-11, SkyHarbor live run): an uploaded evidence file lands in
// Blob + the source_artifacts registry and renders in the EVENT DOCUMENTS shelf, but the
// Evidence readiness ladder and Gate criteria the canvas shows never move — the only
// readiness write was the explicitly in-memory reasoning store (per-process, resets on
// restart), while the canvas reads the per-event Postgres substrate tables. This module
// is the missing durable write path:
//
//   upload → match canonical evidence requirement (filename + stage)
//          → upgrade source_event_evidence_states (7-state ramp; never downgrade;
//            link source_artifact_id)
//          → update source_event_gate_criterion_states for the artifact's family
//            (append evidence_artifact_ids; auto-'met' ONLY for ART-* presence
//            criteria — HARD human gates stay pending for a named approver)
//
// Pure matching is exported for tests; DB writes take an injectable client.

import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import {
  SOURCE_EVIDENCE_REQUIREMENTS,
  type SourceEvidenceRequirement,
} from "@/lib/source/canonical-specs/evidence-requirements";
import { getCriterionIdsForArtifactFamily } from "@/lib/source/artifact-gate-map";
import type { SourceArtifactFamily } from "@/lib/source/artifact-registry/types";
import type { SourceStageKey } from "@/lib/source/types";

type DbClient = ReturnType<typeof getAzureWriteFluentClient>;

// ── Evidence-state ramp ordering (upgrade-only; Stale/Low Confidence are
//    flags a fresh upload may replace) ──────────────────────────────────────
const STATE_RANK: Record<string, number> = {
  "Not Requested": 0,
  Stale: 0,
  "Low Confidence": 0,
  Loaded: 1,
  Parsed: 2,
  Available: 3,
  "Usable Evidence": 4,
};

/**
 * Filename keywords per canonical requirement id. Curated, not inferred — the
 * requirement set is small and stable, and explicit keywords keep matching
 * auditable. All matching is against the lowercased filename and scoped to the
 * upload's stage, so cross-stage collisions (e.g. "contract") cannot occur.
 */
const REQUIREMENT_FILENAME_KEYWORDS: Record<string, string[]> = {
  // Stage 1 · Strategy
  "EVID-SRC-STR-INCUMBENT": [
    "incumbent",
    "contract",
    "msa",
    "sow",
    "renewal",
    "agreement",
  ],
  "EVID-SRC-STR-SPONSOR-COMMIT": [
    "sponsor",
    "commitment",
    "governance",
    "authoriz",
    "mandate",
  ],
  // Stage 2 · Scope
  "EVID-SRC-SCOPE-APP-INV": [
    "application",
    "inventory",
    "cmdb",
    "portfolio",
    "app_",
  ],
  "EVID-SRC-SCOPE-ORG": [
    "org",
    "roster",
    "headcount",
    "workforce",
    "staffing",
    "fte",
  ],
  "EVID-SRC-SCOPE-TICKET-HISTORY": [
    "ticket",
    "incident",
    "itsm",
    "volume",
    "servicenow",
    "jira",
  ],
  "EVID-SRC-SCOPE-FY-CONTRACT": [
    "contract",
    "spend",
    "run_cost",
    "run-cost",
    "runcost",
    "budget",
  ],
  // Stage 3 · RFP
  "EVID-SRC-RFP-VENDOR-INTEL": ["vendor", "market", "intel", "landscape"],
  "EVID-SRC-RFP-LEGAL-TEMPLATE": [
    "legal",
    "terms",
    "template",
    "dpa",
    "liability",
  ],
  // Stage 4 · Responses
  "EVID-SRC-RESP-PROPOSALS": ["proposal", "response", "bid", "submission"],
  "EVID-SRC-RESP-CLARIFICATIONS": ["clarification", "q&a", "qa_", "question"],
  // Stage 5 · Evaluation
  "EVID-SRC-EVAL-RATER-SCORES": ["score", "rating", "evaluation", "rater"],
  "EVID-SRC-EVAL-WEIGHT-RATIONALE": ["weight", "criteria", "rationale"],
  // Stage 6 · Pricing
  "EVID-SRC-PRICE-VENDOR-PRICING": [
    "pricing",
    "price",
    "rate",
    "cost",
    "commercial",
  ],
  "EVID-SRC-PRICE-ASSUMPTIONS": ["assumption", "basis"],
  // Stage 7 · BAFO
  "EVID-SRC-BAFO-OPEN-TRAPS": ["trap", "bafo", "open_item", "issue"],
  // Stage 8 · Executive decision
  "EVID-SRC-DEC-FINALIST-PRICING": ["pricing", "finalist", "final_offer"],
  "EVID-SRC-DEC-RISK-REGISTER": ["risk"],
  // Stage 9 · Selection
  "EVID-SRC-SEL-CONTRACT": ["contract", "executed", "signature", "signed"],
  // Stage 10 · Transition
  "EVID-SRC-TRAN-MILESTONES": ["milestone", "plan", "timeline", "cutover"],
  "EVID-SRC-TRAN-KT-EVIDENCE": ["kt", "knowledge", "handover"],
  // Stage 11 · Value
  "EVID-SRC-VAL-MEASUREMENT": [
    "value",
    "kpi",
    "measure",
    "benefit",
    "realization",
    "realisation",
  ],
};

/**
 * Match an uploaded file to the canonical evidence requirement it satisfies,
 * scoped to the upload's stage. Returns null when nothing matches — an honest
 * no-op beats a wrong link.
 */
export function matchEvidenceRequirementForUpload(args: {
  stageKey: SourceStageKey | string;
  filename: string;
}): SourceEvidenceRequirement | null {
  const name = args.filename.toLowerCase();
  const stageRequirements = SOURCE_EVIDENCE_REQUIREMENTS.filter(
    (r) => r.stage === args.stageKey,
  );
  let best: { req: SourceEvidenceRequirement; hits: number } | null = null;
  for (const req of stageRequirements) {
    const keywords = REQUIREMENT_FILENAME_KEYWORDS[req.requirementId] ?? [];
    const hits = keywords.filter((k) => name.includes(k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { req, hits };
  }
  return best?.req ?? null;
}

/**
 * The canonical filename token a downloadable input template should embed so
 * that, once the user fills it in and re-uploads it, {@link
 * matchEvidenceRequirementForUpload} reconciles it back to this exact
 * requirement with no manual picking. Drawn from the same curated keyword map,
 * so the template and the matcher can never drift apart. Returns null when a
 * requirement has no keywords (no deterministic round-trip can be promised).
 */
export function templateFilenameTokenForRequirement(
  requirementId: string,
): string | null {
  const keywords = REQUIREMENT_FILENAME_KEYWORDS[requirementId];
  return keywords && keywords.length > 0 ? keywords[0] : null;
}

export interface UploadSubstrateSyncInput {
  /** source_events.id row (FK for the substrate tables). */
  sourceEventRowId: string;
  tenantKey: string;
  stageKey: SourceStageKey | string;
  artifactId: string;
  artifactFamily: SourceArtifactFamily;
  filename: string;
  /** true when the upload parsed synchronously (csv/txt/etc.). */
  parsed: boolean;
}

export interface UploadSubstrateSyncResult {
  evidence: {
    requirementId: string;
    previousState: string | null;
    newState: string;
    minimumState: string;
    meetsMinimum: boolean;
  } | null;
  criteria: { criterionId: string; linked: boolean; autoMet: boolean }[];
  skippedReason?: string;
}

/**
 * Durably reflect an upload in the canvas substrate. Never downgrades an
 * evidence state; never auto-meets a non-ART (human/HARD) gate criterion.
 */
export async function syncUploadToCanvasSubstrate(
  input: UploadSubstrateSyncInput,
  db: DbClient = getAzureWriteFluentClient(),
): Promise<UploadSubstrateSyncResult> {
  const result: UploadSubstrateSyncResult = { evidence: null, criteria: [] };
  const nowIso = new Date().toISOString();

  // ── 1 · evidence readiness ladder ──
  const matched = matchEvidenceRequirementForUpload({
    stageKey: input.stageKey,
    filename: input.filename,
  });
  if (matched) {
    const targetState = input.parsed ? "Parsed" : "Loaded";
    const { data: existing, error: readError } = await db
      .from("source_event_evidence_states")
      .select("*")
      .eq("source_event_id", input.sourceEventRowId)
      .eq("requirement_id", matched.requirementId)
      .maybeSingle();
    if (readError)
      throw new Error(`evidence_state read failed: ${readError.message}`);

    const previousState = existing
      ? String((existing as Record<string, unknown>).current_state)
      : null;
    const previousRank =
      previousState !== null ? (STATE_RANK[previousState] ?? 0) : -1;
    const targetRank = STATE_RANK[targetState];

    if (existing && targetRank > previousRank) {
      const { error } = await db
        .from("source_event_evidence_states")
        .update({
          current_state: targetState,
          source_artifact_id: input.artifactId,
          notes: `Uploaded: ${input.filename}`,
          last_synced_at: nowIso,
          updated_at: nowIso,
        })
        .eq("source_event_id", input.sourceEventRowId)
        .eq("requirement_id", matched.requirementId);
      if (error)
        throw new Error(`evidence_state update failed: ${error.message}`);
    } else if (!existing) {
      const { error } = await db.from("source_event_evidence_states").insert({
        source_event_id: input.sourceEventRowId,
        tenant_key: input.tenantKey,
        requirement_id: matched.requirementId,
        stage_key: String(input.stageKey),
        current_state: targetState,
        source_artifact_id: input.artifactId,
        notes: `Uploaded: ${input.filename}`,
        last_synced_at: nowIso,
      });
      if (error)
        throw new Error(`evidence_state insert failed: ${error.message}`);
    }

    const newState =
      existing && targetRank <= previousRank
        ? (previousState as string)
        : targetState;
    const newRank = STATE_RANK[newState] ?? 0;
    result.evidence = {
      requirementId: matched.requirementId,
      previousState,
      newState,
      minimumState: matched.minimumState,
      meetsMinimum: newRank >= (STATE_RANK[matched.minimumState] ?? 99),
    };
  }

  // ── 2 · gate criteria (artifact-presence only auto-meets) ──
  const criterionIds = getCriterionIdsForArtifactFamily(input.artifactFamily);
  for (const criterionId of criterionIds) {
    const { data: row, error: readError } = await db
      .from("source_event_gate_criterion_states")
      .select("*")
      .eq("source_event_id", input.sourceEventRowId)
      .eq("criterion_id", criterionId)
      .maybeSingle();
    if (readError)
      throw new Error(`gate_criterion read failed: ${readError.message}`);
    if (!row) {
      result.criteria.push({ criterionId, linked: false, autoMet: false });
      continue;
    }
    const rec = row as Record<string, unknown>;
    const ids: string[] = Array.isArray(rec.evidence_artifact_ids)
      ? (rec.evidence_artifact_ids as unknown[]).map(String)
      : [];
    if (!ids.includes(input.artifactId)) ids.push(input.artifactId);

    // ART-* criteria are artifact-presence checks and may auto-satisfy; every
    // other criterion (GATE-*, EVID-*) requires a named human via MARK MET.
    const isPresence = criterionId.startsWith("ART-");
    const currentState = String(rec.state ?? "pending");
    const autoMet =
      isPresence && (currentState === "pending" || currentState === "not_met");

    const { error } = await db
      .from("source_event_gate_criterion_states")
      .update({
        evidence_artifact_ids: ids,
        ...(autoMet
          ? {
              state: "met",
              notes: `Auto-satisfied by upload: ${input.filename}`,
              reviewed_at: nowIso,
            }
          : {}),
        updated_at: nowIso,
      })
      .eq("source_event_id", input.sourceEventRowId)
      .eq("criterion_id", criterionId);
    if (error)
      throw new Error(`gate_criterion update failed: ${error.message}`);

    result.criteria.push({ criterionId, linked: true, autoMet });
  }

  return result;
}
