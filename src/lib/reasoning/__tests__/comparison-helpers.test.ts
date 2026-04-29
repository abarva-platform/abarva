/**
 * comparison-helpers tests
 *
 * Deterministic: pure-function fallback selection used by the
 * /source/compare grid to seed the streaming synthesis quote.
 */

import {
  FALLBACK_QUOTE_PLACEHOLDER,
  pickFallbackQuoteFromContext,
} from '@/lib/reasoning/comparison-helpers';
import type { SynthesisContext } from '@/lib/reasoning/types';

function makeContext(
  overrides: Partial<SynthesisContext> = {},
): SynthesisContext {
  return {
    instanceId: 'test-instance',
    instanceType: 'source-event',
    patternId: 'pat.test',
    patternVersion: '1.0.0',
    currentStage: 'stage-1',
    gatesSummary: { total: 0, met: 0, unmet: 0, blocked: [] },
    activeContradictions: [],
    failureModes: [],
    missingArtifacts: [],
    cascadeContext: [],
    citations: [],
    instanceSnapshot: {},
    stageGuidance: '',
    builtAt: 0,
    ...overrides,
  };
}

describe('pickFallbackQuoteFromContext', () => {
  it('uses the first sentence of stageGuidance when present', () => {
    const ctx = makeContext({
      stageGuidance:
        'BAFO requires three priced bids. Once received, advance to award.',
      citations: [
        {
          ref: {
            patternId: 'pat.test',
            patternVersion: '1.0.0',
            section: 'overview',
          },
          excerpt: 'Citation text not used here.',
          relevance: 'irrelevant',
        },
      ],
    });

    expect(pickFallbackQuoteFromContext(ctx)).toBe(
      'BAFO requires three priced bids.',
    );
  });

  it('falls back to the first citation excerpt when stageGuidance is empty', () => {
    const ctx = makeContext({
      stageGuidance: '   ',
      citations: [
        {
          ref: {
            patternId: 'pat.test',
            patternVersion: '1.0.0',
            section: 'overview',
          },
          excerpt: 'Vendor must demonstrate hand-off readiness. Then sign.',
          relevance: 'gate-evidence',
        },
      ],
    });

    expect(pickFallbackQuoteFromContext(ctx)).toBe(
      'Vendor must demonstrate hand-off readiness.',
    );
  });

  it('returns the placeholder when neither guidance nor citations have text', () => {
    const ctx = makeContext({ stageGuidance: '', citations: [] });

    expect(pickFallbackQuoteFromContext(ctx)).toBe(
      FALLBACK_QUOTE_PLACEHOLDER,
    );
  });
});
