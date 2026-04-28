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

  // Failure mode detection
  FailureModeDetection,
  FailureModeDetector,

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

// Failure mode detector — REASON-19
export { LifecycleFailureModeDetector, createFailureModeDetector, detectFailureModes } from './failure-mode-detector';

// Artifact tracker — REASON-8
export { LifecycleArtifactTracker, createArtifactTracker, trackArtifacts } from './artifact-tracker';
export type { ArtifactMatchResolver, ArtifactMatchStatus } from './artifact-tracker';

// Synthesis context builder — REASON-14
export { buildSourceSynthesisContext, instanceStateHash } from './synthesis-context-builder';

// Program synthesis context builder — REASON-15
export { buildProgramSynthesisContext, programInstanceStateHash } from './program-synthesis-context-builder';

// Tower (Atlas) portfolio synthesis context builder — REASON-17
export { buildTowerSynthesisContext, towerStateHash } from './tower-synthesis-context-builder';

// Cross-instance reasoner — REASON-18 + REASON-9
export {
  resolveLinkedProgram,
  resolveLinkedSourceEvent,
  resolveLinkedInstance,
  buildLinkedProgramChip,
  computeCascadeImpacts,
  computeReverseCascade,
  scoreImpactSeverity,
  traceMultiHop,
} from './cross-instance-reasoner';
export type {
  LinkedProgramChipData,
  LinkedProgramChipStatus,
  CascadeGraph,
  CascadeGraphNode,
  CascadeGraphEdge,
} from './cross-instance-reasoner';

// Mission derivation — auto-derives mission queue entries from pending gates
export {
  deriveMissionsFromInstance,
  deriveAllMissions,
} from './mission-derivation';
export type { DerivedMission, DerivedMissionPriority } from './mission-derivation';
