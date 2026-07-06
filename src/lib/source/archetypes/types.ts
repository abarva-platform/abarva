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
  | 'renewal_leverage';

/**
 * A single archetype value-lever rule. Deterministic advisor knowledge (code
 * constant, versioned) — NOT free LLM prose. The trigger + valueBasis keep the
 * generated number grounded and defensible.
 */
export interface ValueLeverRule {
  /** Stable key, archetype-prefixed, e.g. 'AMS.ENHANCEMENT_LEAKAGE'. */
  key: string;
  name: string;
  category: ValueLeverCategory;
  /** The pattern the advisor watches for. */
  whatToWatch: string;
  /** Evidence family keys this rule needs before it can quantify. */
  requiredEvidence: string[];
  /** When the rule fires (the condition in the event's evidence). */
  triggerLogic: string;
  /** How the $ value is computed — the basis for the range (never a bare guess). */
  valueBasis: string;
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
}
