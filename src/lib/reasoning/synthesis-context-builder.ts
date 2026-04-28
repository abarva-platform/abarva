import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { createContradictionDetector } from '@/lib/reasoning/contradiction-detector';
import { computeCascadeImpacts } from '@/lib/reasoning/cross-instance-reasoner';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { SynthesisContext, GateEvaluation } from '@/lib/reasoning/types';

/**
 * Builds a structured SynthesisContext from a SourceEventInstance + its pattern.
 * This is the deterministic Layer 3 output that feeds the Layer 4 LLM call.
 */
export function buildSourceSynthesisContext(
  instance: SourceEventInstance,
  pattern: LifecyclePatternSeed,
): SynthesisContext {
  const evidenceMap = buildEvidenceMap(instance);
  const evaluator = createGateEvaluator(pattern);
  const gateEvals: GateEvaluation[] = evaluator.evaluateStage(instance.currentStage, evidenceMap);
  evaluator.evaluateAllStages(instance.currentStage, evidenceMap);
  const unmet = evaluator.unmetCriteria(instance.currentStage, evidenceMap);
  const canAdvance = evaluator.canAdvance(instance.currentStage, evidenceMap);

  const metCount = gateEvals.filter(g => g.status === 'met' || g.status === 'waived').length;
  const hardBlockers = unmet.filter(g => g.gateType === 'hard');

  // Find the stage definition for current stage guidance
  const currentStageDef = pattern.stages.find(s => s.id === instance.currentStage);

  // Missing artifacts for current stage
  const stageArtifacts = pattern.expectedArtifacts.filter(a => a.stageId === instance.currentStage);
  const presentArtifactIds = new Set(instance.artifacts.map(a => a.expectedArtifactId).filter((id): id is string => Boolean(id)));
  const missingArtifacts = stageArtifacts
    .filter(a => !presentArtifactIds.has(a.id))
    .map(a => ({
      artifactId: a.id,
      label: a.label,
      stageId: a.stageId,
      requirement: a.requirement,
      gateType: a.gateType,
      present: false,
      patternRef: {
        patternId: pattern.patternId,
        patternVersion: pattern.version,
        section: `§ Expected artifacts — ${a.stageId}`,
      },
    }));

  // Cascade impacts — delegated to the cross-instance reasoner so cascade
  // logic is computed in one place and severity scoring is consistent
  // across Source / Programs / Tower surfaces.
  const cascadeContext = computeCascadeImpacts(instance);

  // Citations: pattern stage guidance + gate criteria
  const citations = [
    {
      ref: { patternId: pattern.patternId, patternVersion: pattern.version, section: `§ Stage — ${instance.currentStage}` },
      excerpt: currentStageDef?.description ?? '',
      relevance: `Current stage definition for ${instance.currentStage}`,
    },
    ...hardBlockers.slice(0, 3).map(b => ({
      ref: b.patternRef,
      excerpt: b.evaluationHint,
      relevance: `Hard gate blocker: ${b.description}`,
    })),
  ];

  return {
    instanceId: instance.id,
    instanceType: 'source-event',
    patternId: pattern.patternId,
    patternVersion: pattern.version,
    currentStage: instance.currentStage,
    gatesSummary: {
      total: gateEvals.length,
      met: metCount,
      unmet: gateEvals.length - metCount,
      blocked: hardBlockers,
    },
    activeContradictions: createContradictionDetector(pattern).detect(evidenceMap),
    missingArtifacts,
    cascadeContext,
    citations,
    instanceSnapshot: {
      name: instance.name,
      tenantSlug: instance.tenantSlug,
      vendorCount: instance.vendors.length,
      activeVendors: instance.vendors.filter(v => v.status === 'invited-bafo' || v.status === 'shortlisted').map(v => v.name),
      riskFlags: instance.vendors.flatMap(v => v.riskFlags).filter(f => f.status === 'open').map(f => f.label),
      canAdvance,
      linkedPrograms: instance.linkedPrograms.map(lp => ({ id: lp.programId, name: lp.programName, linkType: lp.linkType })),
    },
    stageGuidance: currentStageDef?.description ?? '',
    builtAt: Date.now(),
  };
}

/**
 * Stable hash of instance state for cache key.
 * Changes when currentStage, vendor statuses, artifacts, or evidence change.
 */
export function instanceStateHash(instance: SourceEventInstance): string {
  const key = JSON.stringify({
    stage: instance.currentStage,
    vendors: instance.vendors.map(v => ({ id: v.id, status: v.status })),
    artifactCount: instance.artifacts.length,
    evidenceCount: instance.evidence.length,
  });
  // Simple djb2 hash — deterministic, no crypto needed
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
