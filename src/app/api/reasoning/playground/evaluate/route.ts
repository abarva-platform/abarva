// /api/reasoning/playground/evaluate
//
// POST { instanceId: string }
// Returns gate criterion data for the given source event instance at its
// current stage, with hasEvidence flags reflecting the actual evidence map.
//
// Used by the PlaygroundClient to reload gate data when the user picks a
// different instance from the selector.

import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';

export const dynamic = 'force-dynamic';

export interface PlaygroundCriterion {
  id: string;
  label: string;
  hint: string;
  gateType: 'hard' | 'soft';
  hasEvidence: boolean;
}

export interface PlaygroundEvaluateResponse {
  instance: {
    id: string;
    label: string;
    stageLabel: string;
  };
  criteria: PlaygroundCriterion[];
  totalMet: number;
  total: number;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: Request): Promise<Response> {
  let body: { instanceId?: string };
  try {
    body = (await req.json()) as { instanceId?: string };
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const { instanceId } = body;
  if (!instanceId) {
    return json({ error: 'instanceId is required' }, 400);
  }

  const instance = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
  if (!instance) {
    return json({ error: `Instance not found: ${instanceId}` }, 404);
  }

  const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === instance.patternId);
  if (!pattern) {
    return json({ error: `Pattern not found: ${instance.patternId}` }, 404);
  }

  const evidenceMap = buildEvidenceMap(instance);
  const evaluator = createGateEvaluator(pattern);
  const evaluations = evaluator.evaluateStage(instance.currentStage, evidenceMap);

  // Build criteria with hasEvidence from real evaluation
  const criteria: PlaygroundCriterion[] = evaluations.map((ev) => {
    const criterion = pattern.gateCriteria.find((c) => c.id === ev.criterionId);
    return {
      id: ev.criterionId,
      label: criterion?.description ?? ev.criterionId,
      hint: criterion?.evaluationHint ?? '',
      gateType: ev.gateType,
      hasEvidence: ev.status === 'met' || ev.status === 'waived',
    };
  });

  const totalMet = criteria.filter((c) => c.hasEvidence).length;

  const response: PlaygroundEvaluateResponse = {
    instance: {
      id: instance.id,
      label: instance.name,
      stageLabel: instance.currentStage,
    },
    criteria,
    totalMet,
    total: criteria.length,
  };

  return json(response);
}
