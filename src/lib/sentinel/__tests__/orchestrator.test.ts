jest.mock('server-only', () => ({}));

import { getActiveSentinelPrompt } from '@/lib/prompts/sentinel';
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
  const originalAnthropicApiKey = process.env.ANTHROPIC_API_KEY;
  const originalSentinelPromptVersion = process.env.SENTINEL_PROMPT_VERSION;

  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.SENTINEL_PROMPT_VERSION;
  });

  afterAll(() => {
    if (originalAnthropicApiKey) {
      process.env.ANTHROPIC_API_KEY = originalAnthropicApiKey;
    } else {
      delete process.env.ANTHROPIC_API_KEY;
    }

    if (originalSentinelPromptVersion) {
      process.env.SENTINEL_PROMPT_VERSION = originalSentinelPromptVersion;
    } else {
      delete process.env.SENTINEL_PROMPT_VERSION;
    }
  });

  it('answers portfolio sequencing questions through the live Sentinel turn path', async () => {
    const canonicalPatternSearch = jest.fn().mockResolvedValue(noMatchCanonicalResult());

    const result = await runSentinelTurn({
      ctx: {
        clientKey: 'skyharbor',
        clientName: 'SkyHarbor Air',
        industryCode: 'airline',
        userId: 'user_123',
      },
      message: 'What should I sequence next in the portfolio?',
      canonicalPatternSearch,
    });

    expect(canonicalPatternSearch).not.toHaveBeenCalled();
    expect(result.response).toContain('SkyHarbor Air');
    expect(result.response).toContain('sequence');
    expect(result.response).toContain('Executive action');
    expect(result.response).toContain('Basis: signature planning fixture');
    expect(result.response).not.toMatch(/\bSKY-[A-Z-]+\b/);
    expect(result.response).not.toMatch(/\bsignal:[a-z0-9:_-]{8,}\b/i);
    expect(result.citations[0]).toMatchObject({
      slug: 'portfolio-sequence-packet',
      label: 'SkyHarbor Air portfolio sequence packet',
    });
    expect(result.groundingDisclosure.status).toBe('not_requested');
  });

  it('answers portfolio capacity questions without leaking another client', async () => {
    const result = await runSentinelTurn({
      ctx: {
        clientKey: 'meridian',
        clientName: 'Meridian Health',
        industryCode: 'healthcare',
        userId: 'user_123',
      },
      message: 'Where are we capacity constrained?',
      canonicalPatternSearch: jest.fn().mockResolvedValue(noMatchCanonicalResult()),
    });

    expect(result.response).toContain('Meridian Health');
    expect(result.response).toContain('Executive action');
    expect(result.response).not.toMatch(/Apex Retail|SkyHarbor|Store Associate|Crew Recovery/i);
    expect(result.response).not.toMatch(/\bMER-[A-Z-]+\b/);
  });

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

    expect(canonicalPatternSearch.mock.calls[0]?.[0]).toEqual(expect.objectContaining({
      tenant_key: 'apex-retail',
      industry: 'retail',
      limit: 3,
    }));
    expect(result.grounding.status).toBe('no_match');
    expect(result.groundingDisclosure).toMatchObject({
      source: 'persisted_canonical_corpus',
      status: 'no_match',
      retrievedPatternCount: 0,
      warnings: ['WARNING_CANONICAL_PATTERN_NO_MATCH: no persisted canonical patterns matched the query.'],
    });
    expect(result.grounding.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'canonical_pattern_no_match' }),
    ]));
    expect(result.response).toContain('Grounding check:');
  });

  it('pairs Sentinel prompt v1.0.0 to citation and grounding expectations', async () => {
    const activePrompt = getActiveSentinelPrompt({ SENTINEL_PROMPT_VERSION: '1.0.0' });
    const canonicalPatternSearch = jest.fn().mockResolvedValue(noMatchCanonicalResult());

    process.env.SENTINEL_PROMPT_VERSION = activePrompt.version;
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

    expect(activePrompt.version).toBe('1.0.0');
    expect(activePrompt.citationBehavior.expectedGroundingFlagPrefix).toBe('Grounding check:');
    expect(result.citations.length).toBeGreaterThan(0);
    expect(result.citations[0]).toMatchObject({
      slug: expect.any(String),
      label: expect.any(String),
      evidenceCount: expect.any(Number),
    });
    expect(result.grounding.status).toBe('no_match');
    expect(result.response).toContain(activePrompt.citationBehavior.expectedGroundingFlagPrefix);
  });
});
