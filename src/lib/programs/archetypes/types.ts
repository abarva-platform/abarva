// =============================================================================
// Strategic Move Archetype Framework — type system (PR-1).
// -----------------------------------------------------------------------------
// AbarVa runs strategy work on a UNIVERSAL 7-phase spine (Originate → Charter →
// Diagnose → Design → Roadmap/Business-Case → Mobilize → Handoff/Operate). What
// changes per use case — evidence, analysis, risks, value model, artifacts, gate
// criteria, agent guidance — is declared by a StrategicMoveArchetype, NOT
// hardcoded into Charter/phase code.
//
// Two-axis requirement resolution (the key generalization):
//   required(phase) = archetype.requirements(phase)  ⨯  estate(profile)
//   — the ARCHETYPE says what kind of evidence the work needs; the client's real
//     ESTATE decides which specific instruments apply and at what severity (e.g.
//     AI-PDLC needs an "engineering delivery baseline"; a mainframe estate
//     resolves that to change-cadence/batch, not DORA).
//
// Hard rules honored by the framework: no hardcoded DORA/IT requirements in
// global Charter code; governed promotion only (no auto agent_ready); no silent
// missing evidence; single-tenant; Azure-native stores; existing governance.
//
// Design: docs/build/moves-design/strategic-move-archetype-framework.md (+
// moves-consulting-engine-arc.md, which becomes the AI-PDLC archetype).
// =============================================================================

// ── Spine ────────────────────────────────────────────────────────────────────

/** The universal strategy spine. Move phases 0–5 live in the product; Operate is
 *  the post-P5 Tower handoff. */
export type PhaseKey =
  | "originate" // P0
  | "charter" // P1
  | "diagnose" // P2
  | "design" // P3
  | "roadmap_business_case" // P4
  | "mobilize" // P5
  | "handoff_operate"; // Tower

export const PHASE_NUMBER: Record<PhaseKey, number> = {
  originate: 0,
  charter: 1,
  diagnose: 2,
  design: 3,
  roadmap_business_case: 4,
  mobilize: 5,
  handoff_operate: 6,
};

export type Severity = "hard" | "soft";

// ── Evidence ladder (governed state machine) ─────────────────────────────────

/** The honest, governed readiness ladder. Forward-only; `agent_ready` is
 *  reachable ONLY through the governed promotion workflow (never automatically). */
export type EvidenceState =
  | "missing"
  | "staged" // uploaded/attached
  | "parsing" // extraction queued/running
  | "committed" // rows in the backing store for this tenant
  | "indexed" // chunked/embedded for retrieval
  | "retrievable" // proven returnable by the retrieval path
  | "citation_ready" // carries source citation in evidence_ledger
  | "promotion_candidate" // eligible for promotion review
  | "agent_ready"; // promoted (governed) — usable as grounded agent context

/** Ordered for monotonic progress checks. */
export const EVIDENCE_STATE_ORDER: EvidenceState[] = [
  "missing",
  "staged",
  "parsing",
  "committed",
  "indexed",
  "retrievable",
  "citation_ready",
  "promotion_candidate",
  "agent_ready",
];

export type EvidenceKind =
  | "metric_baseline"
  | "inventory"
  | "org"
  | "qualitative"
  | "document"
  | "financial"
  | "commercial";

/** A reusable evidence family. Backed by a committed store when structured, or by
 *  the governed artifact/attachment store when documentary. */
export interface EvidenceFamilySpec {
  key: string;
  label: string;
  kind: EvidenceKind;
  /** Plain-English reason this matters — shown in the readiness panel. */
  whyNeeded: string;
  /** What the user typically supplies. */
  sourceDocHint: string;
  acceptedFormats: string[];
  /** Committed-data source (a tower_* / data-plane table) when structured. */
  backing?: { table: string; keyColumn: "client_id" | "tenant_key" };
  /** Analysis method keys that consume this family. */
  feedsMethods?: string[];
}

// ── Per-phase requirements (archetype-declared) ──────────────────────────────

export interface PhaseEvidenceRequirement {
  /** EvidenceFamilySpec.key */
  family: string;
  severity: Severity;
  /** When true, the second axis (estate/profile) may refine applicability and
   *  severity — e.g. drop DORA for a mainframe estate. When false, the family is
   *  required whenever the archetype is active at this phase. */
  estateScoped?: boolean;
}

export interface GateRequirement {
  key: string;
  describe: string;
  severity: Severity;
}

export interface PhaseRequirements {
  phase: PhaseKey;
  /** Evidence the client must supply (resolved against the estate). */
  requiredEvidence: PhaseEvidenceRequirement[];
  /** Analysis method keys run at this phase. */
  analysisMethods: string[];
  /** Deliverable keys produced at this phase. */
  deliverables: string[];
  /** Phase-gate criteria for advancing out of this phase. */
  gateRequirements: GateRequirement[];
}

// ── Analysis methods (pluggable library) ─────────────────────────────────────

/** A reusable strategy method (maturity scoring, two-gap, leverage ranking,
 *  should-cost, sla-gap…). Archetypes COMPOSE methods by key — they don't write
 *  engines. */
export interface AnalysisMethodSpec {
  key: string;
  label: string;
  description: string;
  /** Evidence family keys this method reasons over. */
  consumesFamilies: string[];
  /** The artifact/object key this method produces (e.g. maturity_profile). */
  producesArtifact: string;
}

// ── Deliverables: quality rubric + prompt-driven refinement ──────────────────

export type DeliverableFormat = "html" | "docx" | "xlsx" | "pptx" | "pdf";
export type Altitude = "board" | "exec" | "full";

/** The quality bar a deliverable must clear — used to pressure-test generation. */
export interface DeliverableQualityBar {
  minSections: number;
  requiresCitations: boolean;
  altitude: Altitude;
  /** Explicit, checkable quality criteria (the pressure-test rubric). */
  rubric: string[];
}

export type RefinementScope = "whole" | "section";
export type RefinementIntent =
  | "content"
  | "audience"
  | "quality"
  | "structure"
  | "tone"
  | "depth";

/** Prompt-driven refinement contract. The client reshapes a deliverable by
 *  prompt; every version stays grounded — refinement NEVER fabricates: claims
 *  remain cited, missing evidence stays visible, confidence stays honest. */
export interface DeliverableRefinement {
  promptable: boolean;
  scopes: RefinementScope[];
  allowedIntents: RefinementIntent[];
  /** The guardrail statement enforced on every refinement turn. */
  groundingGuard: string;
  /** Versioned + diffable across refinement turns. */
  versioned: boolean;
}

export interface DeliverableSpec {
  key: string;
  label: string;
  phase: PhaseKey;
  audience: string;
  /** Required sections — the backbone of the quality rubric. */
  sections: string[];
  qualityBar: DeliverableQualityBar;
  refinement: DeliverableRefinement;
  formats: DeliverableFormat[];
  /** True when producing/signing this deliverable is a gate artifact. */
  gateArtifact?: boolean;
}

// ── Value + risk models ──────────────────────────────────────────────────────

export interface ValueModelSpec {
  key: string;
  label: string;
  /** Method key that quantifies value (e.g. dora_uplift, cost_takeout). */
  method: string;
  /** Evidence families that establish the value baseline. */
  baselineFamilies: string[];
  /** Honest default: value is provisional until ratified in Charter. */
  ratifiedAtPhase: PhaseKey;
}

export interface RiskModelSpec {
  key: string;
  label: string;
  /** Risk dimensions evaluated for this archetype. */
  dimensions: string[];
}

// ── Agent guidance + grounded-answer contract ────────────────────────────────

/** Context every agent (Nexus/Sentinel/Atlas) receives BEFORE reasoning. No raw
 *  user-only prompt reaches Claude — the archetype context bundle is injected. */
export interface AgentGuidance {
  /** Archetype framing injected into the system context. */
  systemFraming: string;
  /** The questions this archetype is built to answer. */
  keyQuestions: string[];
  /** Every answer must emit the GroundedAnswer envelope (see below). */
  requiresGroundedAnswer: true;
}

/** The universal output contract for ANY strategy answer/artifact. An agent that
 *  cannot fill it must say "insufficient context" — never bluff. */
export interface GroundedAnswerEnvelope {
  tenantResolved: string; // client id/key
  archetypeResolved: string; // archetype id
  evidenceUsed: string[]; // evidence_ledger refs / family keys
  missingEvidence: string[]; // stated, never silent
  citations: string[];
  unsupportedClaims: string[]; // flagged, not hidden
  confidence: "high" | "medium" | "low" | "insufficient_evidence";
  specific: boolean; // not generic
}

// ── The archetype (root) ─────────────────────────────────────────────────────

export type ArchetypeStatus = "draft" | "validated" | "published";

export interface StrategicMoveArchetype {
  id: string;
  name: string;
  description: string;
  /** Versioned, governed knowledge asset — improves with every engagement. */
  version: string;
  status: ArchetypeStatus;
  applicableIndustries: string[];
  applicableFunctions: string[];
  /** Per-phase requirements (evidence, methods, deliverables, gates). */
  phaseModel: PhaseRequirements[];
  /** Evidence families this archetype can require. */
  evidenceFamilies: EvidenceFamilySpec[];
  /** Analysis method keys this archetype composes (resolved from the method library). */
  analysisMethods: string[];
  deliverablePack: DeliverableSpec[];
  valueModel: ValueModelSpec;
  riskModel: RiskModelSpec;
  agentGuidance: AgentGuidance;
}

// ── Resolver output (two-axis) ───────────────────────────────────────────────

export interface ResolvedEvidenceRequirement {
  family: EvidenceFamilySpec;
  severity: Severity;
  /** True when the estate axis pruned or re-severitied this requirement. */
  estateResolved: boolean;
  /** Why it applies to THIS archetype + estate at this phase. */
  rationale: string;
}
