// POST /api/reasoning/stage-synthesis
// Body: { instanceId: string; stageId: string }
// Response: streaming plain text — focused 60–80 word LLM-generated synthesis
// of ONE stage's gates, evidence, and instance context.
//
// Where /api/source/synthesis and /api/programs/synthesis stream a 2–3 sentence
// summary of the WHOLE instance, this route streams a deeper per-stage
// explanation. Cache key includes the stageId so each stage is cached
// independently. Mirrors the ETag + 304 pattern from PR #760.

import Anthropic from '@anthropic-ai/sdk';

import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { buildEvidenceMapWithIngestions } from '@/lib/source/source-event-instance';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { buildProgramEvidenceMapWithIngestions } from '@/lib/programs/program-instance';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { instanceStateHash } from '@/lib/reasoning/synthesis-context-builder';
import { programInstanceStateHash } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeSynthesisEtag } from '@/lib/reasoning/synthesis-etag';
import { buildStageSynthesisPrompt } from '@/lib/reasoning/stage-synthesis-prompt';
import { AGENT_DEMO_SYSTEM_BLOCK } from '@/lib/agent/demo-context';
import { getUserContextPromptBlock } from '@/lib/agent/userContext';
import { FOUR_LAYER_REASONING_INSTRUCTIONS } from '@/lib/intelligence/synthesis/instructionLayer';

// Process-local cache: key → text response. Fine for the demo; production
// would use Redis. Keyed by `${instanceId}:${stageId}:${stateHash}`.
const stageSynthesisCache = new Map<string, string>();

interface ResolvedInstance {
  surface: 'source' | 'programs';
  instanceId: string;
  instanceLabel: string;
  patternId: string;
  patternVersion: string;
  stateHash: string;
  evidenceMap: Record<string, unknown>;
}

function resolveInstance(instanceId: string): ResolvedInstance | null {
  const sourceInstance = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
  if (sourceInstance) {
    return {
      surface: 'source',
      instanceId: sourceInstance.id,
      instanceLabel: sourceInstance.name,
      patternId: sourceInstance.patternId,
      patternVersion: sourceInstance.patternVersion,
      stateHash: instanceStateHash(sourceInstance),
      evidenceMap: buildEvidenceMapWithIngestions(sourceInstance),
    };
  }

  const programInstance = APEX_RETAIL_PROGRAM_INSTANCES.find(
    (i) => i.id === instanceId || i.displayId === instanceId,
  );
  if (programInstance) {
    return {
      surface: 'programs',
      instanceId: programInstance.id,
      instanceLabel: programInstance.name,
      patternId: programInstance.patternId,
      patternVersion: programInstance.patternVersion,
      stateHash: programInstanceStateHash(programInstance),
      evidenceMap: buildProgramEvidenceMapWithIngestions(programInstance),
    };
  }

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    instanceId?: string;
    stageId?: string;
  };
  const instanceId = body.instanceId;
  const stageId = body.stageId;

  if (!instanceId || !stageId) {
    return new Response(
      JSON.stringify({ error: 'instanceId and stageId are required' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const resolved = resolveInstance(instanceId);
  if (!resolved) {
    return new Response(JSON.stringify({ error: 'instance not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const pattern = findLifecyclePattern(resolved.patternId);
  if (!pattern) {
    return new Response(JSON.stringify({ error: 'pattern not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stage = pattern.stages.find((s) => s.id === stageId);
  if (!stage) {
    return new Response(
      JSON.stringify({ error: `stage ${stageId} not found in pattern ${pattern.patternId}` }),
      {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  // Evaluate the requested stage against the resolved evidence map. We use the
  // first pattern stage as the "current" anchor — for prompt construction we
  // only need gateEvaluations for `stageId`; the passed/current/blocked/
  // upcoming bucket is informational and downgrades gracefully.
  const evaluator = createGateEvaluator(pattern);
  const allEvaluations = evaluator.evaluateAllStages(
    pattern.stages[0]?.id ?? stageId,
    resolved.evidenceMap,
  );
  const evaluation = allEvaluations.find((e) => e.stageId === stageId);
  if (!evaluation) {
    return new Response(
      JSON.stringify({ error: `evaluation for stage ${stageId} not produced` }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }

  const cacheKey = `${resolved.instanceId}:${stageId}:${resolved.stateHash}`;
  const etag = computeSynthesisEtag(cacheKey);
  const ifNoneMatch = request.headers.get('if-none-match');
  const cached = stageSynthesisCache.get(cacheKey);

  // Conditional 304 — client already has this exact synthesis.
  if (cached && ifNoneMatch && ifNoneMatch === etag) {
    return new Response(null, {
      status: 304,
      headers: {
        ETag: etag,
        'X-Cache': 'HIT',
      },
    });
  }

  if (cached) {
    return new Response(cached, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        ETag: etag,
        'X-Cache': 'HIT',
      },
    });
  }

  const prompt = buildStageSynthesisPrompt({
    stageId,
    evaluation,
    pattern,
    instanceLabel: resolved.instanceLabel,
    surface: resolved.surface,
  });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // F0.2 Layer 0 — composed AFTER role/voice (prompt.system) and BEFORE
  // demo/knowledge block.
  const userContextBlock = await getUserContextPromptBlock();
  const composedSystem = [
    prompt.system,
    userContextBlock,
    FOUR_LAYER_REASONING_INSTRUCTIONS,
    AGENT_DEMO_SYSTEM_BLOCK,
  ]
    .filter((s) => s && s.trim().length > 0)
    .join('\n\n');
  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: composedSystem,
    messages: [{ role: 'user', content: prompt.user }],
  });

  const encoder = new TextEncoder();
  let accumulated = '';

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          accumulated += chunk.delta.text;
          controller.enqueue(encoder.encode(chunk.delta.text));
        }
      }
      if (accumulated) {
        stageSynthesisCache.set(cacheKey, accumulated);
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      ETag: etag,
      'X-Cache': 'MISS',
    },
  });
}
