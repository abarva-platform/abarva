// SOL12 · Architecture Draft Read Model.
//
// Pure deterministic library that names the canonical shape of a
// per-tenant architecture draft. The draft is the working artifact a
// Solution Architect / Client Maestro / AbarVa Maestro composes from a
// SOL3 archetype plus SOL2 / SOL4 / SOL5 component packs and the SOL6
// build / buy / partner posture. The draft groups its content into
// eight canonical sections, each anchored to explicit assumptions,
// components, risks, and evidence gaps so reviewers see the basis
// without a model run.
//
// This module is a *library*. It does NOT compose live architectures
// per tenant, invoke models, read tenant runtime state, or write
// persistence. Every call with the same input produces a byte-equal
// result.
//
// No live runtime, no Claude / OpenAI / Pinecone invocation, no
// Date.now reads, no random IDs, no Supabase reads, no migrations.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**, src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**
//   - supabase/**

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type ArchitectureDraftSectionKey =
  | 'context'
  | 'capabilities'
  | 'data_model'
  | 'integration'
  | 'security'
  | 'governance'
  | 'observability'
  | 'rollout';

export type ArchitectureDraftStatus =
  | 'draft'
  | 'reviewed'
  | 'approved'
  | 'requires_workshop'
  | 'blocked';

export interface ArchitectureAssumption {
  /** Stable id within the draft (e.g. `assumption_data_foundation_governed`). */
  id: string;
  /** The assumption stated in plain language. */
  statement: string;
  /** Confidence the architect places in the assumption today. */
  confidence: 'low' | 'medium' | 'high';
  /** Section this assumption anchors. */
  sectionKey: ArchitectureDraftSectionKey;
  /** Whether the assumption must be validated in a workshop before approval. */
  requiresWorkshopValidation: boolean;
}

export interface ArchitectureComponent {
  /** Stable id within the draft (e.g. `component_semantic_layer`). */
  id: string;
  /** Human-readable component name. */
  name: string;
  /** What the component does in this architecture. */
  responsibility: string;
  /** Section this component anchors. */
  sectionKey: ArchitectureDraftSectionKey;
  /** Build / buy / partner posture for this component. */
  buildBuyPartner: 'build' | 'buy' | 'partner' | 'undecided';
  /** Maturity of the component as drawn today. */
  maturity: 'draft' | 'reviewed' | 'approved';
}

export interface ArchitectureRisk {
  /** Stable id within the draft. */
  id: string;
  /** Risk description in plain language. */
  description: string;
  /** Section this risk anchors. */
  sectionKey: ArchitectureDraftSectionKey;
  /** Severity band drawn deterministically from the seed. */
  severity: 'low' | 'medium' | 'high';
  /** Mitigation language; never empty. */
  mitigation: string;
  /** Whether the risk currently blocks approval. */
  blocksApproval: boolean;
}

export interface ArchitectureEvidenceGap {
  /** Stable id within the draft. */
  id: string;
  /** What evidence is missing in plain language. */
  description: string;
  /** Section this gap anchors. */
  sectionKey: ArchitectureDraftSectionKey;
  /** What input is needed to close the gap. */
  inputRequired: string;
  /** Impact on the draft if the gap is not closed. */
  impact: 'informational' | 'requires_workshop' | 'blocks_approval';
}

export interface ArchitectureDraftSection {
  key: ArchitectureDraftSectionKey;
  title: string;
  /** Section narrative drawn from the deterministic seed. Never empty. */
  narrative: string;
  /** Bullet body the renderer can print verbatim. */
  body: readonly string[];
  /** Assumption ids that anchor this section. */
  assumptionIds: readonly string[];
  /** Component ids that anchor this section. */
  componentIds: readonly string[];
  /** Risk ids that anchor this section. */
  riskIds: readonly string[];
  /** Evidence gap ids that anchor this section. */
  evidenceGapIds: readonly string[];
}

export interface ArchitectureDraft {
  archetypeKey: string;
  draftKey: string;
  status: ArchitectureDraftStatus;
  sections: readonly ArchitectureDraftSection[];
  assumptions: readonly ArchitectureAssumption[];
  components: readonly ArchitectureComponent[];
  risks: readonly ArchitectureRisk[];
  evidenceGaps: readonly ArchitectureEvidenceGap[];
  recommendedNextAction: string;
  basis: {
    source: 'deterministic_architecture_draft_seed';
    draftBuilderVersion: string;
  };
  createdFrom: 'deterministic_architecture_draft_seed';
}

export interface ArchitectureDraftSummary {
  draftKey: string;
  archetypeKey: string;
  status: ArchitectureDraftStatus;
  totalSections: number;
  totalAssumptions: number;
  totalComponents: number;
  totalRisks: number;
  totalEvidenceGaps: number;
  blockingRiskCount: number;
  blockingEvidenceGapCount: number;
  workshopGatedAssumptionCount: number;
  recommendedNextAction: string;
}

// Optional caller-supplied input. The builder accepts a sparse input
// (default fixture is returned) or a populated input that overrides the
// seed sections / assumptions / components / risks / evidence gaps.
export interface ArchitectureDraftInput {
  archetypeKey?: string;
  draftKey?: string;
  status?: ArchitectureDraftStatus;
  sections?: readonly ArchitectureDraftSection[];
  assumptions?: readonly ArchitectureAssumption[];
  components?: readonly ArchitectureComponent[];
  risks?: readonly ArchitectureRisk[];
  evidenceGaps?: readonly ArchitectureEvidenceGap[];
}

// ---------------------------------------------------------------------
// Canonical section order
// ---------------------------------------------------------------------

const SECTION_KEYS_IN_ORDER: ReadonlyArray<ArchitectureDraftSectionKey> = [
  'context',
  'capabilities',
  'data_model',
  'integration',
  'security',
  'governance',
  'observability',
  'rollout',
];

const SECTION_TITLE: Record<ArchitectureDraftSectionKey, string> = {
  context: 'Context and intent',
  capabilities: 'Capabilities and components',
  data_model: 'Data model and foundation',
  integration: 'Integration topology',
  security: 'Security and privacy',
  governance: 'Governance and human-in-loop',
  observability: 'Observability and audit',
  rollout: 'Rollout sequence',
};

// ---------------------------------------------------------------------
// Deterministic seed
// ---------------------------------------------------------------------
//
// The seed names the canonical content of an architecture draft when no
// caller-supplied content is present. It is intentionally generic so the
// read model can stand alone: every section, assumption, component,
// risk, and evidence gap is anchored to one of the eight canonical
// sections.

const SEED_ARCHETYPE_KEY = 'cross_sector_ai_solution_draft';
const SEED_DRAFT_KEY = 'deterministic_seed_draft_v1';
const SEED_BUILDER_VERSION = 'sol12.v1';

const SEED_ASSUMPTIONS: ReadonlyArray<ArchitectureAssumption> = [
  {
    id: 'assumption_executive_sponsor_named',
    statement:
      'A named executive sponsor with budget and decision authority owns the engagement and signs off on the architecture before rollout.',
    confidence: 'medium',
    sectionKey: 'context',
    requiresWorkshopValidation: false,
  },
  {
    id: 'assumption_capability_inventory_present',
    statement:
      'A capability inventory exists or will be captured in the current-state discovery workshop before architecture approval.',
    confidence: 'medium',
    sectionKey: 'capabilities',
    requiresWorkshopValidation: true,
  },
  {
    id: 'assumption_data_foundation_governed',
    statement:
      'The target data foundation has named domain owners and a published quality / lineage posture before AI consumption is wired.',
    confidence: 'low',
    sectionKey: 'data_model',
    requiresWorkshopValidation: true,
  },
  {
    id: 'assumption_integration_endpoints_supported',
    statement:
      'Integration runs on supported endpoints from the existing system-of-record vendors rather than shadow surfaces.',
    confidence: 'medium',
    sectionKey: 'integration',
    requiresWorkshopValidation: false,
  },
  {
    id: 'assumption_phi_pii_classification_complete',
    statement:
      'PHI / PII classification covers every data path the architecture touches and is reviewed by the privacy officer before rollout.',
    confidence: 'low',
    sectionKey: 'security',
    requiresWorkshopValidation: true,
  },
  {
    id: 'assumption_governance_committee_chartered',
    statement:
      'A governance committee with named owners and a contracted cadence reviews assumptions, evidence gaps, and approval state.',
    confidence: 'medium',
    sectionKey: 'governance',
    requiresWorkshopValidation: false,
  },
  {
    id: 'assumption_audit_trail_retained',
    statement:
      'An audit trail of model output, human decision, and customer / clinician outcome is retained for the contracted regulatory window.',
    confidence: 'medium',
    sectionKey: 'observability',
    requiresWorkshopValidation: false,
  },
  {
    id: 'assumption_rollout_sequence_phased',
    statement:
      'Rollout is phased per priority capability with named owners and a measurable readout against the captured baseline.',
    confidence: 'medium',
    sectionKey: 'rollout',
    requiresWorkshopValidation: false,
  },
];

const SEED_COMPONENTS: ReadonlyArray<ArchitectureComponent> = [
  {
    id: 'component_problem_brief',
    name: 'Problem brief and intent statement',
    responsibility:
      'Anchors the engagement intent, the named sponsor, and the in-scope problem statement so downstream sections do not drift.',
    sectionKey: 'context',
    buildBuyPartner: 'build',
    maturity: 'draft',
  },
  {
    id: 'component_capability_inventory',
    name: 'Capability inventory',
    responsibility:
      'Lists target capabilities with current ownership, adoption posture, and the named owner each capability requires before architecture approval.',
    sectionKey: 'capabilities',
    buildBuyPartner: 'build',
    maturity: 'draft',
  },
  {
    id: 'component_governed_data_foundation',
    name: 'Governed data foundation',
    responsibility:
      'Provides the lakehouse / warehouse layer plus stewardship and quality controls that AI consumption sits on top of.',
    sectionKey: 'data_model',
    buildBuyPartner: 'buy',
    maturity: 'draft',
  },
  {
    id: 'component_integration_topology',
    name: 'Integration topology map',
    responsibility:
      'Names supported endpoints, integration patterns, and the system-of-record systems the architecture interacts with.',
    sectionKey: 'integration',
    buildBuyPartner: 'partner',
    maturity: 'draft',
  },
  {
    id: 'component_security_privacy_controls',
    name: 'Security and privacy controls',
    responsibility:
      'Covers identity, access, PHI / PII handling, secret management, and the privacy-officer review path.',
    sectionKey: 'security',
    buildBuyPartner: 'build',
    maturity: 'draft',
  },
  {
    id: 'component_governance_human_in_loop',
    name: 'Governance and human-in-loop surface',
    responsibility:
      'Names hard gates G1..G4, evidence retention, named reviewers, and the human-in-loop approval path on regulated outcomes.',
    sectionKey: 'governance',
    buildBuyPartner: 'build',
    maturity: 'draft',
  },
  {
    id: 'component_observability_audit_chain',
    name: 'Observability and audit chain',
    responsibility:
      'Captures telemetry, audit retention, and the evidence chain bound to every model output and human decision.',
    sectionKey: 'observability',
    buildBuyPartner: 'build',
    maturity: 'draft',
  },
  {
    id: 'component_rollout_value_ledger',
    name: 'Rollout sequence and value ledger',
    responsibility:
      'Sequences rollout per priority capability and binds outcomes to the value ledger against the captured baseline.',
    sectionKey: 'rollout',
    buildBuyPartner: 'build',
    maturity: 'draft',
  },
];

const SEED_RISKS: ReadonlyArray<ArchitectureRisk> = [
  {
    id: 'risk_sponsor_misalignment',
    description:
      'Executive sponsor intent drifts from the engagement scope; the architecture solves the wrong problem at scale.',
    sectionKey: 'context',
    severity: 'medium',
    mitigation:
      'Re-confirm intent at every governance review and record dissent in the steering-committee audit trail.',
    blocksApproval: false,
  },
  {
    id: 'risk_capability_overlap',
    description:
      'Target capabilities overlap with existing platforms; investment is duplicated and accountability fragments.',
    sectionKey: 'capabilities',
    severity: 'medium',
    mitigation:
      'Reconcile overlap against the capability inventory before architecture approval and assign a named owner per capability.',
    blocksApproval: false,
  },
  {
    id: 'risk_data_foundation_drift',
    description:
      'Data foundation governance drifts as new domains are onboarded; metric definitions and lineage become inconsistent.',
    sectionKey: 'data_model',
    severity: 'high',
    mitigation:
      'Anchor the semantic layer to versioned definitions with named stewards and review at the same cadence as availability SLOs.',
    blocksApproval: true,
  },
  {
    id: 'risk_integration_shadow_path',
    description:
      'Integration lands on a shadow path the system-of-record vendor does not support; operational risk and upgrade exposure rise.',
    sectionKey: 'integration',
    severity: 'medium',
    mitigation:
      'Constrain integration to the vendor-supported endpoint catalog and flag exceptions for governance review.',
    blocksApproval: false,
  },
  {
    id: 'risk_phi_pii_leakage',
    description:
      'PHI / PII handling is incomplete on at least one data path and exposes the tenant to regulatory risk.',
    sectionKey: 'security',
    severity: 'high',
    mitigation:
      'Privacy officer reviews every data path the architecture touches before rollout; gaps gate approval.',
    blocksApproval: true,
  },
  {
    id: 'risk_governance_review_lag',
    description:
      'Governance review cadence lags rollout; AI outcomes ship without named reviewer evidence or audit retention.',
    sectionKey: 'governance',
    severity: 'high',
    mitigation:
      'Hard gate G3 enforces named reviewer and audit retention before rollout proceeds beyond pilot scope.',
    blocksApproval: true,
  },
  {
    id: 'risk_observability_blind_spot',
    description:
      'Observability misses model output or human override telemetry; value capture and audit defensibility erode.',
    sectionKey: 'observability',
    severity: 'medium',
    mitigation:
      'Telemetry and audit retention SLOs are reviewed at the governance committee cadence with named owners.',
    blocksApproval: false,
  },
  {
    id: 'risk_rollout_overreach',
    description:
      'Rollout scope expands past the captured baseline before evidence supports the next phase.',
    sectionKey: 'rollout',
    severity: 'medium',
    mitigation:
      'Phased rollout requires a measurable readout against the captured baseline before the next phase is approved.',
    blocksApproval: false,
  },
];

const SEED_EVIDENCE_GAPS: ReadonlyArray<ArchitectureEvidenceGap> = [
  {
    id: 'gap_named_executive_sponsor',
    description:
      'The named executive sponsor with budget authority is not yet recorded in the engagement evidence chain.',
    sectionKey: 'context',
    inputRequired:
      'Capture the named sponsor, decision rights, and budget envelope in the engagement record.',
    impact: 'requires_workshop',
  },
  {
    id: 'gap_capability_inventory_baseline',
    description:
      'No capability inventory baseline is recorded; overlap with existing platforms cannot be reconciled today.',
    sectionKey: 'capabilities',
    inputRequired:
      'Run the current-state discovery workshop to capture capability inventory and named owners.',
    impact: 'requires_workshop',
  },
  {
    id: 'gap_data_foundation_lineage',
    description:
      'Data foundation lineage and quality posture are not recorded; AI consumption cannot be wired defensibly.',
    sectionKey: 'data_model',
    inputRequired:
      'Run the data foundation assessment workshop to capture stewardship, lineage, and quality SLOs.',
    impact: 'blocks_approval',
  },
  {
    id: 'gap_integration_endpoint_catalog',
    description:
      'The integration endpoint catalog is not captured; supported paths cannot be confirmed today.',
    sectionKey: 'integration',
    inputRequired:
      'Capture the vendor-supported endpoint catalog and the system-of-record contact for each integration path.',
    impact: 'requires_workshop',
  },
  {
    id: 'gap_phi_pii_data_path_review',
    description:
      'Privacy officer review of every PHI / PII data path is not yet recorded.',
    sectionKey: 'security',
    inputRequired:
      'Schedule and capture the privacy officer review for every data path the architecture touches.',
    impact: 'blocks_approval',
  },
  {
    id: 'gap_governance_committee_charter',
    description:
      'The governance committee charter, named owners, and review cadence are not recorded.',
    sectionKey: 'governance',
    inputRequired:
      'Capture the governance committee charter, named owners, and contracted cadence.',
    impact: 'blocks_approval',
  },
  {
    id: 'gap_audit_retention_window',
    description:
      'Audit retention window per regulated outcome is not yet recorded.',
    sectionKey: 'observability',
    inputRequired:
      'Capture the audit retention window per regulated outcome class with named owner sign-off.',
    impact: 'requires_workshop',
  },
  {
    id: 'gap_rollout_baseline_metrics',
    description:
      'Pre-rollout baseline metrics for value-capture readout are not yet captured.',
    sectionKey: 'rollout',
    inputRequired:
      'Capture pre-rollout baseline metrics per priority capability before phase one launches.',
    impact: 'requires_workshop',
  },
];

const SEED_SECTION_NARRATIVE: Record<ArchitectureDraftSectionKey, string> = {
  context:
    'Names the engagement intent, the executive sponsor, and the bounded problem statement the architecture is solving.',
  capabilities:
    'Lists the target capabilities, their owners, and the components each capability requires.',
  data_model:
    'Anchors the data foundation and semantic layer the architecture consumes, including governance posture and quality controls.',
  integration:
    'Names integration topology, supported endpoints, and the system-of-record systems involved.',
  security:
    'Covers identity, access, PHI / PII handling, secret management, and the privacy-officer review path.',
  governance:
    'Names hard gates G1..G4, evidence retention, named reviewers, and the human-in-loop approval path.',
  observability:
    'Captures telemetry, audit retention, and the evidence chain bound to every model output and human decision.',
  rollout:
    'Sequences rollout per priority capability and binds outcomes to the value ledger against the captured baseline.',
};

const SEED_SECTION_BODY: Record<ArchitectureDraftSectionKey, ReadonlyArray<string>> = {
  context: [
    'Engagement intent and executive sponsor named with budget and decision authority',
    'Bounded problem statement scoped to the capability under transformation',
    'In-scope and out-of-scope boundaries recorded for governance review',
  ],
  capabilities: [
    'Target capability inventory with current ownership and adoption posture',
    'Component-level breakdown with named owner and build / buy / partner posture',
    'Capability-level value-metric anchors recorded against the captured baseline',
  ],
  data_model: [
    'Governed data foundation with named domain owners',
    'Semantic layer publishing canonical metrics with versioned definitions',
    'Quality, lineage, and access governance pipeline reviewed at SLO cadence',
  ],
  integration: [
    'Supported endpoint catalog from each system-of-record vendor',
    'Integration patterns mapped against vendor-supported guidance',
    'Exceptions flagged for governance review with named owner per exception',
  ],
  security: [
    'Identity and access boundaries grounded in least privilege',
    'PHI / PII classification reviewed by the privacy officer per data path',
    'Secret management posture audited at the governance committee cadence',
  ],
  governance: [
    'Hard gates G1..G4 enforced uniformly across the program portfolio',
    'Named reviewers, audit retention, and committee cadence recorded',
    'Human-in-loop approval path required for regulated outcomes',
  ],
  observability: [
    'Telemetry covers model output, human override, and customer / clinician outcome',
    'Audit retention runs the contracted regulatory window per outcome class',
    'Evidence chain bound to every regulated decision is reviewable on demand',
  ],
  rollout: [
    'Phased rollout per priority capability with named owner per phase',
    'Pre-rollout baseline metrics captured for the value-capture readout',
    'Phase gate requires a measurable readout before the next phase launches',
  ],
};

// ---------------------------------------------------------------------
// Public exports
// ---------------------------------------------------------------------

/**
 * Frozen tuple of canonical architecture draft section keys in canonical
 * order. Pure: byte-equal across reads.
 */
export const ARCHITECTURE_DRAFT_SECTION_KEYS: ReadonlyArray<ArchitectureDraftSectionKey> =
  Object.freeze([...SECTION_KEYS_IN_ORDER]) as ReadonlyArray<ArchitectureDraftSectionKey>;

/**
 * Build a deterministic architecture draft from caller-supplied input.
 *
 * Semantics:
 * - When `input` is undefined or empty, the returned draft uses the
 *   canonical seed (default archetype key, default draft key, eight
 *   canonical sections, full assumption / component / risk / evidence-
 *   gap rosters).
 * - When `input.sections` (or any of the supporting collections) is
 *   provided, the builder uses it verbatim instead of the seed; the
 *   surface contract still requires the eight canonical sections in
 *   canonical order.
 * - Status defaults to `'draft'`.
 * - `recommendedNextAction` is derived deterministically from the
 *   resulting status / blockers.
 * - Every call with the same input produces a byte-equal output.
 */
export function buildArchitectureDraft(input?: ArchitectureDraftInput): ArchitectureDraft {
  const archetypeKey =
    typeof input?.archetypeKey === 'string' && input.archetypeKey.trim().length > 0
      ? input.archetypeKey.trim()
      : SEED_ARCHETYPE_KEY;
  const draftKey =
    typeof input?.draftKey === 'string' && input.draftKey.trim().length > 0
      ? input.draftKey.trim()
      : SEED_DRAFT_KEY;
  const status: ArchitectureDraftStatus = input?.status ?? 'draft';

  const assumptions = input?.assumptions ?? SEED_ASSUMPTIONS;
  const components = input?.components ?? SEED_COMPONENTS;
  const risks = input?.risks ?? SEED_RISKS;
  const evidenceGaps = input?.evidenceGaps ?? SEED_EVIDENCE_GAPS;

  const sections =
    input?.sections && input.sections.length > 0
      ? input.sections
      : buildSeedSections(assumptions, components, risks, evidenceGaps);

  const recommendedNextAction = deriveRecommendedNextAction(status, risks, evidenceGaps);

  return {
    archetypeKey,
    draftKey,
    status,
    sections,
    assumptions,
    components,
    risks,
    evidenceGaps,
    recommendedNextAction,
    basis: {
      source: 'deterministic_architecture_draft_seed',
      draftBuilderVersion: SEED_BUILDER_VERSION,
    },
    createdFrom: 'deterministic_architecture_draft_seed',
  };
}

/**
 * Summarise an architecture draft for at-a-glance readouts. Pure.
 */
export function summarizeArchitectureDraft(draft: ArchitectureDraft): ArchitectureDraftSummary {
  const blockingRiskCount = draft.risks.filter((r) => r.blocksApproval).length;
  const blockingEvidenceGapCount = draft.evidenceGaps.filter(
    (g) => g.impact === 'blocks_approval',
  ).length;
  const workshopGatedAssumptionCount = draft.assumptions.filter(
    (a) => a.requiresWorkshopValidation,
  ).length;

  return {
    draftKey: draft.draftKey,
    archetypeKey: draft.archetypeKey,
    status: draft.status,
    totalSections: draft.sections.length,
    totalAssumptions: draft.assumptions.length,
    totalComponents: draft.components.length,
    totalRisks: draft.risks.length,
    totalEvidenceGaps: draft.evidenceGaps.length,
    blockingRiskCount,
    blockingEvidenceGapCount,
    workshopGatedAssumptionCount,
    recommendedNextAction: draft.recommendedNextAction,
  };
}

/**
 * Return the explicit blocker list for a draft. Pure. The list joins
 * approval-blocking risks and approval-blocking evidence gaps so the
 * caller can render a single combined readout.
 */
export function getArchitectureBlockers(draft: ArchitectureDraft): ReadonlyArray<{
  kind: 'risk' | 'evidence_gap';
  id: string;
  sectionKey: ArchitectureDraftSectionKey;
  description: string;
}> {
  const out: Array<{
    kind: 'risk' | 'evidence_gap';
    id: string;
    sectionKey: ArchitectureDraftSectionKey;
    description: string;
  }> = [];
  for (const r of draft.risks) {
    if (r.blocksApproval) {
      out.push({
        kind: 'risk',
        id: r.id,
        sectionKey: r.sectionKey,
        description: r.description,
      });
    }
  }
  for (const g of draft.evidenceGaps) {
    if (g.impact === 'blocks_approval') {
      out.push({
        kind: 'evidence_gap',
        id: g.id,
        sectionKey: g.sectionKey,
        description: g.description,
      });
    }
  }
  return out;
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function buildSeedSections(
  assumptions: ReadonlyArray<ArchitectureAssumption>,
  components: ReadonlyArray<ArchitectureComponent>,
  risks: ReadonlyArray<ArchitectureRisk>,
  evidenceGaps: ReadonlyArray<ArchitectureEvidenceGap>,
): ReadonlyArray<ArchitectureDraftSection> {
  return SECTION_KEYS_IN_ORDER.map((key) => {
    const assumptionIds = assumptions.filter((a) => a.sectionKey === key).map((a) => a.id);
    const componentIds = components.filter((c) => c.sectionKey === key).map((c) => c.id);
    const riskIds = risks.filter((r) => r.sectionKey === key).map((r) => r.id);
    const evidenceGapIds = evidenceGaps.filter((g) => g.sectionKey === key).map((g) => g.id);

    return {
      key,
      title: SECTION_TITLE[key],
      narrative: SEED_SECTION_NARRATIVE[key],
      body: SEED_SECTION_BODY[key],
      assumptionIds,
      componentIds,
      riskIds,
      evidenceGapIds,
    };
  });
}

function deriveRecommendedNextAction(
  status: ArchitectureDraftStatus,
  risks: ReadonlyArray<ArchitectureRisk>,
  evidenceGaps: ReadonlyArray<ArchitectureEvidenceGap>,
): string {
  const blockingRisks = risks.filter((r) => r.blocksApproval);
  const blockingGaps = evidenceGaps.filter((g) => g.impact === 'blocks_approval');
  const workshopGaps = evidenceGaps.filter((g) => g.impact === 'requires_workshop');

  if (status === 'blocked' || blockingRisks.length > 0 || blockingGaps.length > 0) {
    return 'Resolve approval-blocking risks and evidence gaps before promoting the draft beyond reviewed.';
  }
  if (status === 'requires_workshop' || workshopGaps.length > 0) {
    return 'Schedule the next workshop to close evidence gaps before promoting the draft to reviewed.';
  }
  if (status === 'approved') {
    return 'Architecture is approved; promote to rollout sequencing under the governance committee cadence.';
  }
  if (status === 'reviewed') {
    return 'Steward review complete; capture remaining named owners and proceed to approval gate.';
  }
  return 'Capture remaining inputs and progress the draft through the governance review cadence.';
}
