/**
 * Reasoning layer — public API surface
 *
 * Re-exports every type from the pattern application runtime type definitions
 * so consumers can import from `@/lib/reasoning` without reaching into the
 * individual module.
 */

export type {
  // Provenance
  PatternRef,
  EvidencePointer,

  // Gate evaluation
  GateStatus,
  GateEvaluation,
  GateCriterionResult,

  // Contradiction detection
  ContradictionDetection,

  // Artifact tracking
  ArtifactExpectation,
  ArtifactTracker,
  StageArtifactTracking,

  // Cross-instance reasoning
  LinkType,
  LinkedInstance,
  CascadeImpact,

  // Synthesis context
  CitationPointer,
  SynthesisContext,

  // Staged evaluation
  StageEvaluationResult,

  // Cache key
  SynthesisCacheKey,

  // Runtime interfaces
  GateEvaluator,
  ContradictionDetector,
  PatternResolver,
  SynthesisContextBuilder,

  // Central runtime contract
  PatternApplication,

  // Re-exported from intelligence layer
  PatternSeed,
} from './types';

// Gate evaluator — REASON-6
export { LifecycleGateEvaluator, createGateEvaluator, evaluateStageGates } from './gate-evaluator';

// Contradiction detector — REASON-7
export { LifecycleContradictionDetector, createContradictionDetector, detectContradictions } from './contradiction-detector';

// Artifact tracker — REASON-8
export { LifecycleArtifactTracker, createArtifactTracker, trackArtifacts } from './artifact-tracker';

// Synthesis context builder — REASON-14
export { buildSourceSynthesisContext, instanceStateHash } from './synthesis-context-builder';

// Program synthesis context builder — REASON-15
export { buildProgramSynthesisContext, programInstanceStateHash } from './program-synthesis-context-builder';
