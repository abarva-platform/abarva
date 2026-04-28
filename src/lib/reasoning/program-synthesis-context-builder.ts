import type { ProgramInstance } from '@/lib/programs/program-instance';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import type { SynthesisContext } from '@/lib/reasoning/types';

/**
 * Builds a SynthesisContext from a ProgramInstance for Nexus synthesis.
 * Programs don't have typed LifecyclePatternSeed yet (REASON-3 backlog item),
 * so we derive the context directly from the instance's phase/evidence state.
 */
export function buildProgramSynthesisContext(instance: ProgramInstance): SynthesisContext {
  const evidenceMap = buildProgramEvidenceMap(instance);
  void evidenceMap; // consumed by gate evaluator when PAT-PRG patterns land (REASON-3)

  const currentPhaseDef = instance.phases.find(p => p.phaseId === instance.currentPhase);
  const prevPhase = instance.phases.find(p => p.phaseId === instance.currentPhase - 1);

  // Gate summary: use phase gate status
  const gateApproved = currentPhaseDef?.gateStatus === 'approved';

  const openBlockers = instance.flags.filter(f => f.kind === 'blocker' && f.status === 'open');
  const hardBlockers = openBlockers.map(b => ({
    criterionId: b.id,
    stageId: `P${instance.currentPhase}`,
    status: 'unmet' as const,
    gateType: 'hard' as const,
    evidence: [],
    description: b.description,
    evaluationHint: b.description,
    patternRef: { patternId: instance.patternId, patternVersion: instance.patternVersion, section: '§ Governance flags' },
    evaluatedAt: Date.now(),
  }));

  // Cross-instance cascade
  const cascadeContext = instance.linkedSourceEvents.map(link => ({
    sourceInstanceId: link.sourceEventId,
    targetInstanceId: instance.id,
    linkType: link.linkType,
    impact: link.description,
    severity: (link.linkType === 'depends-on' ? 'blocking' : 'informational') as 'blocking' | 'informational',
  }));

  const patternRef = { patternId: instance.patternId, patternVersion: instance.patternVersion, section: `§ Phase P${instance.currentPhase}` };

  return {
    instanceId: instance.id,
    instanceType: 'program',
    patternId: instance.patternId,
    patternVersion: instance.patternVersion,
    currentStage: `P${instance.currentPhase} ${currentPhaseDef?.phaseLabel ?? ''}`,
    gatesSummary: {
      total: 1,
      met: gateApproved ? 1 : 0,
      unmet: gateApproved ? 0 : 1,
      blocked: hardBlockers,
    },
    activeContradictions: [],
    missingArtifacts: instance.deliverables
      .filter(d => d.status !== 'complete' && d.status !== 'in-progress' && d.phaseId === instance.currentPhase)
      .map(d => ({
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
    instanceSnapshot: {
      name: instance.name,
      tenantSlug: instance.tenantSlug,
      currentPhase: instance.currentPhase,
      phaseLabel: currentPhaseDef?.phaseLabel ?? '',
      gateStatus: currentPhaseDef?.gateStatus ?? 'open',
      prevGateApproved: prevPhase?.gateStatus === 'approved',
      evidenceCount: instance.evidence.length,
      openBlockers: openBlockers.map(b => b.description),
      linkedSourceEvents: instance.linkedSourceEvents.map(l => ({ id: l.sourceEventId, name: l.sourceEventName, type: l.linkType })),
    },
    stageGuidance: currentPhaseDef?.phaseLabel ?? '',
    builtAt: Date.now(),
  };
}

/**
 * Hash of program instance state for cache key.
 * Changes when phase, gate status, deliverable count, evidence count, or open flag count changes.
 */
export function programInstanceStateHash(instance: ProgramInstance): string {
  const key = JSON.stringify({
    phase: instance.currentPhase,
    gateStatus: instance.phases.find(p => p.phaseId === instance.currentPhase)?.gateStatus,
    deliverableCount: instance.deliverables.length,
    evidenceCount: instance.evidence.length,
    flagCount: instance.flags.filter(f => f.status === 'open').length,
  });
  // Simple djb2 hash — deterministic, no crypto needed
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
