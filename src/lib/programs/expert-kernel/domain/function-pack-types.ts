// Domain Function Pack — the typed eight-layer schema.
//
// A Domain Function Pack is a curated, function-indexed industry-depth layer
// that an agent binds into context BEFORE it reaches for general intelligence
// (spec: docs/strategy/ABARVA-DOMAIN-FUNCTION-PACK-SPEC.md, §4).
//
// The principle: curated depth first, general intelligence second. The pack is
// the senior operator's playbook the agent inherits before it thinks — so
// AbarVa reasons like an operator of a SPECIFIC industry function, not like a
// smart generalist improvising the domain.
//
// This module is PURE: typed shapes only, no runtime code, no I/O, no
// fabrication. Each layer below carries a depth requirement (§6) — a layer
// generic enough to apply to any industry is a hard fail. The packs themselves
// (function-pack-registry + the healthcare/* packs) are the data; this file is
// only the contract they satisfy.

// ─────────────────────────────────────────────────────────────────────────────
// Keys — the (industryKey, functionKey) spine (spec §3)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The industry vertical a Function Pack belongs to. The library spans three
 * verticals — healthcare provider, retail, and financial services — each
 * built on the same eight-layer schema (spec §3). Kept as a string-literal
 * union so the registry can be exhaustively type-checked.
 */
export type FunctionPackIndustryKey =
  | "healthcare-provider"
  | "retail"
  | "financial-services"
  | "airline";

/**
 * The airline (global network carrier) function taxonomy. v1 builds the
 * irregular-operations recovery + customer-care spine (`irops_recovery`) —
 * the disruption recovery function where AI decision support and proactive
 * passenger re-accommodation create the sharpest value.
 */
export type AirlineFunctionKey =
  | "irops_recovery"
  | "network_operations_control"
  | "crew_operations"
  | "loyalty_customer_experience";

/**
 * The healthcare (provider) function taxonomy — the ~12 functions of the
 * vertical (spec §3). A Function Pack is keyed by `(industryKey, functionKey)`.
 * v1 builds two of these to reference depth: the value-based-care spine
 * (`care_delivery_care_management`, `population_health_value_based_care`).
 */
export type HealthcareFunctionKey =
  | "clinical_operations_documentation"
  | "care_delivery_care_management"
  | "population_health_value_based_care"
  | "patient_access_engagement_experience"
  | "research_clinical_trials"
  | "revenue_cycle"
  | "quality_safety_regulatory"
  | "clinical_supply_chain"
  | "health_information_interoperability"
  | "clinical_workforce_staffing"
  | "payer_claims_operations"
  | "pharmacy";

/**
 * The retail function taxonomy — the twelve functions of the retail vertical
 * (spec §3). A Function Pack is keyed by `(industryKey, functionKey)`.
 */
export type RetailFunctionKey =
  | "merchandising_assortment"
  | "pricing_promotions"
  | "demand_inventory_planning"
  | "supply_chain_fulfillment"
  | "store_operations"
  | "customer_loyalty_personalization"
  | "digital_commerce"
  | "marketing_retail_media"
  | "customer_care"
  | "workforce_labor"
  | "returns_reverse_logistics"
  | "loss_prevention";

/**
 * The financial-services function taxonomy — the twelve functions of the
 * diversified-institution vertical (spec §3): the front office, the control
 * functions, the corporate spine, and the servicing operations.
 */
export type FinancialServicesFunctionKey =
  | "retail_banking_deposits"
  | "lending_credit_underwriting"
  | "payments_money_movement"
  | "wealth_asset_management"
  | "capital_markets_trading"
  | "commercial_corporate_banking"
  | "risk_management"
  | "fraud_financial_crime"
  | "regulatory_compliance"
  | "finance_treasury_alm"
  /** Cross-entity cost reduction & vendor/procurement rationalization — the corporate/G&A spend spine of a diversified HoldCo. */
  | "cost_optimization_vendor_management"
  | "customer_servicing_contact_center"
  | "collections_recovery";

/**
 * Any function key across the three verticals. The named unions document each
 * taxonomy; the `string` widening keeps the registry resolver tolerant of a
 * function not yet catalogued (it returns `null` honestly rather than failing
 * to type-check).
 */
export type FunctionPackFunctionKey =
  | HealthcareFunctionKey
  | RetailFunctionKey
  | FinancialServicesFunctionKey
  | AirlineFunctionKey
  | string;

// ─────────────────────────────────────────────────────────────────────────────
// Layer 1 — Operating metrics
// ─────────────────────────────────────────────────────────────────────────────

/** Which direction of movement on a metric is "good". */
export type MetricDirectionOfGood = "lower" | "higher" | "in-range";

/**
 * A benchmark range — always a labelled PLANNING range, never asserted as
 * fact. The `basis` records why the range is what it is so a forecast can be
 * honest about how firm the number is.
 */
export interface BenchmarkRange {
  /** Low end of the planning range, in the metric's unit. */
  low: number;
  /** High end of the planning range, in the metric's unit. */
  high: number;
  /**
   * What the range is anchored to — published program data, peer ranges,
   * operator experience. Never presented as a single asserted fact.
   */
  basis: string;
  /** Explicit honesty marker — every benchmark is a planning range. */
  label: "planning-range";
}

/**
 * Layer 1 — one operating metric that defines performance in this function.
 * Each metric makes baselines real and makes a missing metric a PRECISE seed
 * gap: the pack knows what SHOULD be measured and where it is sourced.
 */
export interface OperatingMetric {
  /** Stable key — unique within the pack; the seed-gap and baseline join. */
  key: string;
  /** Human label, e.g. "30-day all-cause readmission rate". */
  name: string;
  /** What the metric measures — a real definition, not a restated label. */
  definition: string;
  /** The unit, e.g. "%", "USD PMPY", "visits per 1,000 members per year". */
  unit: string;
  /** Which direction of movement is good. */
  directionOfGood: MetricDirectionOfGood;
  /** A labelled planning benchmark range — never an asserted fact. */
  benchmarkRange: BenchmarkRange;
  /** The system/process the metric is sourced from in a real tenant. */
  dataSource: string;
  /** Why this metric matters to the function's economics or outcomes. */
  whyItMatters: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 2 — Pain themes & failure modes
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Layer 2 — a recurring way this function underperforms or breaks. Function-
 * specific "phase traps": the agent knows what to look for and how to detect it.
 */
export interface PainTheme {
  /** Stable key — unique within the pack. */
  key: string;
  /** The pain theme, named — domain-specific, not generic. */
  name: string;
  /** How this failure mode actually plays out in the function. */
  description: string;
  /** The observable signal that detects this theme in a tenant. */
  detectionSignal: string;
  /** The diagnostic question this theme seeds in a Discover conversation. */
  diagnosticQuestion: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 3 — AI use-case archetypes
// ─────────────────────────────────────────────────────────────────────────────

/** How readily this archetype is being adopted in the function today. */
export type AdoptionProfile =
  | "mainstream"
  | "emerging"
  | "experimenting"
  | "early";

/** The control posture an archetype demands. */
export type ControlPosture =
  | "human-in-the-loop"
  | "human-on-the-loop"
  | "human-approval-required"
  | "autonomous-with-audit";

/**
 * Layer 3 — a recurring AI bet made in this function. The agent RECOGNISES the
 * bet instead of reasoning from zero. Each archetype is fully specified: no
 * archetype without a value mechanism is a hard fail (spec §6).
 */
export interface AiUseCaseArchetype {
  /** Stable key — unique within the pack. */
  key: string;
  /** The archetype, named. */
  name: string;
  /**
   * The value mechanism — the causal chain by which this bet creates value.
   * REQUIRED: an archetype with no value mechanism auto-rejects the pack.
   */
  valueMechanism: string;
  /** How readily the function is adopting this bet today. */
  adoptionProfile: AdoptionProfile;
  /** The data this archetype depends on to work at all. */
  dataDependencies: string[];
  /** The control / risk posture this archetype demands. */
  controlPosture: ControlPosture;
  /** The named control and risk considerations specific to this bet. */
  controlRiskNotes: string[];
  /** Which operating-metric keys this archetype is expected to move. */
  metricsMoved: string[];
  /** Cross-reference to an existing kernel archetype playbook, where one fits. */
  relatedArchetypePlaybook?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 4 — Reference solution patterns
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Layer 4 — an architecture + operating-model pattern that recurs in this
 * function. Feeds the Solution Architecture Pack and the "patterns" depth.
 */
export interface ReferenceSolutionPattern {
  /** Stable key — unique within the pack. */
  key: string;
  /** The pattern, named. */
  name: string;
  /** What the pattern is — its architecture and operating-model shape. */
  description: string;
  /** The boundary — what the pattern owns and what it explicitly does not. */
  boundary: string;
  /** The named human accountability point — who owns the decision. */
  humanAccountabilityPoint: string;
  /** The control posture the pattern operates under. */
  controlPosture: ControlPosture;
  /** Cross-reference to an existing canonical AI pattern, where one fits. */
  relatedCanonicalPatternId?: string;
  /**
   * How this pattern participates in the solution-architecture option
   * scorecard. Omitted/`'option'` = a competing architecture option (ranked;
   * one selected, the rest named as alternatives). `'foundation'` = an adopted
   * platform-foundation component (landing zone, ingestion, governance) shown
   * as adopted, never ranked or rejected.
   */
  dispositionKind?: "option" | "foundation";
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 5 — Value model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A haircut factor — a reason a function-level value forecast must be
 * discounted. Ordered hardest-biting first so a forecast can be honest.
 *
 * Named `FunctionPackHaircutFactor` (not `HaircutFactor`) to avoid a collision
 * with the value-forecast kernel's own `HaircutFactor` when both are re-exported
 * from the expert-kernel barrel — they are distinct concepts.
 */
export interface FunctionPackHaircutFactor {
  /** The factor, named (adoption, data readiness, regulatory, etc.). */
  factor: string;
  /** Why it bites in THIS function specifically. */
  rationale: string;
  /**
   * A labelled planning discount range, expressed as a fraction (0–1) of the
   * unhaircut value this factor can remove. A planning range, never a fact.
   */
  typicalHaircut: BenchmarkRange;
}

/** A benchmark value range for a value lever in this function. */
export interface ValueBenchmark {
  /** The value lever, e.g. "Risk-adjusted total-cost-of-care reduction". */
  lever: string;
  /** A labelled planning range for the realisable value. */
  range: BenchmarkRange;
  /** What the value is measured against — the metric and the unit. */
  measuredAs: string;
}

/**
 * Layer 5 — how value is realised in this function: which haircut factors bite
 * hardest, and benchmark value ranges. Drives honest, function-calibrated
 * value forecasts.
 */
export interface ValueModel {
  /** How value is realised in this function — the economic engine. */
  valueRealizationNarrative: string;
  /** The dominant haircut factors, hardest-biting first. */
  dominantHaircutFactors: FunctionPackHaircutFactor[];
  /** Benchmark value ranges for the function's value levers. */
  valueBenchmarks: ValueBenchmark[];
  /** The typical time-to-value band for bets in this function. */
  timeToValueBand: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 6 — Vocabulary & entities
// ─────────────────────────────────────────────────────────────────────────────

/** A system of record relevant to this function. */
export interface SystemOfRecord {
  /** The system's name, e.g. "Care-management platform". */
  name: string;
  /** What it holds and why it matters to this function. */
  role: string;
  /** Representative products — examples, never an exhaustive endorsement. */
  examples: string[];
}

/** A role / accountable actor in this function. */
export interface FunctionRole {
  /** The role's name or title. */
  title: string;
  /** What the role is accountable for in this function. */
  accountability: string;
}

/** A regulatory or program frame that governs this function. */
export interface RegulatoryFrame {
  /** The program or rule, e.g. "Medicare Shared Savings Program (MSSP)". */
  name: string;
  /** Why it shapes how this function operates. */
  relevance: string;
}

/** A canonical term of art in this function. */
export interface VocabularyTerm {
  /** The term, e.g. "RAF score". */
  term: string;
  /** A precise definition an operator would recognise. */
  definition: string;
}

/**
 * Layer 6 — the systems of record, roles, regulatory frame and canonical terms
 * that ground the agent's language so it sounds like an operator.
 */
export interface VocabularyAndEntities {
  /** The systems of record this function runs on. */
  systemsOfRecord: SystemOfRecord[];
  /** The accountable roles in this function. */
  roles: FunctionRole[];
  /** The regulatory / program frames that govern the function. */
  regulatoryFrames: RegulatoryFrame[];
  /** The canonical terms of art an operator uses. */
  canonicalTerms: VocabularyTerm[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 7 — Deliverable outlines
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The four Moves phase artifacts a Function Pack carries an outline for.
 * Mirrors the board-artifacts phases (Charter / Discover / Design & Plan /
 * Mobilize).
 */
export type MovesPhaseArtifact =
  | "discover_brief"
  | "business_case"
  | "solution_architecture"
  | "mobilization_plan";

/** One section of a deliverable's table of contents. */
export interface DeliverableSection {
  /** The section heading. */
  heading: string;
  /**
   * What the section must contain — a real instruction, not a label. This is
   * what makes the outline a TOC the agent can inherit, not a label list.
   */
  guidance: string;
}

/**
 * Layer 7 — the canonical table of contents for one phase artifact AS IT
 * APPLIES to this function. The deliverable-depth fix: the agent inherits
 * structure instead of improvising it. A label list (no guidance) is a hard
 * fail (spec §6).
 */
export interface DeliverableOutline {
  /** Which Moves phase artifact this outline is for. */
  artifact: MovesPhaseArtifact;
  /** The artifact's human label. */
  label: string;
  /** The Moves phase the artifact belongs to. */
  phase: string;
  /** What this artifact must answer in this function — its purpose. */
  purpose: string;
  /** The canonical TOC — ordered sections, each with real guidance. */
  sections: DeliverableSection[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 8 — Evidence anchors
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Layer 8 — what data proves what in this function, which sources are
 * authoritative, and what "good evidence" looks like. Strengthens the
 * no-fabrication discipline.
 */
export interface EvidenceAnchor {
  /** The claim or metric this anchor governs. */
  claim: string;
  /** The authoritative source that can substantiate it. */
  authoritativeSource: string;
  /** What "good evidence" looks like for this claim. */
  whatGoodEvidenceLooksLike: string;
  /** The weak / unacceptable substitute the agent must refuse. */
  weakEvidenceToReject: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// The Function Pack — all eight layers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A Domain Function Pack — the curated, function-indexed industry-depth layer
 * for one `(industryKey, functionKey)`. Eight layers, each typed and each with
 * a depth requirement (spec §4, §6).
 *
 * A pack is a pure, deterministic, typed module — no I/O, no fabrication — the
 * same discipline as the expert kernel.
 */
export interface FunctionPack {
  /** The industry vertical this pack belongs to. */
  industryKey: FunctionPackIndustryKey;
  /** The function within the vertical this pack covers. */
  functionKey: FunctionPackFunctionKey;
  /** Human label for the function, e.g. "Care delivery & care management". */
  functionLabel: string;
  /** A one-paragraph operator's framing of what this function is and does. */
  summary: string;
  /** The pack's version — packs are catalog entries, deepened over time. */
  version: string;
  /** When the pack's content was last reviewed by a domain author. */
  lastReviewed: string;

  /** Layer 1 — operating metrics with definitions, units, benchmarks. */
  operatingMetrics: OperatingMetric[];
  /** Layer 2 — pain themes & failure modes with detection signals. */
  painThemes: PainTheme[];
  /** Layer 3 — fully-specified AI use-case archetypes. */
  aiUseCaseArchetypes: AiUseCaseArchetype[];
  /** Layer 4 — reference solution patterns. */
  referenceSolutionPatterns: ReferenceSolutionPattern[];
  /** Layer 5 — the value model. */
  valueModel: ValueModel;
  /** Layer 6 — vocabulary & entities. */
  vocabulary: VocabularyAndEntities;
  /** Layer 7 — deliverable outlines for the four Moves phase artifacts. */
  deliverableOutlines: DeliverableOutline[];
  /** Layer 8 — evidence anchors. */
  evidenceAnchors: EvidenceAnchor[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Depth-bar minimums (spec §6) — exported so tests assert against one source
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The minimum counts a reference-depth Function Pack must meet (spec §6). The
 * registry's depth-check and the pack tests both read these constants so the
 * depth bar lives in exactly one place.
 */
export const FUNCTION_PACK_DEPTH_MINIMUMS = {
  operatingMetrics: 10,
  painThemes: 6,
  aiUseCaseArchetypes: 5,
  referenceSolutionPatterns: 4,
  /** The four Moves phase artifacts must all carry an outline. */
  deliverableOutlines: 4,
  evidenceAnchors: 4,
} as const;

/** The four Moves phase artifacts every reference pack must outline. */
export const REQUIRED_DELIVERABLE_ARTIFACTS: readonly MovesPhaseArtifact[] = [
  "discover_brief",
  "business_case",
  "solution_architecture",
  "mobilization_plan",
] as const;
