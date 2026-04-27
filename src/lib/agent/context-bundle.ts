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

// --- AGENT1B foundation: lightweight agent context for read-models ----
//
// The types and helpers below are the simplified, deterministic
// agent-context contract consumed by admin/programs/source/etc page
// read-models. They sit alongside the platform-wide ContextBundle and
// surface enough state for posture/editorial/choices generators.

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
  label: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface AgentContextDecision {
  id: string;
  label: string;
}

export interface AgentContextSource {
  id: string;
  label: string;
  lastUpdated: string;
}

/**
 * Lightweight per-page agent context. Deterministic; does not retrieve
 * live data. Generators (editorial / posture / choices) consume this.
 */
export interface AgentContextBundle {
  tenant: { slug: string; name: string; tier: TenantTier };
  surface: AgentSurface;
  page: string;
  stage: string | null;
  evidence: {
    strength: EvidenceStrength;
    sources: number;
    lastUpdated: string | null;
  };
  blockers: ReadonlyArray<AgentContextBlocker>;
  pendingDecisions: ReadonlyArray<AgentContextDecision>;
  contextSources: ReadonlyArray<AgentContextSource>;
  deterministicSeed: true;
}

interface AgentContextSeed {
  stage: string | null;
  evidence: AgentContextBundle['evidence'];
  blockers: ReadonlyArray<AgentContextBlocker>;
  pendingDecisions: ReadonlyArray<AgentContextDecision>;
  contextSources: ReadonlyArray<AgentContextSource>;
}

const APEX_TENANT = {
  slug: 'apex-retail',
  name: 'Apex Retail',
  tier: 'rich' as TenantTier,
};

const PLATFORM_TENANT = {
  slug: 'abarva-platform',
  name: 'AbarVa platform',
  tier: 'rich' as TenantTier,
};

const ADMIN_PAGE_SEEDS: Record<string, AgentContextSeed> = {
  architecture: {
    stage: 'documented',
    evidence: {
      strength: 'strong',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [
      {
        id: 'lab-not-deployed',
        label: 'lab not deployed',
        severity: 'high',
      },
    ],
    pendingDecisions: [
      { id: 'azure-private-plane', label: 'Azure private data-plane proof' },
    ],
    contextSources: [
      {
        id: 'architecture-docs',
        label: 'architecture docs',
        lastUpdated: '2026-04-20T00:00:00.000Z',
      },
      {
        id: 'azure-lab-blueprint',
        label: 'Azure lab blueprint',
        lastUpdated: '2026-04-20T00:00:00.000Z',
      },
      {
        id: 'data-trust-model',
        label: 'data trust model',
        lastUpdated: '2026-04-20T00:00:00.000Z',
      },
    ],
  },
  'production-readiness': {
    stage: 'demo-ready',
    evidence: {
      strength: 'partial',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [
      { id: 'production-controls', label: 'production controls', severity: 'critical' },
      { id: 'live-audit', label: 'live audit', severity: 'critical' },
      { id: 'model-gateway-execution', label: 'model gateway execution', severity: 'critical' },
      { id: 'tenant-security-review', label: 'tenant security review', severity: 'high' },
      { id: 'azure-private-plane-proof', label: 'Azure private data-plane proof', severity: 'high' },
    ],
    pendingDecisions: [
      { id: 'pilot-cutover', label: 'pilot cutover criteria' },
    ],
    contextSources: [
      { id: 'readiness-manifest', label: 'readiness manifest', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'ci-vercel-status', label: 'CI/Vercel status', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'wireframe-audit', label: 'wireframe audit', lastUpdated: '2026-04-20T00:00:00.000Z' },
    ],
  },
  overview: {
    stage: 'setup',
    evidence: {
      strength: 'partial',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [],
    pendingDecisions: [
      { id: 'pilot-readiness', label: 'pilot readiness assessment' },
    ],
    contextSources: [
      { id: 'admin-shell-config', label: 'admin shell config', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'readiness-manifest', label: 'readiness manifest', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'connector-readiness', label: 'connector readiness', lastUpdated: '2026-04-20T00:00:00.000Z' },
    ],
  },
  'data-trust': {
    stage: 'partial-trust',
    evidence: {
      strength: 'partial',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [
      {
        id: 'decision-grade-approvals',
        label: 'Decision-grade approvals pending',
        severity: 'high',
      },
    ],
    pendingDecisions: [
      { id: 'dataset-approvals', label: 'dataset approvals' },
    ],
    contextSources: [
      { id: 'evidence-manifest', label: 'evidence manifest', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'dataset-approval-model', label: 'dataset approval model', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'no-raw-copy-enforcement', label: 'no-raw-copy enforcement', lastUpdated: '2026-04-20T00:00:00.000Z' },
    ],
  },
  connectors: {
    stage: 'stub-only',
    evidence: {
      strength: 'thin',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [],
    pendingDecisions: [
      { id: 'connector-config', label: 'connector configuration' },
    ],
    contextSources: [
      { id: 'connector-readiness-model', label: 'connector readiness model', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'admin-shell-config', label: 'admin shell config', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'data-sharing-enforcement', label: 'data sharing enforcement', lastUpdated: '2026-04-20T00:00:00.000Z' },
    ],
  },
  'users-access': {
    stage: 'roles-seeded',
    evidence: {
      strength: 'partial',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [
      { id: 'no-sso', label: 'No SSO configured', severity: 'high' },
    ],
    pendingDecisions: [
      { id: 'sso-config', label: 'SSO configuration' },
    ],
    contextSources: [
      { id: 'users-access-readiness', label: 'users-access readiness', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'tenant-isolation-guard', label: 'tenant isolation guard', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'admin-shell-config', label: 'admin shell config', lastUpdated: '2026-04-20T00:00:00.000Z' },
    ],
  },
  'agent-readiness': {
    stage: 'inventory',
    evidence: {
      strength: 'partial',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [],
    pendingDecisions: [
      { id: 'agent-posture-review', label: 'agent posture review' },
    ],
    contextSources: [
      { id: 'agent-readiness-deep-drill', label: 'agent readiness deep drill', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'admin-shell-config', label: 'admin shell config', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'mission-queue-model', label: 'mission queue model', lastUpdated: '2026-04-20T00:00:00.000Z' },
    ],
  },
  'build-progress': {
    stage: 'in-flight',
    evidence: {
      strength: 'partial',
      sources: 3,
      lastUpdated: '2026-04-20T00:00:00.000Z',
    },
    blockers: [],
    pendingDecisions: [
      { id: 'wave-cutover', label: 'wave cutover order' },
    ],
    contextSources: [
      { id: 'build-manifest-snapshot', label: 'build manifest snapshot', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'wave-lifecycle-catalog', label: 'wave lifecycle catalog', lastUpdated: '2026-04-20T00:00:00.000Z' },
      { id: 'admin-shell-config', label: 'admin shell config', lastUpdated: '2026-04-20T00:00:00.000Z' },
    ],
  },
};

const PAGE_SEEDS: Record<AgentSurface, Record<string, AgentContextSeed>> = {
  admin: ADMIN_PAGE_SEEDS,
  programs: {},
  source: {},
  intelligence: {},
  tower: {},
  home: {},
};

const EMPTY_SEED: AgentContextSeed = {
  stage: null,
  evidence: { strength: 'thin', sources: 0, lastUpdated: null },
  blockers: [],
  pendingDecisions: [],
  contextSources: [],
};

function resolveTenant(tenantSlug: string, surface: AgentSurface, page: string) {
  // Build progress is platform-scoped (no per-tenant content).
  if (surface === 'admin' && page === 'build-progress') return PLATFORM_TENANT;
  if (tenantSlug === 'apex-retail') return APEX_TENANT;
  return {
    slug: tenantSlug,
    name: tenantSlug,
    tier: 'shell_only' as TenantTier,
  };
}

/**
 * Build a deterministic agent context for the given (tenant, surface,
 * page) triple. No live model calls, no live data retrieval.
 */
export function buildAgentContext(
  tenantSlug: string,
  surface: AgentSurface,
  page: string,
): AgentContextBundle {
  const tenant = resolveTenant(tenantSlug, surface, page);
  const seed = PAGE_SEEDS[surface]?.[page] ?? EMPTY_SEED;
  return {
    tenant,
    surface,
    page,
    stage: seed.stage,
    evidence: seed.evidence,
    blockers: seed.blockers,
    pendingDecisions: seed.pendingDecisions,
    contextSources: seed.contextSources,
    deterministicSeed: true,
  };
}

/**
 * Async variant of buildAgentContext that enriches with live DB data when
 * ADMIN_DATA_MODE=live. Falls back to the deterministic base in fixture mode
 * or on any DB error (safe degradation).
 *
 * DATA11: In live mode, pulls real blockers from admin_blockers and updates
 * the evidence strength if critical blockers are present.
 */
export async function buildAgentContextAsync(
  tenantSlug: string,
  surface: AgentSurface,
  page: string,
): Promise<AgentContextBundle> {
  const base = buildAgentContext(tenantSlug, surface, page);

  // isFixtureMode is resolved at call time via admin-data-mode
  const { isFixtureMode } = await import('@/lib/admin/data/admin-data-mode');
  if (isFixtureMode()) return base;

  // In live mode, enrich blockers and evidence from real DB
  try {
    const { getAdminBlockers } = await import('@/lib/admin/data/admin-blockers-adapter');
    const liveBlockers = await getAdminBlockers(tenantSlug);
    const pageBlockers = liveBlockers
      .filter((b) => b.status === 'open' || b.status === 'in_progress')
      .slice(0, 5)
      .map((b) => ({ id: b.id, label: b.title, severity: b.severity }));
    return {
      ...base,
      blockers: pageBlockers,
      evidence: {
        ...base.evidence,
        sources: liveBlockers.length > 0 ? base.evidence.sources : 0,
        strength: pageBlockers.some((b) => b.severity === 'critical') ? 'thin' : base.evidence.strength,
      },
    };
  } catch {
    return base; // safe fallback
  }
}
