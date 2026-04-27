// Platform-wide Context Bundle contract.
//
// Source of truth for per-turn context across every AbarVa agent (Nexus,
// Sentinel, Atlas, Steward) and every surface (Programs, Source,
// Intelligence, Control Tower, Setup/Admin). Specified in
// docs/platform-design/02_CONTEXT_BUNDLE_STANDARD.md. Consumed by the
// scoring/classifier slice (S2) and the Nexus context adapter (S4).
//
// This module is declarative only. It does not retrieve, score, render,
// or call models. It defines the shapes other slices implement against.
//
// Relationship to src/lib/source/agent-context.ts: the Source bundle is
// surface-specific and predates this platform contract. Both coexist.
// Later slices may add bridge adapters.

// --- Canonical keys ----------------------------------------------------

/**
 * Five canonical Context Bundle states per doc 02 GPT addendum. Runtime
 * gate for agent behavior:
 * - complete: event/work-object-specific guidance permitted.
 * - usable_with_gaps: answer with caveats, list missing inputs.
 * - pattern_only: label answer as pattern guidance, not event-specific.
 * - insufficient: ask for missing context or offer guided choices.
 * - blocked: refuse the specific action and explain what is needed.
 */
export const CONTEXT_BUNDLE_STATES = [
  'complete',
  'usable_with_gaps',
  'pattern_only',
  'insufficient',
  'blocked',
] as const;

export type ContextBundleState = (typeof CONTEXT_BUNDLE_STATES)[number];

/**
 * Eight canonical category keys per doc 02. Each surface populates
 * whichever categories apply; missing categories are represented
 * structurally (present=false) rather than silently omitted.
 */
export const CONTEXT_BUNDLE_CATEGORY_KEYS = [
  'identity',
  'workObject',
  'workflowState',
  'businessContext',
  'artifacts',
  'patterns',
  'evidence',
  'conversation',
] as const;

export type ContextBundleCategoryKey =
  (typeof CONTEXT_BUNDLE_CATEGORY_KEYS)[number];

/**
 * Six canonical scoring dimensions per doc 02. Scoring implementation
 * lives in S2.
 */
export const CONTEXT_BUNDLE_SCORING_DIMENSIONS = [
  'context_completeness',
  'pattern_grounding',
  'evidence_coverage',
  'workflow_awareness',
  'actionability',
  'vanilla_response_risk',
] as const;

export type ContextBundleScoringDimension =
  (typeof CONTEXT_BUNDLE_SCORING_DIMENSIONS)[number];

// --- Identity / agent / surface ---------------------------------------

export type ContextBundleAgentKey = 'nexus' | 'sentinel' | 'atlas' | 'steward';

/**
 * Canonical surface keys. `unknown` covers boot/error paths and future
 * surfaces added before the canon updates.
 */
export type ContextBundleSurfaceKey =
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'tower'
  | 'admin'
  | 'unknown';

/**
 * Provenance of a populated category. Tracks where its data came from so
 * downstream UI can render "Context used" honestly and tests can assert
 * that claims trace to deterministic state rather than model inference.
 */
export type ContextBundleFieldProvenance =
  | 'deterministic'
  | 'retrieved'
  | 'userProvided'
  | 'modelInference'
  | 'unknown';

/**
 * Confidence qualifier applied to substantive claims. Mirrors the tiers
 * used in renderedResponse.ts so UI can render consistently.
 */
export type ContextBundleConfidenceTier = 'HIGH' | 'MEDIUM' | 'LOW';

// --- Category carrier --------------------------------------------------

/**
 * Generic wrapper for each of the eight canonical categories. Keeps the
 * top-level bundle shape uniform across surfaces while letting each
 * surface attach its own category payload under `data`.
 *
 * - `present: false` means the category is not populated. Downstream
 *   agents must treat the category as absent rather than imagining
 *   values. `missingFields` names specific fields that would be needed
 *   to move from absent to present.
 * - `provenance` declares how the data was sourced; defaults to
 *   'deterministic' when present, 'unknown' when absent.
 */
export interface ContextBundleCategory<TData = unknown> {
  key: ContextBundleCategoryKey;
  present: boolean;
  provenance: ContextBundleFieldProvenance;
  /** Populated only when present is true. */
  data?: TData;
  /** Named fields whose absence held this category back. */
  missingFields: string[];
  /** Freshness timestamp when the category was loaded. ISO-8601. */
  loadedAt?: string;
  /** True if the data is known to be stale; decided by the loader. */
  stale?: boolean;
}

// --- Reference shapes (cross-category) --------------------------------

/**
 * Evidence reference. Evidence may come from the registry, an uploaded
 * file, or a pattern section. Only references resolvable at retrieval
 * time should be recorded here.
 */
export interface ContextBundleEvidenceReference {
  id: string;
  label: string;
  kind:
    | 'registryEntry'
    | 'uploadedFile'
    | 'patternSection'
    | 'priorTurn'
    | 'externalReference';
  href?: string;
  confidence: ContextBundleConfidenceTier;
  provenance: ContextBundleFieldProvenance;
  /** Free-form excerpt or summary used by the agent. */
  excerpt?: string;
  /** Evidence capture or extraction timestamp, ISO-8601. */
  capturedAt?: string;
}

/** Pattern reference with tier, confidence, and match signal. */
export interface ContextBundlePatternReference {
  id: string;
  name: string;
  tier: 'meta' | 'craft' | 'capability' | 'useCase' | 'unknown';
  /** 0-100 relevance score from retrieval. */
  relevanceScore: number;
  /** Pattern authoring status per the pattern library canon. */
  authoringStatus:
    | 'AUTHORED-DRAFT'
    | 'AUTHORED-REVIEWED'
    | 'AUTHORED-EXPERT'
    | 'BATTLE-TESTED'
    | 'unknown';
  /** Pattern sections cited by the agent turn. */
  sectionsCited: string[];
  /** Contradictions with other applicable patterns, if detected. */
  contradictsPatternIds?: string[];
}

/** Artifact reference with tier and readiness. */
export interface ContextBundleArtifactReference {
  id: string;
  title: string;
  kind: string;
  /** Rich/Outline/Stub per doc 03 artifact tier rules. */
  tier: 'rich' | 'outline' | 'stub' | 'unknown';
  status: string;
  owner?: string;
  /** Inputs the artifact still needs to move toward its declared tier. */
  missingInputs: string[];
  evidenceIds: string[];
}

/** Conversation reference — prior turns the agent has access to. */
export interface ContextBundleConversationReference {
  conversationId: string;
  turnIndex: number;
  role: 'user' | 'agent' | 'system';
  /** The agent that produced the turn; only set when role === 'agent'. */
  agent?: ContextBundleAgentKey;
  summary: string;
  timestamp?: string;
}

// --- Missing inputs / allowed actions ---------------------------------

export interface ContextBundleMissingInput {
  id: string;
  label: string;
  /** The category whose population this input blocks. */
  category: ContextBundleCategoryKey;
  /** Whether the agent can attempt a downgraded answer without this. */
  blocking: boolean;
  owner?: string;
  requestedVia?: 'upload' | 'ask' | 'handoff' | 'external';
}

/**
 * Declarative action affordance. The bundle only declares which actions
 * are permitted for the current identity + workflow state; rendering and
 * wiring happen in surface-specific layers.
 */
export interface ContextBundleAllowedAction {
  id: string;
  label: string;
  kind:
    | 'navigate'
    | 'ask'
    | 'requestInput'
    | 'uploadEvidence'
    | 'reviewGate'
    | 'reviewScorecard'
    | 'openArtifact'
    | 'assignOwner'
    | 'handoff'
    | 'refuse'
    | 'none';
  allowed: boolean;
  /** Populated only when allowed is false. */
  blockedReason?: string;
  requiresGateCheck: boolean;
  requiresEvidenceCheck: boolean;
}

// --- Scoring and response gate ----------------------------------------

export interface ContextBundleQualityScore {
  context_completeness: number;
  pattern_grounding: number;
  evidence_coverage: number;
  workflow_awareness: number;
  actionability: number;
  vanilla_response_risk: number;
  /** Rolled-up qualifier; derived in S2 by the classifier. */
  overallConfidence: ContextBundleConfidenceTier;
  /** Human-readable reasons the scorer flagged context thinness. */
  notes: string[];
}

/**
 * Runtime gate a composer must honor before speaking. Computed from the
 * 5-state classification plus the quality score. This is the contract
 * that turns "we have a bundle" into "the agent is allowed to answer."
 */
export interface ContextBundleResponseGate {
  state: ContextBundleState;
  /** Whether the agent may produce any substantive response at all. */
  permitsResponse: boolean;
  /** Whether the agent must open with an honest-disclosure banner. */
  requiresDisclosure: boolean;
  /** Whether the agent must label the response as pattern-level. */
  requiresPatternLabeling: boolean;
  /** Whether the agent must refuse and explain the blocker. */
  requiresRefusal: boolean;
  /** Whether the agent should surface guided choices instead of prose. */
  requiresGuidedChoices: boolean;
  /** Machine-readable reason string for observability. */
  reason: string;
}

// --- Assembly input / result ------------------------------------------

/**
 * Inputs an assembler needs to build a bundle. Deliberately surface-
 * agnostic: concrete surface builders extend this with their own fields.
 */
export interface ContextBundleAssemblyInput {
  tenantId: string;
  tenantName?: string;
  userId: string;
  userRole?: string;
  route: string;
  surface: ContextBundleSurfaceKey;
  /** The agent that will speak next; informs what to emphasize. */
  assignedAgent?: ContextBundleAgentKey;
  /** Work object identifier when the surface has one. */
  workObjectId?: string;
  /** Work object kind when known. */
  workObjectKind?: string;
  /** The user's current prompt, if any. Not required for idle openings. */
  userPrompt?: string;
  /** Request timestamp, ISO-8601. Used for freshness calculations. */
  requestedAt?: string;
}

export interface ContextBundleAssemblyFailure {
  code:
    | 'missingTenant'
    | 'missingUser'
    | 'workObjectNotFound'
    | 'permissionDenied'
    | 'evidenceUnavailable'
    | 'unknown';
  message: string;
  recoverable: boolean;
  missingFields: string[];
}

export interface ContextBundleAssemblyResult {
  ok: boolean;
  bundle?: ContextBundle;
  failure?: ContextBundleAssemblyFailure;
}

// --- The bundle --------------------------------------------------------

/**
 * The platform-wide Context Bundle. One per agent turn. Assembled before
 * Claude is invoked; scored in S2; consumed by S4 (Nexus adapter) and
 * later by Sentinel/Atlas/Steward paths.
 *
 * The eight canonical categories are stored in a map keyed by
 * ContextBundleCategoryKey so every consumer can iterate the full set
 * uniformly. Typed accessors for specific categories live in helper
 * functions further down.
 */
export interface ContextBundle {
  /** Bundle identifier; stable for the lifetime of a single turn. */
  bundleId: string;

  /** The agent that will compose the response this bundle grounds. */
  assignedAgent?: ContextBundleAgentKey;

  /** Surface the bundle was assembled for. */
  surface: ContextBundleSurfaceKey;

  /** Route the turn originated from. */
  route: string;

  /** Tenant + user identity. Flat fields for callers that only need this. */
  tenantId: string;
  tenantName?: string;
  userId: string;
  userRole?: string;

  /** Work object identifier when the surface has one. */
  workObjectId?: string;
  workObjectKind?: string;

  /** Bundle assembly timestamp, ISO-8601. */
  assembledAt: string;

  /**
   * The eight canonical categories. Always contains all eight keys;
   * `present: false` is the explicit absence signal.
   */
  categories: Record<ContextBundleCategoryKey, ContextBundleCategory>;

  /** Known missing inputs across categories. */
  missingInputs: ContextBundleMissingInput[];

  /** Actions permitted by identity + workflow state at this moment. */
  allowedActions: ContextBundleAllowedAction[];

  /** References sourced into the Evidence category for fast lookup. */
  evidenceReferences: ContextBundleEvidenceReference[];

  /** References sourced into the Patterns category. */
  patternReferences: ContextBundlePatternReference[];

  /** References sourced into the Artifacts category. */
  artifactReferences: ContextBundleArtifactReference[];

  /** References sourced into the Conversation category. */
  conversationReferences: ContextBundleConversationReference[];

  /** Scoring output from S2. Null before the classifier has run. */
  qualityScore: ContextBundleQualityScore | null;

  /** Response gate derived from state + scoring. Null before S2. */
  responseGate: ContextBundleResponseGate | null;

  /** 5-state classification. Null before S2 has run. */
  state: ContextBundleState | null;
}

// --- Runtime helpers ---------------------------------------------------

export function isContextBundleState(value: unknown): value is ContextBundleState {
  return (
    typeof value === 'string'
    && (CONTEXT_BUNDLE_STATES as readonly string[]).includes(value)
  );
}

export function isContextBundleCategoryKey(
  value: unknown,
): value is ContextBundleCategoryKey {
  return (
    typeof value === 'string'
    && (CONTEXT_BUNDLE_CATEGORY_KEYS as readonly string[]).includes(value)
  );
}

export function isContextBundleScoringDimension(
  value: unknown,
): value is ContextBundleScoringDimension {
  return (
    typeof value === 'string'
    && (CONTEXT_BUNDLE_SCORING_DIMENSIONS as readonly string[]).includes(value)
  );
}

/**
 * Factory for a blank bundle. Every category is present=false; no scoring
 * has run; the response gate is null. Used by assemblers as the starting
 * point before populating categories.
 */
export function createEmptyContextBundle(
  input: ContextBundleAssemblyInput,
): ContextBundle {
  const assembledAt = input.requestedAt ?? new Date().toISOString();

  const categories = CONTEXT_BUNDLE_CATEGORY_KEYS.reduce((acc, key) => {
    acc[key] = {
      key,
      present: false,
      provenance: 'unknown',
      missingFields: [],
    };
    return acc;
  }, {} as Record<ContextBundleCategoryKey, ContextBundleCategory>);

  return {
    bundleId: makeBundleId(input, assembledAt),
    assignedAgent: input.assignedAgent,
    surface: input.surface,
    route: input.route,
    tenantId: input.tenantId,
    tenantName: input.tenantName,
    userId: input.userId,
    userRole: input.userRole,
    workObjectId: input.workObjectId,
    workObjectKind: input.workObjectKind,
    assembledAt,
    categories,
    missingInputs: [],
    allowedActions: [],
    evidenceReferences: [],
    patternReferences: [],
    artifactReferences: [],
    conversationReferences: [],
    qualityScore: null,
    responseGate: null,
    state: null,
  };
}

/**
 * Per-bundle summary for logs, observability, and founder review. Does
 * not expose raw category payloads; use the full bundle for that.
 */
export interface ContextBundleSummary {
  bundleId: string;
  surface: ContextBundleSurfaceKey;
  route: string;
  assignedAgent?: ContextBundleAgentKey;
  tenantId: string;
  workObjectId?: string;
  state: ContextBundleState | null;
  presentCategoryKeys: ContextBundleCategoryKey[];
  absentCategoryKeys: ContextBundleCategoryKey[];
  missingInputCount: number;
  allowedActionCount: number;
  evidenceCount: number;
  patternCount: number;
  artifactCount: number;
  overallConfidence: ContextBundleConfidenceTier | null;
}

export function summarizeContextBundle(bundle: ContextBundle): ContextBundleSummary {
  const present: ContextBundleCategoryKey[] = [];
  const absent: ContextBundleCategoryKey[] = [];
  for (const key of CONTEXT_BUNDLE_CATEGORY_KEYS) {
    if (bundle.categories[key].present) present.push(key);
    else absent.push(key);
  }
  return {
    bundleId: bundle.bundleId,
    surface: bundle.surface,
    route: bundle.route,
    assignedAgent: bundle.assignedAgent,
    tenantId: bundle.tenantId,
    workObjectId: bundle.workObjectId,
    state: bundle.state,
    presentCategoryKeys: present,
    absentCategoryKeys: absent,
    missingInputCount: bundle.missingInputs.length,
    allowedActionCount: bundle.allowedActions.length,
    evidenceCount: bundle.evidenceReferences.length,
    patternCount: bundle.patternReferences.length,
    artifactCount: bundle.artifactReferences.length,
    overallConfidence: bundle.qualityScore?.overallConfidence ?? null,
  };
}

// --- Internal helpers --------------------------------------------------

function makeBundleId(
  input: ContextBundleAssemblyInput,
  assembledAt: string,
): string {
  const route = input.route.replace(/[^a-z0-9]/gi, '-').replace(/^-+|-+$/g, '');
  const workObject = input.workObjectId ?? 'no-object';
  return `cb_${input.tenantId}_${route}_${workObject}_${assembledAt}`;
}

// ---------------------------------------------------------------------------
// AGENT1A — Foundation read-model
// ---------------------------------------------------------------------------
//
// AgentContextBundle (distinct from the platform ContextBundle above): the
// canonical context an agent sees when reasoning about a page.
//
// Pure read-model. No live data, no API calls, no model invocations.
// Deterministic. Built from existing seeds + read-models: blocker-detail-view,
// connectors-readiness-view, admin-shell-config, etc.
//
// Coexists with the platform ContextBundle contract above; the two have
// disjoint export names and are consumed by different surfaces.

import { getAllBlockerDetails } from '@/lib/admin/blocker-detail-view';

export type AgentSurface =
  | 'admin'
  | 'programs'
  | 'source'
  | 'intelligence'
  | 'tower'
  | 'home';

export type TenantTier = 'rich' | 'thin' | 'shell_only';

export type EvidenceStrength = 'strong' | 'partial' | 'thin';

export interface AgentContextBlocker {
  id: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  impactedComponent: string;
  pilotImpact: boolean;
  productionImpact: boolean;
}

export interface AgentContextDecision {
  id: string;
  label: string;
  owner: string;
}

export interface AgentContextSource {
  id: string;
  label: string;
  lastUpdated: string;
}

export interface AgentContextEvidence {
  strength: EvidenceStrength;
  sources: number;
  lastUpdated: string | null;
}

export interface AgentContextTenant {
  slug: string;
  name: string;
  tier: TenantTier;
}

export interface AgentContextBundle {
  tenant: AgentContextTenant;
  surface: AgentSurface;
  page: string;
  stage: string | null;
  evidence: AgentContextEvidence;
  blockers: ReadonlyArray<AgentContextBlocker>;
  pendingDecisions: ReadonlyArray<AgentContextDecision>;
  contextSources: ReadonlyArray<AgentContextSource>;
  deterministicSeed: true;
}

const TENANT_REGISTRY: Record<string, AgentContextTenant> = {
  'apex-retail': { slug: 'apex-retail', name: 'Apex Retail', tier: 'rich' },
  'meridian-health': {
    slug: 'meridian-health',
    name: 'Meridian Health System',
    tier: 'thin',
  },
  arcturus: { slug: 'arcturus', name: 'Arcturus', tier: 'shell_only' },
};

const PAGE_CONTEXT_SOURCES: Record<string, ReadonlyArray<AgentContextSource>> =
  {
    'admin/architecture': [
      { id: 'arch-docs', label: 'architecture docs', lastUpdated: '2026-04-26' },
      {
        id: 'azure-blueprint',
        label: 'Azure lab blueprint',
        lastUpdated: '2026-04-26',
      },
      {
        id: 'data-trust-model',
        label: 'data trust model',
        lastUpdated: '2026-04-26',
      },
    ],
    'admin/production-readiness': [
      {
        id: 'readiness-manifest',
        label: 'readiness manifest',
        lastUpdated: '2026-04-27',
      },
      { id: 'ci-vercel', label: 'CI/Vercel status', lastUpdated: '2026-04-27' },
      {
        id: 'wireframe-audit',
        label: 'wireframe audit',
        lastUpdated: '2026-04-27',
      },
    ],
    'admin/connectors': [
      {
        id: 'connector-readiness',
        label: 'connector readiness model',
        lastUpdated: '2026-04-27',
      },
      {
        id: 'admin-shell-config',
        label: 'admin shell config',
        lastUpdated: '2026-04-27',
      },
    ],
    'admin/data-trust': [
      {
        id: 'evidence-manifest',
        label: 'evidence manifest',
        lastUpdated: '2026-04-27',
      },
      {
        id: 'dataset-approval',
        label: 'dataset approval model',
        lastUpdated: '2026-04-27',
      },
      {
        id: 'no-raw-copy',
        label: 'no-raw-copy enforcement',
        lastUpdated: '2026-04-27',
      },
    ],
    'admin/users-access': [
      { id: 'role-matrix', label: 'role matrix', lastUpdated: '2026-04-27' },
      { id: 'access-policy', label: 'access policy', lastUpdated: '2026-04-27' },
    ],
    'admin/agent-readiness': [
      {
        id: 'agent-posture',
        label: 'agent posture model',
        lastUpdated: '2026-04-27',
      },
      {
        id: 'context-coverage',
        label: 'context coverage',
        lastUpdated: '2026-04-27',
      },
    ],
    'admin/build-progress': [
      { id: 'build-waves', label: 'build waves', lastUpdated: '2026-04-27' },
      {
        id: 'slice-registry',
        label: 'slice registry',
        lastUpdated: '2026-04-27',
      },
    ],
    'admin/overview': [
      {
        id: 'admin-shell-config',
        label: 'admin shell config',
        lastUpdated: '2026-04-27',
      },
      {
        id: 'readiness-manifest',
        label: 'readiness manifest',
        lastUpdated: '2026-04-27',
      },
    ],
  };

function resolveTenant(slug: string): AgentContextTenant {
  return TENANT_REGISTRY[slug] ?? { slug, name: slug, tier: 'shell_only' };
}

function resolveContextSources(
  surface: AgentSurface,
  page: string,
): ReadonlyArray<AgentContextSource> {
  return PAGE_CONTEXT_SOURCES[`${surface}/${page}`] ?? [];
}

function resolveEvidence(
  surface: AgentSurface,
  tier: TenantTier,
  sources: ReadonlyArray<AgentContextSource>,
): AgentContextEvidence {
  if (tier === 'shell_only') {
    return { strength: 'thin', sources: 0, lastUpdated: null };
  }
  if (sources.length === 0) {
    return { strength: 'thin', sources: 0, lastUpdated: null };
  }
  if (tier === 'thin') {
    return {
      strength: 'thin',
      sources: sources.length,
      lastUpdated: sources[0].lastUpdated,
    };
  }
  // rich tier
  if (sources.length >= 3) {
    return {
      strength: 'strong',
      sources: sources.length,
      lastUpdated: sources[0].lastUpdated,
    };
  }
  return {
    strength: 'partial',
    sources: sources.length,
    lastUpdated: sources[0].lastUpdated,
  };
}

export function buildAgentContext(
  tenantSlug: string,
  surface: AgentSurface,
  page: string,
): AgentContextBundle {
  const tenant = resolveTenant(tenantSlug);
  const contextSources = resolveContextSources(surface, page);
  const evidence = resolveEvidence(surface, tenant.tier, contextSources);
  const allBlockers =
    tenant.tier === 'rich' ? getAllBlockerDetails(tenantSlug) : [];
  const blockers: ReadonlyArray<AgentContextBlocker> = allBlockers.map((b) => ({
    id: b.id,
    severity: b.severity,
    title: b.title,
    impactedComponent: b.impactedComponent,
    pilotImpact: b.pilotImpact,
    productionImpact: b.productionImpact,
  }));
  return {
    tenant,
    surface,
    page,
    stage: null,
    evidence,
    blockers,
    pendingDecisions: [],
    contextSources,
    deterministicSeed: true,
  };
}
