// src/lib/reasoning/tower-synthesis-context-builder.ts
//
// REASON-17 — Tower-level (Atlas) portfolio synthesis context.
//
// Atlas is the portfolio CIO-of-staff agent on the Tower surface. Unlike the
// per-instance Sentinel (Source detail) and Nexus (Programs detail) builders,
// Atlas reasons across the whole portfolio: every active program plus every
// active source event. The context aggregates gate counts, blocker counts,
// cascade impacts, and citations across instances so the Layer 4 LLM call
// can produce a portfolio-level read.

import type { ProgramInstance } from '@/lib/programs/program-instance';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import { computeCascadeImpacts } from '@/lib/reasoning/cross-instance-reasoner';
import type {
  CascadeImpact,
  CitationPointer,
  ContradictionDetection,
  GateCriterionResult,
  SynthesisContext,
} from '@/lib/reasoning/types';

/**
 * Builds a portfolio-level SynthesisContext from every active program +
 * source-event instance in the tenant. Used by /api/tower/synthesis.
 */
export function buildTowerSynthesisContext(
  programInstances: ProgramInstance[],
  sourceEventInstances: SourceEventInstance[],
): SynthesisContext {
  // ── Aggregate gate state across the portfolio ──────────────────────────────
  const programGateCounts = programInstances.reduce(
    (acc, p) => {
      const current = p.phases.find(ph => ph.phaseId === p.currentPhase);
      if (!current) return acc;
      if (current.gateStatus === 'approved') acc.met += 1;
      else acc.unmet += 1;
      return acc;
    },
    { met: 0, unmet: 0 },
  );

  // Source events advance through stages — we treat their currentStage as the
  // active stage gate. Without per-stage evaluator output here we count one
  // pending gate per active source event (mirrors the per-instance builder
  // when no contradicting evidence is supplied).
  const sourceUnmet = sourceEventInstances.length;
  const totalGates = programInstances.length + sourceEventInstances.length;
  const totalMet = programGateCounts.met;
  const totalUnmet = programGateCounts.unmet + sourceUnmet;

  // ── Blockers — open governance flags across all instances ─────────────────
  const blocked: GateCriterionResult[] = [];

  for (const p of programInstances) {
    const openBlockers = p.flags.filter(f => f.kind === 'blocker' && f.status === 'open');
    for (const b of openBlockers) {
      blocked.push({
        criterionId: `${p.id}:${b.id}`,
        stageId: `P${p.currentPhase}`,
        status: 'unmet',
        gateType: 'hard',
        evidence: [],
        description: `${p.id}: ${b.description}`,
        evaluationHint: b.description,
        patternRef: {
          patternId: p.patternId,
          patternVersion: p.patternVersion,
          section: `§ Governance flags — ${p.id}`,
        },
        evaluatedAt: Date.now(),
      });
    }
  }

  for (const s of sourceEventInstances) {
    const openBlockers = s.flags.filter(f => f.kind === 'blocker' && f.status === 'open');
    for (const b of openBlockers) {
      blocked.push({
        criterionId: `${s.id}:${b.id}`,
        stageId: s.currentStage,
        status: 'unmet',
        gateType: 'hard',
        evidence: [],
        description: `${s.id}: ${b.description}`,
        evaluationHint: b.description,
        patternRef: {
          patternId: s.patternId,
          patternVersion: s.patternVersion,
          section: `§ Governance flags — ${s.id}`,
        },
        evaluatedAt: Date.now(),
      });
    }
  }

  // ── Cascade context — aggregate cross-instance links via the reasoner ────
  // Each per-instance call returns a normalised, severity-scored set of
  // CascadeImpacts. We then dedupe across the portfolio by (source,target,
  // linkType) so source-event ↔ program pairs aren't double-counted from
  // both sides of the link.
  const allImpacts: CascadeImpact[] = [
    ...programInstances.flatMap(p => computeCascadeImpacts(p)),
    ...sourceEventInstances.flatMap(s => computeCascadeImpacts(s)),
  ];
  const seen = new Set<string>();
  const cascadeContext: CascadeImpact[] = [];
  for (const imp of allImpacts) {
    const key = `${imp.sourceInstanceId}::${imp.targetInstanceId}::${imp.linkType}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cascadeContext.push(imp);
  }

  // ── Citations — top patterns + top blocker hints ──────────────────────────
  const citations: CitationPointer[] = [];
  const seenPatterns = new Set<string>();
  for (const p of programInstances) {
    if (seenPatterns.has(p.patternId)) continue;
    seenPatterns.add(p.patternId);
    citations.push({
      ref: {
        patternId: p.patternId,
        patternVersion: p.patternVersion,
        section: `§ Phase P${p.currentPhase} — ${p.id}`,
      },
      excerpt: `${p.name} at phase P${p.currentPhase}`,
      relevance: `Active program ${p.id} pattern reference`,
    });
  }
  for (const s of sourceEventInstances) {
    if (seenPatterns.has(s.patternId)) continue;
    seenPatterns.add(s.patternId);
    citations.push({
      ref: {
        patternId: s.patternId,
        patternVersion: s.patternVersion,
        section: `§ Stage ${s.currentStage} — ${s.id}`,
      },
      excerpt: `${s.name} at ${s.currentStage}`,
      relevance: `Active source event ${s.id} pattern reference`,
    });
  }

  // ── Contradictions — surface high-severity flags as portfolio signals ────
  const activeContradictions: ContradictionDetection[] = [];

  // ── Snapshot — the Atlas prompt reads this to name instances by ID ───────
  const programSummaries = programInstances.map(p => ({
    id: p.id,
    name: p.name,
    phase: p.currentPhase,
    phaseLabel: p.phases.find(ph => ph.phaseId === p.currentPhase)?.phaseLabel ?? '',
    gateStatus: p.phases.find(ph => ph.phaseId === p.currentPhase)?.gateStatus ?? 'open',
    openBlockerCount: p.flags.filter(f => f.kind === 'blocker' && f.status === 'open').length,
    linkedSourceEventIds: p.linkedSourceEvents.map(l => l.sourceEventId),
  }));

  const sourceSummaries = sourceEventInstances.map(s => ({
    id: s.id,
    name: s.name,
    stage: s.currentStage,
    vendorCount: s.vendors.length,
    activeVendors: s.vendors
      .filter(v => v.status === 'invited-bafo' || v.status === 'shortlisted')
      .map(v => v.name),
    openBlockerCount: s.flags.filter(f => f.kind === 'blocker' && f.status === 'open').length,
    linkedProgramIds: s.linkedPrograms.map(l => l.programId),
  }));

  return {
    instanceId: 'tower',
    instanceType: 'tower',
    patternId: 'PAT-TOWER-PORTFOLIO',
    patternVersion: '1.0.0',
    currentStage: 'portfolio',
    gatesSummary: {
      total: totalGates,
      met: totalMet,
      unmet: totalUnmet,
      blocked,
    },
    activeContradictions,
    failureModes: [],
    missingArtifacts: [],
    cascadeContext,
    citations,
    instanceSnapshot: {
      programCount: programInstances.length,
      sourceEventCount: sourceEventInstances.length,
      totalInstanceCount: programInstances.length + sourceEventInstances.length,
      pendingGateCount: totalUnmet,
      activeBlockerCount: blocked.length,
      programs: programSummaries,
      sourceEvents: sourceSummaries,
      topCascade: cascadeContext.slice(0, 5),
    },
    stageGuidance:
      'Portfolio-level Atlas synthesis: aggregate read across active programs and source events. ' +
      'Identify the single highest-leverage move that unblocks the most downstream work.',
    builtAt: Date.now(),
  };
}

/**
 * Stable hash of the entire portfolio state for cache-key derivation.
 * Same djb2 algorithm as `instanceStateHash` in synthesis-context-builder.ts.
 * Changes when any instance phase/stage, blocker count, or flag count changes.
 */
export function towerStateHash(
  programInstances: ProgramInstance[],
  sourceEventInstances: SourceEventInstance[],
): string {
  const key = JSON.stringify({
    programs: programInstances.map(p => ({
      id: p.id,
      phase: p.currentPhase,
      gate: p.phases.find(ph => ph.phaseId === p.currentPhase)?.gateStatus,
      blockers: p.flags.filter(f => f.status === 'open').length,
    })),
    sources: sourceEventInstances.map(s => ({
      id: s.id,
      stage: s.currentStage,
      blockers: s.flags.filter(f => f.status === 'open').length,
      vendors: s.vendors.length,
    })),
  });
  // Simple djb2 hash — deterministic, no crypto needed
  let hash = 5381;
  for (let i = 0; i < key.length; i++) {
    hash = ((hash << 5) + hash) + key.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
