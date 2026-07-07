// Behavior tests for the verification runner + summary (PR-5).
// Uses a SYNTHETIC driver — these are test fixtures, not live Azure results.

import { buildSentinelTrace, type RawAskSource } from '@/lib/agent-trace/build';
import { hashModelInput } from '@/lib/agent-trace/redaction';
import {
  evaluateQuestion,
  renderReportMarkdown,
  summarizeVerification,
  type AgentDriver,
  type VerificationQuestion,
} from '@/lib/agent-verification';

function makeDriver(map: Record<string, { sources: RawAskSource[]; answer: string; tenantKey: string }>): AgentDriver {
  return async (q: VerificationQuestion) => {
    const spec = map[q.id];
    const trace = buildSentinelTrace({
      questionId: q.id,
      tenantId: spec.tenantKey,
      tenantKey: spec.tenantKey,
      surface: 'intelligence',
      userIntent: 'general_synthesis',
      modelInputHash: hashModelInput({ system: 's', user: q.question }),
      emittedAt: '2026-06-09T00:00:00.000Z',
      citationObjectsEmitted: spec.sources.map((s) => s.id).filter((x): x is string => Boolean(x)),
      sources: spec.sources,
    });
    return { trace, answerText: spec.answer };
  };
}

describe('evaluateQuestion', () => {
  it('passes a grounded, leakage-free, supported answer', async () => {
    const driver = makeDriver({
      q1: {
        tenantKey: 'apex-retail',
        sources: [
          { id: 'f1', type: 'TENANT', name: 'Apex fact', confidence: 0.8 },
          { id: 'p1', type: 'PATTERN', name: 'Contact Center AI', confidence: 0.8 },
        ],
        answer: 'Apex should pilot on the highest-volume queue; the risk is intent coverage.',
      },
    });
    const result = await evaluateQuestion(driver, { id: 'q1', tenantKey: 'apex-retail', question: 'q' });
    expect(result.hasTrace).toBe(true);
    expect(result.productionReady).toBe(true);
    expect(result.failureReasons).toHaveLength(0);
  });

  it('fails an answer with cross-tenant leakage', async () => {
    const driver = makeDriver({
      q2: {
        tenantKey: 'apex-retail',
        sources: [{ id: 'f1', type: 'TENANT', name: 'x', confidence: 0.8 }],
        answer: 'Apex should copy what Meridian Health did.',
      },
    });
    const result = await evaluateQuestion(driver, { id: 'q2', tenantKey: 'apex-retail', question: 'q' });
    expect(result.productionReady).toBe(false);
    expect(result.claim?.tenantIsolationStatus).toBe('fail');
  });
});

describe('summarizeVerification + report', () => {
  it('aggregates pass/fail, coverage, leakage, and backlog', async () => {
    const driver = makeDriver({
      good: {
        tenantKey: 'apex-retail',
        sources: [
          { id: 'f1', type: 'TENANT', name: 'fact', confidence: 0.8 },
          { id: 'p1', type: 'PATTERN', name: 'pattern', confidence: 0.8 },
        ],
        answer: 'Grounded answer with a clear risk and mitigation.',
      },
      leak: {
        tenantKey: 'skyharbor-air',
        sources: [{ id: 'f2', type: 'TENANT', name: 'fact', confidence: 0.8 }],
        answer: 'SkyHarbor should do what Meridian Health did with $40M of savings.',
      },
    });
    const results = [
      await evaluateQuestion(driver, { id: 'good', tenantKey: 'apex-retail', question: 'q' }),
      await evaluateQuestion(driver, { id: 'leak', tenantKey: 'skyharbor-air', question: 'q' }),
    ];
    const summary = summarizeVerification(results, 'lab_structural');
    expect(summary.totalQuestions).toBe(2);
    expect(summary.tenantsTested).toEqual(['apex-retail', 'skyharbor-air']);
    expect(summary.traceCoveragePct).toBe(100);
    expect(summary.tenantLeakageCount).toBeGreaterThanOrEqual(1);
    expect(summary.remediationBacklog.some((b) => b.lane === 'tenant_isolation')).toBe(true);

    const md = renderReportMarkdown(summary);
    expect(md).toMatch(/Pass\/fail by tenant/);
    expect(md).toMatch(/Remediation backlog/);
  });
});
