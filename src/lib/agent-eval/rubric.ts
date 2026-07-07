// Response Wisdom Evaluation Rubric · scorer (PR-3).

import type { AgentContextTrace } from '@/lib/agent-trace/types';
import {
  DEFAULT_THRESHOLD,
  SUBJECTIVE_DIMENSIONS,
  type AgentResponseEvaluation,
  type DimensionScore,
  type EvaluateInput,
  type RubricDimension,
  type Score,
} from './types';

const RISK_LANGUAGE =
  /\b(risk|failure mode|fail(s|ure)?|pitfall|caveat|downside|mitigat\w*|guard ?rail|trade-?off|what could go wrong|dependenc)\b/i;

const MISSING_CONTEXT_LANGUAGE =
  /\b(not (yet )?loaded|insufficient|limited (data|evidence|indexed)|do(n'?t| not) have|not available|cannot confirm|can'?t confirm|assumption|we lack|no (direct )?(data|evidence|corpus)|partially (loaded|answerable)|haven'?t loaded|once .* is loaded)\b/i;

function clamp(score: number): Score {
  const rounded = Math.round(score);
  if (rounded < 1) return 1;
  if (rounded > 5) return 5;
  return rounded as Score;
}

/** Total retrieved objects across the three buckets. */
function retrievedTotal(trace: AgentContextTrace): number {
  return (
    trace.retrieved_tenant_context.length +
    trace.retrieved_corpus_patterns.length +
    trace.retrieved_artifacts.length
  );
}

function evidenceIsThin(trace: AgentContextTrace): boolean {
  const mean = trace.confidence_distribution.mean;
  if (trace.source_basis_count <= 1) return true;
  if (typeof mean === 'number' && mean < 0.4) return true;
  return retrievedTotal(trace) <= 1;
}

function scoreTenantGrounding(trace: AgentContextTrace): DimensionScore {
  const n = trace.retrieved_tenant_context.length;
  let score: Score;
  if (n === 0) score = 1;
  else if (n === 1) score = 3;
  else if (n <= 3) score = 4;
  else score = 5;
  return {
    dimension: 'tenant_grounding',
    score,
    basis: 'deterministic',
    rationale: `${n} tenant context object(s) assembled into the bundle.`,
  };
}

function scorePatternGrounding(
  trace: AgentContextTrace,
  namespaceIssues: number,
): DimensionScore {
  const n = trace.retrieved_corpus_patterns.length;
  let score: Score;
  if (namespaceIssues > 0) score = 1;
  else if (n === 0) score = 2;
  else if (n === 1) score = 4;
  else score = 5;
  return {
    dimension: 'pattern_grounding',
    score,
    basis: 'deterministic',
    rationale:
      namespaceIssues > 0
        ? `${namespaceIssues} pattern namespace violation(s) detected.`
        : `${n} approved corpus pattern(s) in the bundle.`,
  };
}

function scoreSourceDiscipline(trace: AgentContextTrace): DimensionScore {
  const cited = trace.citation_objects_emitted.length;
  const available = trace.source_basis_count;
  let score: Score;
  let rationale: string;
  if (available === 0) {
    // No backend sources: discipline = honest when no citations are fabricated.
    score = cited === 0 ? 4 : 2;
    rationale =
      cited === 0
        ? 'No backend sources and no citations claimed — consistent.'
        : 'Citations emitted with no backend source basis (possible phantom citation).';
  } else if (cited === 0) {
    score = 1;
    rationale = `Backend sources existed (basis=${available}) but the answer emitted no citations.`;
  } else {
    score = clamp(3 + Math.min(2, cited));
    rationale = `${cited} citation object(s) emitted against source basis ${available}.`;
  }
  return { dimension: 'source_discipline', score, basis: 'deterministic', rationale };
}

function scoreRiskAwareness(answerText: string): DimensionScore {
  const present = RISK_LANGUAGE.test(answerText);
  return {
    dimension: 'risk_failure_mode_awareness',
    score: present ? 4 : 2,
    basis: 'deterministic',
    rationale: present
      ? 'Answer surfaces risk / failure-mode / trade-off language.'
      : 'Answer does not surface explicit risk or failure-mode awareness.',
  };
}

function scoreMissingContextHonesty(
  trace: AgentContextTrace,
  answerText: string,
): DimensionScore {
  const thin = evidenceIsThin(trace);
  const hedges = MISSING_CONTEXT_LANGUAGE.test(answerText);
  let score: Score;
  let rationale: string;
  if (thin && hedges) {
    score = 5;
    rationale = 'Evidence is thin and the answer honestly flags missing/limited context.';
  } else if (thin && !hedges) {
    score = 1;
    rationale = 'Evidence is thin but the answer does not flag missing context (over-claim risk).';
  } else if (!thin && hedges) {
    score = 4;
    rationale = 'Evidence is adequate and the answer still calibrates with a caveat.';
  } else {
    score = 4;
    rationale = 'Evidence is adequate; no missing-context warning required.';
  }
  return { dimension: 'missing_context_honesty', score, basis: 'deterministic', rationale };
}

export function evaluateAgentResponse(input: EvaluateInput): AgentResponseEvaluation {
  const { trace, answerText } = input;
  const threshold = input.threshold ?? DEFAULT_THRESHOLD;
  const unsupportedClaims = input.unsupportedClaims ?? [];
  const tenantLeakage = input.tenantLeakage ?? [];
  const namespaceFindings = input.namespaceFindings ?? [];
  const judgments = input.judgments ?? {};

  const deterministic: DimensionScore[] = [
    scoreTenantGrounding(trace),
    scorePatternGrounding(trace, namespaceFindings.length),
    scoreSourceDiscipline(trace),
    scoreRiskAwareness(answerText),
    scoreMissingContextHonesty(trace, answerText),
  ];

  const subjective: DimensionScore[] = SUBJECTIVE_DIMENSIONS.map((dim): DimensionScore => {
    const injected = judgments[dim];
    if (injected && injected.score != null) {
      return {
        dimension: dim,
        score: injected.score,
        basis: 'injected',
        rationale: injected.rationale,
      };
    }
    return {
      dimension: dim,
      score: null,
      basis: 'not_assessed',
      rationale: 'No model/human judgment injected; not assessed in this run.',
    };
  });

  const dimensionScores = [...deterministic, ...subjective];

  const assessed = dimensionScores.filter((d) => d.score != null) as Array<
    DimensionScore & { score: number }
  >;
  const overallScore =
    assessed.length > 0
      ? assessed.reduce((sum, d) => sum + d.score, 0) / assessed.length
      : null;

  const failedDimensions: RubricDimension[] = assessed
    .filter((d) => d.score < threshold)
    .map((d) => d.dimension);

  // ── automatic-fail rules ────────────────────────────────────────────────
  const autoFailReasons: string[] = [];
  if (tenantLeakage.length > 0) {
    autoFailReasons.push(`tenant leakage (${tenantLeakage.length} finding(s))`);
  }
  const criticalUnsupported = unsupportedClaims.filter((c) => c.critical);
  if (criticalUnsupported.length > 0) {
    autoFailReasons.push(
      `unsupported critical claim(s) (${criticalUnsupported.length})`,
    );
  }
  if (namespaceFindings.length > 0) {
    const phantom = namespaceFindings.filter((f) => f.kind === 'phantom').length;
    const cross = namespaceFindings.filter((f) => f.kind === 'cross_namespace').length;
    autoFailReasons.push(
      `pattern namespace violation(s): ${phantom} phantom, ${cross} cross-namespace`,
    );
  }

  const meetsThreshold =
    overallScore != null && overallScore >= threshold && failedDimensions.length === 0;
  const productionReady = autoFailReasons.length === 0 && meetsThreshold;

  const missingCitations =
    trace.source_basis_count > 0 && trace.citation_objects_emitted.length === 0
      ? ['answer emitted no citations despite available backend sources']
      : [];

  return {
    questionId: trace.question_id,
    agent: trace.agent,
    surface: trace.surface,
    tenantKey: trace.tenant_key,
    overallScore,
    dimensionScores,
    failedDimensions,
    supportingTraceIds: [trace.question_id, ...(trace.response_id ? [trace.response_id] : [])],
    unsupportedClaims,
    missingCitations,
    tenantLeakageFindings: tenantLeakage,
    patternNamespaceFindings: namespaceFindings,
    autoFailReasons,
    recommendedFix: buildRecommendedFix({
      autoFailReasons,
      failedDimensions,
      unsupportedClaims,
      missingCitations,
    }),
    productionReady,
    threshold,
  };
}

function buildRecommendedFix(args: {
  autoFailReasons: string[];
  failedDimensions: RubricDimension[];
  unsupportedClaims: EvaluateInput['unsupportedClaims'];
  missingCitations: string[];
}): string | null {
  const parts: string[] = [];
  if (args.autoFailReasons.length > 0) {
    parts.push(`Resolve auto-fail: ${args.autoFailReasons.join('; ')}.`);
  }
  const lanes = new Set((args.unsupportedClaims ?? []).map((c) => c.recommendedFixLane));
  if (lanes.size > 0) {
    parts.push(`Address unsupported claims via lane(s): ${[...lanes].join(', ')}.`);
  }
  if (args.missingCitations.length > 0) {
    parts.push('Emit evidence-drawer citation objects for backend-grounded claims.');
  }
  if (args.failedDimensions.length > 0) {
    parts.push(`Lift below-threshold dimensions: ${args.failedDimensions.join(', ')}.`);
  }
  return parts.length > 0 ? parts.join(' ') : null;
}
