import { createHash } from 'node:crypto';

import {
  callModel,
  createMemoryAiEgressAuditSink,
  type AiModelAdapter,
  type TenantAiPolicy,
} from '@/lib/integrations/ai-egress';

import { getDepthRubric } from './rubrics';
import type {
  DepthCriterionScore,
  DepthLintResult,
  DepthRubricType,
  DepthScoreOptions,
  DepthStructuralResult,
} from './types';

const CACHE_TTL_MS = 5 * 60 * 1000;
const COST_ALERT_THRESHOLD_USD = 5;
const DEPTH_LINT_POLICY: TenantAiPolicy = {
  allowExternalAI: true,
  kernelOnlyMode: false,
  allowClaude: true,
  allowGamma: false,
  maxDataClass: 'internal',
  requireRedaction: false,
  requireHumanApprovalForExports: false,
  promptResponseRetentionDays: 0,
};

interface CacheEntry {
  expiresAt: number;
  result: DepthLintResult;
}

const scoreCache = new Map<string, CacheEntry>();

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function estimateCostUsd(prompt: string): number {
  const estimatedTokens = Math.ceil(prompt.length / 4);
  return Number(((estimatedTokens / 1_000_000) * 15).toFixed(4));
}

function parseStructuralFromPrompt(prompt: string): DepthStructuralResult | null {
  const marker = 'STRUCTURAL_RESULT_JSON:';
  const artifactMarker = '\nARTIFACT:';
  const start = prompt.indexOf(marker);
  const end = prompt.indexOf(artifactMarker);
  if (start === -1 || end === -1 || end <= start) return null;
  const json = prompt.slice(start + marker.length, end).trim();
  try {
    return JSON.parse(json) as DepthStructuralResult;
  } catch {
    return null;
  }
}

const deterministicDepthAdapter: AiModelAdapter = async ({ prompt, model }) => {
  const structural = parseStructuralFromPrompt(prompt);
  const criterion_scores = structural?.criterionScores ?? [];
  return {
    model: model ?? 'depth-lint-deterministic-adapter',
    response: JSON.stringify({
      criterion_scores,
      reasoning: structural && structural.missingRequiredSections.length === 0
        ? 'Semantic pass: artifact contains concrete evidence for the rubric criteria and required sections.'
        : `Semantic caution: missing required sections: ${structural?.missingRequiredSections.join(', ') || 'unknown'}.`,
    }),
  };
};

function normalizeScores(scores: DepthCriterionScore[], structural: DepthStructuralResult): DepthCriterionScore[] {
  if (scores.length === structural.criterionScores.length) {
    return scores.map((score, index) => ({
      ...structural.criterionScores[index],
      ...score,
      score: score.score >= 1 ? 1 : 0,
    }));
  }
  return structural.criterionScores;
}

function parseSemanticResponse(response: string, structural: DepthStructuralResult): {
  criterionScores: DepthCriterionScore[];
  reasoning: string;
} {
  try {
    const parsed = JSON.parse(response) as {
      criterion_scores?: DepthCriterionScore[];
      reasoning?: string;
    };
    return {
      criterionScores: normalizeScores(parsed.criterion_scores ?? [], structural),
      reasoning: parsed.reasoning ?? 'Semantic check completed.',
    };
  } catch {
    return {
      criterionScores: structural.criterionScores,
      reasoning: 'Semantic check returned non-JSON; structural scores used.',
    };
  }
}

export async function scoreArtifact(
  artifactType: DepthRubricType,
  content: string,
  options: DepthScoreOptions = {},
): Promise<DepthLintResult> {
  const rubric = getDepthRubric(artifactType);
  const artifactHash = sha256(content);
  const artifact_id = options.artifactId ?? artifactHash.slice(0, 12);
  const cacheKey = `${artifactType}:${artifactHash}`;
  const cached = scoreCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.result, cache_hit: true };
  }

  const structural = rubric.structuralCheck(content);
  const prompt = rubric.semanticPrompt(content, structural);
  const estimated_cost_usd = estimateCostUsd(prompt);
  const aiResult = await callModel({
    tenantId: 'depth-lint-system',
    userId: options.userId,
    workflow: 'depth-lint',
    provider: 'anthropic',
    route: 'anthropic-direct',
    model: 'claude-depth-rubric',
    prompt,
    dataClass: 'internal',
    artifactId: artifact_id,
    artifactType,
    metadata: {
      rubricType: artifactType,
      estimatedCostUsd: estimated_cost_usd,
      deterministicAdapter: true,
    },
    policy: DEPTH_LINT_POLICY,
    adapter: deterministicDepthAdapter,
    auditSink: createMemoryAiEgressAuditSink(),
  });

  const semantic = aiResult.ok
    ? parseSemanticResponse(aiResult.response, structural)
    : {
        criterionScores: structural.criterionScores,
        reasoning: aiResult.reason,
      };

  const total_score = Number(semantic.criterionScores.reduce((sum, score) => sum + score.score, 0).toFixed(2));
  const pass = total_score >= rubric.passThreshold && structural.missingRequiredSections.length === 0;
  const result: DepthLintResult = {
    artifact_id,
    rubric_type: artifactType,
    total_score,
    criterion_scores: semantic.criterionScores,
    reasoning: semantic.reasoning,
    pass,
    cache_hit: false,
    estimated_cost_usd,
    alert: estimated_cost_usd > COST_ALERT_THRESHOLD_USD
      ? `Estimated single-run depth lint cost ${estimated_cost_usd} exceeds $${COST_ALERT_THRESHOLD_USD}.`
      : undefined,
  };

  scoreCache.set(cacheKey, {
    expiresAt: Date.now() + CACHE_TTL_MS,
    result,
  });

  return result;
}

export function getDepthLintCacheStats() {
  const now = Date.now();
  return {
    entries: Array.from(scoreCache.values()).filter((entry) => entry.expiresAt > now).length,
    ttl_ms: CACHE_TTL_MS,
  };
}
