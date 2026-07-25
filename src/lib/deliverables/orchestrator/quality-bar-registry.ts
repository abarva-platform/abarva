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
    // Aligned to the golden-bar pipeline's charter standard (2026-07-25) —
    // target 900-1,100 words, hard maximum 1,300, so the two pipelines don't
    // diverge on the same artifact type. See docs/architecture/
    // MOVES_DUAL_PIPELINE_AUDIT.md for the full reconciliation context.
    minSections: 7,
    minBodyWords: 900, // ~2 pages
    targetBodyWordsMax: 1_300, // ~2-3 pages; a charter is a gate memo, not a report
    enforceMaxAsBlocker: true,
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::business_case": {
    // Substantial narrative artifact — must tell one coherent investment
    // argument, not a stack of disconnected sections. The financial model is a
    // separate workbook, so the narrative case must stay within its hard band.
    minSections: 9,
    minBodyWords: 5_000, // ~12 pages
    targetBodyWordsMax: 9_500, // ~20 pages (financial model is a separate companion artifact)
    enforceMaxAsBlocker: true,
    requiresCentralTension: true,
    requiresOptionsConsidered: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::target_state_architecture": {
    // Substantial, visual, implementation-grade — this is exactly the artifact
    // type that must NOT be squeezed by a universal brevity rule. Ceiling is a
    // warning only; the four architecture-view exhibits alone justify real depth.
    minSections: 10,
    minBodyWords: 9_000, // ~20 pages
    targetBodyWordsMax: 16_000, // ~35 pages, plus the diagram appendix
    enforceMaxAsBlocker: false,
    requiresCentralTension: true,
    requiresOptionsConsidered: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::solution_design": {
    // 8-12 visual, decision-led pages. This is a specification of the accepted
    // architecture, not a second architecture report or implementation manual.
    minSections: 8,
    minBodyWords: 2_800,
    targetBodyWordsMax: 5_200,
    enforceMaxAsBlocker: true,
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::operating_model_design": {
    // 6-10 table/diagram-rich pages. Reader energy belongs on work split,
    // accountability, controls, cadence, and adoption decisions.
    minSections: 8,
    minBodyWords: 2_400,
    targetBodyWordsMax: 4_600,
    enforceMaxAsBlocker: true,
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::sourcing_strategy": {
    // 5-8 page options paper. It chooses a sourcing posture; it does not become
    // an RFP, vendor landscape, contract, or restatement of the full design.
    minSections: 7,
    minBodyWords: 1_800,
    targetBodyWordsMax: 3_600,
    enforceMaxAsBlocker: true,
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
    minBodyWords: 2_400,
    targetBodyWordsMax: 4_600,
    enforceMaxAsBlocker: true,
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::roadmap": {
    // P4 execution roadmap is an executable sequence with dependency logic and
    // milestone tables. If it sprawls past this ceiling, it is no longer a
    // sponsor-readable roadmap.
    minSections: 6,
    minBodyWords: 5_000, // ~12 pages
    targetBodyWordsMax: 11_000, // ~25 pages
    enforceMaxAsBlocker: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::estimate_model": {
    // P4 financial model is table/workbook-led. It should explain assumptions
    // and confidence, but prose bloat is a quality failure.
    minSections: 6,
    minBodyWords: 1_600,
    targetBodyWordsMax: 4_200,
    enforceMaxAsBlocker: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::value_model": {
    // P4 Tower metrics / value realization plan: compact measurement contract,
    // not a second business case.
    minSections: 6,
    minBodyWords: 1_800,
    targetBodyWordsMax: 4_600,
    enforceMaxAsBlocker: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::handoff_pack": {
    // P5 handoff must be a crisp execution-transfer package. Oversized handoff
    // packs bury accountabilities and should not become board-ready.
    minSections: 6,
    minBodyWords: 5_000, // ~12 pages
    targetBodyWordsMax: 11_000, // ~25 pages
    enforceMaxAsBlocker: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::value_measurement_contract": {
    // P5 value contract is a measurement instrument. It should name metrics,
    // baselines, owners, cadence, gaps, and Tower handoff without re-telling
    // the entire Move history.
    minSections: 6,
    minBodyWords: 1_800,
    targetBodyWordsMax: 4_200,
    enforceMaxAsBlocker: true,
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
