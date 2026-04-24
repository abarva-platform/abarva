import { runSentinelTurn } from '@/lib/sentinel/orchestrator';

describe('sentinel orchestrator', () => {
  const ctx = {
    clientKey: 'meridian',
    clientName: 'Meridian Health',
    industryCode: 'HEALTHCARE_IDN',
    userId: 'user_test',
  } as const;

  test('returns differentiated free-text answers with tenant-scoped citations', async () => {
    const evidence = await runSentinelTurn({
      ctx,
      activePatternSlug: 'ambient-clinical-value-chain',
      message: 'How strong is the evidence for ambient workflow value here?',
    });
    const risk = await runSentinelTurn({
      ctx,
      activePatternSlug: 'ambient-clinical-value-chain',
      message: 'Stop the structured output. In plain English, what is the biggest risk?',
    });

    expect(evidence.response).not.toEqual(risk.response);
    expect(evidence.citations.length).toBeGreaterThan(0);
    expect(risk.citations.length).toBeGreaterThan(0);
    expect(evidence.citations[0]?.href).toContain('/tenant/meridian/intelligence/patterns/');
    expect(evidence.citations[0]?.evidenceCount).toBeGreaterThanOrEqual(0);
    expect(risk.confidence).toMatch(/high|medium|thin/);
  });

  test('anchors the selected pattern when it is already in context', async () => {
    const result = await runSentinelTurn({
      ctx,
      activePatternSlug: 'prior-authorization-automation',
      message: 'What evidence do we have?',
    });

    expect(result.activePatternSlug).toBe('prior-authorization-automation');
    expect(result.citations[0]?.slug).toBe('prior-authorization-automation');
  });
});
