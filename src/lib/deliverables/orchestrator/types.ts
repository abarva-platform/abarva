// Deliverable Intelligence Orchestrator — core contracts.
//
// The orchestrator assembles the RIGHT prompt + context for Claude per
// (module × use-case archetype × phase × deliverable type × audience × decision),
// then drives a multi-pass authoring flow. The governing principle: do NOT
// over-constrain Claude into mediocre output.
//
// Claude operates in TWO modes at once:
//   1. GOVERNED FACTUAL MODE — client-specific facts come ONLY from governed
//      evidence / current facts / citation-ready sources / user-attested intake /
//      approved assumptions / explicit placeholders. Never invented.
//   2. EXPERT ARTIFACT MODE — structure, narrative, exhibits, tables, decision
//      logic, boilerplate, industry-standard sections, professional language all
//      draw on Claude's full expert consulting / industry / sourcing / technology
//      knowledge.
//
// Every client-specific claim must be cited [n], marked [ASSUMPTION TO VALIDATE],
// or shown as [CLIENT TO COMPLETE] / [EVIDENCE MISSING].

export type DeliverableModule = "moves" | "source" | "tower" | "intelligence";

export type OutputFormat = "docx" | "pptx" | "xlsx" | "html" | "pdf";

export type AudienceRole =
  | "board"
  | "ceo"
  | "cio"
  | "cfo"
  | "cpo" // chief procurement officer
  | "cto"
  | "ciso"
  | "steering_committee"
  | "program_leadership"
  | "vendor_facing"
  | "procurement"
  | "legal";

/** Where a section's client-specific content is allowed to come from. */
export type SectionGroundingMode =
  | "governed_facts" // assert client facts only from cited governed evidence
  | "expert_template" // standard structure/boilerplate, no client facts
  | "assumption_driven" // expert content from approved assumptions, labelled
  | "client_to_complete" // guided placeholder; client judgment/legal — never invented
  | "mixed"; // governed facts + expert framing in one section

// ── Evidence inputs (already governed upstream; rendered clean for the model) ──

/** One clean, human-readable, citation-numbered evidence item. No internal IDs. */
export interface GovernedEvidenceItem {
  citationNumber: number; // [n] used in the document body
  label: string; // human-readable subject, e.g. "FY26 run-cost by tower"
  statement: string; // the clean fact text the model may assert
  evidenceFamily: string; // e.g. 'run_cost_baseline'
  confidence: "high" | "medium" | "low";
  asOf?: string; // freshness, e.g. "FY2026"
  disclosureTier: "vendor_facing" | "internal_only" | "aggregate_only";
  /** opaque provenance handle kept OUT of the body; for audit/source-register only. */
  provenanceRef: string;
}

export interface MissingEvidenceItem {
  evidenceFamily: string;
  label: string;
  whyItMatters: string;
  blocksSections: string[]; // section keys this gap blocks/weakens
  completionPath: string; // upload template / chat answer / etc.
}

export interface ClientCompleteItem {
  key: string;
  label: string;
  owner: AudienceRole | string;
  reason:
    | "client_judgment"
    | "legal_review"
    | "procurement_signoff"
    | "pricing_signoff";
  placeholderText: string; // the guided [CLIENT TO COMPLETE] prose
}

export interface ApprovedAssumption {
  key: string;
  statement: string;
  basis: string; // why it's a reasonable expert assumption
  mustValidate: boolean;
}

/** One row of the clean source register exposed in the document. */
export interface SourceRegisterEntry {
  citationNumber: number;
  label: string;
  evidenceFamily: string;
  confidence: "high" | "medium" | "low";
  asOf?: string;
}

// ── Formatting + quality profile ──

export interface FormattingProfile {
  bodyPointSize: number; // ~11pt
  headingStyle: "numbered" | "unnumbered";
  tableStyle: "banded" | "plain";
  /** wide datasets must move to an Excel companion rather than tiny in-doc tables. */
  wideDataToExcelCompanion: boolean;
  includeCoverPage: boolean;
  includeTableOfContents: boolean;
  includeSourceRegisterSection: boolean;
}

export interface QualityBar {
  minSections: number;
  minBodyWords: number; // guards against artificially short documents
  /**
   * The upper end of this artifact type's depth band (see quality-bar-registry.ts
   * for the per-type bands). A ceiling exists for every type — even a substantial
   * architecture or solution-design document has a real outer bound — but whether
   * crossing it BLOCKS export or only WARNS is controlled by `enforceMaxAsBlocker`.
   * Concise, commitment-style artifacts (Charter, decision briefs, approval
   * records) should block; substantial, analytical artifacts should warn, so a
   * genuinely complex architecture is never blocked for being thorough.
   */
  targetBodyWordsMax?: number;
  /** true = crossing targetBodyWordsMax blocks export; false/undefined = warning only. */
  enforceMaxAsBlocker?: boolean;
  /**
   * When true, the word band measures PROSE only — tables, exhibits, fenced
   * blocks and appendix sections are excluded from the body count (see
   * `shared/body-word-count.ts`). Undefined/false preserves the legacy
   * whole-body count exactly.
   *
   * A word band is a discipline on ARGUMENT length. Counting exhibits pushes
   * authors toward fewer tables and more paragraphs, which is the opposite of
   * what every artifact contract asks for. Opt-in per artifact type, so bands
   * calibrated against whole-body counts are never silently tightened.
   */
  excludeNonProseFromBody?: boolean;
  /**
   * When set, a document between `targetBodyWordsMax` and this value is an
   * advisory (does not block export) even when `enforceMaxAsBlocker` is true —
   * only crossing THIS value blocks. Lets a concise artifact's ceiling stay a
   * discipline signal without punishing a slightly-long-but-high-quality draft
   * while the prompt/section budgets that should keep it under the target are
   * still being tuned against real generations.
   */
  advisoryBandMax?: number;
  requiresCitations: boolean;
  requiresDecisionSection: boolean;
  requiresRecommendation: boolean;
  requiresRiskTable: boolean;
  requiresSourceRegister: boolean;
  requiresClientCompleteChecklistWhenGaps: boolean;
  /** Narrative-spine requirements — the document must argue a case, not just fill sections. */
  requiresCentralTension?: boolean; // what tension/problem the document is resolving
  requiresOptionsConsidered?: boolean; // real alternatives weighed, not one path presented as inevitable
  requiresEvidenceGapsNoted?: boolean; // what remains unproven must be stated, not implied away
  /**
   * Reference-contract enforcement (REF_EXECUTIVE_ROADMAP pilot, 2026-07-25):
   * per-exhibit-kind required elements, presence-checked against the matching
   * exhibit's rendered description. `expectedExhibits[].requiredElements`
   * (types.ts, used since the 2026-07-15 pilot) was only ever read into the
   * PROMPT — never actually validated. This is the first real check; start
   * advisory-only (warning, not blocker) until proven on real generations.
   */
  requiredExhibitElementsByKind?: {
    kind: string;
    elements: readonly string[];
  }[];
  /**
   * Content patterns that must NOT appear (e.g. sprint numbers, Gantt-style
   * task lists in an executive roadmap) — matched against the full rendered
   * body. Advisory-only for the same reason as requiredExhibitElementsByKind.
   */
  forbiddenContentPatterns?: readonly RegExp[];
  /**
   * Story-first title enforcement (roadmap story-first fast-follow,
   * 2026-07-25): the artifact title must be the executive conclusion, not a
   * bare category label ("Execution Roadmap"). Advisory-only pending proof
   * on real generations, same as the other reference-contract checks above.
   */
  titleRule?: {
    genericForbiddenPatterns: readonly RegExp[];
    minWords: number;
  };
  tone: "board_grade_consulting";
}

// ── 1 · DeliverableIntelligenceRequest ──

export interface DeliverableIntelligenceRequest {
  module: DeliverableModule;
  useCaseArchetype: string; // 'AMS_IT_OUTSOURCING' | 'ERP_SI_SELECTION' | 'CLOUD_MODERNIZATION' | 'AI_PDLC' | move archetypes…
  phaseOrStage: string;
  deliverableType: string; // 'rfp_package' | 'business_case' | 'charter' | …
  audience: AudienceRole[];
  decisionContext: string; // the decision this artifact must support
  governedEvidenceBundle: GovernedEvidenceItem[];
  sourceRegister: SourceRegisterEntry[];
  missingEvidence: MissingEvidenceItem[];
  clientCompleteItems: ClientCompleteItem[];
  approvedAssumptions: ApprovedAssumption[];
  artifactStandard: string; // reference to the standard doc/key
  exemplarGuidance?: string; // optional exemplar/style hint
  outputFormats: OutputFormat[];
  formattingProfile: FormattingProfile;
  qualityBar: QualityBar;
  /** display-safe client/initiative name (cover name — never the real identity). */
  clientDisplayName: string;
  initiativeDisplayName: string;
}

// ── 2 · DeliverableArtifactBrief ──
// The "artifact intelligence" handed to Claude: enough structure + expert latitude
// to design a board-grade artifact, with the governance boundary made explicit.

export interface BriefSection {
  key: string;
  title: string;
  intent: string; // what a senior consultant puts here and why
  groundingMode: SectionGroundingMode;
  expectedEvidenceFamilies: string[]; // which governed families feed it
  expertLatitude: string; // what expert knowledge Claude should bring
}

export interface ExpectedExhibit {
  key: string;
  title: string;
  kind:
    | "diagram"
    | "matrix"
    | "timeline"
    | "heatmap"
    | "flow"
    | "chart"
    // Architecture views are distinct diagram KINDS, not one generic "diagram" box —
    // each answers a different question and needs different required elements.
    | "conceptual_architecture" // business/capability model: personas, capabilities, channels, trust boundaries, outcomes
    | "logical_architecture" // solution components: experience/orchestration/agents/models/context/integration/data/identity/observability/governance/human-in-the-loop
    | "physical_architecture" // deployable services: cloud boundaries, regions, networks, runtimes, endpoints, data platforms, queues, secrets, CI/CD
    | "agent_orchestration" // the explicit trigger→router→planner→context→tool→model→gate→approval→action→trace flow
    | "roadmap"; // P4 executive roadmap — horizons × workstreams with decision gates, not a Gantt chart. See REF_EXECUTIVE_ROADMAP (shared/reference-library/executive-roadmap-reference.ts).
  purpose: string;
  preferredFormat: OutputFormat; // e.g. wide matrices → 'xlsx'
  /**
   * The specific elements this exhibit MUST show — e.g. for a physical
   * architecture: ["cloud subscription boundary","region","runtime service",
   * "model endpoint","vector/search service","queue/event bus","secrets store",
   * "identity provider","CI/CD path"]. Presence-checked the same way
   * requiredVisuals/requiredTables already are; a bare "include a diagram"
   * instruction is not enough to guarantee the model draws the right one.
   */
  requiredElements?: string[];
  /** Whether the exhibit must carry a legend (e.g. illustrative vs. selected vs. client-confirmed service). */
  legendRequired?: boolean;
}

export interface ExpectedTable {
  key: string;
  title: string;
  columns: string[];
  groundingMode: SectionGroundingMode;
  moveToExcelIfWide: boolean;
}

export interface DeliverableArtifactBrief {
  module: DeliverableModule;
  useCaseArchetype: string;
  deliverableType: string;
  purpose: string;
  /**
   * What this document must NOT attempt yet — the phase-discipline boundary
   * stated positively (the sibling of `forbiddenSectionTopics`, which lists
   * topics; this states the boundary as a sentence Claude can reason from,
   * e.g. "This is a funding gate, not a build authorization — do not design
   * the solution here.").
   */
  prohibitedContent?: string[];
  audience: AudienceRole[];
  decisionToSupport: string;
  recommendedStructure: BriefSection[]; // ordered baseline; fixed artifacts treat this as exhaustive
  requiredSections: string[]; // keys that must appear
  optionalSections: string[];
  /**
   * True for concise approval instruments where adding sections is product drift.
   * Substantial artifacts leave this false so Claude can still add useful views.
   */
  fixedStructure?: boolean;
  /**
   * Phase-discipline guard. Topics that MUST NOT appear as sections in this
   * deliverable because they belong to a later phase (e.g. a P1 Charter must not
   * carry a current-state evidence analysis or target-state architecture — those
   * are P2/P3 work). Matched case-insensitively against a planned section's key
   * and title; the architect is told to omit them AND the plan sanitizer drops
   * any that slip through, so runs stay consistent. Optional — absent = no guard.
   */
  forbiddenSectionTopics?: string[];
  expectedExhibits: ExpectedExhibit[];
  expectedTables: ExpectedTable[];
  requiredPlaceholders: string[]; // [CLIENT TO COMPLETE] / [EVIDENCE MISSING] keys
  requiredClientDecisions: string[];
  citationPolicy: string;
  allowedExpertKnowledge: string; // explicit latitude grant
  disallowedFabrication: string; // explicit governance boundary
  formattingInstructions: string;
  qualityCriteria: string[];
}

// ── 3 · DeliverableGenerationPlan ──
// Produced BY Claude in Pass 1 (architect). The orchestrator validates it before
// allowing the full draft. Mirrors the brief but is the model's concrete plan.

export interface PlannedSection {
  key: string;
  title: string;
  groundingMode: SectionGroundingMode;
  evidenceCitations: number[]; // [n] this section will cite
  assumptionsUsed: string[];
  placeholders: string[];
  rationale: string;
}

export interface EvidenceMappingEntry {
  citationNumber: number;
  usedInSections: string[];
  supportsClaim: string;
}

export interface ArtifactEnhancement {
  suggestion: string;
  addsSectionOrExhibit: string;
  rationale: string;
}

export interface TableExhibitPlanEntry {
  key: string;
  title: string;
  kind: "table" | "exhibit";
  targetFormat: OutputFormat;
  groundingMode: SectionGroundingMode;
}

export interface ClientCompletePlanEntry {
  key: string;
  label: string;
  owner: string;
  placement: string; // which section / checklist
}

export interface OutputPackagePlanEntry {
  format: OutputFormat;
  contents: string; // what goes in this artifact (e.g. main doc vs companion workbook)
}

export interface DeliverableGenerationPlan {
  sectionPlan: PlannedSection[];
  evidenceMapping: EvidenceMappingEntry[];
  missingEvidenceHandling: {
    evidenceFamily: string;
    handledAs: SectionGroundingMode;
    note: string;
  }[];
  artifactEnhancementSuggestions: ArtifactEnhancement[];
  tableAndExhibitPlan: TableExhibitPlanEntry[];
  clientCompletePlan: ClientCompletePlanEntry[];
  outputPackagePlan: OutputPackagePlanEntry[];
}

// ── Multi-pass flow ──

export type GenerationPass =
  | "architect" // Pass 1 — design the best structure (no full draft)
  | "evidence_grounding" // Pass 2 — map evidence → sections, flag gaps
  | "full_draft" // Pass 3 — write the full document
  | "red_team" // Pass 4 — critique as a senior partner
  | "board_grade_rewrite" // Pass 5 — revise to board-grade
  | "render_package" // Pass 6 — structure for renderers
  | "section_draft" // decomposed: write ONE planned section (bounded-parallel fan-out)
  | "synthesis"; // decomposed: the doc-level structured fields (recommendation, tables, checklist)

export interface PassPrompt {
  pass: GenerationPass;
  system: string;
  user: string;
  maxTokens: number;
  /** board-grade artifacts must NOT be capped low; this guards that. */
  highStakes: boolean;
}

// ── Validation results ──

export interface PlanValidationResult {
  ok: boolean;
  errors: string[]; // block — plan must be revised
  warnings: string[]; // advisory
}

export interface QualityValidationResult {
  pass: boolean;
  blockers: string[]; // export is blocked until resolved
  warnings: string[]; // mechanical/thin/generic flags (advisory)
  metrics: {
    sectionCount: number;
    bodyWordCount: number;
    tableCount: number;
    hasSourceRegister: boolean;
    hasDecisionSection: boolean;
    hasRecommendation: boolean;
    hasRiskTable: boolean;
    clientCompleteCount: number;
    unsupportedClaimCount: number;
    leakedInternalTags: string[];
    hasCentralTension: boolean;
    hasOptionsConsidered: boolean;
    hasEvidenceGapsNoted: boolean;
    /** ~200 words/minute executive reading pace, rounded up to at least 1. */
    readingTimeMinutes: number;
    /** true whenever any advisory/warning fired — a signal to track whether the
     * artifact needed a human touch before it could ship, across a sample of
     * real generations. */
    manualEditNeeded: boolean;
    /** Where bodyWordCount landed relative to the artifact's word bands. */
    wordBand: "under" | "ideal" | "pass" | "advisory" | "excessive" | "n/a";
  };
}

/** The structured document the model returns at render_package time. */
export interface RenderableDeliverable {
  title: string;
  subtitle?: string;
  clientDisplayName: string;
  initiativeDisplayName: string;
  generatedSections: RenderableSection[];
  tables: RenderableTable[];
  exhibits: RenderableExhibit[];
  sourceRegister: SourceRegisterEntry[];
  assumptions: ApprovedAssumption[];
  clientCompleteChecklist: ClientCompleteItem[];
  recommendation: string;
  nextActions: string[];
}

export interface RenderableSection {
  key: string;
  title: string;
  bodyMarkdown: string; // 11pt body, headings, lists — markdown
  groundingMode: SectionGroundingMode;
  citationsUsed: number[];
}

export interface RenderableTable {
  key: string;
  title: string;
  columns: string[];
  rows: string[][];
  targetFormat: OutputFormat;
}

export interface RenderableExhibit {
  key: string;
  title: string;
  kind: ExpectedExhibit["kind"];
  description: string;
  targetFormat: OutputFormat;
}
