/**
 * Pattern application runtime type definitions — REASON-5
 *
 * Layer 3 of the AbarVa 4-layer AI reasoning architecture.
 * This module is pure TypeScript: no implementation, no side effects.
 *
 * Imports PatternSeed from the intelligence layer for forward-compatible typing.
 */

import type { PatternSeed } from '@/lib/intelligence/seed-types';

// ─── Re-export seed anchor for consumers of this module ───────────────────────

export type { PatternSeed };

// ─── Provenance ────────────────────────────────────────────────────────────────

/**
 * A pointer back to the specific section of a pattern that authored a
 * criterion, template, or expectation.  Used for citation and audit trails.
 */
export interface PatternRef {
  /** Stable pattern identifier (matches PatternSeed.id). */
  patternId: string;
  /** Semver string of the pattern at evaluation time. */
  patternVersion: string;
  /**
   * Human-readable section label within the pattern document.
   * Example: "§3.7 — Gate criteria for BAFO"
   */
  section: string;
}

/**
 * A pointer to a concrete piece of evidence inside an instance object.
 */
export interface EvidencePointer {
  /** The field path within the instance that holds the evidence. */
  field: string;
  /** The observed value at that field. */
  value: string;
  /** Unix timestamp (ms) when this value was recorded, if known. */
  timestamp?: number;
}

// ─── Gate evaluation ───────────────────────────────────────────────────────────

/**
 * Lifecycle state of a single gate criterion against a given instance.
 * - `met`     — all evidence present and passing.
 * - `unmet`   — required evidence absent or failing.
 * - `partial` — some evidence present but not sufficient.
 * - `waived`  — deliberately bypassed by an authorised user.
 */
export type GateStatus = 'met' | 'unmet' | 'partial' | 'waived';

/**
 * Evaluation result for a single gate criterion at a given stage.
 */
export interface GateEvaluation {
  /** Stable identifier for the criterion (from the pattern definition). */
  criterionId: string;
  /** The stage this criterion belongs to. */
  stageId: string;
  /** Computed pass/fail state. */
  status: GateStatus;
  /**
   * Hard gates block stage advancement when unmet.
   * Soft gates surface warnings but do not block.
   */
  gateType: 'hard' | 'soft';
  /** Evidence fragments that support (or contradict) the evaluation. */
  evidence: string[];
  /** Provenance: which pattern section defined this criterion. */
  patternRef: PatternRef;
  /** Unix timestamp (ms) when the evaluation was performed. */
  evaluatedAt: number;
}

/**
 * GateEvaluation enriched with human-readable description and evaluation hint.
 * Returned by `PatternApplication.unmetGateCriteria()` so UIs can render
 * actionable guidance alongside the pass/fail state.
 */
export interface GateCriterionResult extends GateEvaluation {
  /** Plain-language label for the criterion. */
  description: string;
  /** Hint text explaining what must change for this criterion to be met. */
  evaluationHint: string;
}

// ─── Contradiction detection ───────────────────────────────────────────────────

/**
 * A contradiction detected between two parties in the context of a pattern
 * template.  Provides evidence, severity, and a resolution path for the LLM
 * or a human reviewer.
 */
export interface ContradictionDetection {
  /** References the ContradictionTemplate id inside the pattern. */
  templateId: string;
  /** Short human-readable label for this contradiction. */
  label: string;
  /** How serious this contradiction is for programme execution. */
  severity: 'low' | 'medium' | 'high';
  /**
   * Model confidence that this is a genuine contradiction.
   * Floating point in the range [0, 1].
   */
  confidence: number;
  /** First party involved (e.g. vendor name, team name). */
  partyA: string;
  /** Second party involved. */
  partyB: string;
  /** Specific evidence pointers that triggered this detection. */
  triggeringEvidence: EvidencePointer[];
  /**
   * Recommended resolution path or escalation action.
   * Written by the pattern author; may reference specific gate criteria.
   */
  resolutionPath: string;
  /** Provenance: pattern section that defines the contradiction template. */
  patternRef: PatternRef;
  /** Unix timestamp (ms) when this contradiction was detected. */
  detectedAt: number;
}

// ─── Artifact tracking ─────────────────────────────────────────────────────────

/**
 * An artifact that the pattern expects to exist for a given stage, annotated
 * with whether it is currently present in the instance.
 */
export interface ArtifactExpectation {
  /** Stable identifier for this artifact expectation (from the pattern). */
  artifactId: string;
  /** Human-readable name of the artifact. */
  label: string;
  /** The stage during which this artifact should be produced or available. */
  stageId: string;
  /** Whether the artifact is required, recommended, or optional. */
  requirement: 'required' | 'recommended' | 'optional';
  /**
   * Hard artifacts block stage gate completion when missing.
   * Soft artifacts generate warnings.
   */
  gateType: 'hard' | 'soft';
  /** True if the artifact appears in the instance's artifact list. */
  present: boolean;
  /** Provenance: which pattern section defined this expectation. */
  patternRef: PatternRef;
}

// ─── Cross-instance reasoning ──────────────────────────────────────────────────

/**
 * The nature of the relationship between two instances in the reasoning graph.
 * - `unblocks`      — this instance completing allows the target to proceed.
 * - `depends-on`    — this instance cannot proceed without the target.
 * - `feeds`         — output from this instance is consumed by the target.
 * - `shares-vendor` — both instances involve the same vendor or supplier.
 * - `contradicts`   — this instance contains signals that conflict with the target.
 */
export type LinkType =
  | 'unblocks'
  | 'depends-on'
  | 'feeds'
  | 'shares-vendor'
  | 'contradicts';

/**
 * An instance that is linked to the current instance via a typed relationship.
 * Returned by `PatternApplication.linkedInstances()`.
 */
export interface LinkedInstance {
  /** Stable identifier of the linked instance. */
  instanceId: string;
  /** What kind of entity the linked instance is. */
  instanceType: 'source-event' | 'program' | 'vendor';
  /** The nature of the link. */
  linkType: LinkType;
  /**
   * Human-readable description of why these instances are linked.
   * Example: "BAFO award unblocks APX-CDP-2026 P3 Design"
   */
  description: string;
}

/**
 * Describes the downstream effect on a target instance when the source
 * instance changes state.
 */
export interface CascadeImpact {
  /** The instance whose state change is the trigger. */
  sourceInstanceId: string;
  /** The instance that will be affected. */
  targetInstanceId: string;
  /** The type of link that propagates the impact. */
  linkType: LinkType;
  /**
   * Description of what changes on the target when the source changes.
   * Example: "Delays P3 Design gate by an estimated 2 weeks."
   */
  impact: string;
  /**
   * How severe the downstream effect is.
   * - `blocking`       — target cannot proceed until resolved.
   * - `accelerating`   — target can proceed sooner than planned.
   * - `informational`  — awareness only, no action required.
   */
  severity: 'blocking' | 'accelerating' | 'informational';
}

// ─── Synthesis context ─────────────────────────────────────────────────────────

/**
 * A citation back to a specific fragment of a pattern document, used to
 * ground LLM-generated synthesis in authoritative source material.
 */
export interface CitationPointer {
  /** Which pattern section this citation references. */
  ref: PatternRef;
  /** A short verbatim excerpt from the pattern document. */
  excerpt: string;
  /** Why this citation is relevant to the current instance state. */
  relevance: string;
}

/**
 * A fully-assembled context object passed to the synthesis LLM call.
 * Contains gate state, contradictions, missing artifacts, cascade context,
 * citations, the raw instance snapshot, and stage guidance authored by the
 * pattern writer.
 *
 * Built by `SynthesisContextBuilder.build()` and stored/referenced via
 * `SynthesisCacheKey`.
 */
export interface SynthesisContext {
  /** Identifier of the instance being synthesised. */
  instanceId: string;
  /** The type of instance being synthesised. */
  instanceType: 'source-event' | 'program';
  /** The pattern that governs this instance. */
  patternId: string;
  /** Semver of the pattern at the time this context was built. */
  patternVersion: string;
  /** The stage the instance is currently in. */
  currentStage: string;

  /**
   * Compact summary of gate state for the LLM prompt.
   * `blocked` contains only unmet hard gates to keep the prompt focused.
   */
  gatesSummary: {
    total: number;
    met: number;
    unmet: number;
    /** Unmet hard-gate criterion results — the primary blockers. */
    blocked: GateCriterionResult[];
  };

  /** All active contradiction detections for this instance. */
  activeContradictions: ContradictionDetection[];

  /** Artifacts that are absent but expected for the current stage. */
  missingArtifacts: ArtifactExpectation[];

  /** Cascade impacts from the current instance to its downstream dependants. */
  cascadeContext: CascadeImpact[];

  /**
   * Citation pointers the LLM should reference in its output.
   * Each points to the authoritative pattern fragment that supports a claim.
   */
  citations: CitationPointer[];

  /**
   * A snapshot of the raw instance data passed to the LLM as-is.
   * Typed as `Record<string, unknown>` to remain forward-compatible as
   * instance shapes evolve.
   */
  instanceSnapshot: Record<string, unknown>;

  /**
   * Pattern-authored prose guidance for the current stage.
   * Written in the pattern definition; surfaced verbatim in the LLM prompt.
   */
  stageGuidance: string;

  /** Unix timestamp (ms) when this context object was constructed. */
  builtAt: number;
}

// ─── Staged evaluation result ──────────────────────────────────────────────────

/**
 * The full evaluation summary for a single stage in the pattern lifecycle.
 * Used for rendering stage-by-stage progress indicators and for feeding
 * downstream stage-advance logic.
 */
export interface StageEvaluationResult {
  /** Stage identifier (matches the pattern's stage definition). */
  stageId: string;
  /** Human-readable stage name. */
  stageLabel: string;
  /** Numeric order of this stage in the pattern lifecycle (0-indexed). */
  order: number;
  /**
   * Computed status of the instance relative to this stage.
   * - `passed`   — all hard gates met; instance has advanced beyond this stage.
   * - `current`  — instance is at this stage.
   * - `upcoming` — instance has not yet reached this stage.
   * - `blocked`  — instance is at this stage but one or more hard gates are unmet.
   */
  status: 'passed' | 'current' | 'upcoming' | 'blocked';
  /** All gate evaluations (hard and soft) for this stage. */
  gateEvaluations: GateEvaluation[];
  /** Count of gates whose status is `met` or `waived`. */
  gatesMet: number;
  /** Total gate count for this stage. */
  gatesTotal: number;
  /** Artifacts expected at this stage that are not yet present. */
  missingArtifacts: ArtifactExpectation[];
}

// ─── Synthesis cache key ───────────────────────────────────────────────────────

/**
 * Cache key for synthesis output.  A synthesis result is valid as long as
 * the instance state hash, pattern identity, and agent variant are unchanged.
 */
export interface SynthesisCacheKey {
  /**
   * A deterministic hash of the instance state at the time of synthesis.
   * When any field on the instance changes, this hash changes and the cache
   * entry is invalidated.
   */
  instanceStateHash: string;
  /** The pattern governing the instance. */
  patternId: string;
  /** Semver of the pattern used for this synthesis run. */
  patternVersion: string;
  /**
   * The agent persona for which this synthesis was generated.
   * Different agents may emphasise different aspects of the same context.
   */
  agentVariant: 'sentinel' | 'nexus' | 'steward' | 'atlas';
}

// ─── Runtime interfaces ────────────────────────────────────────────────────────

/**
 * Evaluates gate criteria for a specific instance and stage.
 * Implementations are pattern-specific; the interface ensures they are
 * interchangeable at the runtime layer.
 *
 * @template TInstance The concrete instance type (e.g. SourceEvent, Program).
 */
export interface GateEvaluator<TInstance> {
  /**
   * Run all gate evaluations for the given stage.
   * Returns one `GateEvaluation` per criterion defined for that stage.
   */
  evaluate(instance: TInstance, stageId: string): GateEvaluation[];
  /**
   * Returns `true` if any hard gate for the given stage is unmet,
   * meaning the instance is blocked from advancing.
   */
  isHardGateBlocker(instance: TInstance, stageId: string): boolean;
}

/**
 * Detects contradictions within an instance using the templates defined in
 * the governing pattern.
 *
 * @template TInstance The concrete instance type.
 */
export interface ContradictionDetector<TInstance> {
  /**
   * Scan the instance for signals matching any contradiction template.
   * Returns one `ContradictionDetection` per template that fires.
   */
  detect(instance: TInstance): ContradictionDetection[];
}

/**
 * Resolves which pattern governs a given instance type and type-field value.
 * Used by the runtime to look up the correct PatternSeed before evaluation.
 */
export interface PatternResolver {
  /**
   * Returns the pattern id for the given instance type and type-field value,
   * or `null` if no pattern is registered for that combination.
   *
   * @param instanceType - Top-level category of the instance.
   * @param typeField    - Discriminator value within that category
   *                       (e.g. `"rfi"`, `"bafo"`, `"cdp"`).
   */
  resolve(
    instanceType: 'source-event' | 'program',
    typeField: string,
  ): string | null;
}

/**
 * Assembles a `SynthesisContext` from pre-computed evaluation artefacts.
 * Implementations are responsible for combining gate evaluations,
 * contradictions, and linked-instance data into a prompt-ready structure.
 *
 * @template TInstance The concrete instance type.
 */
export interface SynthesisContextBuilder<TInstance> {
  /**
   * Build the synthesis context for a given instance.
   *
   * @param instance        - The raw instance data.
   * @param gateEvaluations - Gate evaluations already computed for this instance.
   * @param contradictions  - Contradiction detections already computed.
   * @param linkedInstances - Cross-instance links already resolved.
   */
  build(
    instance: TInstance,
    gateEvaluations: GateEvaluation[],
    contradictions: ContradictionDetection[],
    linkedInstances: LinkedInstance[],
  ): SynthesisContext;
}

// ─── Central runtime contract ──────────────────────────────────────────────────

/**
 * The central runtime contract for applying a pattern to a concrete instance.
 *
 * `PatternApplication` is a stateful session object: it holds the pattern,
 * the instance, and the current stage, and exposes methods for gate evaluation,
 * contradiction detection, artifact tracking, cross-instance reasoning, and
 * synthesis context construction.
 *
 * Implementations are generated (or injected) by the pattern application
 * factory; consumers should depend on this interface, not on concrete classes.
 *
 * @template TPattern  The specific PatternSeed subtype governing this instance.
 * @template TInstance The concrete instance type (e.g. SourceEvent, Program).
 */
export interface PatternApplication<
  TPattern extends PatternSeed,
  TInstance,
> {
  /** The pattern governing this application session. */
  pattern: TPattern;
  /** The instance being evaluated. */
  instance: TInstance;
  /** The stage the instance is currently in. */
  currentStage: string;

  // — Gate evaluation —

  /**
   * Evaluate all gate criteria for the current stage.
   * Returns one result per criterion.
   */
  evaluateGates(): GateEvaluation[];

  /**
   * Return only the gate criteria that are currently unmet, enriched with
   * description and evaluation hint text for UI rendering.
   */
  unmetGateCriteria(): GateCriterionResult[];

  /**
   * Returns `true` if all hard gates for `stageId` are met or waived.
   */
  isStageGateMet(stageId: string): boolean;

  /**
   * Returns `true` if the instance satisfies all hard gates on the current
   * stage and may advance to the next stage.
   */
  canAdvanceToNextStage(): boolean;

  // — Contradiction detection —

  /**
   * Run all contradiction templates defined in the pattern against the
   * current instance state.
   */
  detectContradictions(): ContradictionDetection[];

  // — Artifact tracking —

  /**
   * Return the list of `ArtifactExpectation` objects the pattern expects to
   * be present for the current stage.
   */
  expectedArtifactsForCurrentStage(): ArtifactExpectation[];

  /**
   * Return the subset of `expectedArtifactsForCurrentStage()` that are
   * not yet present in the instance.
   */
  missingArtifacts(): ArtifactExpectation[];

  // — Cross-instance reasoning —

  /**
   * Resolve all instances that are linked to this one via the reasoning graph.
   */
  linkedInstances(): LinkedInstance[];

  /**
   * Compute the downstream cascade impacts that would occur if this instance's
   * state changes.
   */
  cascadeImpact(): CascadeImpact[];

  // — Synthesis —

  /**
   * Assemble the full `SynthesisContext` for this instance, ready to be
   * serialised and passed to an LLM synthesis call.
   */
  buildSynthesisContext(): SynthesisContext;
}
