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
// analytical artifacts (architecture, solution design) only WARN on the ceiling —
// a genuinely complex document should never be blocked from being thorough; the
// ceiling still exists as a discipline signal, it just doesn't gate export.

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
    minSections: 7,
    minBodyWords: 900, // ~2 pages
    targetBodyWordsMax: 3_000, // ~6-8 pages with evidence-backed tables
    enforceMaxAsBlocker: true,
    requiresCentralTension: true,
    requiresEvidenceGapsNoted: true,
  },
  "moves::business_case": {
    // Substantial narrative artifact — must tell one coherent investment
    // argument, not a stack of disconnected sections. Ceiling is a warning:
    // a genuinely complex funding case should not be blocked for depth.
    minSections: 9,
    minBodyWords: 5_000, // ~12 pages
    targetBodyWordsMax: 9_500, // ~20 pages (financial model is a separate companion artifact)
    enforceMaxAsBlocker: false,
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
  "moves::discovery_report": {
    minSections: 8,
    minBodyWords: 6_500, // ~15 pages
    targetBodyWordsMax: 13_500, // ~30 pages plus appendix
    enforceMaxAsBlocker: false,
    requiresEvidenceGapsNoted: true,
  },
  "moves::operating_model": {
    minSections: 7,
    minBodyWords: 6_500, // ~15 pages
    targetBodyWordsMax: 13_500, // ~30 pages
    enforceMaxAsBlocker: false,
  },
  "moves::roadmap": {
    minSections: 6,
    minBodyWords: 5_000, // ~12 pages
    targetBodyWordsMax: 11_000, // ~25 pages
    enforceMaxAsBlocker: false,
  },
  "moves::handoff_pack": {
    minSections: 6,
    minBodyWords: 5_000, // ~12 pages
    targetBodyWordsMax: 11_000, // ~25 pages
    enforceMaxAsBlocker: false,
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
