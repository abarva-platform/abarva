// Source Event Archetype Framework — contract.
//
// Mirrors the proven Strategic Move Archetype Framework (src/lib/programs/
// archetypes) but scoped to IT sourcing. The principle: ONE universal sourcing
// spine (strategy → scope → rfp → responses → evaluation → pricing → bafo →
// executive_decision → selection → transition → value), but each event TYPE is a
// different organism — different evidence packs, vendor questions, RFP
// structure, pricing model, evaluation model, negotiation levers, deliverables,
// and gate criteria. An archetype is a DECLARATION (a contract), never an
// implementation. New archetypes are added to the registry with NO Source core
// code change.

import type { SourceStageKey } from '../types';

export type ArchetypeStatus = 'draft' | 'validated' | 'published';
export type Severity = 'hard' | 'soft';

// ── Evidence families (what the client must supply per event type) ───────────

export type EvidenceKind =
  | 'inventory' // application/system/asset inventories
  | 'metric_baseline' // SLA/DORA/utilization/incident baselines
  | 'financial' // run cost / spend / TCO baselines
  | 'commercial' // contracts, rate cards, renewal terms
  | 'org' // staffing, retained org, stakeholder maps
  | 'process' // process inventories, workflow maps
  | 'document' // strategy memos, architecture docs
  | 'qualitative'; // expectations, constraints, readiness

export interface EvidenceFamilySpec {
  key: string;
  label: string;
  kind: EvidenceKind;
  /** Plain-English reason — shown in the readiness panel. */
  whyNeeded: string;
  /** What the client typically supplies (e.g. "ServiceNow ticket export CSV"). */
  sourceDocHint: string;
  acceptedFormats: string[];
  /** Optional committed-data backing table (when structured). */
  backing?: { table: string; keyColumn: 'client_id' | 'tenant_key' };
  /** Analysis method keys that consume this family. */
  feedsMethods?: string[];
}

// ── Promotion-only evidence ladder (agent_ready earned, never automatic) ─────

export type EvidenceState =
  | 'missing'
  | 'staged'
  | 'parsing'
  | 'committed'
  | 'indexed'
  | 'retrievable'
  | 'citation_ready'
  | 'promotion_candidate'
  | 'agent_ready';

export const EVIDENCE_STATE_ORDER: EvidenceState[] = [
  'missing', 'staged', 'parsing', 'committed', 'indexed',
  'retrievable', 'citation_ready', 'promotion_candidate', 'agent_ready',
];

// ── Vendor discussion + negotiation intelligence ─────────────────────────────

export interface VendorDiscussionGuide {
  /** Topics to probe with the vendor, in order. */
  topics: string[];
  /** Questions to ASK the vendor (archetype-specific). */
  ask: string[];
  /** What NOT to reveal yet (information asymmetry protection). */
  doNotRevealYet: string[];
  /** Where the vendor is likely to push back. */
  likelyPushback: string[];
  /** Assumptions to challenge. */
  challengeAssumptions: string[];
}

export interface NegotiationLever {
  key: string;
  label: string;
  /** Why this lever has force for this event type. */
  rationale: string;
  /** When to deploy: 'pre_rfp' | 'rfp' | 'bafo' | 'final_contracting'. */
  timing: 'pre_rfp' | 'rfp' | 'bafo' | 'final_contracting';
}

// ── Pricing + evaluation + risk models (per archetype) ───────────────────────

export interface PricingModelSpec {
  /** The commercial structure appropriate to this event type. */
  model: string; // e.g. "resource-unit + ticket-band", "fixed-price + T&M", "per-seat + consumption"
  /** The cost components that must be normalized for comparison. */
  costComponents: string[];
  /** Pricing traps to surface for this event type. */
  traps: string[];
  /** Whether a bottom-up should-cost is expected. */
  shouldCost: boolean;
}

export interface EvaluationCriterion {
  key: string;
  label: string;
  /** Default weight (0..1); weights must sum ~1 across the model. */
  weight: number;
}

export interface EvaluationModelSpec {
  criteria: EvaluationCriterion[];
  /** Disqualifiers (auto-fail conditions) for this event type. */
  disqualifiers: string[];
}

export interface RiskModelSpec {
  /** Risk dimensions to assess for this event type. */
  dimensions: string[];
  /** Contract terms that must be protected for this event type. */
  contractProtections: string[];
}

// ── RFP document structure (event-specific, not generic) ─────────────────────

export interface RfpSection {
  key: string;
  title: string;
  required: boolean;
  /** Evidence family keys this section depends on (drives "weak because X missing"). */
  evidenceDependencies: string[];
}

// ── Deliverables (board-grade, grounded, refinement-safe) ────────────────────

export type Altitude = 'board' | 'exec' | 'full';
export type DeliverableFormat = 'html' | 'docx' | 'xlsx' | 'pptx' | 'pdf';

export interface DeliverableSpec {
  key: string;
  label: string;
  stage: SourceStageKey;
  audience: string;
  sections: string[];
  qualityBar: {
    minSections: number;
    requiresCitations: boolean;
    altitude: Altitude;
    rubric: string[];
  };
  formats: DeliverableFormat[];
  /** Signing this is a gate artifact. */
  gateArtifact?: boolean;
}

// ── Gate criteria + phase model ──────────────────────────────────────────────

export interface GateCriterion {
  key: string;
  describe: string;
  fromStage: SourceStageKey;
  toStage: SourceStageKey | 'closed';
  severity: Severity;
}

export interface PhaseEvidenceRequirement {
  family: string;
  severity: Severity;
  /** May be pruned / re-severitied by the spend-band / estate axis. */
  estateScoped?: boolean;
}

export interface StageRequirements {
  stage: SourceStageKey;
  requiredEvidence: PhaseEvidenceRequirement[];
  analysisMethods: string[];
  deliverables: string[];
}

// ── Agent guidance + grounded answer contract ────────────────────────────────

export interface AgentGuidance {
  systemFraming: string;
  keyQuestions: string[];
  requiresGroundedAnswer: true;
}

/** Universal output contract for every Source agent answer/deliverable. */
export interface GroundedSourceAnswerEnvelope {
  tenantResolved: string;
  archetypeResolved: string;
  eventResolved: string | null;
  evidenceUsed: string[];
  missingEvidence: string[]; // stated, never silent
  citations: string[];
  unsupportedClaims: string[]; // flagged, MUST be empty for a clean answer
  confidence: 'high' | 'medium' | 'low' | 'insufficient_evidence';
  specific: boolean; // not generic
}

// ── The archetype object (the contract) ──────────────────────────────────────

export interface SourceEventArchetype {
  id: string;
  name: string;
  description: string;
  version: string;
  status: ArchetypeStatus;
  /** Maps to source_events.event_type. */
  eventType: string;
  applicableSpendCategories: string[];
  requiredEvidenceFamilies: EvidenceFamilySpec[];
  optionalEvidenceFamilies: EvidenceFamilySpec[];
  requiredStakeholders: string[];
  sourcingStrategyQuestions: string[];
  vendorDiscussionGuide: VendorDiscussionGuide;
  rfpDocumentStructure: RfpSection[];
  pricingModel: PricingModelSpec;
  evaluationModel: EvaluationModelSpec;
  riskModel: RiskModelSpec;
  negotiationLevers: NegotiationLever[];
  deliverablePack: DeliverableSpec[];
  gateCriteria: GateCriterion[];
  agentGuidance: AgentGuidance;
  /** Per-stage requirements (evidence + methods + deliverables). */
  stageModel: StageRequirements[];
  /**
   * Structured value-lever rules — the qualitative→quantitative bridge. Each rule
   * turns an archetype trap into a computable value row: what to watch, the
   * evidence it needs, the trigger, the $ basis, the RFP clause it drives, its
   * evaluation + BAFO impact, and the executive implication. One rule drives
   * evidence request → RFP clause → response exhibit → scorecard hook → BAFO ask
   * → decision-brief insight → value-lever row → aVa answer. Optional while the
   * library is authored archetype-by-archetype.
   */
  valueLeverRules?: ValueLeverRule[];
}

/** The value-lever categories a rule contributes to (the savings basket). */
export type ValueLeverCategory =
  | 'pricing'
  | 'scope_leakage'
  | 'productivity'
  | 'sla_economics'
  | 'retained_cost'
  | 'transition_risk'
  | 'staffing'
  | 'renewal_leverage'
  | 'commercial_posture'
  | 'solution_quality'
  | 'assumptions'
  | 'claim_integrity';

/**
 * The five value TYPES — the classification spine. Source does not chase a single
 * "savings %". The first vendor bid is the vendor's OPENING POSITION, not the
 * baseline; a price reduction is not automatically Source-created value. Every
 * movement is classified into one of these so the value story is honest:
 *  - `expected_concession`   — giveback already latent in the first bid; the buyer
 *                              would get it just by asking. NOT Source-created.
 *  - `incremental_negotiated`— value beyond the expected concession, earned through
 *                              competitive tension, normalization, and BAFO pressure.
 *  - `solution_tightening`   — value from a better solution: staffing, SLA, transition,
 *                              productivity, assumptions cleanup — not just a lower price.
 *  - `protected`             — post-award leakage AVOIDED (scope, SLA, change-order),
 *                              value that never shows up as a discount but is real.
 *  - `risk_adjusted`         — value remaining after discounting delivery, underpricing,
 *                              and solution-weakness risk (the defensible, not headline, figure).
 */
export type ValueType =
  | 'expected_concession'
  | 'incremental_negotiated'
  | 'solution_tightening'
  | 'protected'
  | 'risk_adjusted';

/** Where a computation input comes from — all structured/extracted, never model-invented. */
export type ValueInputSource =
  | 'extracted_vendor' // parsed from a vendor proposal/response (price line, SLA term, staffing, claim)
  | 'extracted_contract' // parsed from the incumbent / current contract
  | 'enterprise_inventory' // committed client inventory / run-cost / ticket volumes
  | 'should_cost' // computed should-cost model output
  | 'benchmark' // named market benchmark (source recorded)
  | 'analyst_input'; // explicit human-entered assumption (logged, overridable)

export type ValueUnit =
  | 'usd'
  | 'usd_per_year'
  | 'pct'
  | 'count'
  | 'fte'
  | 'months'
  | 'ratio';

/** A single typed input the deterministic math consumes. */
export interface ValueComputationInput {
  /** Stable fact key the evaluator reads, e.g. 'annual_change_order_spend'. */
  key: string;
  label: string;
  unit: ValueUnit;
  source: ValueInputSource;
  /** If true, no value row is produced without a cited value for this input. */
  citationRequired: boolean;
}

/**
 * The deterministic, defensible computation contract for a value lever. The
 * NUMBER is derived by code from the typed inputs — never authored by the model.
 * `method` is what an auditor reads; `formulaId` is the pure evaluator that
 * implements it (same inputs → same output). A range is mandatory — a point
 * estimate is never presented as fact — and missing required inputs yield
 * `insufficient_evidence`, not a guess. This is how we defend our math.
 */
export interface ValueComputation {
  /** The ONLY things the value is derived from. */
  inputs: ValueComputationInput[];
  /** Human-readable formula, e.g. 'avoidable_pct × annual_change_order_spend × term_years'. */
  method: string;
  /** Machine id of the deterministic evaluator fn implementing `method`. */
  formulaId: string;
  /** How the low/high band is derived (mandatory range, never a bare point). */
  rangeMethod: string;
  /** When any citationRequired input is absent, the lever must not guess. */
  onMissingEvidence: 'insufficient_evidence';
}

/**
 * A single archetype value-lever rule. Deterministic advisor knowledge (code
 * constant, versioned) — NOT free LLM prose. The `computation` contract makes the
 * generated number grounded, reproducible, and auditable.
 */
export interface ValueLeverRule {
  /** Stable key, archetype-prefixed, e.g. 'AMS.ENHANCEMENT_LEAKAGE'. */
  key: string;
  name: string;
  category: ValueLeverCategory;
  /**
   * Which of the five value types this lever primarily produces. Forces every
   * lever to declare whether it is expected concession, incremental negotiated
   * value, solution tightening, protected value, or risk-adjusted value — so the
   * value story classifies movement instead of claiming a single headline number.
   */
  valueType: ValueType;
  /** The pattern the advisor watches for. */
  whatToWatch: string;
  /** Evidence family keys this rule needs before it can quantify. */
  requiredEvidence: string[];
  /** When the rule fires (the condition in the event's evidence). */
  triggerLogic: string;
  /** Plain-English summary of the basis for the range (the human gloss on `computation.method`). */
  valueBasis: string;
  /** The deterministic computation contract — how the number is derived and defended. */
  computation: ValueComputation;
  /** Default confidence when the trigger fires with adequate evidence. */
  defaultConfidence: 'low' | 'med' | 'high';
  /** The RFP clause this rule requires vendors to answer. */
  rfpClause: string;
  /** How it shifts evaluation (scoring hook / disqualifier). */
  evaluationImpact: string;
  /** The negotiation ask it becomes at BAFO. */
  bafoAsk: string;
  /** Why it matters to the executive decision. */
  executiveImplication: string;
  /**
   * The commercial risk if this lever is mishandled or the value is claimed
   * without evidence — keeps the advisory honest about downside, not just upside.
   */
  commercialRisk?: string;
  /**
   * The product capability / UI view that surfaces this lever (e.g.
   * 'value_lever_map', 'vendor_commercial_posture', 'solution_quality'). Ties the
   * rule to where the user sees and acts on it.
   */
  capabilityRef?: string;
}
