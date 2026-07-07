// Verification runner + aggregation (PR-5). Pure given an injected driver.

import type { RemediationLane } from '@/lib/agent-eval/types';
import { evaluateAgentResponse } from '@/lib/agent-eval';
import { validateClaimsAndCitations } from '@/lib/agent-claims';
import { assertGoldenQuestion, type GoldenQuestion } from '@/lib/agent-golden';
import type {
  AgentDriver,
  QuestionResult,
  TenantRollup,
  VerificationQuestion,
  VerificationSummary,
} from './types';

/** Drive one question through the real agent and evaluate the result. */
export async function evaluateQuestion(
  driver: AgentDriver,
  question: VerificationQuestion,
  goldenQuestion?: GoldenQuestion,
): Promise<QuestionResult> {
  const { trace, answerText } = await driver(question);

  const claim = validateClaimsAndCitations({
    trace: {
      tenant_key: trace.tenant_key,
      retrieved_tenant_context: trace.retrieved_tenant_context,
      retrieved_corpus_patterns: trace.retrieved_corpus_patterns,
      retrieved_artifacts: trace.retrieved_artifacts,
      citation_objects_emitted: trace.citation_objects_emitted,
    },
    answerText,
  });

  const evaluation = evaluateAgentResponse({
    trace,
    answerText,
    unsupportedClaims: claim.unsupportedClaims,
    tenantLeakage: claim.tenantLeakage,
    namespaceFindings: claim.namespaceFindings,
  });

  const golden = goldenQuestion
    ? assertGoldenQuestion(goldenQuestion, {
        trace,
        answerText,
        tenantIsolationOk: claim.tenantIsolationStatus === 'pass',
      })
    : undefined;

  const failureReasons: string[] = [];
  if (golden && !golden.passed) failureReasons.push(...golden.failures);
  if (!evaluation.productionReady) failureReasons.push(...evaluation.autoFailReasons);
  if (claim.claimValidationStatus === 'fail') failureReasons.push('claim/citation validation failed');

  const productionReady =
    evaluation.productionReady &&
    claim.claimValidationStatus === 'pass' &&
    claim.tenantIsolationStatus === 'pass' &&
    (golden ? golden.passed : true);

  return {
    questionId: trace.question_id || question.id,
    tenantKey: trace.tenant_key ?? question.tenantKey,
    agent: trace.agent,
    surface: trace.surface,
    golden,
    claim,
    evaluation,
    hasTrace: Boolean(trace.model_input_hash),
    hasCitations: trace.citation_objects_emitted.length > 0,
    productionReady,
    failureReasons,
  };
}

function inc<K extends string>(rec: Record<K, number>, key: K): void {
  rec[key] = (rec[key] ?? 0) + 1;
}

/** Aggregate per-question results into the verification summary. */
export function summarizeVerification(
  results: QuestionResult[],
  mode: VerificationSummary['mode'],
): VerificationSummary {
  const tenants = new Map<string, TenantRollup>();
  const byAgent: Record<string, { passed: number; failed: number }> = {};
  const bySurface: Record<string, { passed: number; failed: number }> = {};
  const wisdom: Record<string, number> = {};
  const failureModes: Record<string, number> = {};
  const backlog: Record<string, number> = {};

  let withTrace = 0;
  let withCitations = 0;
  let unsupportedClaims = 0;
  let leakage = 0;

  for (const r of results) {
    const t = tenants.get(r.tenantKey) ?? { tenantKey: r.tenantKey, total: 0, passed: 0, failed: 0 };
    t.total += 1;
    if (r.productionReady) t.passed += 1;
    else t.failed += 1;
    tenants.set(r.tenantKey, t);

    byAgent[r.agent] ??= { passed: 0, failed: 0 };
    byAgent[r.agent][r.productionReady ? 'passed' : 'failed'] += 1;
    bySurface[r.surface] ??= { passed: 0, failed: 0 };
    bySurface[r.surface][r.productionReady ? 'passed' : 'failed'] += 1;

    if (r.hasTrace) withTrace += 1;
    if (r.hasCitations) withCitations += 1;
    unsupportedClaims += r.claim?.unsupportedClaims.length ?? 0;
    leakage += r.claim?.tenantLeakage.length ?? 0;

    const score = r.evaluation?.overallScore;
    const bucket = score == null ? 'unscored' : `${Math.floor(score)}-${Math.floor(score) + 1}`;
    inc(wisdom, bucket);

    for (const reason of r.failureReasons) inc(failureModes, reason);
    for (const c of r.claim?.unsupportedClaims ?? []) inc(backlog, c.recommendedFixLane);
    if ((r.claim?.tenantLeakage.length ?? 0) > 0) inc(backlog, 'tenant_isolation');
    if ((r.claim?.namespaceFindings.length ?? 0) > 0) inc(backlog, 'binder_pattern_validation');
  }

  const n = results.length || 1;
  return {
    generatedNote:
      mode === 'lab_structural'
        ? 'LAB STRUCTURAL RUN — no live agent answers generated; counts reflect framework wiring only. Run on Azure Container Apps for live pass/fail.'
        : 'LIVE AZURE RUN against the private data plane.',
    mode,
    tenantsTested: [...tenants.keys()].sort(),
    totalQuestions: results.length,
    passFailByTenant: [...tenants.values()].sort((a, b) => a.tenantKey.localeCompare(b.tenantKey)),
    passFailByAgent: byAgent,
    passFailBySurface: bySurface,
    traceCoveragePct: Math.round((withTrace / n) * 100),
    citationCoveragePct: Math.round((withCitations / n) * 100),
    unsupportedClaimCount: unsupportedClaims,
    tenantLeakageCount: leakage,
    wisdomScoreDistribution: wisdom,
    topFailureModes: Object.entries(failureModes)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),
    remediationBacklog: Object.entries(backlog)
      .map(([lane, count]) => ({ lane: lane as RemediationLane, count }))
      .sort((a, b) => b.count - a.count),
  };
}
