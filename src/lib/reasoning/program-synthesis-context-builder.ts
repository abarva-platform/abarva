// src/lib/reasoning/program-synthesis-context-builder.ts
//
// Builds a SynthesisContext from a ProgramInstance, mirroring the architecture
// of the Source builder. When a typed LifecyclePatternSeed is available for the
// instance's patternId we run the gate evaluator, contradiction detector,
// failure-mode detector, and artifact tracker against the program's evidence
// map — same Layer 3 reasoning loop the Source surface uses.
//
// When no pattern is found we keep the legacy shape-only fallback so existing
// callers and tests for instances with placeholder pattern ids continue to work.

import type { ProgramInstance, ProgramDeliverable } from '@/lib/programs/program-instance';
import { buildProgramEvidenceMapWithIngestions } from '@/lib/programs/program-instance';
import { computeCascadeImpacts } from '@/lib/reasoning/cross-instance-reasoner';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { createFailureModeDetector } from '@/lib/reasoning/failure-mode-detector';
import {
  createArtifactTracker,
  type ArtifactMatchResolver,
} from '@/lib/reasoning/artifact-tracker';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { LifecyclePatternSeed, ExpectedArtifact } from '@/lib/intelligence/seed-types';
import type {
  ArtifactExpectation,
  GateEvaluation,
  SynthesisContext,
} from '@/lib/reasoning/types';

// ── Phase ↔ stage-id mapping ────────────────────────────────────────────────
// Program patterns use stage ids `P{N}-{Label}` (e.g. `P3-Design`); instances
// store a numeric `currentPhase`. This map bridges the two without forcing
// callers to depend on intelligence-layer types.
const PHASE_LABELS: ReadonlyArray<string> = [
  'Originate',
  'Discovery',
  'Synthesis',
  'Design',
  'Build',
  'Activate',
  'Operate',
];

function stageIdForPhase(phaseId: number): string {
  const label = PHASE_LABELS[phaseId] ?? '';
  return `P${phaseId}-${label}`;
}

// ── Deliverable → artifact match resolver ───────────────────────────────────
// Programs use `deliverables` rather than `artifacts`. Match an expected
// artifact to a deliverable by id (or by case-insensitive label substring),
// then bucket by deliverable status:
//   complete                        → present
//   in-progress                     → in-progress
//   not-started | blocked | absent  → missing
function findMatchingDeliverable(
  expectation: ExpectedArtifact,
  instance: ProgramInstance,
): ProgramDeliverable | undefined {
  const expectationIdLower = expectation.id.toLowerCase();
  const expectationLabelLower = expectation.label.toLowerCase();

  // Primary: id-prefix match (allows expectation id like 'cdp-d-006' to find
  // an instance deliverable of the same id).
  const byId = instance.deliverables.find(
    (d) => d.id.toLowerCase() === expectationIdLower,
  );
  if (byId !== undefined) return byId;

  // Fallback: case-insensitive label substring match in either direction.
  return instance.deliverables.find((d) => {
    const dLabel = d.label.toLowerCase();
    return dLabel.includes(expectationLabelLower) || expectationLabelLower.includes(dLabel);
  });
}

const programDeliverableResolver: ArtifactMatchResolver<ProgramInstance> = (
  expectation,
  instance,
) => {
  const matched = findMatchingDeliverable(expectation, instance);
  if (matched === undefined) return 'missing';
  if (matched.status === 'complete') return 'present';
  if (matched.status === 'in-progress') return 'in-progress';
  // 'blocked' and 'not-started' both surface as missing for gate-readiness.
  return 'missing';
};

// ── Pattern resolution ──────────────────────────────────────────────────────

function resolvePattern(instance: ProgramInstance): LifecyclePatternSeed | undefined {
  return PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === instance.patternId);
}

// ── Builder ─────────────────────────────────────────────────────────────────

/**
 * Builds a SynthesisContext from a ProgramInstance for Nexus synthesis.
 *
 * If `pattern` is supplied (or can be resolved from `PROGRAM_LIFECYCLE_PATTERNS`
 * by `instance.patternId`), gate criteria, contradictions, failure modes, and
 * expected-artifact tracking are all evaluated against the instance evidence
 * map. If no pattern is available, returns a shape-only fallback so callers
 * with unknown / placeholder pattern ids continue to function.
 */
export function buildProgramSynthesisContext(
  instance: ProgramInstance,
  pattern?: LifecyclePatternSeed,
): SynthesisContext {
  const evidenceMap = buildProgramEvidenceMapWithIngestions(instance);

  const currentPhaseDef = instance.phases.find((p) => p.phaseId === instance.currentPhase);
  const prevPhase = instance.phases.find((p) => p.phaseId === instance.currentPhase - 1);
  const stageId = stageIdForPhase(instance.currentPhase);

  // Cross-instance cascade is delegated to the cross-instance reasoner so
  // severity scoring stays consistent across Source / Programs / Tower.
  const cascadeContext = computeCascadeImpacts(instance);

  const resolvedPattern = pattern ?? resolvePattern(instance);

  const openBlockers = instance.flags.filter((f) => f.kind === 'blocker' && f.status === 'open');
  const phaseLabel = currentPhaseDef?.phaseLabel ?? '';

  const baseSnapshot = {
    name: instance.name,
    tenantSlug: instance.tenantSlug,
    currentPhase: instance.currentPhase,
    phaseLabel,
    gateStatus: currentPhaseDef?.gateStatus ?? 'open',
    prevGateApproved: prevPhase?.gateStatus === 'approved',
    evidenceCount: instance.evidence.length,
    openBlockers: openBlockers.map((b) => b.description),
    linkedSourceEvents: instance.linkedSourceEvents.map((l) => ({
      id: l.sourceEventId,
      name: l.sourceEventName,
      type: l.linkType,
    })),
  };

  if (resolvedPattern === undefined) {
    // ── Shape-only fallback: no typed pattern available ──
    return buildShapeOnlyContext(instance, currentPhaseDef, prevPhase, openBlockers, cascadeContext, baseSnapshot);
  }

  // ── Pattern-aware path: run the four detectors ──

  const evaluator = createGateEvaluator(resolvedPattern);
  const gateEvals: GateEvaluation[] = evaluator.evaluateStage(stageId, evidenceMap);
  const canAdvance = evaluator.canAdvance(stageId, evidenceMap);

  const metCount = gateEvals.filter((g) => g.status === 'met' || g.status === 'waived').length;
  const hardBlockers = evaluator
    .unmetCriteria(stageId, evidenceMap)
    .filter((g) => g.gateType === 'hard');

  const contradictions = createContradictionDetector(resolvedPattern).detect(evidenceMap);
  const failureModes = createFailureModeDetector(resolvedPattern).detect(evidenceMap);

  const tracker = createArtifactTracker<ProgramInstance>(resolvedPattern, programDeliverableResolver);
  const stageTracking = tracker.trackForStage(stageId, instance);

  // Surface the missing + in-progress required artifacts for the current
  // phase so the Programs UI can render the same artifact ribbon as Source.
  // We deliberately keep `inProgress` items out of `missingArtifacts` — a
  // draft is not "missing" — while still flagging them via gate evaluation.
  const patternMissingArtifacts: ArtifactExpectation[] = stageTracking.missing;

  // If the pattern has no expected artifacts for this phase, fall back to the
  // deliverable-derived list so the synthesis still surfaces gap signals.
  const fallbackMissing = patternMissingArtifacts.length === 0
    ? deliverableDerivedMissingArtifacts(instance, resolvedPattern)
    : [];

  const stageDef = resolvedPattern.stages.find((s) => s.id === stageId);

  const citations = [
    {
      ref: {
        patternId: resolvedPattern.patternId,
        patternVersion: resolvedPattern.version,
        section: `§ Stage — ${stageId}`,
      },
      excerpt: stageDef?.description ?? '',
      relevance: `Current stage definition for ${stageId}`,
    },
    ...hardBlockers.slice(0, 3).map((b) => ({
      ref: b.patternRef,
      excerpt: b.evaluationHint,
      relevance: `Hard gate blocker: ${b.description}`,
    })),
  ];

  return {
    instanceId: instance.id,
    instanceType: 'program',
    patternId: resolvedPattern.patternId,
    patternVersion: resolvedPattern.version,
    currentStage: `P${instance.currentPhase} ${phaseLabel}`,
    gatesSummary: {
      total: gateEvals.length,
      met: metCount,
      unmet: gateEvals.length - metCount,
      blocked: hardBlockers,
    },
    activeContradictions: contradictions,
    failureModes,
    missingArtifacts: [...patternMissingArtifacts, ...fallbackMissing],
    cascadeContext,
    citations,
    instanceSnapshot: {
      ...baseSnapshot,
      canAdvance,
    },
    stageGuidance: stageDef?.description ?? phaseLabel,
    builtAt: Date.now(),
  };
}

/**
 * Shape-only fallback for instances whose patternId is not present in
 * PROGRAM_LIFECYCLE_PATTERNS. Mirrors the legacy behaviour exactly so
 * back-compat tests continue to pass.
 */
function buildShapeOnlyContext(
  instance: ProgramInstance,
  currentPhaseDef: ProgramInstance['phases'][number] | undefined,
  _prevPhase: ProgramInstance['phases'][number] | undefined,
  openBlockers: ProgramInstance['flags'],
  cascadeContext: ReturnType<typeof computeCascadeImpacts>,
  baseSnapshot: SynthesisContext['instanceSnapshot'],
): SynthesisContext {
  const phaseLabel = currentPhaseDef?.phaseLabel ?? '';
  const gateApproved = currentPhaseDef?.gateStatus === 'approved';

  const hardBlockers = openBlockers.map((b) => ({
    criterionId: b.id,
    stageId: `P${instance.currentPhase}`,
    status: 'unmet' as const,
    gateType: 'hard' as const,
    evidence: [],
    description: b.description,
    evaluationHint: b.description,
    patternRef: {
      patternId: instance.patternId,
      patternVersion: instance.patternVersion,
      section: '§ Governance flags',
    },
    evaluatedAt: Date.now(),
  }));

  const patternRef = {
    patternId: instance.patternId,
    patternVersion: instance.patternVersion,
    section: `§ Phase P${instance.currentPhase}`,
  };

  return {
    instanceId: instance.id,
    instanceType: 'program',
    patternId: instance.patternId,
    patternVersion: instance.patternVersion,
    currentStage: `P${instance.currentPhase} ${phaseLabel}`,
    gatesSummary: {
      total: 1,
      met: gateApproved ? 1 : 0,
      unmet: gateApproved ? 0 : 1,
      blocked: hardBlockers,
    },
    activeContradictions: [],
    failureModes: [],
    missingArtifacts: instance.deliverables
      .filter(
        (d) =>
          d.status !== 'complete' &&
          d.status !== 'in-progress' &&
          d.phaseId === instance.currentPhase,
      )
      .map((d) => ({
        artifactId: d.id,
        label: d.label,
        stageId: `P${d.phaseId}`,
        requirement: 'required' as const,
        gateType: 'soft' as const,
        present: false,
        patternRef,
      })),
    cascadeContext,
    citations: [],
    instanceSnapshot: baseSnapshot,
    stageGuidance: phaseLabel,
    builtAt: Date.now(),
  };
}

/**
 * Build deliverable-derived missing artifacts for the current phase. Used
 * when the pattern declares no expected artifacts for this phase, so the UI
 * still surfaces deliverable gaps rather than an empty list.
 */
function deliverableDerivedMissingArtifacts(
  instance: ProgramInstance,
  pattern: LifecyclePatternSeed,
): ArtifactExpectation[] {
  const stageId = stageIdForPhase(instance.currentPhase);
  const patternRef = {
    patternId: pattern.patternId,
    patternVersion: pattern.version,
    section: `§ Phase P${instance.currentPhase}`,
  };
  return instance.deliverables
    .filter(
      (d) =>
        d.status !== 'complete' &&
        d.status !== 'in-progress' &&
        d.phaseId === instance.currentPhase,
    )
    .map((d) => ({
      artifactId: d.id,
      label: d.label,
      stageId,
      requirement: 'required' as const,
      gateType: 'soft' as const,
      present: false,
      patternRef,
    }));
}

/**
 * Hash of program instance state for cache key.
 * Changes when phase, gate status, deliverable count, evidence count, or open flag count changes.
 */
export function programInstanceStateHash(instance: ProgramInstance): string {
  const key = JSON.stringify({
    phase: instance.currentPhase,
    gateStatus: instance.phases.find((p) => p.phaseId === instance.currentPhase)?.gateStatus,
    deliverableCount: instance.deliverables.length,
    evidenceCount: instance.evidence.length,
    flagCount: instance.flags.filter((f) => f.status === 'open').length,
  });
  // Simple djb2 hash — deterministic, no crypto needed
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
