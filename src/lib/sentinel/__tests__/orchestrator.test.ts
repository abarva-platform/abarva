jest.mock('server-only', () => ({}));

import { runSentinelTurn } from '@/lib/sentinel/orchestrator';
import type { CanonicalPatternIndexResult } from '@/lib/intelligence/canonical/runtime-pattern-index';

function noMatchCanonicalResult(): CanonicalPatternIndexResult {
  return {
    source: 'persisted_canonical_corpus',
    status: 'no_match',
    patterns: [],
    total: 0,
    warnings: ['WARNING_CANONICAL_PATTERN_NO_MATCH: no persisted canonical patterns matched the query.'],
    filters_applied: {},
    cache: { mode: 'disabled', key: null, ttl_ms: 60_000 },
  };
}

describe('runSentinelTurn canonical grounding', () => {
  it('queries the canonical runtime index and includes grounding flags without writing data', async () => {
    const canonicalPatternSearch = jest.fn().mockResolvedValue(noMatchCanonicalResult());

    const result = await runSentinelTurn({
      ctx: {
        clientKey: 'apex-retail',
        clientName: 'Apex Retail',
        industryCode: 'retail-omni',
        userId: 'user_123',
      },
      message: 'Which demand forecasting pattern applies?',
      canonicalPatternSearch,
    });

    expect(canonicalPatternSearch).toHaveBeenCalledWith(expect.objectContaining({
      tenant_key: 'apex-retail',
      industry: 'retail',
      limit: 3,
    }));
    expect(result.grounding.status).toBe('no_match');
    expect(result.grounding.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'canonical_pattern_no_match' }),
    ]));
    expect(result.response).toContain('Grounding check:');
  });
});
