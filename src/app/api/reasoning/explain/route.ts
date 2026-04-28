// GET /api/reasoning/explain?surface=source|programs|tower&instanceId=...
//
// Returns the full reasoning trace for a synthesis quote: every gate criterion
// evaluated, every contradiction template tested, every failure mode template
// tested, plus citations and cascade impacts. This is the auditor's view of
// the Layer 3 → Layer 4 handoff for a given instance.
//
// Cache-Control: no-store. The response shape is debug-y and we want fresh
// reads when an authoring change lands.

import { NextResponse } from 'next/server';

import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import {
  APEX_RETAIL_PROGRAM_INSTANCES,
} from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { buildTowerSynthesisContext } from '@/lib/reasoning/tower-synthesis-context-builder';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import {
  buildEvidenceMap,
  buildEvidenceMapWithIngestions,
} from '@/lib/source/source-event-instance';
import { buildProgramEvidenceMapWithIngestions } from '@/lib/programs/program-instance';
import {
  serializeSynthesisExplanation,
  type ContradictionTemplateLite,
  type ExplanationPayload,
  type FailureModeTemplateLite,
} from '@/lib/reasoning/explanation-serializer';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import type { GateEvaluation } from '@/lib/reasoning/types';

type Surface = 'source' | 'programs' | 'tower';

function jsonError(status: number, message: string) {
  return new NextResponse(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function jsonOk(payload: ExplanationPayload) {
  return new NextResponse(JSON.stringify(payload), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

function describeCriteria(pattern: LifecyclePatternSeed) {
  const map = new Map<string, { description: string; evaluationHint: string }>();
  for (const c of pattern.gateCriteria) {
    map.set(c.id, {
      description: c.description,
      evaluationHint: c.evaluationHint,
    });
  }
  return map;
}

function templatesForPattern(pattern: LifecyclePatternSeed): {
  contradictions: ContradictionTemplateLite[];
  failureModes: FailureModeTemplateLite[];
} {
  return {
    contradictions: pattern.contradictionTemplates.map((t) => ({
      id: t.id,
      label: t.label,
      severity: t.severity,
      partyA: t.partyA,
      partyB: t.partyB,
      resolutionPath: t.resolutionPath,
    })),
    failureModes: pattern.failureModes.map((f) => ({
      id: f.id,
      label: f.label,
      description: f.description,
      stages: f.stages,
      mitigations: f.mitigations,
    })),
  };
}

function resolveSourcePattern(patternId: string): LifecyclePatternSeed | undefined {
  return SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === patternId);
}

function resolveProgramPattern(patternId: string): LifecyclePatternSeed | undefined {
  return PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === patternId);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surface = url.searchParams.get('surface') as Surface | null;
  const instanceId = url.searchParams.get('instanceId');

  if (!surface || !['source', 'programs', 'tower'].includes(surface)) {
    return jsonError(400, "surface must be 'source', 'programs', or 'tower'");
  }
  if (!instanceId) {
    return jsonError(400, 'instanceId is required');
  }

  if (surface === 'source') {
    const instance = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
    if (!instance) return jsonError(404, `source-event ${instanceId} not found`);

    const pattern = resolveSourcePattern(instance.patternId);
    if (!pattern) {
      return jsonError(
        404,
        `source pattern ${instance.patternId} not registered in SOURCE_LIFECYCLE_PATTERNS`,
      );
    }

    const context = buildSourceSynthesisContext(instance, pattern);
    const evidenceMap = typeof buildEvidenceMapWithIngestions === 'function'
      ? buildEvidenceMapWithIngestions(instance)
      : buildEvidenceMap(instance);
    const evaluator = createGateEvaluator(pattern);
    // Every criterion at every stage — this gives the drawer the complete
    // rule-by-rule trace, not just the current stage.
    const allStages = evaluator.evaluateAllStages(instance.currentStage, evidenceMap);
    const gateEvaluations: GateEvaluation[] = allStages.flatMap((s) => s.gateEvaluations);
    const { contradictions, failureModes } = templatesForPattern(pattern);

    const payload = serializeSynthesisExplanation({
      surface,
      context,
      gateEvaluations,
      criterionDescriptions: describeCriteria(pattern),
      contradictionTemplates: contradictions,
      failureModeTemplates: failureModes,
    });
    return jsonOk(payload);
  }

  if (surface === 'programs') {
    const instance = APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === instanceId);
    if (!instance) return jsonError(404, `program ${instanceId} not found`);

    const pattern = resolveProgramPattern(instance.patternId);
    const context = buildProgramSynthesisContext(instance, pattern);
    let gateEvaluations: GateEvaluation[] = [];
    let criterionDescriptions: Map<string, { description: string; evaluationHint: string }> | undefined;
    let contradictionTemplates: ContradictionTemplateLite[] = [];
    let failureModeTemplates: FailureModeTemplateLite[] = [];

    if (pattern) {
      const evidenceMap = buildProgramEvidenceMapWithIngestions(instance);
      const evaluator = createGateEvaluator(pattern);
      const stageId = `P${instance.currentPhase}-${
        ['Originate', 'Discovery', 'Synthesis', 'Design', 'Build', 'Activate', 'Operate'][
          instance.currentPhase
        ] ?? ''
      }`;
      // Walk every stage so the drawer can render the full lifecycle trace.
      const allStages = evaluator.evaluateAllStages(stageId, evidenceMap);
      gateEvaluations = allStages.flatMap((s) => s.gateEvaluations);
      criterionDescriptions = describeCriteria(pattern);
      const t = templatesForPattern(pattern);
      contradictionTemplates = t.contradictions;
      failureModeTemplates = t.failureModes;
    }

    const payload = serializeSynthesisExplanation({
      surface,
      context,
      gateEvaluations,
      criterionDescriptions,
      contradictionTemplates,
      failureModeTemplates,
    });
    return jsonOk(payload);
  }

  // surface === 'tower'
  // The Tower context aggregates the entire portfolio. Convention: any
  // instanceId with prefix 'tower' is accepted (e.g. 'tower' or 'tower:apex').
  if (!instanceId.startsWith('tower')) {
    return jsonError(404, `tower instanceId must start with 'tower'`);
  }
  const programInstances = APEX_RETAIL_PROGRAM_INSTANCES;
  const sourceEventInstances = SOURCE_EVENT_INSTANCES;
  const context = buildTowerSynthesisContext(programInstances, sourceEventInstances);

  // Tower has no single governing pattern — gate evaluations are aggregated
  // upstream into `gatesSummary.blocked`. We surface those as the trace
  // gate-rows so the drawer still shows rule-by-rule context.
  const gateEvaluations: GateEvaluation[] = context.gatesSummary.blocked.map((b) => ({
    criterionId: b.criterionId,
    stageId: b.stageId,
    status: b.status,
    gateType: b.gateType,
    evidence: b.evidence,
    patternRef: b.patternRef,
    evaluatedAt: b.evaluatedAt,
  }));
  const criterionDescriptions = new Map<
    string,
    { description: string; evaluationHint: string }
  >();
  for (const b of context.gatesSummary.blocked) {
    criterionDescriptions.set(b.criterionId, {
      description: b.description,
      evaluationHint: b.evaluationHint,
    });
  }

  const payload = serializeSynthesisExplanation({
    surface,
    context,
    gateEvaluations,
    criterionDescriptions,
    contradictionTemplates: [],
    failureModeTemplates: [],
  });
  return jsonOk(payload);
}
