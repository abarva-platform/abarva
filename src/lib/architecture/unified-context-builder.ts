// CTX2 - Unified Context Builder MVP.
//
// Pure deterministic projection layer that assembles a single
// "Unified Context Pack" for an agent turn. The pack is the canonical
// container an agent runtime would consult before composing a
// response: it names the work object, names what was retrieved, and
// names what is honestly missing. No model call. No live retrieval.
// No Date.now. No randomness.
//
// CTX2 is a builder, not a runtime. It does not stream, score, or
// invoke any agent. It reads from already-canonical, deterministic
// modules and projects them into the twelve-section pack shape the
// rest of the platform can converge on:
//
//   - src/lib/programs/programs-canonical-view (S9 read model)
//   - src/lib/intelligence/sentinel-pattern-detections (I1 read model)
//   - src/lib/solutions/solution-archetype-registry (SOL3 registry)
//
// CTX2 explicitly DOES NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/lib/auth/**, supabase/**
//   - src/lib/programs/mock.ts
//
// CTX2 may import the existing CTX1 declarative bundle contract from
// src/lib/agent/context-bundle for read-only type alignment with the
// platform Context Bundle Standard. No agent runtime is invoked.

import type { ContextBundleAgentKey } from '@/lib/agent/context-bundle';
import {
  buildAllProgramsSeedPlan,
  type ProgramSeedPlan,
  type TenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';
import {
  buildCanonicalHardGateStrip,
  buildCanonicalPhaseTimeline,
  buildProgramReadinessSummary,
  buildStewardReadinessNote,
  summarizeProgram,
  type CanonicalHardGateEntry,
  type CanonicalPhaseTimelineEntry,
  type ProgramReadinessSummary,
  type ProgramSummaryView,
  type StewardReadinessNote,
} from '@/lib/programs/programs-canonical-view';
import {
  buildSentinelPatternDetectionsForTenant,
  type SentinelPatternDetection,
  type SentinelPatternKey,
} from '@/lib/intelligence/sentinel-pattern-detections';
import {
  getSolutionArchetype,
  type SolutionArchetype,
} from '@/lib/solutions/solution-archetype-registry';

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type WorkObjectType =
  | 'program'
  | 'intelligence_pattern'
  | 'solution_archetype';

export interface UnifiedContextBuildRequest {
  tenantKey: string;
  workObject: { kind: WorkObjectType; id: string };
  conversationId?: string;
  intent?: string;
  governanceConstraints?: readonly UnifiedContextGovernanceConstraint[];
}

export type UnifiedContextQuality =
  | 'usable'
  | 'partial'
  | 'weak'
  | 'refused';

export interface UnifiedContextMissingInput {
  kind: string;
  impact:
    | 'blocks_response'
    | 'downgrades_quality'
    | 'missing_metadata';
  reason: string;
}

export interface UnifiedContextGovernanceConstraint {
  policy: string;
  rationale: string;
  severity: 'soft' | 'hard';
}

export interface UnifiedContextSourceBasis {
  retrievalSources: readonly string[];
  generatedAt: 'deterministic_seed';
  contextBuilderVersion: string;
}

export type UnifiedContextSectionKey =
  | 'identity'
  | 'work_object'
  | 'workflow_state'
  | 'business_context'
  | 'artifacts'
  | 'patterns'
  | 'evidence'
  | 'conversation'
  | 'datasets'
  | 'solution_archetypes'
  | 'governance_constraints'
  | 'audit_basis';

export interface UnifiedContextSection {
  key: UnifiedContextSectionKey;
  body: unknown;
  sourceLabel: string;
  hasContent: boolean;
  notes?: string;
}

export interface UnifiedContextPack {
  identity: {
    tenantKey: string;
    userKey?: string;
    roleScope?: string;
  };
  workObject: {
    kind: WorkObjectType;
    id: string;
    resolved: boolean;
    resolutionNote?: string;
  };
  sections: readonly UnifiedContextSection[];
  basis: UnifiedContextSourceBasis;
  createdFrom: 'deterministic_seed';
}

export interface UnifiedContextBuildResult {
  pack: UnifiedContextPack;
  quality: UnifiedContextQuality;
  missingInputs: readonly UnifiedContextMissingInput[];
  refused?: {
    reason: string;
    missingHardInputs: readonly string[];
  };
}

/** Canonical section order. The pack ALWAYS contains all twelve. */
export const UNIFIED_CONTEXT_PACK_SECTIONS: ReadonlyArray<UnifiedContextSectionKey> = [
  'identity',
  'work_object',
  'workflow_state',
  'business_context',
  'artifacts',
  'patterns',
  'evidence',
  'conversation',
  'datasets',
  'solution_archetypes',
  'governance_constraints',
  'audit_basis',
] as const;

const CONTEXT_BUILDER_VERSION = 'ctx2.v1';

// ---------------------------------------------------------------------
// Section bodies (typed, deterministic)
// ---------------------------------------------------------------------

interface ProgramWorkflowStateBody {
  currentCanonicalPhase: ProgramSummaryView['currentCanonicalPhase'];
  currentPhaseSpec: ProgramSummaryView['currentPhaseSpec'];
  status: ProgramSummaryView['status'];
  phaseTimeline: ReadonlyArray<CanonicalPhaseTimelineEntry>;
  hardGates: ReadonlyArray<CanonicalHardGateEntry>;
  stewardReadiness: StewardReadinessNote;
}

interface ProgramBusinessContextBody {
  programCode: string;
  programName: string;
  archetypeCode: ProgramSummaryView['archetypeCode'];
  appArchetype: ProgramSummaryView['appArchetype'];
  roleInDemo: string;
  routePath: string;
  patternSlug: string | null;
  tenantDisplayName: string;
}

interface ProgramArtifactsBody {
  deliverableTiers: ProgramSummaryView['deliverableTiers'];
  readiness: ProgramReadinessSummary;
}

interface PatternsSectionBody {
  patternKey?: SentinelPatternKey;
  detections: ReadonlyArray<SentinelPatternDetection>;
}

interface SolutionArchetypeSectionBody {
  archetype: SolutionArchetype | null;
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the unified context pack for an agent turn. Pure: same
 * request input → identical output (byte-equal across calls).
 */
export function buildUnifiedContextPack(
  request: UnifiedContextBuildRequest,
): UnifiedContextBuildResult {
  const missingInputs: UnifiedContextMissingInput[] = [];
  const tenantKey = (request.tenantKey ?? '').trim();
  const tenant = tenantKey.length > 0 ? findTenantByKey(tenantKey) : null;

  if (tenantKey.length === 0) {
    missingInputs.push({
      kind: 'tenant_key',
      impact: 'blocks_response',
      reason: 'Request did not name a tenant; pack cannot be scoped.',
    });
  } else if (!tenant) {
    missingInputs.push({
      kind: 'tenant_seed',
      impact: 'blocks_response',
      reason: `Tenant '${tenantKey}' is not present in the canonical seed.`,
    });
  }

  const resolved = resolveWorkObject(request.workObject, tenant);

  if (!resolved.resolved) {
    missingInputs.push({
      kind: 'work_object',
      impact: 'blocks_response',
      reason:
        resolved.resolutionNote
        ?? `Work object ${request.workObject.kind}:${request.workObject.id} could not be resolved.`,
    });
  }

  const retrievalSources: string[] = [];

  const identitySection = buildIdentitySection(tenantKey, tenant);
  const workObjectSection = buildWorkObjectSection(request.workObject, resolved);

  const workflowStateSection = buildWorkflowStateSection(resolved);
  if (resolved.kind === 'program' && resolved.program) {
    retrievalSources.push('programs_canonical_view');
  }

  const businessContextSection = buildBusinessContextSection(resolved, tenant);
  const artifactsSection = buildArtifactsSection(resolved);

  const patternsSection = buildPatternsSection(request.workObject, resolved, tenant);
  if (
    resolved.kind === 'intelligence_pattern'
    || (tenant !== null && (workObjectIsProgramAndHasPatterns(resolved) || true))
  ) {
    if (patternsSection.hasContent) {
      retrievalSources.push('sentinel_pattern_detections');
    }
  }

  const evidenceSection = buildEvidenceSection();
  const conversationSection = buildConversationSection();
  const datasetsSection = buildDatasetsSection();

  const solutionArchetypeSection = buildSolutionArchetypeSection(
    request.workObject,
    resolved,
  );
  if (
    resolved.kind === 'solution_archetype'
    && resolved.archetype !== null
  ) {
    retrievalSources.push('solution_archetype_registry');
  }

  const governanceConstraintsSection = buildGovernanceConstraintsSection(
    request.governanceConstraints ?? [],
  );

  const sectionsSoFar: UnifiedContextSection[] = [
    identitySection,
    workObjectSection,
    workflowStateSection,
    businessContextSection,
    artifactsSection,
    patternsSection,
    evidenceSection,
    conversationSection,
    datasetsSection,
    solutionArchetypeSection,
    governanceConstraintsSection,
  ];

  const auditBasisSection = buildAuditBasisSection(retrievalSources);
  const sections: UnifiedContextSection[] = [
    ...sectionsSoFar,
    auditBasisSection,
  ];

  // Honest missing-input bookkeeping for the always-empty sections.
  if (!evidenceSection.hasContent) {
    missingInputs.push({
      kind: 'evidence_ledger',
      impact: 'downgrades_quality',
      reason:
        'Evidence ledger is not yet wired; pack has no per-deliverable citations.',
    });
  }
  if (!conversationSection.hasContent) {
    missingInputs.push({
      kind: 'conversation_history',
      impact: 'missing_metadata',
      reason:
        'Conversation memory is not yet wired; pack has no prior turns.',
    });
  }

  const pack: UnifiedContextPack = {
    identity: {
      tenantKey,
      userKey: undefined,
      roleScope: undefined,
    },
    workObject: {
      kind: request.workObject.kind,
      id: request.workObject.id,
      resolved: resolved.resolved,
      resolutionNote: resolved.resolutionNote,
    },
    sections,
    basis: {
      retrievalSources: dedupeAndSort(retrievalSources),
      generatedAt: 'deterministic_seed',
      contextBuilderVersion: CONTEXT_BUILDER_VERSION,
    },
    createdFrom: 'deterministic_seed',
  };

  const interim: UnifiedContextBuildResult = {
    pack,
    quality: 'weak',
    missingInputs,
  };

  const quality = computeUnifiedContextQuality({ ...interim, quality: 'weak' }, request);

  if (quality === 'refused') {
    return {
      pack,
      quality,
      missingInputs,
      refused: {
        reason: composeRefusalReason(request, resolved),
        missingHardInputs: missingInputs
          .filter((m) => m.impact === 'blocks_response')
          .map((m) => m.kind),
      },
    };
  }

  return {
    pack,
    quality,
    missingInputs,
  };
}

/**
 * Aggregate counters for the unified pack. Pure.
 */
export function summarizeUnifiedContextPack(pack: UnifiedContextPack): {
  totalSections: number;
  sectionsWithContent: number;
  missingInputCount: number;
  quality: UnifiedContextQuality;
} {
  const totalSections = pack.sections.length;
  const sectionsWithContent = pack.sections.filter((s) => s.hasContent).length;
  return {
    totalSections,
    sectionsWithContent,
    missingInputCount: 0,
    quality: deriveSummaryQualityFromCounts(sectionsWithContent, 0, false),
  };
}

/**
 * Compute quality. Public so callers can re-derive after layering
 * additional inputs into the result. The intent argument is honored
 * via the original request when called from buildUnifiedContextPack;
 * external callers can pass an updated result for re-derivation.
 */
export function computeUnifiedContextQuality(
  result: UnifiedContextBuildResult,
  request?: UnifiedContextBuildRequest,
): UnifiedContextQuality {
  const sectionsWithContent = result.pack.sections.filter((s) => s.hasContent).length;
  const blockingInputs = result.missingInputs.filter(
    (m) => m.impact === 'blocks_response',
  );
  const isHighStakesIntent = request ? intentIsHighStakes(request.intent) : false;

  return deriveSummaryQualityFromCounts(
    sectionsWithContent,
    blockingInputs.length,
    isHighStakesIntent && !result.pack.workObject.resolved,
  );
}

// ---------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------

function deriveSummaryQualityFromCounts(
  sectionsWithContent: number,
  blockingInputCount: number,
  refuseDueToHighStakes: boolean,
): UnifiedContextQuality {
  if (refuseDueToHighStakes) return 'refused';
  if (sectionsWithContent < 3) return 'weak';
  if (sectionsWithContent <= 5) return 'partial';
  if (blockingInputCount > 0) return 'partial';
  return 'usable';
}

function intentIsHighStakes(intent: string | undefined): boolean {
  if (!intent) return false;
  const lower = intent.toLowerCase();
  return (
    lower.includes('approve')
    || lower.includes('execute')
    || lower.includes('deliver')
  );
}

interface ResolvedWorkObject {
  kind: WorkObjectType;
  resolved: boolean;
  resolutionNote?: string;
  program?: ProgramSeedPlan;
  programSummary?: ProgramSummaryView;
  patternKey?: SentinelPatternKey;
  archetype?: SolutionArchetype | null;
}

function resolveWorkObject(
  workObject: { kind: WorkObjectType; id: string },
  tenant: TenantSeedPlan | null,
): ResolvedWorkObject {
  if (workObject.kind === 'program') {
    if (!tenant) {
      return {
        kind: 'program',
        resolved: false,
        resolutionNote:
          'Program work object requires a resolvable tenant; tenant not found in seed.',
      };
    }
    const program = findProgramInTenant(tenant, workObject.id);
    if (!program) {
      return {
        kind: 'program',
        resolved: false,
        resolutionNote: `Program '${workObject.id}' is not in tenant '${tenant.tenantKey}'.`,
      };
    }
    return {
      kind: 'program',
      resolved: true,
      program,
      programSummary: summarizeProgram(program),
    };
  }

  if (workObject.kind === 'intelligence_pattern') {
    const known = isKnownPatternKey(workObject.id);
    if (!known) {
      return {
        kind: 'intelligence_pattern',
        resolved: false,
        resolutionNote: `Pattern key '${workObject.id}' is not a known Sentinel pattern.`,
      };
    }
    return {
      kind: 'intelligence_pattern',
      resolved: true,
      patternKey: workObject.id as SentinelPatternKey,
    };
  }

  // solution_archetype
  const archetype = getSolutionArchetype(workObject.id);
  if (!archetype) {
    return {
      kind: 'solution_archetype',
      resolved: false,
      resolutionNote: `Solution archetype '${workObject.id}' is not in the canonical SOL3 registry.`,
      archetype: null,
    };
  }
  return {
    kind: 'solution_archetype',
    resolved: true,
    archetype,
  };
}

function findTenantByKey(tenantKey: string): TenantSeedPlan | null {
  const plan = buildAllProgramsSeedPlan();
  return plan.tenants.find((t) => t.tenantKey === tenantKey) ?? null;
}

function findProgramInTenant(
  tenant: TenantSeedPlan,
  id: string,
): ProgramSeedPlan | undefined {
  return tenant.programs.find(
    (p) =>
      p.programSlug === id
      || p.code === id
      || p.graphNodeId === id,
  );
}

function isKnownPatternKey(id: string): boolean {
  const known: ReadonlyArray<SentinelPatternKey> = [
    'value_ledger_incompleteness',
    'evidence_chain_gap',
    'gate_governance_gap',
    'program_context_sparsity',
    'ai_governance_operating_model_gap',
  ];
  return (known as ReadonlyArray<string>).includes(id);
}

// --- Section builders ------------------------------------------------

function buildIdentitySection(
  tenantKey: string,
  tenant: TenantSeedPlan | null,
): UnifiedContextSection {
  const body = {
    tenantKey,
    tenantDisplayName: tenant?.displayName ?? null,
    tenantRouteSlug: tenant?.routeSlug ?? null,
    agentScope: null as ContextBundleAgentKey | null,
  };
  return {
    key: 'identity',
    body,
    sourceLabel: 'request_input + programs_canonical_view',
    hasContent: tenantKey.length > 0,
  };
}

function buildWorkObjectSection(
  workObject: { kind: WorkObjectType; id: string },
  resolved: ResolvedWorkObject,
): UnifiedContextSection {
  return {
    key: 'work_object',
    body: {
      kind: workObject.kind,
      id: workObject.id,
      resolved: resolved.resolved,
      resolutionNote: resolved.resolutionNote ?? null,
    },
    sourceLabel: 'request_input',
    hasContent: workObject.id.length > 0,
  };
}

function buildWorkflowStateSection(
  resolved: ResolvedWorkObject,
): UnifiedContextSection {
  if (resolved.kind !== 'program' || !resolved.program || !resolved.programSummary) {
    return {
      key: 'workflow_state',
      body: { phaseTimeline: [], hardGates: [] },
      sourceLabel: 'programs_canonical_view',
      hasContent: false,
      notes: 'Workflow state is populated for program work objects only.',
    };
  }
  const program = resolved.program;
  const body: ProgramWorkflowStateBody = {
    currentCanonicalPhase: resolved.programSummary.currentCanonicalPhase,
    currentPhaseSpec: resolved.programSummary.currentPhaseSpec,
    status: resolved.programSummary.status,
    phaseTimeline: buildCanonicalPhaseTimeline(program),
    hardGates: buildCanonicalHardGateStrip(program),
    stewardReadiness: buildStewardReadinessNote(program),
  };
  return {
    key: 'workflow_state',
    body,
    sourceLabel: 'programs_canonical_view (S9)',
    hasContent: true,
  };
}

function buildBusinessContextSection(
  resolved: ResolvedWorkObject,
  tenant: TenantSeedPlan | null,
): UnifiedContextSection {
  if (resolved.kind !== 'program' || !resolved.program || !tenant) {
    return {
      key: 'business_context',
      body: {},
      sourceLabel: 'programs_canonical_view',
      hasContent: false,
      notes:
        'Business context is populated for program work objects with a resolved tenant.',
    };
  }
  const summary = resolved.programSummary!;
  const body: ProgramBusinessContextBody = {
    programCode: summary.code,
    programName: summary.name,
    archetypeCode: summary.archetypeCode,
    appArchetype: summary.appArchetype,
    roleInDemo: summary.roleInDemo,
    routePath: summary.routePath,
    patternSlug: summary.patternSlug,
    tenantDisplayName: tenant.displayName,
  };
  return {
    key: 'business_context',
    body,
    sourceLabel: 'programs_canonical_view (S9)',
    hasContent: true,
  };
}

function buildArtifactsSection(
  resolved: ResolvedWorkObject,
): UnifiedContextSection {
  if (resolved.kind !== 'program' || !resolved.program) {
    return {
      key: 'artifacts',
      body: { deliverableTiers: { rich: 0, outline: 0, stub: 0, total: 0 } },
      sourceLabel: 'programs_canonical_view',
      hasContent: false,
      notes:
        'Artifact inventory is populated for program work objects only.',
    };
  }
  const program = resolved.program;
  const body: ProgramArtifactsBody = {
    deliverableTiers: resolved.programSummary!.deliverableTiers,
    readiness: buildProgramReadinessSummary(program),
  };
  return {
    key: 'artifacts',
    body,
    sourceLabel: 'programs_canonical_view (S9d readiness)',
    hasContent: program.deliverables.length > 0,
  };
}

function buildPatternsSection(
  workObject: { kind: WorkObjectType; id: string },
  resolved: ResolvedWorkObject,
  tenant: TenantSeedPlan | null,
): UnifiedContextSection {
  if (workObject.kind === 'intelligence_pattern') {
    if (!tenant || !resolved.resolved || !resolved.patternKey) {
      return {
        key: 'patterns',
        body: { detections: [] },
        sourceLabel: 'sentinel_pattern_detections',
        hasContent: false,
        notes:
          'Pattern section requires a resolvable tenant and a known Sentinel pattern key.',
      };
    }
    const all = buildSentinelPatternDetectionsForTenant(tenant);
    const matched = all.filter((d) => d.patternKey === resolved.patternKey);
    const body: PatternsSectionBody = {
      patternKey: resolved.patternKey,
      detections: matched,
    };
    return {
      key: 'patterns',
      body,
      sourceLabel: 'sentinel_pattern_detections (I1)',
      hasContent: matched.length > 0,
    };
  }

  // For programs, we surface tenant-wide detections that touch this
  // program. Solution archetypes carry no pattern detection feed in
  // this MVP.
  if (workObject.kind === 'program' && resolved.program && tenant) {
    const all = buildSentinelPatternDetectionsForTenant(tenant);
    const programCode = resolved.program.code;
    const matched = all.filter((d) =>
      d.affectedPrograms.some((ap) => ap.programCode === programCode),
    );
    const body: PatternsSectionBody = {
      detections: matched,
    };
    return {
      key: 'patterns',
      body,
      sourceLabel: 'sentinel_pattern_detections (I1)',
      hasContent: matched.length > 0,
    };
  }

  return {
    key: 'patterns',
    body: { detections: [] },
    sourceLabel: 'sentinel_pattern_detections',
    hasContent: false,
    notes:
      'Pattern detections are populated for program and pattern work objects only.',
  };
}

function workObjectIsProgramAndHasPatterns(
  resolved: ResolvedWorkObject,
): boolean {
  return resolved.kind === 'program' && resolved.resolved;
}

function buildEvidenceSection(): UnifiedContextSection {
  return {
    key: 'evidence',
    body: { items: [] as ReadonlyArray<unknown> },
    sourceLabel: 'evid2_evidence_ledger',
    hasContent: false,
    notes: 'EVID2 ledger not yet wired',
  };
}

function buildConversationSection(): UnifiedContextSection {
  return {
    key: 'conversation',
    body: { messages: [] as ReadonlyArray<unknown> },
    sourceLabel: 'conversation_memory',
    hasContent: false,
    notes: 'Conversation memory not yet wired',
  };
}

function buildDatasetsSection(): UnifiedContextSection {
  return {
    key: 'datasets',
    body: { summaries: [] as ReadonlyArray<unknown> },
    sourceLabel: 'adm3_dataset_inventory',
    hasContent: false,
    notes: 'ADM3 dataset inventory not imported in CTX2 v1 to keep MVP scoped',
  };
}

function buildSolutionArchetypeSection(
  workObject: { kind: WorkObjectType; id: string },
  resolved: ResolvedWorkObject,
): UnifiedContextSection {
  if (workObject.kind !== 'solution_archetype') {
    return {
      key: 'solution_archetypes',
      body: { archetype: null } as SolutionArchetypeSectionBody,
      sourceLabel: 'solution_archetype_registry',
      hasContent: false,
      notes:
        'Solution archetype context is populated for solution_archetype work objects only.',
    };
  }
  const archetype = resolved.archetype ?? null;
  const body: SolutionArchetypeSectionBody = { archetype };
  return {
    key: 'solution_archetypes',
    body,
    sourceLabel: 'solution_archetype_registry (SOL3)',
    hasContent: archetype !== null,
  };
}

function buildGovernanceConstraintsSection(
  fromRequest: ReadonlyArray<UnifiedContextGovernanceConstraint>,
): UnifiedContextSection {
  const defaults: ReadonlyArray<UnifiedContextGovernanceConstraint> = [
    {
      policy: 'no_fabricated_evidence_citations',
      rationale:
        'Evidence ledger is not wired; agents must not invent E-### citations.',
      severity: 'hard',
    },
    {
      policy: 'no_fabricated_dollar_value',
      rationale:
        'Projected value is not in the seed; agents must not invent dollar amounts.',
      severity: 'hard',
    },
    {
      policy: 'honest_missing_input_disclosure',
      rationale:
        'Missing inputs must be surfaced explicitly, not silently omitted.',
      severity: 'soft',
    },
  ];
  const merged = mergeGovernanceConstraints(defaults, fromRequest);
  return {
    key: 'governance_constraints',
    body: { constraints: merged },
    sourceLabel: 'request_input + ctx2_defaults',
    hasContent: merged.length > 0,
  };
}

function mergeGovernanceConstraints(
  a: ReadonlyArray<UnifiedContextGovernanceConstraint>,
  b: ReadonlyArray<UnifiedContextGovernanceConstraint>,
): ReadonlyArray<UnifiedContextGovernanceConstraint> {
  const out: UnifiedContextGovernanceConstraint[] = [...a];
  for (const c of b) {
    if (!out.some((existing) => existing.policy === c.policy)) {
      out.push(c);
    }
  }
  // Stable sort by policy for byte-equal determinism.
  return [...out].sort((x, y) => x.policy.localeCompare(y.policy));
}

function buildAuditBasisSection(
  retrievalSources: ReadonlyArray<string>,
): UnifiedContextSection {
  const body: UnifiedContextSourceBasis = {
    retrievalSources: dedupeAndSort(retrievalSources),
    generatedAt: 'deterministic_seed',
    contextBuilderVersion: CONTEXT_BUILDER_VERSION,
  };
  return {
    key: 'audit_basis',
    body,
    sourceLabel: 'ctx2_unified_context_builder',
    hasContent: true,
  };
}

function dedupeAndSort(sources: ReadonlyArray<string>): ReadonlyArray<string> {
  return Array.from(new Set(sources)).sort();
}

function composeRefusalReason(
  request: UnifiedContextBuildRequest,
  resolved: ResolvedWorkObject,
): string {
  const intent = (request.intent ?? '').trim();
  if (!resolved.resolved) {
    return `High-stakes intent '${intent}' refused: work object ${request.workObject.kind}:${request.workObject.id} could not be resolved from canonical sources.`;
  }
  return `High-stakes intent '${intent}' refused: pack does not meet the resolution bar.`;
}
