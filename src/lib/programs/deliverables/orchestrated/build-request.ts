// Build a DeliverableIntelligenceRequest for a Move from its RECORDED data only.
//
// This is the evidence-binding seam between a real `engagements` Move and the
// Deliverable Intelligence Orchestrator. Client-specific facts come ONLY from
// what the Move actually recorded — the charter fields captured at P1 and the
// `engagements.baseline_metrics` rows. Each becomes one citation-numbered
// GovernedEvidenceItem; nothing is invented. Charter fields the Move does NOT
// have become MissingEvidenceItem entries (so the orchestrator labels the gap
// rather than fabricating). This is what lets the quality gate stay honest:
// a thin Move produces a thin (or blocked) deck, never a fabricated one.

import type { MoveBusinessCaseInput } from "../../move-business-case";
import type {
  DeliverableIntelligenceRequest,
  FormattingProfile,
  GovernedEvidenceItem,
  MissingEvidenceItem,
  QualityBar,
  SourceRegisterEntry,
} from "@/lib/deliverables/orchestrator/types";

/** Board-grade defaults shared by orchestrated Move deliverables. */
const FORMATTING_PROFILE: FormattingProfile = {
  bodyPointSize: 11,
  headingStyle: "numbered",
  tableStyle: "banded",
  wideDataToExcelCompanion: true,
  includeCoverPage: true,
  includeTableOfContents: true,
  includeSourceRegisterSection: true,
};

const QUALITY_BAR: QualityBar = {
  minSections: 5,
  minBodyWords: 600,
  requiresCitations: true,
  requiresDecisionSection: true,
  requiresRecommendation: true,
  requiresRiskTable: true,
  requiresSourceRegister: true,
  requiresClientCompleteChecklistWhenGaps: true,
  tone: "board_grade_consulting",
};

/** Charter fields captured at P1, in the order they read on a board deck. */
const CHARTER_EVIDENCE_FIELDS: ReadonlyArray<{
  key: string;
  label: string;
  evidenceFamily: string;
}> = [
  {
    key: "sponsor",
    label: "Accountable sponsor",
    evidenceFamily: "charter_sponsor",
  },
  {
    key: "stakeholders",
    label: "Stakeholders & dependencies",
    evidenceFamily: "charter_stakeholders",
  },
  {
    key: "success_metrics",
    label: "Success metrics & baseline",
    evidenceFamily: "charter_success_metrics",
  },
  {
    key: "value_range",
    label: "Projected value range",
    evidenceFamily: "charter_value_range",
  },
  { key: "scope", label: "Scope (in / out)", evidenceFamily: "charter_scope" },
];

function asString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/** Pull a clean, human-readable statement from a baseline-metric row. */
function baselineStatement(
  row: unknown,
): { label: string; statement: string } | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  // `metric_name` is the canonical BaselineMetricEntry field; the others are
  // accepted defensively for older/looser rows.
  const label =
    asString(r.metric_name) ??
    asString(r.label) ??
    asString(r.metric) ??
    asString(r.name);
  if (!label) return null;
  const value =
    asString(r.value) ?? (typeof r.value === "number" ? String(r.value) : null);
  const unit = asString(r.unit);
  const asOf = asString(r.as_of) ?? asString(r.period);
  const parts = [value, unit].filter(Boolean).join(" ");
  const statement = [
    `${label}: ${parts || "(value recorded)"}`,
    asOf ? `(as of ${asOf})` : "",
  ]
    .filter(Boolean)
    .join(" ");
  return { label, statement };
}

export interface BuildBusinessCaseRequestResult {
  request: DeliverableIntelligenceRequest;
  /** how many real evidence items were bound — 0 means the Move has no recorded facts. */
  evidenceCount: number;
}

/**
 * Build the DeliverableIntelligenceRequest for a Move's Costed Business-Case.
 *
 * Binds only recorded facts (charter fields + baseline metrics) as governed
 * evidence; absent charter fields become missing-evidence entries. The
 * useCaseArchetype is derived from the Move's function-pack key (or charter
 * classification) and falls back to a generic strategic-move archetype — the
 * brief resolver has a sound default either way.
 */
export function buildBusinessCaseRequest(
  input: MoveBusinessCaseInput,
): BuildBusinessCaseRequestResult {
  const charter = (input.charter ?? {}) as Record<string, unknown>;

  const governedEvidenceBundle: GovernedEvidenceItem[] = [];
  const sourceRegister: SourceRegisterEntry[] = [];
  const missingEvidence: MissingEvidenceItem[] = [];
  let n = 0;

  // 1 · Charter fields — user-attested intake, high confidence when present.
  for (const field of CHARTER_EVIDENCE_FIELDS) {
    const statement = asString(charter[field.key]);
    if (statement) {
      n += 1;
      governedEvidenceBundle.push({
        citationNumber: n,
        label: field.label,
        statement,
        evidenceFamily: field.evidenceFamily,
        confidence: "high",
        disclosureTier: "internal_only",
        provenanceRef: `engagements.charter.${field.key}`,
      });
      sourceRegister.push({
        citationNumber: n,
        label: field.label,
        evidenceFamily: field.evidenceFamily,
        confidence: "high",
      });
    } else {
      missingEvidence.push({
        evidenceFamily: field.evidenceFamily,
        label: field.label,
        whyItMatters: `The board cannot evaluate the case without ${field.label.toLowerCase()}.`,
        blocksSections: ["executive_summary", "recommendation"],
        completionPath: `Capture "${field.label}" in the Move's P1 Charter.`,
      });
    }
  }

  // 2 · Baseline metrics — recorded quantitative facts.
  const baseline = Array.isArray(input.baseline_metrics)
    ? input.baseline_metrics
    : [];
  for (const row of baseline) {
    const parsed = baselineStatement(row);
    if (!parsed) continue;
    n += 1;
    governedEvidenceBundle.push({
      citationNumber: n,
      label: parsed.label,
      statement: parsed.statement,
      evidenceFamily: "baseline_metric",
      confidence: "high",
      disclosureTier: "internal_only",
      provenanceRef: "engagements.baseline_metrics",
    });
    sourceRegister.push({
      citationNumber: n,
      label: parsed.label,
      evidenceFamily: "baseline_metric",
      confidence: "high",
    });
  }

  const useCaseArchetype =
    asString(input.function_pack_key) ??
    asString(
      (charter.classification as Record<string, unknown> | undefined)
        ?.archetype,
    ) ??
    "STRATEGIC_MOVE";

  const initiativeDisplayName = asString(input.name) ?? "Strategic Move";
  const clientDisplayName =
    asString(input.tenant_name) ?? asString(input.tenant_key) ?? "Client";

  const request: DeliverableIntelligenceRequest = {
    module: "moves",
    useCaseArchetype,
    phaseOrStage: "P4_business_case",
    deliverableType: "business_case",
    audience: ["board", "cfo", "cio", "steering_committee"],
    decisionContext: `Fund / shape / kill decision for "${initiativeDisplayName}". The board must see the value case, the cost and timeline, the risks, and an explicit recommendation grounded in the recorded evidence.`,
    governedEvidenceBundle,
    sourceRegister,
    missingEvidence,
    clientCompleteItems: [],
    approvedAssumptions: [],
    artifactStandard: "moves.board_grade.costed_business_case",
    outputFormats: ["html"],
    formattingProfile: FORMATTING_PROFILE,
    qualityBar: QUALITY_BAR,
    clientDisplayName,
    initiativeDisplayName,
  };

  return { request, evidenceCount: governedEvidenceBundle.length };
}
