// Per-(module × deliverableType) QualityBar overrides — the depth-BAND control.
//
// The generic default in build-request.ts (minSections:6, minBodyWords:600) is a
// floor only, uniform across every artifact type. That is backwards: a Move Brief
// and a Target State Architecture are not the same shape of document. This
// registry gives each artifact type its OWN target depth band (a floor AND a
// ceiling) plus its own narrative-spine requirements, so "board-grade" means
// "right-sized for what this document is for," not "as long as possible."
//
// Word ranges are derived from a ~450-500 words/page board-grade-consulting
// density (11pt body, tables/diagrams reduce prose density vs. a plain memo).
// Concise, commitment-style artifacts (Charter, decision briefs, approval
// records) enforce the ceiling as a BLOCKER — they should never bloat. Substantial,
// analytical artifacts can warn-only when depth is genuinely part of the artifact
// contract. Phase-close and sponsor decision artifacts enforce the ceiling because
// their value is synthesis, not page volume.

import type { DeliverableModule, QualityBar } from "./types";
import {
  CHARTER_CONTRACT,
  P3_P4_WORD_BAND_CONTRACTS,
} from "@/lib/deliverables/shared/artifact-contracts";
import { EXECUTIVE_ROADMAP_REFERENCE } from "@/lib/deliverables/shared/reference-library/executive-roadmap-reference";

/** Spreads a shared P3/P4 word-band contract's numbers into QualityBar's
 * shape, so quality-validator.ts's banded logic (pass/advisory/block) applies
 * identically to Charter and to these reconciled types. */
function wordBandFrom(
  key: keyof typeof P3_P4_WORD_BAND_CONTRACTS,
): Pick<
  QualityBar,
  | "minBodyWords"
  | "targetBodyWordsMax"
  | "advisoryBandMax"
  | "enforceMaxAsBlocker"
  | "excludeNonProseFromBody"
> {
  const c = P3_P4_WORD_BAND_CONTRACTS[key];
  return {
    minBodyWords: c.minWords,
    targetBodyWordsMax: c.targetWordsMax,
    advisoryBandMax: c.advisoryMaxWords,
    enforceMaxAsBlocker: c.enforceMaxAsBlocker,
    // Carried through so a band and the counting rule it was calibrated
    // against can never drift apart — see WordBandContract.
    excludeNonProseFromBody: c.excludeNonProseFromBody,
  };
}

type QualityBarOverride = Partial<QualityBar>;

const DEFAULT_QUALITY_BAR: QualityBar = {
  minSections: 6,
  minBodyWords: 600,
  requiresCitations: true,
  requiresDecisionSection: true,
  requiresRecommendation: true,
  requiresRiskTable: true,
  requiresSourceRegister: false, // overridden by evidence.length > 0 in build-request.ts
  requiresClientCompleteChecklistWhenGaps: true,
  tone: "board_grade_consulting",
};

/** key = `${module}::${deliverableType}` */
const OVERRIDES: Record<string, QualityBarOverride> = {
  "moves::charter": {
    // Concise commitment instrument — the P1 Charter approves discovery/design;
    // it must not become a 40-page strategy or solution report. Hard ceiling.
    // Word budget is read from the shared contract (src/lib/deliverables/
    // shared/artifact-contracts.ts) so it can never silently diverge from the
    // golden-bar pipeline's copy again — see docs/architecture/
    // MOVES_DUAL_PIPELINE_AUDIT.md.
    minSections: CHARTER_CONTRACT.sections.length,
    minBodyWords:
      CHARTER_CONTRACT.wordBudget.minProseWords ??
      CHARTER_CONTRACT.wordBudget.minWords,
    targetBodyWordsMax: CHARTER_CONTRACT.wordBudget.hardMaxWords,
    // 2026-07-25: two independent live generations landed 170-200 words past
    // hardMaxWords with strong quality — block only past the true ceiling and
    // let the target act as a discipline signal in between. See
    // advisoryMaxWords in artifact-contracts.ts for the rationale.
    advisoryBandMax: CHARTER_CONTRACT.wordBudget.advisoryMaxWords,
    enforceMaxAsBlocker: true,
    // Charter is deliberately table-led (decision box, scope table, discovery
    // preparation tables). Enforce the word band on prose so the gate blocks
    // narrative bloat without penalizing the required tables.
    excludeNonProseFromBody: true,
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::business_case": {
    // Substantial narrative artifact — must tell one coherent investment
    // argument, not a stack of disconnected sections. The financial model is a
    // separate workbook, so the narrative case must stay within its hard band.
    // Word band reconciled 2026-07-25 with golden-bar's DEPTH_BY_ARTIFACT
    // (they previously contradicted: golden-bar's ceiling equalled this
    // pipeline's floor) — see P3_P4_WORD_BAND_CONTRACTS in artifact-contracts.ts.
    minSections: 9,
    ...wordBandFrom("business_case"),
    requiresCentralTension: true,
    requiresOptionsConsidered: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::target_state_architecture": {
    // Substantial, visual, implementation-grade — this is exactly the artifact
    // type that must NOT be squeezed by a universal brevity rule. Ceiling is a
    // warning only; the four architecture-view exhibits alone justify real depth.
    // Word band reconciled 2026-07-25 — golden-bar's ceiling (6,000) previously
    // sat below this pipeline's own floor (9,000); both now read the same
    // numbers from P3_P4_WORD_BAND_CONTRACTS in artifact-contracts.ts.
    minSections: 10,
    ...wordBandFrom("target_state_architecture"),
    requiresCentralTension: true,
    requiresOptionsConsidered: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::solution_design": {
    // 8-12 visual, decision-led pages. This is a specification of the accepted
    // architecture, not a second architecture report or implementation manual.
    minSections: 8,
    ...wordBandFrom("solution_design"),
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::operating_model_design": {
    // 6-10 table/diagram-rich pages. Reader energy belongs on work split,
    // accountability, controls, cadence, and adoption decisions.
    minSections: 8,
    ...wordBandFrom("operating_model_design"),
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::sourcing_strategy": {
    // 5-8 page options paper. It chooses a sourcing posture; it does not become
    // an RFP, vendor landscape, contract, or restatement of the full design.
    minSections: 7,
    ...wordBandFrom("sourcing_strategy"),
    requiresOptionsConsidered: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::discovery_report": {
    minSections: 8,
    minBodyWords: 6_500, // ~15 pages
    targetBodyWordsMax: 13_500, // ~30 pages plus appendix
    enforceMaxAsBlocker: false,
    requiresEvidenceGapsNoted: true,
  },
  "moves::root_cause_worksheet": {
    // Diagnostic decision artifact — it should be an issue-tree readout, not a
    // second discovery report. Hard ceiling because the value is synthesis.
    minSections: 5,
    minBodyWords: 1_200, // ~3 pages plus tables/diagram
    targetBodyWordsMax: 3_200, // ~7 pages; beyond this it is no longer a worksheet
    enforceMaxAsBlocker: true,
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::operating_model": {
    // Canonical orchestrator key used by the P3 `operating_model_design`
    // registry artifact. It must resolve to the same concise control as the
    // registry-facing alias above.
    minSections: 8,
    ...wordBandFrom("operating_model_design"),
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::roadmap": {
    // P4 execution roadmap is an executable sequence with dependency logic and
    // milestone tables. If it sprawls past this ceiling, it is no longer a
    // sponsor-readable roadmap. Word band reconciled 2026-07-25 — golden-bar's
    // `execution_roadmap` ceiling (5,000) previously equalled this pipeline's
    // own floor; both now read P3_P4_WORD_BAND_CONTRACTS.roadmap.
    minSections: 6,
    ...wordBandFrom("roadmap"),
    requiresEvidenceGapsNoted: true,
    // REF_EXECUTIVE_ROADMAP pilot (2026-07-25): the roadmap must argue why
    // this sequence de-risks the Move (EXECUTIVE_ROADMAP_REFERENCE.story),
    // not just list horizons — reuses the same TENSION_RE heuristic already
    // proven for Charter/business_case rather than a new check.
    requiresCentralTension: true,
    requiredExhibitElementsByKind: [
      {
        kind: "roadmap",
        elements: [
          ...EXECUTIVE_ROADMAP_REFERENCE.horizons,
          "decision gate",
          "dependency",
          "owner",
          "success measure",
        ],
      },
    ],
    forbiddenContentPatterns: EXECUTIVE_ROADMAP_REFERENCE.forbiddenPatterns,
    titleRule: {
      genericForbiddenPatterns:
        EXECUTIVE_ROADMAP_REFERENCE.titleRule.genericTitleForbiddenPatterns,
      minWords: EXECUTIVE_ROADMAP_REFERENCE.titleRule.minTitleWords,
    },
  },
  "moves::estimate_model": {
    // P4 financial model is table/workbook-led. It should explain assumptions
    // and confidence, but prose bloat is a quality failure. golden-bar calls
    // this deliverable type `financial_model` and had no depth standard for
    // it at all before this reconciliation.
    minSections: 6,
    ...wordBandFrom("estimate_model"),
    requiresEvidenceGapsNoted: true,
  },
  "moves::value_model": {
    // P4 Tower metrics / value realization plan: compact measurement contract,
    // not a second business case. golden-bar calls this deliverable type
    // `tower_metrics_plan` and had no depth standard for it at all before
    // this reconciliation.
    minSections: 6,
    ...wordBandFrom("value_model"),
    requiresEvidenceGapsNoted: true,
  },
  "moves::requirements_traceability": {
    // P3 traceability is a compact control matrix, not a generic board memo.
    // It exists to prove requirements, evidence, design choices, and open
    // decisions stay linked before the P3 gate closes.
    minSections: 5,
    minBodyWords: 1_200,
    targetBodyWordsMax: 3_200,
    advisoryBandMax: 3_800,
    enforceMaxAsBlocker: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::readiness_and_change_plan": {
    // P4 readiness and change plan is a mobilization decision instrument. It
    // should prove adoption/governance readiness without becoming a second
    // roadmap, business case, or value model.
    minSections: 6,
    ...wordBandFrom("readiness_and_change_plan"),
    requiresEvidenceGapsNoted: true,
  },
  "moves::handoff_pack": {
    // P5 handoff must be a crisp execution-transfer package. Oversized handoff
    // packs bury accountabilities and should not become board-ready. The lower
    // bound has a small tolerance because the prompt deliberately removes
    // predecessor-document repetition; a strong handoff should not be forced to
    // add filler to cross an arbitrary round-number floor.
    minSections: 6,
    minBodyWords: 4_800, // ~11-12 pages
    targetBodyWordsMax: 11_000, // ~25 pages
    enforceMaxAsBlocker: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::value_measurement_contract": {
    // P5 value contract is a measurement instrument. It should name metrics,
    // baselines, owners, cadence, gaps, and Tower handoff without re-telling
    // the entire Move history. It is deliberately table-led, so the hard band
    // measures prose argument length rather than table/exhibit cell text.
    minSections: 6,
    minBodyWords: 1_800,
    targetBodyWordsMax: 4_200,
    enforceMaxAsBlocker: true,
    excludeNonProseFromBody: true,
    requiresEvidenceGapsNoted: true,
  },
};

/** Resolve the QualityBar for a (module, deliverableType), falling back to the shared default. */
export function resolveQualityBar(
  module: DeliverableModule,
  deliverableType: string,
): QualityBar {
  const override = OVERRIDES[`${module}::${deliverableType}`];
  return override
    ? { ...DEFAULT_QUALITY_BAR, ...override }
    : { ...DEFAULT_QUALITY_BAR };
}
