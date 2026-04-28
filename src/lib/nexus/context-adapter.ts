// Nexus Context Bundle adapter. S4 slice.
//
// Maps Nexus's existing 6-phase pipeline state (OrchestratorInput +
// CompositionBundle + optional SessionContext + optional clarifying
// trigger) into the platform-wide ContextBundle from S1, scores it via
// S2, and returns the resulting bundle, score, response gate, and
// summary.
//
// This adapter is a pure function. No model calls. No network. No
// Date.now() reads. Same inputs produce identical outputs.
//
// Used by runPipeline() to attach Context Bundle metadata to its output
// after Phase 4 (assemble) so downstream readers can observe state and
// gating without changing prompt content or breaking the API surface.

import {
  CONTEXT_BUNDLE_CATEGORY_KEYS,
  createEmptyContextBundle,
  summarizeContextBundle,
  type ContextBundle,
  type ContextBundleAllowedAction,
  type ContextBundleAssemblyInput,
  type ContextBundleArtifactReference,
  type ContextBundleCategory,
  type ContextBundleConfidenceTier,
  type ContextBundleConversationReference,
  type ContextBundleEvidenceReference,
  type ContextBundleMissingInput,
  type ContextBundlePatternReference,
  type ContextBundleQualityScore,
  type ContextBundleResponseGate,
  type ContextBundleState,
  type ContextBundleSummary,
  type ContextBundleSurfaceKey,
} from '@/lib/agent/context-bundle';
import {
  classifyContextBundle,
  createResponseGate,
  scoreContextBundle,
} from '@/lib/agent/context-bundle-scoring';
import type { CompositionBundle } from './assembler';
import type { OrchestratorInput } from './orchestrator';
import type { SessionContext } from './sessionContext';

// --- Input / output shapes --------------------------------------------

export interface NexusContextAdapterInput {
  /** The orchestrator input that originated this turn. */
  pipelineInput: OrchestratorInput;
  /** Composition bundle produced by Phase 4 assembly, when available. */
  compositionBundle?: CompositionBundle | null;
  /** Loaded SessionContext, when available. */
  session?: SessionContext | null;
  /** True when the clarifying-trigger fast-path fired. */
  isClarifying?: boolean;
  /** Optional surface/route hints; default to 'unknown' / '/api/v1/nexus/query'. */
  surface?: ContextBundleSurfaceKey;
  route?: string;
  /** Stable timestamp; defaults to a fixed sentinel for deterministic tests. */
  requestedAt?: string;
}

export interface NexusContextAdapterResult {
  bundle: ContextBundle;
  qualityScore: ContextBundleQualityScore;
  responseGate: ContextBundleResponseGate;
  state: ContextBundleState;
  summary: ContextBundleSummary;
  warnings: string[];
}

const DEFAULT_REQUESTED_AT = '2026-04-24T00:00:00.000Z';
const DEFAULT_ROUTE = '/api/v1/nexus/query';
const DEFAULT_SURFACE: ContextBundleSurfaceKey = 'unknown';

// --- Public adapter ---------------------------------------------------

/**
 * Map Nexus pipeline state into a platform ContextBundle, score it, and
 * return the gated result. Pure — never mutates input objects.
 */
export function adaptToContextBundle(
  input: NexusContextAdapterInput,
): NexusContextAdapterResult {
  const assemblyInput = buildAssemblyInput(input);
  const bundle = createEmptyContextBundle(assemblyInput);

  const warnings: string[] = [];

  populateIdentity(bundle, input);
  populateWorkObject(bundle, input);
  populateWorkflowState(bundle, input);
  populateBusinessContext(bundle, input);
  populateArtifacts(bundle, input);
  populatePatterns(bundle, input);
  populateEvidence(bundle, input);
  populateConversation(bundle, input);

  attachMissingInputs(bundle, input);
  attachAllowedActions(bundle, input);

  // Score and classify before computing the gate so the bundle's
  // `state` and `qualityScore` fields reflect the runtime view.
  const state = classifyContextBundle(bundle);
  bundle.state = state;
  const qualityScore = scoreContextBundle(bundle);
  bundle.qualityScore = qualityScore;
  const responseGate = createResponseGate(bundle);
  bundle.responseGate = responseGate;

  if (input.isClarifying) {
    warnings.push('Clarifying fast-path fired; composition was skipped.');
  }
  if (!input.compositionBundle) {
    warnings.push('No composition bundle was supplied to the adapter.');
  }
  if (!input.session) {
    warnings.push('No session context was supplied to the adapter.');
  }

  const summary = summarizeContextBundle(bundle);

  return { bundle, qualityScore, responseGate, state, summary, warnings };
}

/**
 * Convenience: produce only the fields the orchestrator attaches to its
 * output. Same adapter call, narrower return.
 */
export function buildOrchestratorContextBundleFields(
  input: NexusContextAdapterInput,
): {
  contextBundle: ContextBundle;
  contextBundleSummary: ContextBundleSummary;
  contextBundleGate: ContextBundleResponseGate;
  contextBundleScore: ContextBundleQualityScore;
  contextBundleState: ContextBundleState;
} {
  const result = adaptToContextBundle(input);
  return {
    contextBundle: result.bundle,
    contextBundleSummary: result.summary,
    contextBundleGate: result.responseGate,
    contextBundleScore: result.qualityScore,
    contextBundleState: result.state,
  };
}

// --- Helpers: assembly input ------------------------------------------

function buildAssemblyInput(
  input: NexusContextAdapterInput,
): ContextBundleAssemblyInput {
  const tenancy = input.pipelineInput.tenancy;
  const session = input.session ?? undefined;
  const composition = input.compositionBundle ?? undefined;

  return {
    tenantId: tenancy.clientId,
    tenantName: session?.tenant.clientName ?? undefined,
    userId: tenancy.userId,
    userRole: session?.user.role ?? undefined,
    route: input.route ?? DEFAULT_ROUTE,
    surface: input.surface ?? DEFAULT_SURFACE,
    assignedAgent: 'nexus',
    workObjectId: deriveWorkObjectId(composition, session),
    workObjectKind: deriveWorkObjectKind(composition, session),
    userPrompt: input.pipelineInput.query,
    requestedAt: input.requestedAt ?? DEFAULT_REQUESTED_AT,
  };
}

function deriveWorkObjectId(
  composition: CompositionBundle | undefined,
  session: SessionContext | undefined,
): string | undefined {
  if (composition?.entities && composition.entities.length > 0) {
    return composition.entities[0];
  }
  const firstEngagement = session?.recentEngagements?.[0];
  return firstEngagement?.id;
}

function deriveWorkObjectKind(
  composition: CompositionBundle | undefined,
  session: SessionContext | undefined,
): string | undefined {
  if (composition?.entities && composition.entities.length > 0) {
    return 'nexusEntity';
  }
  if (session?.recentEngagements && session.recentEngagements.length > 0) {
    return 'engagement';
  }
  return undefined;
}

// --- Helpers: category population -------------------------------------

function setCategoryPresent(
  bundle: ContextBundle,
  key: keyof ContextBundle['categories'],
  data: unknown,
  missingFields: string[] = [],
): void {
  bundle.categories[key] = {
    ...bundle.categories[key],
    present: true,
    provenance: 'deterministic',
    data,
    missingFields,
  } satisfies ContextBundleCategory;
}

function populateIdentity(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const tenancy = input.pipelineInput.tenancy;
  if (!tenancy?.clientId || !tenancy?.userId) return;
  const session = input.session ?? undefined;
  const data = {
    clientId: tenancy.clientId,
    userId: tenancy.userId,
    userName: session?.user.name ?? null,
    userRole: session?.user.role ?? null,
    isVip: Boolean(session?.user.isVip),
    tenantClientName: session?.tenant.clientName ?? null,
    tenantIndustryCode: session?.tenant.industryCode ?? null,
    recentEngagementCount: session?.recentEngagements.length ?? 0,
  };
  const missingFields: string[] = [];
  if (!session?.user.name) missingFields.push('userName');
  if (!session?.user.role) missingFields.push('userRole');
  setCategoryPresent(bundle, 'identity', data, missingFields);
}

function populateWorkObject(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const composition = input.compositionBundle;
  const session = input.session;
  const entities = composition?.entities ?? [];

  if (entities.length === 0
    && (!session?.recentEngagements || session.recentEngagements.length === 0)) {
    return;
  }
  const data = {
    entities,
    mode: composition?.mode ?? null,
    query: input.pipelineInput.query,
    recentEngagements: session?.recentEngagements ?? [],
  };
  setCategoryPresent(bundle, 'workObject', data);
}

function populateWorkflowState(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const session = input.session;
  if (!session?.recentEngagements || session.recentEngagements.length === 0) {
    return;
  }
  const withPhase = session.recentEngagements.filter(
    (e) => e.currentPhase !== null || e.status !== null,
  );
  if (withPhase.length === 0) return;

  const missing: string[] = [];
  if (withPhase.every((e) => e.currentPhase === null)) missing.push('currentPhase');
  if (withPhase.every((e) => e.lastActivityAt === null)) missing.push('lastActivityAt');

  setCategoryPresent(
    bundle,
    'workflowState',
    {
      engagements: withPhase.map((e) => ({
        id: e.id,
        name: e.name,
        currentPhase: e.currentPhase,
        status: e.status,
        lastActivityAt: e.lastActivityAt,
      })),
    },
    missing,
  );
}

function populateBusinessContext(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const composition = input.compositionBundle;
  if (!composition) return;
  const valueSignals = composition.valueSignals ?? [];
  const valueHeadline = composition.valueHeadline;
  if (valueSignals.length === 0 && !valueHeadline) return;
  setCategoryPresent(bundle, 'businessContext', {
    valueHeadline: valueHeadline ?? null,
    valueSignalCount: valueSignals.length,
    valueSignals,
  });
}

function populateArtifacts(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const composition = input.compositionBundle;
  if (!composition) return;
  const decision = composition.decision;
  const contradictions = composition.contradictions ?? [];
  const branches = decision?.branches ?? [];

  if (branches.length === 0 && contradictions.length === 0) return;

  setCategoryPresent(bundle, 'artifacts', {
    decisionCrux: decision?.crux ?? null,
    decisionBranchCount: branches.length,
    contradictionCount: contradictions.length,
  });

  // Artifact references mirror decision branches when present.
  bundle.artifactReferences = branches.map<ContextBundleArtifactReference>(
    (branch, i) => ({
      id: `nexus-decision-branch-${i}`,
      title: branch.verdict,
      kind: 'DecisionBranch',
      tier: 'outline',
      status: 'draft',
      missingInputs: [],
      evidenceIds: [],
    }),
  );
}

function populatePatterns(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const composition = input.compositionBundle;
  if (!composition) return;
  const patternSources = (composition.sources ?? []).filter(
    (s) => s.type === 'pattern' || s.type === 'framework',
  );
  if (patternSources.length === 0) return;

  setCategoryPresent(bundle, 'patterns', {
    patternSourceCount: patternSources.length,
    patternIds: patternSources.map((s) => s.id),
  });

  bundle.patternReferences = patternSources.map<ContextBundlePatternReference>(
    (source) => ({
      id: source.id,
      name: source.name,
      tier: source.type === 'pattern' ? 'useCase' : 'craft',
      relevanceScore: confidenceToRelevance(source.confidence),
      authoringStatus: 'unknown',
      sectionsCited: [],
    }),
  );
}

function populateEvidence(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const composition = input.compositionBundle;
  if (!composition) return;
  const claims = composition.evidence ?? [];
  if (claims.length === 0) return;

  const refs = claims.slice(0, 10).map<ContextBundleEvidenceReference>((claim, i) => ({
    id: `${claim.source.id}-${i}`,
    label: claim.text.length > 80 ? `${claim.text.slice(0, 80)}…` : claim.text,
    kind: claim.source.type === 'pattern' ? 'patternSection' : 'registryEntry',
    confidence: nexusConfidenceToTier(claim.confidence),
    provenance: 'retrieved',
    capturedAt: claim.source.asOf ?? undefined,
  }));

  bundle.evidenceReferences = refs;

  setCategoryPresent(bundle, 'evidence', {
    claimCount: claims.length,
    sourceCount: composition.sources?.length ?? 0,
    contextTokenEstimate: composition.contextTokenEstimate,
  });
}

function populateConversation(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const priorTurns = input.pipelineInput.priorTurns ?? [];
  if (priorTurns.length === 0) return;

  const refs = priorTurns.slice(-5).map<ContextBundleConversationReference>((turn) => ({
    conversationId: turn.threadId,
    turnIndex: turn.index,
    role: turn.role === 'user' ? 'user' : 'agent',
    agent: turn.role === 'user' ? undefined : 'nexus',
    summary: deriveTurnSummary(turn),
    timestamp: turn.createdAt,
  }));

  bundle.conversationReferences = refs;

  setCategoryPresent(bundle, 'conversation', {
    turnCount: priorTurns.length,
    threadId: priorTurns[priorTurns.length - 1]?.threadId ?? null,
  });
}

function attachMissingInputs(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  const missing: ContextBundleMissingInput[] = [];

  for (const key of CONTEXT_BUNDLE_CATEGORY_KEYS) {
    const category = bundle.categories[key];
    if (category.present) continue;
    // Only signal expected categories as missing; conversation absence
    // is normal for a first turn and should not block.
    if (key === 'conversation') continue;
    missing.push({
      id: `missing-category-${key}`,
      label: `Category not populated: ${key}`,
      category: key,
      blocking: key === 'identity',
    });
  }

  if (input.isClarifying) {
    // Clarifying mode is an explicit "ask back" affordance; flag so the
    // gate can route to guided choices rather than substantive prose.
    missing.push({
      id: 'clarifying-trigger',
      label: 'Clarifying-trigger fired; awaiting user choice.',
      category: 'conversation',
      blocking: false,
      requestedVia: 'ask',
    });
  }

  bundle.missingInputs = missing;
}

function attachAllowedActions(
  bundle: ContextBundle,
  input: NexusContextAdapterInput,
): void {
  // Default minimal action surface for a Nexus turn. Surface-specific
  // adapters can extend this in later slices.
  const allowed: ContextBundleAllowedAction[] = [
    {
      id: 'nexus-ask-followup',
      label: 'Ask Nexus a follow-up',
      kind: 'ask',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    },
  ];
  if (bundle.evidenceReferences.length > 0) {
    allowed.push({
      id: 'nexus-open-evidence',
      label: 'Open underlying evidence',
      kind: 'openArtifact',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: true,
    });
  }
  if (bundle.patternReferences.length > 0) {
    allowed.push({
      id: 'nexus-open-pattern',
      label: 'Open pattern reference',
      kind: 'navigate',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    });
  }
  if (input.isClarifying) {
    allowed.push({
      id: 'nexus-answer-clarifying',
      label: 'Answer clarifying question',
      kind: 'requestInput',
      allowed: true,
      requiresGateCheck: false,
      requiresEvidenceCheck: false,
    });
  }
  bundle.allowedActions = allowed;
}

// --- Small mapping utilities ------------------------------------------

function confidenceToRelevance(
  confidence: 'high' | 'medium' | 'low' | undefined,
): number {
  switch (confidence) {
    case 'high':
      return 90;
    case 'medium':
      return 70;
    case 'low':
      return 50;
    default:
      return 60;
  }
}

function nexusConfidenceToTier(
  confidence: 'high' | 'medium' | 'low',
): ContextBundleConfidenceTier {
  if (confidence === 'high') return 'HIGH';
  if (confidence === 'medium') return 'MEDIUM';
  return 'LOW';
}

function deriveTurnSummary(turn: {
  payload: { hero?: string; answer?: string; framing?: string; question?: string };
}): string {
  const p = turn.payload;
  return p.answer ?? p.hero ?? p.framing ?? p.question ?? '';
}
