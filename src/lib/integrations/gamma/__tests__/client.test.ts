// Gamma client tests — mocked HTTP. We pin the POST body shape, the polling
// loop, and the configured/unconfigured flag. No real network is touched.

import {
  generateGammaDeck,
  GammaError,
  isGammaConfigured,
  __testing,
} from '../client';

// Speed up the poll loop so the test suite stays fast — we override the
// constant via the testing surface; the production code still uses the real
// value. We do this by stubbing `setTimeout` inside one test rather than
// monkey-patching the module-level constant, which TypeScript guards.
jest.useFakeTimers();

describe('isGammaConfigured', () => {
  const ORIGINAL = process.env.GAMMA_API_KEY;

  afterEach(() => {
    process.env.GAMMA_API_KEY = ORIGINAL;
  });

  it('returns false when the key is unset', () => {
    delete process.env.GAMMA_API_KEY;
    expect(isGammaConfigured()).toBe(false);
  });

  it('returns false when the key is blank', () => {
    process.env.GAMMA_API_KEY = '   ';
    expect(isGammaConfigured()).toBe(false);
  });

  it('returns true when the key is set', () => {
    process.env.GAMMA_API_KEY = 'sk-test-123';
    expect(isGammaConfigured()).toBe(true);
  });
});

describe('generateGammaDeck — POST body shape', () => {
  const ORIGINAL = process.env.GAMMA_API_KEY;
  let realFetch: typeof global.fetch;

  beforeEach(() => {
    realFetch = global.fetch;
    process.env.GAMMA_API_KEY = 'sk-test-123';
  });

  afterEach(() => {
    global.fetch = realFetch;
    process.env.GAMMA_API_KEY = ORIGINAL;
    jest.useFakeTimers();
  });

  it('posts the documented Gamma fields and polls until completed', async () => {
    jest.useRealTimers();

    let postBody: unknown = null;
    let postUrl = '';
    let postHeaders: Record<string, string> = {};
    const calls: string[] = [];
    let pollCount = 0;

    const fetchMock: typeof global.fetch = (async (
      input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      const url = typeof input === 'string' ? input : input.toString();
      calls.push(`${init?.method ?? 'GET'} ${url}`);
      if (init?.method === 'POST') {
        postUrl = url;
        postHeaders = (init.headers ?? {}) as Record<string, string>;
        postBody = JSON.parse(String(init.body));
        return new Response(JSON.stringify({ generationId: 'gen_42' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        });
      }
      // GET poll — return 'pending' twice, then 'completed'.
      pollCount++;
      const status = pollCount >= 2 ? 'completed' : 'pending';
      const body =
        status === 'completed'
          ? {
              status,
              gammaUrl: 'https://gamma.app/docs/abc',
              exportUrl: 'https://gamma.app/export/abc.pptx?sig=xyz',
              gammaId: 'gid_99',
              credits: 12,
            }
          : { status };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-ratelimit-remaining-burst': '5',
          'x-ratelimit-remaining': '95',
          'x-ratelimit-remaining-daily': '1980',
        },
      });
    }) as typeof global.fetch;
    global.fetch = fetchMock;

    // Shorten the poll interval so the test does not wait 5s.
    const originalSetTimeout = global.setTimeout;
    const fastSetTimeout = ((cb: () => void) => {
      return originalSetTimeout(cb, 0);
    }) as unknown as typeof global.setTimeout;
    global.setTimeout = fastSetTimeout;
    try {
      const result = await generateGammaDeck({
        inputText: '# Cover\n\nBody\n\n\n# Card 2',
        additionalInstructions: 'Render only the supplied content.',
        numCards: 2,
        title: 'Test Deck',
      });

      expect(postUrl).toBe(__testing.GAMMA_GENERATIONS_ENDPOINT);
      expect(postHeaders['X-API-KEY']).toBe('sk-test-123');
      expect(postHeaders['Content-Type']).toBe('application/json');
      const body = postBody as Record<string, unknown>;
      expect(body.textMode).toBe('preserve');
      expect(body.format).toBe('presentation');
      expect(body.exportAs).toBe('pptx');
      expect(body.cardSplit).toBe('inputTextBreaks');
      expect(body.numCards).toBe(2);
      expect(body.additionalInstructions).toContain(
        'Render only the supplied content',
      );
      expect((body.cardOptions as { dimensions: string }).dimensions).toBe(
        '16x9',
      );
      expect((body.textOptions as { tone: string }).tone).toContain(
        'professional',
      );

      expect(result.gammaUrl).toBe('https://gamma.app/docs/abc');
      expect(result.exportUrl).toBe(
        'https://gamma.app/export/abc.pptx?sig=xyz',
      );
      expect(result.generationId).toBe('gen_42');
      expect(result.gammaId).toBe('gid_99');
      expect(result.credits).toBe(12);
      expect(result.rateLimit.burstRemaining).toBe('5');
      expect(result.rateLimit.dailyRemaining).toBe('1980');

      // The polling endpoint is the GET /v1.0/generations/<id> URL.
      expect(
        calls.some((c) => c.startsWith('GET ') && c.includes('gen_42')),
      ).toBe(true);
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  });

  it('throws GammaError(kind: gamma_failed) when status === "failed"', async () => {
    jest.useRealTimers();
    process.env.GAMMA_API_KEY = 'sk-test-123';

    const fetchMock: typeof global.fetch = (async (
      _input: RequestInfo | URL,
      init?: RequestInit,
    ) => {
      if (init?.method === 'POST') {
        return new Response(JSON.stringify({ generationId: 'gen_X' }), {
          status: 200,
        });
      }
      return new Response(
        JSON.stringify({ status: 'failed', error: 'unsafe content' }),
        { status: 200 },
      );
    }) as typeof global.fetch;
    global.fetch = fetchMock;

    const originalSetTimeout = global.setTimeout;
    const fastSetTimeout = ((cb: () => void) => {
      return originalSetTimeout(cb, 0);
    }) as unknown as typeof global.setTimeout;
    global.setTimeout = fastSetTimeout;
    try {
      await expect(
        generateGammaDeck({
          inputText: 'x',
          additionalInstructions: 'y',
          numCards: 1,
          title: 't',
        }),
      ).rejects.toMatchObject({
        name: 'GammaError',
        kind: 'gamma_failed',
      });
    } finally {
      global.setTimeout = originalSetTimeout;
    }
  });

  it('throws GammaError(kind: not_configured) when the API key is missing', async () => {
    delete process.env.GAMMA_API_KEY;
    await expect(
      generateGammaDeck({
        inputText: 'x',
        additionalInstructions: 'y',
        numCards: 1,
        title: 't',
      }),
    ).rejects.toBeInstanceOf(GammaError);
    // Confirm the kind specifically.
    try {
      await generateGammaDeck({
        inputText: 'x',
        additionalInstructions: 'y',
        numCards: 1,
        title: 't',
      });
      throw new Error('expected throw');
    } catch (err) {
      expect((err as GammaError).kind).toBe('not_configured');
    }
  });
});
