// /admin/reasoning/synthesis-preview — L4 synthesis output viewer.
//
// Server component. Loads all source + program instances, pre-computes the
// synthesis context for the first instance as the default, and passes the
// serialized list to the client component for the instance selector.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { buildStageMicroSynthesisMap } from '@/lib/reasoning/stage-micro-synthesis';
import {
  buildEvidenceMapWithIngestions,
  buildEvidenceMap,
} from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMapWithIngestions } from '@/lib/programs/program-instance';
import { SynthesisPreviewClient } from './SynthesisPreviewClient';
import type { SynthesisPreviewResponse } from '@/app/api/reasoning/synthesis-preview/route';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Synthesis preview · AbarVa Admin',
};

// ─── Instance list item (safe to serialize) ────────────────────────────────────

export interface InstanceListItem {
  id: string;
  label: string;
  type: 'SOURCE' | 'PROGRAM';
  currentStage: string;
}

// ─── Build default synthesis data for the first instance ──────────────────────

function buildDefaultSynthesis(
  instances: InstanceListItem[],
): SynthesisPreviewResponse | null {
  const first = instances[0];
  if (!first) return null;

  if (first.type === 'SOURCE') {
    const inst = SOURCE_EVENT_INSTANCES.find((i) => i.id === first.id);
    if (!inst) return null;
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) return null;

    const ctx = buildSourceSynthesisContext(inst, pattern);
    const health = computeInstanceHealth(ctx);
    const confidence = computeSynthesisConfidence(ctx);

    const evidenceMap = typeof buildEvidenceMapWithIngestions === 'function'
      ? buildEvidenceMapWithIngestions(inst)
      : buildEvidenceMap(inst);
    const evaluator = createGateEvaluator(pattern);
    const allStageEvals = evaluator.evaluateAllStages(inst.currentStage, evidenceMap);
    const stageMicroSynthesis = buildStageMicroSynthesisMap(allStageEvals, pattern);

    const partialData: Omit<SynthesisPreviewResponse, 'narrative'> = {
      instanceId: inst.id,
      instanceLabel: inst.name,
      instanceType: 'source-event',
      patternId: ctx.patternId,
      currentStage: ctx.currentStage,
      builtAt: ctx.builtAt,
      health: { grade: health.grade, score: health.score, summary: health.summary, reasons: health.reasons },
      confidence: { score: confidence.score, grade: confidence.grade, factors: confidence.factors },
      gates: {
        total: ctx.gatesSummary.total,
        met: ctx.gatesSummary.met,
        unmet: ctx.gatesSummary.unmet,
        blockers: ctx.gatesSummary.blocked.map((b) => ({
          criterionId: b.criterionId,
          description: b.description,
          evaluationHint: b.evaluationHint,
          gateType: b.gateType,
          stageId: b.stageId,
        })),
      },
      contradictions: ctx.activeContradictions.map((c) => ({
        templateId: c.templateId,
        label: c.label,
        severity: c.severity,
        confidence: c.confidence,
        partyA: c.partyA,
        partyB: c.partyB,
        resolutionPath: c.resolutionPath,
      })),
      failureModes: ctx.failureModes.map((f) => ({
        failureModeId: f.failureModeId,
        label: f.label,
        confidence: f.confidence,
        description: f.description,
      })),
      cascadeImpacts: ctx.cascadeContext.map((c) => ({
        sourceInstanceId: c.sourceInstanceId,
        targetInstanceId: c.targetInstanceId,
        linkType: c.linkType,
        severity: c.severity,
      })),
      missingArtifacts: ctx.missingArtifacts.map((a) => ({
        artifactId: a.artifactId,
        label: a.label,
        stageId: a.stageId,
        gateType: a.gateType,
        requirement: a.requirement,
      })),
      stageMicroSynthesis,
      stageGuidance: ctx.stageGuidance,
      citations: ctx.citations.map((c) => ({
        patternId: c.ref.patternId,
        patternVersion: c.ref.patternVersion,
        section: c.ref.section,
        excerpt: c.excerpt,
        relevance: c.relevance,
      })),
    };

    return {
      ...partialData,
      narrative: buildNarrative(partialData),
    };
  }

  // PROGRAM
  const inst = APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === first.id);
  if (!inst) return null;
  const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
  const ctx = buildProgramSynthesisContext(inst, pattern);
  const health = computeInstanceHealth(ctx);
  const confidence = computeSynthesisConfidence(ctx);

  let stageMicroSynthesis: Record<string, string> = {};
  if (pattern) {
    const evidenceMap = buildProgramEvidenceMapWithIngestions(inst);
    const evaluator = createGateEvaluator(pattern);
    const allStageEvals = evaluator.evaluateAllStages(ctx.currentStage, evidenceMap);
    stageMicroSynthesis = buildStageMicroSynthesisMap(allStageEvals, pattern);
  }

  const partialData: Omit<SynthesisPreviewResponse, 'narrative'> = {
    instanceId: inst.id,
    instanceLabel: inst.name,
    instanceType: 'program',
    patternId: ctx.patternId,
    currentStage: ctx.currentStage,
    builtAt: ctx.builtAt,
    health: { grade: health.grade, score: health.score, summary: health.summary, reasons: health.reasons },
    confidence: { score: confidence.score, grade: confidence.grade, factors: confidence.factors },
    gates: {
      total: ctx.gatesSummary.total,
      met: ctx.gatesSummary.met,
      unmet: ctx.gatesSummary.unmet,
      blockers: ctx.gatesSummary.blocked.map((b) => ({
        criterionId: b.criterionId,
        description: b.description,
        evaluationHint: b.evaluationHint,
        gateType: b.gateType,
        stageId: b.stageId,
      })),
    },
    contradictions: ctx.activeContradictions.map((c) => ({
      templateId: c.templateId,
      label: c.label,
      severity: c.severity,
      confidence: c.confidence,
      partyA: c.partyA,
      partyB: c.partyB,
      resolutionPath: c.resolutionPath,
    })),
    failureModes: ctx.failureModes.map((f) => ({
      failureModeId: f.failureModeId,
      label: f.label,
      confidence: f.confidence,
      description: f.description,
    })),
    cascadeImpacts: ctx.cascadeContext.map((c) => ({
      sourceInstanceId: c.sourceInstanceId,
      targetInstanceId: c.targetInstanceId,
      linkType: c.linkType,
      severity: c.severity,
    })),
    missingArtifacts: ctx.missingArtifacts.map((a) => ({
      artifactId: a.artifactId,
      label: a.label,
      stageId: a.stageId,
      gateType: a.gateType,
      requirement: a.requirement,
    })),
    stageMicroSynthesis,
    stageGuidance: ctx.stageGuidance,
    citations: ctx.citations.map((c) => ({
      patternId: c.ref.patternId,
      patternVersion: c.ref.patternVersion,
      section: c.ref.section,
      excerpt: c.excerpt,
      relevance: c.relevance,
    })),
  };

  return {
    ...partialData,
    narrative: buildNarrative(partialData),
  };
}

// ─── Narrative builder (duplicated from route.ts for server-side default) ──────

function buildNarrative(data: Omit<SynthesisPreviewResponse, 'narrative'>): string {
  const lines: string[] = [];

  lines.push(
    `${data.instanceLabel} (${data.instanceType === 'source-event' ? 'source event' : 'program'}) ` +
    `is currently at stage ${data.currentStage} under pattern ${data.patternId}.`,
  );
  lines.push(
    `Health: ${data.health.grade.toUpperCase()} (score ${data.health.score}/100). ` +
    data.health.summary,
  );
  lines.push(
    `Synthesis confidence: ${data.confidence.grade} (${data.confidence.score}/100). ` +
    (data.confidence.factors.length > 0
      ? data.confidence.factors.join(' ')
      : 'No confidence penalties.'),
  );
  const { gates } = data;
  lines.push(`Gate summary: ${gates.met} of ${gates.total} criteria met; ${gates.unmet} unmet.`);
  if (gates.blockers.length > 0) {
    const hardBlockers = gates.blockers.filter((b) => b.gateType === 'hard');
    if (hardBlockers.length > 0) {
      lines.push(
        `Hard blockers (${hardBlockers.length}): ` +
        hardBlockers.slice(0, 3).map((b) => b.description).join('; ') +
        (hardBlockers.length > 3 ? ` …and ${hardBlockers.length - 3} more` : '.'),
      );
    }
  }
  if (data.contradictions.length > 0) {
    const high = data.contradictions.filter((c) => c.severity === 'high');
    lines.push(
      `Contradictions: ${data.contradictions.length} active` +
      (high.length > 0 ? ` (${high.length} high-severity)` : '') +
      '. ' +
      data.contradictions
        .slice(0, 2)
        .map((c) => `${c.label} [${c.severity}] between ${c.partyA} and ${c.partyB}`)
        .join('; ') +
      (data.contradictions.length > 2 ? ` …and ${data.contradictions.length - 2} more.` : '.'),
    );
    for (const c of high.slice(0, 2)) {
      if (c.resolutionPath) {
        lines.push(`Resolution path for "${c.label}": ${c.resolutionPath}`);
      }
    }
  } else {
    lines.push('Contradictions: none detected.');
  }
  if (data.failureModes.length > 0) {
    lines.push(
      `Failure mode detections (${data.failureModes.length}): ` +
      data.failureModes.slice(0, 3).map((f) => `${f.label} (confidence ${(f.confidence * 100).toFixed(0)}%)`).join('; ') +
      (data.failureModes.length > 3 ? ` …and ${data.failureModes.length - 3} more.` : '.'),
    );
  }
  if (data.missingArtifacts.length > 0) {
    const hard = data.missingArtifacts.filter((a) => a.gateType === 'hard');
    lines.push(
      `Missing artifacts: ${data.missingArtifacts.length} total` +
      (hard.length > 0 ? `, ${hard.length} hard-gate` : '') +
      '. ' +
      hard.slice(0, 3).map((a) => a.label).join(', ') +
      (data.missingArtifacts.length > hard.length
        ? ` …plus ${data.missingArtifacts.length - hard.length} soft/recommended.`
        : '.'),
    );
  }
  if (data.cascadeImpacts.length > 0) {
    const blocking = data.cascadeImpacts.filter((c) => c.severity === 'blocking');
    lines.push(
      `Cascade impacts: ${data.cascadeImpacts.length} downstream link${data.cascadeImpacts.length === 1 ? '' : 's'}` +
      (blocking.length > 0 ? ` (${blocking.length} blocking)` : '') +
      '.',
    );
  }
  if (data.stageGuidance) {
    lines.push(`Stage guidance: ${data.stageGuidance}`);
  }
  const topBlocker = gates.blockers.find((b) => b.gateType === 'hard');
  if (topBlocker) {
    lines.push(`Recommended action: ${topBlocker.evaluationHint || `Address gate "${topBlocker.description}" to unblock stage advance.`}`);
  } else if (data.contradictions.length > 0) {
    const topC = data.contradictions.find((c) => c.severity === 'high') ?? data.contradictions[0];
    lines.push(`Recommended action: resolve "${topC.label}" contradiction between ${topC.partyA} and ${topC.partyB}.`);
  } else {
    lines.push('Recommended action: no hard blockers detected — confirm all soft gates and advance when ready.');
  }

  return lines.join('\n\n');
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SynthesisPreviewPage() {
  const instances: InstanceListItem[] = [
    ...SOURCE_EVENT_INSTANCES.map((i) => ({
      id: i.id,
      label: i.name,
      type: 'SOURCE' as const,
      currentStage: i.currentStage,
    })),
    ...APEX_RETAIL_PROGRAM_INSTANCES.map((i) => ({
      id: i.id,
      label: i.name,
      type: 'PROGRAM' as const,
      currentStage: `P${i.currentPhase}`,
    })),
  ];

  const defaultData = buildDefaultSynthesis(instances);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Health Board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Synthesis preview"
        subtitle="L4 synthesis output for a selected instance — the reasoning layer's assessment of each instance."
      >
        <SynthesisPreviewClient instances={instances} defaultData={defaultData} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
