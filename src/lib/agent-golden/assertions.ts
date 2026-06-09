// Golden-question assertions. Pure: given a question + the observed trace and
// answer (plus optional isolation/citation signals the live runner computes),
// decide pass/fail. Lab-mode tests exercise these with synthetic traces; the
// PR-5 Azure run feeds real traces.

import type { AgentContextTrace } from '@/lib/agent-trace/types';
import { canonicalTenantKey } from '@/lib/tenant/aliases';
import type { GoldenQuestion } from './types';

const MISSING_CONTEXT_LANGUAGE =
  /\b(not (yet )?loaded|insufficient|limited (data|evidence|indexed)|do(n'?t| not) have|not available|cannot confirm|can'?t confirm|we lack|no (direct )?(data|evidence|corpus)|partially (loaded|answerable)|to the dollar.*(cannot|can'?t|not))\b/i;

export interface GoldenEvalContext {
  trace: AgentContextTrace;
  answerText: string;
  /** Live runner: false when cross-tenant leakage was detected. */
  tenantIsolationOk?: boolean;
  /** Live runner: false when a cited object id does not exist in Azure. */
  citationIdsExist?: boolean;
  /** Live runner: false when a cited pattern is out of the active namespace. */
  citedPatternsInNamespace?: boolean;
}

export interface GoldenAssertionResult {
  questionId: string;
  tenantKey: string;
  category: GoldenQuestion['category'];
  passed: boolean;
  failures: string[];
}

export function assertGoldenQuestion(
  q: GoldenQuestion,
  ctx: GoldenEvalContext,
): GoldenAssertionResult {
  const failures: string[] = [];

  // correct tenant resolved
  if (canonicalTenantKey(ctx.trace.tenant_key) !== canonicalTenantKey(q.tenantKey)) {
    failures.push(
      `wrong tenant resolved: expected ${q.tenantKey}, got ${ctx.trace.tenant_key}`,
    );
  }

  // no other tenant context appears
  if (q.tenantIsolationTest && ctx.tenantIsolationOk === false) {
    failures.push('cross-tenant leakage detected');
  }

  // at least one relevant tenant context object retrieved where expected
  if (q.expectsTenantContext && ctx.trace.retrieved_tenant_context.length === 0) {
    failures.push('expected tenant context but none retrieved');
  }

  // approved corpus patterns retrieved where expected
  if (q.expectsApprovedPattern && ctx.trace.retrieved_corpus_patterns.length === 0) {
    failures.push('expected an approved corpus pattern but none retrieved');
  }

  // answer includes a missing-context warning when insufficient
  if (q.expectsMissingContextWarning && !MISSING_CONTEXT_LANGUAGE.test(ctx.answerText)) {
    failures.push('expected a missing-context warning but none present');
  }

  // citation / evidence objects emitted
  if (q.expectsCitations && ctx.trace.citation_objects_emitted.length === 0) {
    failures.push('expected citation/evidence objects but none emitted');
  }

  // cited object ids exist in Azure (live runner only)
  if (ctx.citationIdsExist === false) {
    failures.push('a cited object id does not exist in Azure Postgres/Search');
  }

  // cited pattern ids belong to the active grounding namespace (live runner)
  if (ctx.citedPatternsInNamespace === false) {
    failures.push('a cited pattern id is outside the active grounding namespace');
  }

  // negative test: must not over-claim — at minimum must warn about missing data
  if (q.negativeTest && !MISSING_CONTEXT_LANGUAGE.test(ctx.answerText)) {
    failures.push('negative/unsupported question was answered without a missing-data caveat');
  }

  return {
    questionId: q.id,
    tenantKey: q.tenantKey,
    category: q.category,
    passed: failures.length === 0,
    failures,
  };
}
