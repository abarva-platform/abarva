/**
 * FM #10 — Demo-fragile · INT-RGS
 *
 * Failure mode: the surface looks polished on a 2-question
 * demo, then breaks at question 3. The mechanism: the 50-
 * question regression suite must run end-to-end before any
 * deploy that touches `/intelligence` or the broker.
 *
 * Wave 1 acceptance: ≥35 of 50 questions complete the broker
 * without throwing.
 * Wave 2 acceptance: ≥45 of 50 plus LLM-side checks.
 *
 * This file enforces the Wave 1 floor.
 */

import { runQuestion } from './_helpers/runQuestion';
import { REGRESSION_QUESTIONS } from './fixtures/questions';

describe('FM #10 — Demo-fragile (Wave 1 acceptance: 35/50 broker-complete)', () => {
  it('the regression suite contains exactly 50 questions', () => {
    expect(REGRESSION_QUESTIONS).toHaveLength(50);
  });

  it('every question has a unique id', () => {
    const ids = REGRESSION_QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('category distribution matches the kickoff doc spec', () => {
    const counts = REGRESSION_QUESTIONS.reduce<Record<string, number>>(
      (acc, q) => {
        acc[q.category] = (acc[q.category] ?? 0) + 1;
        return acc;
      },
      {},
    );
    expect(counts.cold_cio).toBe(15);
    expect(counts.tenant_grounded).toBe(15);
    expect(counts.cross_corpus).toBe(10);
    expect(counts.voice_drift_probe).toBe(5);
    expect(counts.honesty_probe).toBe(5);
  });

  it('every tenant-bearing question targets apex-retail or meridian-health', () => {
    const tenantQuestions = REGRESSION_QUESTIONS.filter(
      (q) => q.tenantKey !== null,
    );
    for (const q of tenantQuestions) {
      expect(['apex-retail', 'meridian-health']).toContain(q.tenantKey);
    }
  });

  // Live broker run — Wave 1 acceptance gate.
  // Threshold: ≥35 of 50 complete without throwing.
  it(
    'Wave 1: ≥35 of 50 questions complete broker assembly without throwing',
    async () => {
      let succeeded = 0;
      const failures: Array<{ id: string; error: string }> = [];
      for (const q of REGRESSION_QUESTIONS) {
        try {
          const { bundle } = await runQuestion(q);
          // Even the tenant-pending or worldview-pending cases
          // should return a bundle (just with warnings).
          expect(bundle.mode).toBe(q.defaultMode);
          succeeded += 1;
        } catch (err) {
          failures.push({
            id: q.id,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      if (succeeded < 35) {
        // Surface the failure list as an actionable build backlog.
        console.error('FM #10 Wave 1 acceptance failures:', failures);
      }
      expect(succeeded).toBeGreaterThanOrEqual(35);
    },
    30_000,
  );

  // Wave 2 placeholder
  it.todo(
    'Wave 2: ≥45 of 50 questions pass full LLM-output checks (CB-6 + worldview ingestion)',
  );
});
