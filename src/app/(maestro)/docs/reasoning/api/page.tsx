// /docs/reasoning/api — API reference for the AbarVa reasoning layer.
//
// Per-export listing of every public symbol from `@/lib/reasoning`.
// Each entry shows its TypeScript signature (copied verbatim from
// the source files) and a one-line description.
//
// Anchor links per entry let other docs cross-link to specific
// symbols (e.g. /docs/reasoning/api#buildSourceSynthesisContext).

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';

export const metadata = {
  title: 'Reasoning API reference · AbarVa Docs',
};

const COLUMN_MAX_WIDTH = '760px';

const SECTION_STYLE: CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.lg,
  padding: SPACING.xl,
  maxWidth: COLUMN_MAX_WIDTH,
  width: '100%',
};

const H2_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 26,
  fontWeight: 600,
  color: COLORS.ink,
  margin: 0,
  letterSpacing: '-0.01em',
  lineHeight: 1.2,
};

const H3_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.navy,
  margin: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const PROSE_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 15,
  lineHeight: 1.65,
  color: `${COLORS.ink}cc`,
  margin: 0,
};

const LINK_STYLE: CSSProperties = {
  color: COLORS.navy,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

const MONO_INLINE_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12.5,
  color: COLORS.ink,
  background: COLORS.cream,
  padding: '1px 6px',
  borderRadius: RADIUS.sm,
  border: `1px solid ${COLORS.ink}10`,
};

const SIGNATURE_PRE_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12.5,
  color: COLORS.ink,
  background: COLORS.cream,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.md,
  padding: SPACING.md,
  margin: 0,
  lineHeight: 1.55,
  whiteSpace: 'pre',
  overflowX: 'auto',
};

const ENTRY_NAME_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 14,
  fontWeight: 600,
  color: COLORS.ink,
  margin: 0,
  letterSpacing: '-0.005em',
};

const ENTRY_DESC_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13.5,
  lineHeight: 1.6,
  color: `${COLORS.ink}aa`,
  margin: 0,
};

const TOC_LIST_STYLE: CSSProperties = {
  margin: 0,
  paddingLeft: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: '6px',
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13.5,
  lineHeight: 1.5,
  color: `${COLORS.ink}cc`,
};

function Section({
  eyebrow,
  title,
  children,
  id,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section style={SECTION_STYLE} {...(id ? { id } : {})}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        <h3 style={H3_STYLE}>{eyebrow}</h3>
        <h2 style={H2_STYLE}>{title}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
          {children}
        </div>
      </div>
    </section>
  );
}

function InlineCode({ children }: { children: ReactNode }) {
  return <code style={MONO_INLINE_STYLE}>{children}</code>;
}

interface ApiEntry {
  /** The symbol name — also used as the anchor id. */
  name: string;
  /** TypeScript signature, copied verbatim from the source. */
  signature: string;
  /** One-line description. */
  description: string;
}

function ApiEntryBlock({ entry }: { entry: ApiEntry }) {
  return (
    <div
      id={entry.name}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        scrollMarginTop: '24px',
      }}
    >
      <h4 style={ENTRY_NAME_STYLE}>{entry.name}</h4>
      <pre style={SIGNATURE_PRE_STYLE}>{entry.signature}</pre>
      <p style={ENTRY_DESC_STYLE}>{entry.description}</p>
    </div>
  );
}

// ─── Catalog ──────────────────────────────────────────────────────────────────

const TYPES_AND_INTERFACES: ReadonlyArray<ApiEntry> = [
  {
    name: 'PatternRef',
    signature: `interface PatternRef {
  patternId: string;
  patternVersion: string;
  section: string;
}`,
    description:
      'Pointer back to a specific section of a pattern that authored a criterion, template, or expectation. Used for citation and audit trails.',
  },
  {
    name: 'EvidencePointer',
    signature: `interface EvidencePointer {
  field: string;
  value: string;
  timestamp?: number;
}`,
    description:
      'Pointer to a concrete piece of evidence inside an instance object — field path, observed value, optional timestamp.',
  },
  {
    name: 'GateStatus',
    signature: `type GateStatus = 'met' | 'unmet' | 'partial' | 'waived';`,
    description:
      'Lifecycle state of a single gate criterion against a given instance.',
  },
  {
    name: 'GateEvaluation',
    signature: `interface GateEvaluation {
  criterionId: string;
  stageId: string;
  status: GateStatus;
  gateType: 'hard' | 'soft';
  evidence: string[];
  patternRef: PatternRef;
  evaluatedAt: number;
}`,
    description:
      'Evaluation result for a single gate criterion at a given stage. Hard gates block stage advancement when unmet.',
  },
  {
    name: 'GateCriterionResult',
    signature: `interface GateCriterionResult extends GateEvaluation {
  description: string;
  evaluationHint: string;
}`,
    description:
      'GateEvaluation enriched with description + evaluation hint for UI rendering. Returned by `unmetGateCriteria()`.',
  },
  {
    name: 'ContradictionDetection',
    signature: `interface ContradictionDetection {
  templateId: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  partyA: string;
  partyB: string;
  triggeringEvidence: EvidencePointer[];
  resolutionPath: string;
  patternRef: PatternRef;
  detectedAt: number;
}`,
    description:
      'Typed contradiction record between two parties in the context of a pattern template. Carries evidence, severity, and a resolution path.',
  },
  {
    name: 'FailureModeDetection',
    signature: `interface FailureModeDetection {
  id: string;
  failureModeId: string;
  label: string;
  description: string;
  stages: string[];
  mitigations: string[];
  confidence: number;
  matchedKeywords: string[];
  detectedFromKeys: string[];
}`,
    description:
      'A typical failure mode whose pattern-authored description keywords match the instance evidence map.',
  },
  {
    name: 'FailureModeDetector',
    signature: `interface FailureModeDetector<TPattern> {
  detect(evidenceMap: Record<string, unknown>): FailureModeDetection[];
  detectForStage(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): FailureModeDetection[];
}`,
    description:
      'Runtime contract for a deterministic failure-mode detector — same inputs always produce the same outputs.',
  },
  {
    name: 'ArtifactExpectation',
    signature: `interface ArtifactExpectation {
  artifactId: string;
  label: string;
  stageId: string;
  requirement: 'required' | 'recommended' | 'optional';
  gateType: 'hard' | 'soft';
  present: boolean;
  patternRef: PatternRef;
}`,
    description:
      'An artifact the pattern expects for a given stage, annotated with whether it is currently present in the instance.',
  },
  {
    name: 'ArtifactTracker',
    signature: `interface ArtifactTracker<TInstance> {
  trackForStage(stageId: string, instance: TInstance): StageArtifactTracking;
  trackAll(instance: TInstance): StageArtifactTracking[];
  isStageReady(stageId: string, instance: TInstance): boolean;
}`,
    description:
      'Tracks artifact completeness for an instance against the pattern’s `expectedArtifacts`. Pure: same inputs → same outputs.',
  },
  {
    name: 'StageArtifactTracking',
    signature: `interface StageArtifactTracking {
  stageId: string;
  present: ArtifactExpectation[];
  inProgress: ArtifactExpectation[];
  missing: ArtifactExpectation[];
  requiredMissingCount: number;
}`,
    description:
      'Per-stage artifact tracking result — present / inProgress / missing buckets plus required-missing count for gate readiness.',
  },
  {
    name: 'LinkType',
    signature: `type LinkType =
  | 'unblocks'
  | 'depends-on'
  | 'feeds'
  | 'shares-vendor'
  | 'contradicts';`,
    description:
      'Nature of the relationship between two instances in the cross-instance reasoning graph.',
  },
  {
    name: 'LinkedInstance',
    signature: `interface LinkedInstance {
  instanceId: string;
  instanceType: 'source-event' | 'program' | 'vendor';
  linkType: LinkType;
  description: string;
}`,
    description:
      'An instance linked to the current one via a typed relationship. Returned by `PatternApplication.linkedInstances()`.',
  },
  {
    name: 'CascadeImpact',
    signature: `interface CascadeImpact {
  sourceInstanceId: string;
  targetInstanceId: string;
  linkType: LinkType;
  impact: string;
  severity: 'blocking' | 'accelerating' | 'informational';
  impactSeverity?: 'low' | 'medium' | 'high';
  targetInstanceName?: string;
}`,
    description:
      'Describes the downstream effect on a target instance when the source instance changes state.',
  },
  {
    name: 'CitationPointer',
    signature: `interface CitationPointer {
  ref: PatternRef;
  excerpt: string;
  relevance: string;
}`,
    description:
      'Citation back to a specific fragment of a pattern document, used to ground LLM-generated synthesis in authoritative source material.',
  },
  {
    name: 'SynthesisContext',
    signature: `interface SynthesisContext {
  instanceId: string;
  instanceType: 'source-event' | 'program' | 'tower';
  patternId: string;
  patternVersion: string;
  currentStage: string;
  gatesSummary: {
    total: number;
    met: number;
    unmet: number;
    blocked: GateCriterionResult[];
  };
  activeContradictions: ContradictionDetection[];
  failureModes: FailureModeDetection[];
  missingArtifacts: ArtifactExpectation[];
  cascadeContext: CascadeImpact[];
  citations: CitationPointer[];
  instanceSnapshot: Record<string, unknown>;
  stageGuidance: string;
  builtAt: number;
}`,
    description:
      'Fully-assembled context object passed to the synthesis LLM call — gates, contradictions, missing artifacts, cascades, citations, and stage guidance.',
  },
  {
    name: 'StageEvaluationResult',
    signature: `interface StageEvaluationResult {
  stageId: string;
  stageLabel: string;
  order: number;
  status: 'passed' | 'current' | 'upcoming' | 'blocked';
  gateEvaluations: GateEvaluation[];
  gatesMet: number;
  gatesTotal: number;
  missingArtifacts: ArtifactExpectation[];
}`,
    description:
      'Full evaluation summary for a single stage — gate state, met counts, and missing artifacts. Used to render stage progress.',
  },
  {
    name: 'SynthesisCacheKey',
    signature: `interface SynthesisCacheKey {
  instanceStateHash: string;
  patternId: string;
  patternVersion: string;
  agentVariant: 'sentinel' | 'nexus' | 'steward' | 'atlas';
}`,
    description:
      'Cache key for synthesis output. A result is valid as long as instance state hash, pattern identity, and agent variant are unchanged.',
  },
  {
    name: 'GateEvaluator',
    signature: `interface GateEvaluator<TInstance> {
  evaluate(instance: TInstance, stageId: string): GateEvaluation[];
  isHardGateBlocker(instance: TInstance, stageId: string): boolean;
}`,
    description:
      'Runtime contract for a gate evaluator — pattern-specific implementations are interchangeable at the runtime layer.',
  },
  {
    name: 'ContradictionDetector',
    signature: `interface ContradictionDetector<TInstance> {
  detect(instance: TInstance): ContradictionDetection[];
}`,
    description:
      'Runtime contract for detecting contradictions within an instance using the templates defined in the governing pattern.',
  },
  {
    name: 'PatternResolver',
    signature: `interface PatternResolver {
  resolve(
    instanceType: 'source-event' | 'program',
    typeField: string,
  ): string | null;
}`,
    description:
      'Resolves which pattern governs a given instance type and type-field value. Used to look up the correct PatternSeed before evaluation.',
  },
  {
    name: 'SynthesisContextBuilder',
    signature: `interface SynthesisContextBuilder<TInstance> {
  build(
    instance: TInstance,
    gateEvaluations: GateEvaluation[],
    contradictions: ContradictionDetection[],
    linkedInstances: LinkedInstance[],
  ): SynthesisContext;
}`,
    description:
      'Assembles a SynthesisContext from pre-computed evaluation artefacts. Combines gates, contradictions, and linked-instance data into a prompt-ready structure.',
  },
  {
    name: 'PatternApplication',
    signature: `interface PatternApplication<
  TPattern extends PatternSeed,
  TInstance,
> {
  pattern: TPattern;
  instance: TInstance;
  currentStage: string;

  evaluateGates(): GateEvaluation[];
  unmetGateCriteria(): GateCriterionResult[];
  isStageGateMet(stageId: string): boolean;
  canAdvanceToNextStage(): boolean;

  detectContradictions(): ContradictionDetection[];

  expectedArtifactsForCurrentStage(): ArtifactExpectation[];
  missingArtifacts(): ArtifactExpectation[];

  linkedInstances(): LinkedInstance[];
  cascadeImpact(): CascadeImpact[];

  buildSynthesisContext(): SynthesisContext;
}`,
    description:
      'Central runtime contract for applying a pattern to a concrete instance. Stateful session object spanning gates, contradictions, artifacts, cascades, and synthesis.',
  },
  {
    name: 'PatternSeed',
    signature: `// Re-exported from @/lib/intelligence/seed-types
type PatternSeed = /* see intelligence/seed-types.ts */;`,
    description:
      'Re-exported from the intelligence layer — the seed type for typed lifecycle patterns.',
  },
];

const GATE_EVALUATION: ReadonlyArray<ApiEntry> = [
  {
    name: 'LifecycleGateEvaluator',
    signature: `class LifecycleGateEvaluator {
  constructor(pattern: LifecyclePatternSeed);

  evaluateStage(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): GateEvaluation[];

  unmetCriteria(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): GateCriterionResult[];

  isHardGateMet(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): boolean;

  canAdvance(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): boolean;

  evaluateAllStages(
    currentStageId: string,
    evidenceMap: Record<string, unknown>,
  ): StageEvaluationResult[];
}`,
    description:
      'REASON-6 — evaluates pattern stage gates against an instance evidence map. Returns one GateEvaluation per criterion with `met / unmet / partial / waived` status.',
  },
  {
    name: 'createGateEvaluator',
    signature: `function createGateEvaluator(
  pattern: LifecyclePatternSeed,
): LifecycleGateEvaluator;`,
    description:
      'Factory for `LifecycleGateEvaluator`. Prefer over `new` so consumers don’t need to import the class directly.',
  },
  {
    name: 'evaluateStageGates',
    signature: `function evaluateStageGates(
  pattern: LifecyclePatternSeed,
  stageId: string,
  evidenceMap: Record<string, unknown>,
): GateEvaluation[];`,
    description:
      'Convenience: evaluate gates for a single stage against an evidence map. Returns typed results ready for synthesis context building.',
  },
];

const CONTRADICTION_DETECTION: ReadonlyArray<ApiEntry> = [
  {
    name: 'LifecycleContradictionDetector',
    signature: `class LifecycleContradictionDetector {
  constructor(pattern: LifecyclePatternSeed);

  detect(
    evidenceMap: Record<string, unknown>,
  ): ContradictionDetection[];

  detectForStage(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): ContradictionDetection[];
}`,
    description:
      'REASON-7 — detects contradictions from pattern templates by keyword-matching against the evidence map. Templates fire when ≥2 keywords match (confidence: 0.3 base + 0.1/match, cap 0.9).',
  },
  {
    name: 'createContradictionDetector',
    signature: `function createContradictionDetector(
  pattern: LifecyclePatternSeed,
): LifecycleContradictionDetector;`,
    description:
      'Factory for `LifecycleContradictionDetector`.',
  },
  {
    name: 'detectContradictions',
    signature: `function detectContradictions(
  pattern: LifecyclePatternSeed,
  evidenceMap: Record<string, unknown>,
): ContradictionDetection[];`,
    description:
      'Convenience: detect contradictions for an evidence map against a pattern. Returns typed `ContradictionDetection[]`.',
  },
];

const FAILURE_MODE_DETECTION: ReadonlyArray<ApiEntry> = [
  {
    name: 'LifecycleFailureModeDetector',
    signature: `class LifecycleFailureModeDetector
  implements FailureModeDetector<LifecyclePatternSeed>
{
  constructor(pattern: LifecyclePatternSeed);

  detect(
    evidenceMap: Record<string, unknown>,
  ): FailureModeDetection[];

  detectForStage(
    stageId: string,
    evidenceMap: Record<string, unknown>,
  ): FailureModeDetection[];
}`,
    description:
      'REASON-19 — detects failure modes from the pattern’s `failureModes` array via keyword-matching against the evidence map. Output order matches pattern declaration order.',
  },
  {
    name: 'createFailureModeDetector',
    signature: `function createFailureModeDetector(
  pattern: LifecyclePatternSeed,
): LifecycleFailureModeDetector;`,
    description:
      'Factory for `LifecycleFailureModeDetector`.',
  },
  {
    name: 'detectFailureModes',
    signature: `function detectFailureModes(
  pattern: LifecyclePatternSeed,
  evidenceMap: Record<string, unknown>,
): FailureModeDetection[];`,
    description:
      'Convenience: detect failure modes for an evidence map against a pattern. Returns typed `FailureModeDetection[]`.',
  },
];

const ARTIFACT_TRACKING: ReadonlyArray<ApiEntry> = [
  {
    name: 'ArtifactMatchStatus',
    signature: `type ArtifactMatchStatus = 'present' | 'in-progress' | 'missing';`,
    description:
      'Status bucket an artifact match resolves to. `present` = approved/locked, `in-progress` = draft, `missing` = no instance artifact maps to the expectation.',
  },
  {
    name: 'ArtifactMatchResolver',
    signature: `type ArtifactMatchResolver<TInstance> = (
  expectation: ExpectedArtifact,
  instance: TInstance,
) => ArtifactMatchStatus;`,
    description:
      'Pluggable adapter that resolves an `ExpectedArtifact` against a concrete instance type to a match status. Lets the tracker stay generic across instance shapes.',
  },
  {
    name: 'LifecycleArtifactTracker',
    signature: `class LifecycleArtifactTracker<TInstance = SourceEventInstance>
  implements ArtifactTracker<TInstance>
{
  constructor(
    pattern: LifecyclePatternSeed,
    resolver?: ArtifactMatchResolver<TInstance>,
  );

  trackForStage(
    stageId: string,
    instance: TInstance,
  ): StageArtifactTracking;

  trackAll(instance: TInstance): StageArtifactTracking[];

  isStageReady(stageId: string, instance: TInstance): boolean;
}`,
    description:
      'REASON-8 — reconciles attached artifacts against per-stage expectations. Generic over instance shape via the optional resolver; defaults to `SourceEventInstance` semantics.',
  },
  {
    name: 'createArtifactTracker',
    signature: `function createArtifactTracker<TInstance = SourceEventInstance>(
  pattern: LifecyclePatternSeed,
  resolver?: ArtifactMatchResolver<TInstance>,
): LifecycleArtifactTracker<TInstance>;`,
    description:
      'Factory for `LifecycleArtifactTracker`. Pass a resolver to use the tracker with non-Source instance shapes (e.g. `ProgramInstance`).',
  },
  {
    name: 'trackArtifacts',
    signature: `function trackArtifacts(
  pattern: LifecyclePatternSeed,
  instance: SourceEventInstance,
): StageArtifactTracking[];`,
    description:
      'Convenience: compute per-stage tracking for every artifact-bearing stage in one call. Equivalent to `createArtifactTracker(pattern).trackAll(instance)`.',
  },
];

const CROSS_INSTANCE: ReadonlyArray<ApiEntry> = [
  {
    name: 'LinkedProgramChipStatus',
    signature: `type LinkedProgramChipStatus = 'green' | 'amber' | 'gray';`,
    description:
      'Status colour for a linked-program chip. `green` = no open blocker, `amber` = open blocker affects current phase, `gray` = unresolved.',
  },
  {
    name: 'LinkedProgramChipData',
    signature: `interface LinkedProgramChipData {
  label: string;
  phase: number | null;
  phaseLabel: string;
  hasBlocker: boolean;
  blockerLabel?: string;
  status: LinkedProgramChipStatus;
  linkedProgramId: string;
  linkedProgramName: string;
  linkType: LinkType;
}`,
    description:
      'Pure data payload for rendering a linked-program chip — no JSX, no styling. Same payload renders in server, client, and tests.',
  },
  {
    name: 'CascadeGraphNode',
    signature: `interface CascadeGraphNode {
  instanceId: string;
  instanceType: 'program' | 'source-event';
  name: string;
  depth: number;
}`,
    description:
      'Node in a multi-hop cascade graph. `depth` is distance from the root in hops.',
  },
  {
    name: 'CascadeGraphEdge',
    signature: `interface CascadeGraphEdge {
  from: string;
  to: string;
  linkType: LinkType;
  description: string;
}`,
    description:
      'Edge in a multi-hop cascade graph — directed from `from` to `to` with a typed `linkType`.',
  },
  {
    name: 'CascadeGraph',
    signature: `interface CascadeGraph {
  nodes: CascadeGraphNode[];
  edges: CascadeGraphEdge[];
}`,
    description:
      'Multi-hop cascade graph payload — nodes + edges. Output of `traceMultiHop`.',
  },
  {
    name: 'resolveLinkedProgram',
    signature: `function resolveLinkedProgram(
  linkedProgramId: string,
): ProgramInstance | null;`,
    description:
      'Look up a `ProgramInstance` by id across the active program-instances corpus. Returns `null` if not found.',
  },
  {
    name: 'resolveLinkedSourceEvent',
    signature: `function resolveLinkedSourceEvent(
  sourceEventId: string,
): SourceEventInstance | null;`,
    description:
      'Resolve a `SourceEventInstance` by full id or `displayId`. The two are interchangeable in cross-instance link payloads.',
  },
  {
    name: 'resolveLinkedInstance',
    signature: `function resolveLinkedInstance(
  instanceId: string,
):
  | { kind: 'program'; instance: ProgramInstance }
  | { kind: 'source-event'; instance: SourceEventInstance }
  | null;`,
    description:
      'Resolve any linked instance — program or source event — by id or displayId. Returns the instance plus a discriminator so callers can branch.',
  },
  {
    name: 'buildLinkedProgramChip',
    signature: `function buildLinkedProgramChip(
  linkedProgramId: string,
  linkType: LinkType,
): LinkedProgramChipData;`,
    description:
      'Build a renderable chip payload for a linked program. Pure: same inputs always yield same outputs.',
  },
  {
    name: 'computeCascadeImpacts',
    signature: `function computeCascadeImpacts(
  instance: SourceEventInstance | ProgramInstance,
): CascadeImpact[];`,
    description:
      'Compute every downstream cascade impact for the given instance. Sorted by `(targetInstanceId, linkType)` for deterministic output.',
  },
  {
    name: 'computeReverseCascade',
    signature: `function computeReverseCascade(
  instance: SourceEventInstance | ProgramInstance,
): LinkedInstance[];`,
    description:
      'Compute upstream dependencies — the set of linked instances this instance is waiting on. Output sorted by `instanceId`.',
  },
  {
    name: 'scoreImpactSeverity',
    signature: `function scoreImpactSeverity(
  target: ProgramInstance | SourceEventInstance,
  link: {
    linkType: LinkType;
    blockedAtPhase?: number;
    blockedAtStage?: string;
  },
): 'low' | 'medium' | 'high';`,
    description:
      'Score the risk-tier severity of a single cascade impact. `high` = open blocker AND timing conflict; `medium` = blocker OR dependency-block; `low` = informational link.',
  },
  {
    name: 'traceMultiHop',
    signature: `function traceMultiHop(
  rootInstanceId: string,
  depth?: number,
): CascadeGraph;`,
    description:
      'Walk the cross-instance graph from `rootInstanceId` outward up to `depth` hops (default 2). BFS; cycles guarded by visited set; deterministic output.',
  },
];

const SYNTHESIS_CONTEXT_BUILDERS: ReadonlyArray<ApiEntry> = [
  {
    name: 'buildSourceSynthesisContext',
    signature: `function buildSourceSynthesisContext(
  instance: SourceEventInstance,
  pattern: LifecyclePatternSeed,
): SynthesisContext;`,
    description:
      'REASON-14 — assembles the Sentinel synthesis context for a `SourceEventInstance`. Composes gate state, contradictions, failure modes, missing artifacts, cascades, and citations.',
  },
  {
    name: 'instanceStateHash',
    signature: `function instanceStateHash(
  instance: SourceEventInstance,
): string;`,
    description:
      'Stable djb2 hash of source-event state for cache key. Changes when current stage, vendor statuses, artifacts, or evidence change.',
  },
  {
    name: 'buildProgramSynthesisContext',
    signature: `function buildProgramSynthesisContext(
  instance: ProgramInstance,
  pattern?: LifecyclePatternSeed,
): SynthesisContext;`,
    description:
      'REASON-15 — assembles the Nexus synthesis context for a `ProgramInstance`. Falls back to a shape-only result when no pattern can be resolved.',
  },
  {
    name: 'programInstanceStateHash',
    signature: `function programInstanceStateHash(
  instance: ProgramInstance,
): string;`,
    description:
      'Stable djb2 hash of program state for cache key. Changes on phase, gate status, deliverable count, evidence count, or open-flag count.',
  },
  {
    name: 'buildTowerSynthesisContext',
    signature: `function buildTowerSynthesisContext(
  programInstances: ProgramInstance[],
  sourceEventInstances: SourceEventInstance[],
): SynthesisContext;`,
    description:
      'REASON-17 — assembles the Atlas portfolio synthesis context. Aggregates gate state and blockers across every active program + source event in the tenant.',
  },
  {
    name: 'towerStateHash',
    signature: `function towerStateHash(
  programInstances: ProgramInstance[],
  sourceEventInstances: SourceEventInstance[],
): string;`,
    description:
      'Stable djb2 hash of the entire portfolio state for cache-key derivation. Changes on any instance phase/stage, blocker count, or flag count.',
  },
];

const STAGE_MICRO_SYNTHESIS: ReadonlyArray<ApiEntry> = [
  {
    name: 'buildStageMicroSynthesis',
    signature: `function buildStageMicroSynthesis(
  stageId: string,
  evaluation: StageEvaluationResult,
  pattern: LifecyclePatternSeed,
): string;`,
    description:
      'Build a deterministic 1–2 sentence advisory for one stage. Output is rule-based — no LLM call.',
  },
  {
    name: 'buildStageMicroSynthesisMap',
    signature: `function buildStageMicroSynthesisMap(
  evaluations: StageEvaluationResult[],
  pattern: LifecyclePatternSeed,
): Record<string, string>;`,
    description:
      'Convenience: build a `Record<stageId, microSynthesis>` map in one pass. Caller passes the full `evaluateAllStages()` output.',
  },
];

const MISSION_DERIVATION: ReadonlyArray<ApiEntry> = [
  {
    name: 'DerivedMissionPriority',
    signature: `type DerivedMissionPriority = 'high' | 'medium' | 'low';`,
    description:
      'Priority band for a derived mission — drives queue ordering on the mission strip and Tower portfolio queue.',
  },
  {
    name: 'DerivedMission',
    signature: `interface DerivedMission {
  readonly id: string;
  readonly instanceId: string;
  readonly instanceDisplayId: string;
  readonly instanceLabel: string;
  readonly patternId: string;
  readonly stageId: string;
  readonly criterionId: string;
  readonly label: string;
  readonly description: string;
  readonly gateType: 'hard' | 'soft';
  readonly priority: DerivedMissionPriority;
  readonly evaluationHint: string;
}`,
    description:
      'Mission queue entry derived from a pending gate criterion. Stable id of the form `${instanceId}:${criterionId}`.',
  },
  {
    name: 'deriveMissionsFromInstance',
    signature: `function deriveMissionsFromInstance(
  instance: SourceEventInstance | ProgramInstance,
  pattern: LifecyclePatternSeed,
): DerivedMission[];`,
    description:
      'Pure derivation — returns one `DerivedMission` per pending/partial gate criterion across all stages. Sorted high → medium → low; tie-broken by `(stageId, criterionId)`.',
  },
  {
    name: 'deriveAllMissions',
    signature: `function deriveAllMissions(
  instances: readonly (SourceEventInstance | ProgramInstance)[],
  patterns: readonly LifecyclePatternSeed[],
): DerivedMission[];`,
    description:
      'Iterate across an instance list and derive missions for every (instance, pattern) pair where a matching pattern is present. Matching is by `patternId`.',
  },
];

const TELEMETRY: ReadonlyArray<ApiEntry> = [
  {
    name: 'SynthesisSurface',
    signature: `type SynthesisSurface = 'source' | 'programs' | 'tower';`,
    description:
      'Which synthesis surface produced a telemetry event.',
  },
  {
    name: 'SynthesisFeedback',
    signature: `type SynthesisFeedback = 'up' | 'down';`,
    description:
      'User feedback signal attached to a previously-recorded synthesis event.',
  },
  {
    name: 'SynthesisTelemetryEvent',
    signature: `interface SynthesisTelemetryEvent {
  id: string;
  timestamp: string;
  surface: SynthesisSurface;
  instanceId: string;
  patternId: string | null;
  cacheHit: boolean;
  latencyMs: number;
  citationCount: number;
  contradictionCount: number;
  failureModeCount: number;
  gateCount: number;
  feedback?: SynthesisFeedback;
  feedbackTimestamp?: string;
}`,
    description:
      'Telemetry record shape feeding `/admin/reasoning`. One event per synthesis call.',
  },
  {
    name: 'SynthesisTelemetryInput',
    signature: `type SynthesisTelemetryInput = Omit<
  SynthesisTelemetryEvent,
  'id' | 'timestamp' | 'feedback' | 'feedbackTimestamp'
>;`,
    description:
      'Input shape for `recordSynthesisEvent` — caller supplies the operational data; the module fills in `id` and `timestamp` deterministically.',
  },
  {
    name: 'SYNTHESIS_TELEMETRY_CAPACITY',
    signature: `const SYNTHESIS_TELEMETRY_CAPACITY = 500;`,
    description:
      'Maximum events held in the in-memory ring buffer. Older events are evicted FIFO.',
  },
  {
    name: 'recordSynthesisEvent',
    signature: `function recordSynthesisEvent(
  input: SynthesisTelemetryInput,
): SynthesisTelemetryEvent;`,
    description:
      'Append an event to the ring buffer. Returns the assigned event id so callers can echo it via the `X-Synthesis-Event-Id` response header. Backend writes are fire-and-forget.',
  },
  {
    name: 'getRecentSynthesisEvents',
    signature: `function getRecentSynthesisEvents(
  limit?: number,
): SynthesisTelemetryEvent[];`,
    description:
      'Return the most-recent events, newest first. Defaults to the full buffer when `limit` is omitted.',
  },
  {
    name: 'recordFeedback',
    signature: `function recordFeedback(
  eventId: string,
  feedback: SynthesisFeedback,
): boolean;`,
    description:
      'Attach a user feedback signal to a previously-recorded event. Returns `true` when the event was found and updated, `false` otherwise.',
  },
];

interface CategoryDef {
  id: string;
  eyebrow: string;
  title: string;
  intro: string;
  entries: ReadonlyArray<ApiEntry>;
}

const CATEGORIES: ReadonlyArray<CategoryDef> = [
  {
    id: 'types-and-interfaces',
    eyebrow: 'Section 1',
    title: 'Types & interfaces',
    intro:
      'Public type exports from `src/lib/reasoning/types.ts`. These describe the shape of every reasoning artifact that flows through the runtime and into Layer 4.',
    entries: TYPES_AND_INTERFACES,
  },
  {
    id: 'gate-evaluation',
    eyebrow: 'Section 2',
    title: 'Gate evaluation',
    intro:
      'Pattern stage gates evaluated against an instance evidence map. Every result is typed; no surface re-implements gate logic.',
    entries: GATE_EVALUATION,
  },
  {
    id: 'contradiction-detection',
    eyebrow: 'Section 3',
    title: 'Contradiction detection',
    intro:
      'Pattern-template-driven contradiction detection. Templates fire on keyword overlap with the evidence map; confidence scales with match density.',
    entries: CONTRADICTION_DETECTION,
  },
  {
    id: 'failure-mode-detection',
    eyebrow: 'Section 4',
    title: 'Failure-mode detection',
    intro:
      'Detects known anti-patterns from the pattern’s `failureModes` array. Same keyword-match shape as contradictions, anchored on `FailureMode` rather than `ContradictionTemplate`.',
    entries: FAILURE_MODE_DETECTION,
  },
  {
    id: 'artifact-tracking',
    eyebrow: 'Section 5',
    title: 'Artifact tracking',
    intro:
      'Reconciles attached artifacts against per-stage `expectedArtifacts`. Generic over instance shape via a pluggable match resolver.',
    entries: ARTIFACT_TRACKING,
  },
  {
    id: 'cross-instance',
    eyebrow: 'Section 6',
    title: 'Cross-instance reasoning',
    intro:
      'Resolves links between source events and programs, computes downstream cascade impacts, scores risk severity, and walks the multi-hop graph.',
    entries: CROSS_INSTANCE,
  },
  {
    id: 'synthesis-context-builders',
    eyebrow: 'Section 7',
    title: 'Synthesis context builders',
    intro:
      'Layer-3 builders that assemble the typed `SynthesisContext` consumed by Layer-4 prose agents (Sentinel, Nexus, Atlas).',
    entries: SYNTHESIS_CONTEXT_BUILDERS,
  },
  {
    id: 'stage-micro-synthesis',
    eyebrow: 'Section 8',
    title: 'Stage micro-synthesis',
    intro:
      'Rule-based 1–2 sentence advisory per stage. No LLM call — the output is deterministic prose derived from the gate-evaluation result.',
    entries: STAGE_MICRO_SYNTHESIS,
  },
  {
    id: 'mission-derivation',
    eyebrow: 'Section 9',
    title: 'Mission derivation',
    intro:
      'Auto-derives mission queue entries from pending gate criteria across an instance or a list of instances. Output is sorted high → medium → low.',
    entries: MISSION_DERIVATION,
  },
  {
    id: 'telemetry',
    eyebrow: 'Section 10',
    title: 'Synthesis telemetry',
    intro:
      'In-memory ring buffer + feedback channel for synthesis observability. Powers `/admin/reasoning`. Backends are pluggable; writes are fire-and-forget.',
    entries: TELEMETRY,
  },
];

function CategorySection({ category }: { category: CategoryDef }) {
  return (
    <Section
      eyebrow={category.eyebrow}
      title={category.title}
      id={category.id}
    >
      <p style={PROSE_STYLE}>{category.intro}</p>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.lg,
        }}
      >
        {category.entries.map((entry) => (
          <ApiEntryBlock key={entry.name} entry={entry} />
        ))}
      </div>
    </Section>
  );
}

export default function ReasoningApiReferencePage() {
  const totalExports = CATEGORIES.reduce(
    (sum, category) => sum + category.entries.length,
    0,
  );

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open architecture"
          primaryActionHref="/docs/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Docs · Reasoning · API"
        title="Reasoning layer · API reference"
        subtitle="A dense, per-export listing of every public symbol in @/lib/reasoning. Each entry shows the TypeScript signature copied verbatim from the source plus a one-line description."
      >
        <Section eyebrow="Overview" title="What this is">
          <p style={PROSE_STYLE}>
            This is the API reference for the AbarVa reasoning layer
            (<InlineCode>src/lib/reasoning/*</InlineCode>). It enumerates{' '}
            <strong>{totalExports}</strong> public exports from{' '}
            <InlineCode>@/lib/reasoning</InlineCode> grouped into{' '}
            <strong>{CATEGORIES.length}</strong> categories. Every signature is
            copied directly from the source; descriptions are mined from the
            module header comments.
          </p>
          <p style={PROSE_STYLE}>
            For the architectural narrative, read the{' '}
            <Link href="/docs/reasoning" style={LINK_STYLE}>
              architecture doc
            </Link>
            . For an SDK-style walkthrough, read the{' '}
            <Link href="/docs/reasoning/quickstart" style={LINK_STYLE}>
              quickstart
            </Link>
            . For a flat, git-derived view of every reasoning-layer commit, read
            the{' '}
            <Link href="/docs/reasoning/changelog" style={LINK_STYLE}>
              changelog
            </Link>
            . For a hands-on, click-through tour of every Layer 3 surface in
            the live product, read the{' '}
            <Link href="/docs/reasoning/demo" style={LINK_STYLE}>
              5-minute demo walkthrough
            </Link>
            . For an investor-ready overview with live metrics from the corpus,
            read the{' '}
            <Link href="/docs/reasoning/about" style={LINK_STYLE}>
              about page
            </Link>
            .
          </p>
        </Section>

        <Section eyebrow="Index" title="Table of contents">
          <p style={PROSE_STYLE}>
            Each section below corresponds to a category of exports. Anchor
            links are stable: external docs may link to e.g.{' '}
            <InlineCode>/docs/reasoning/api#buildSourceSynthesisContext</InlineCode>.
          </p>
          <ul style={TOC_LIST_STYLE}>
            {CATEGORIES.map((category) => (
              <li key={category.id}>
                <Link href={`#${category.id}`} style={LINK_STYLE}>
                  {category.title}
                </Link>{' '}
                <span style={{ color: `${COLORS.ink}88` }}>
                  ({category.entries.length})
                </span>
              </li>
            ))}
          </ul>
        </Section>

        {CATEGORIES.map((category) => (
          <CategorySection key={category.id} category={category} />
        ))}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
