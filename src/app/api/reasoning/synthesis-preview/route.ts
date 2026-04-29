// GET /api/reasoning/synthesis-preview?instanceId=xxx
//
// Returns a fully-assembled synthesis preview for a single instance.
// Builds the SynthesisContext using the deterministic Layer-3 pipeline
// (gate evaluator + contradiction detector + failure-mode detector +
// cascade reasoner), then assembles a readable L4 assessment from the
// structured data: health grade, confidence, stage micro-synthesis per
// stage, gate summary, contradiction summary, failure modes, and
// recommended actions.
//
// No LLM call — the output is deterministic and stable across renders.

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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// ─── Serializable response shape ──────────────────────────────────────────────

export interface SynthesisPreviewResponse {
  instanceId: string;
  instanceLabel: string;
  instanceType: 'source-event' | 'program';
  patternId: string;
  currentStage: string;
  builtAt: number;

  health: {
    grade: 'green' | 'amber' | 'red';
    score: number;
    summary: string;
    reasons: string[];
  };

  confidence: {
    score: number;
    grade: 'high' | 'medium' | 'low';
    factors: string[];
  };

  gates: {
    total: number;
    met: number;
    unmet: number;
    blockers: Array<{
      criterionId: string;
      description: string;
      evaluationHint: string;
      gateType: 'hard' | 'soft';
      stageId: string;
    }>;
  };

  contradictions: Array<{
    templateId: string;
    label: string;
    severity: 'low' | 'medium' | 'high';
    confidence: number;
    partyA: string;
    partyB: string;
    resolutionPath: string;
  }>;

  failureModes: Array<{
    failureModeId: string;
    label: string;
    confidence: number;
    description: string;
  }>;

  cascadeImpacts: Array<{
    sourceInstanceId: string;
    targetInstanceId: string;
    linkType: string;
    severity: string;
  }>;

  missingArtifacts: Array<{
    artifactId: string;
    label: string;
    stageId: string;
    gateType: 'hard' | 'soft';
    requirement: 'required' | 'recommended' | 'optional';
  }>;

  stageMicroSynthesis: Record<string, string>;

  stageGuidance: string;

  /** Full narrative assessment assembled from the structured data above. */
  narrative: string;

  citations: Array<{
    patternId: string;
    patternVersion: string;
    section: string;
    excerpt: string;
    relevance: string;
  }>;
}

// ─── Narrative builder ─────────────────────────────────────────────────────────

function buildNarrative(data: Omit<SynthesisPreviewResponse, 'narrative'>): string {
  const lines: string[] = [];

  // Lede: identity + health
  lines.push(
    `${data.instanceLabel} (${data.instanceType === 'source-event' ? 'source event' : 'program'}) ` +
    `is currently at stage ${data.currentStage} under pattern ${data.patternId}.`,
  );

  // Health summary
  lines.push(
    `Health: ${data.health.grade.toUpperCase()} (score ${data.health.score}/100). ` +
    data.health.summary,
  );

  // Confidence
  lines.push(
    `Synthesis confidence: ${data.confidence.grade} (${data.confidence.score}/100). ` +
    (data.confidence.factors.length > 0
      ? data.confidence.factors.join(' ')
      : 'No confidence penalties.'),
  );

  // Gate summary
  const { gates } = data;
  lines.push(
    `Gate summary: ${gates.met} of ${gates.total} criteria met; ${gates.unmet} unmet.`,
  );
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

  // Contradictions
  if (data.contradictions.length > 0) {
    const high = data.contradictions.filter((c) => c.severity === 'high');
    const medium = data.contradictions.filter((c) => c.severity === 'medium');
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
    // Resolution paths for high-severity
    for (const c of high.slice(0, 2)) {
      if (c.resolutionPath) {
        lines.push(`Resolution path for "${c.label}": ${c.resolutionPath}`);
      }
    }
    void medium; // referenced for scoping; stats already captured above
  } else {
    lines.push('Contradictions: none detected.');
  }

  // Failure modes
  if (data.failureModes.length > 0) {
    lines.push(
      `Failure mode detections (${data.failureModes.length}): ` +
      data.failureModes.slice(0, 3).map((f) => `${f.label} (confidence ${(f.confidence * 100).toFixed(0)}%)`).join('; ') +
      (data.failureModes.length > 3 ? ` …and ${data.failureModes.length - 3} more.` : '.'),
    );
  }

  // Missing artifacts
  if (data.missingArtifacts.length > 0) {
    const hard = data.missingArtifacts.filter((a) => a.gateType === 'hard');
    lines.push(
      `Missing artifacts: ${data.missingArtifacts.length} total` +
      (hard.length > 0 ? `, ${hard.length} hard-gate` : '') +
      '. ' +
      hard.slice(0, 3).map((a) => a.label).join(', ') +
      (data.missingArtifacts.length > hard.length ? ` …plus ${data.missingArtifacts.length - hard.length} soft/recommended.` : '.'),
    );
  }

  // Cascade
  if (data.cascadeImpacts.length > 0) {
    const blocking = data.cascadeImpacts.filter((c) => c.severity === 'blocking');
    lines.push(
      `Cascade impacts: ${data.cascadeImpacts.length} downstream link${data.cascadeImpacts.length === 1 ? '' : 's'}` +
      (blocking.length > 0 ? ` (${blocking.length} blocking)` : '') +
      '.',
    );
  }

  // Stage guidance
  if (data.stageGuidance) {
    lines.push(`Stage guidance: ${data.stageGuidance}`);
  }

  // Recommended action — derived from blockers or confidence
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

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instanceId = searchParams.get('instanceId');

  if (!instanceId) {
    return Response.json({ error: 'instanceId is required' }, { status: 400 });
  }

  // Try source events first
  const sourceInst = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
  if (sourceInst) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === sourceInst.patternId);
    if (!pattern) {
      return Response.json({ error: `No pattern found for patternId ${sourceInst.patternId}` }, { status: 404 });
    }

    const ctx = buildSourceSynthesisContext(sourceInst, pattern);
    const health = computeInstanceHealth(ctx);
    const confidence = computeSynthesisConfidence(ctx);

    const evidenceMap = typeof buildEvidenceMapWithIngestions === 'function'
      ? buildEvidenceMapWithIngestions(sourceInst)
      : buildEvidenceMap(sourceInst);
    const evaluator = createGateEvaluator(pattern);
    const allStageEvals = evaluator.evaluateAllStages(sourceInst.currentStage, evidenceMap);
    const stageMicroSynthesis = buildStageMicroSynthesisMap(allStageEvals, pattern);

    const partialData: Omit<SynthesisPreviewResponse, 'narrative'> = {
      instanceId: sourceInst.id,
      instanceLabel: sourceInst.name,
      instanceType: 'source-event',
      patternId: ctx.patternId,
      currentStage: ctx.currentStage,
      builtAt: ctx.builtAt,
      health: {
        grade: health.grade,
        score: health.score,
        summary: health.summary,
        reasons: health.reasons,
      },
      confidence: {
        score: confidence.score,
        grade: confidence.grade,
        factors: confidence.factors,
      },
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

    const narrative = buildNarrative(partialData);
    return Response.json({ ...partialData, narrative } satisfies SynthesisPreviewResponse);
  }

  // Try program instances
  const programInst = APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === instanceId);
  if (programInst) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === programInst.patternId);
    const ctx = buildProgramSynthesisContext(programInst, pattern);
    const health = computeInstanceHealth(ctx);
    const confidence = computeSynthesisConfidence(ctx);

    // Stage micro-synthesis for programs: requires pattern
    let stageMicroSynthesis: Record<string, string> = {};
    if (pattern) {
      const evidenceMap = buildProgramEvidenceMapWithIngestions(programInst);
      const evaluator = createGateEvaluator(pattern);
      const allStageEvals = evaluator.evaluateAllStages(ctx.currentStage, evidenceMap);
      stageMicroSynthesis = buildStageMicroSynthesisMap(allStageEvals, pattern);
    }

    const partialData: Omit<SynthesisPreviewResponse, 'narrative'> = {
      instanceId: programInst.id,
      instanceLabel: programInst.name,
      instanceType: 'program',
      patternId: ctx.patternId,
      currentStage: ctx.currentStage,
      builtAt: ctx.builtAt,
      health: {
        grade: health.grade,
        score: health.score,
        summary: health.summary,
        reasons: health.reasons,
      },
      confidence: {
        score: confidence.score,
        grade: confidence.grade,
        factors: confidence.factors,
      },
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

    const narrative = buildNarrative(partialData);
    return Response.json({ ...partialData, narrative } satisfies SynthesisPreviewResponse);
  }

  return Response.json({ error: `Instance not found: ${instanceId}` }, { status: 404 });
}
