// Gamma client — AbarVa's outbound integration with https://gamma.app.
//
// AbarVa supplies the content; Gamma renders the polished presentation. This
// is the only place in the codebase that talks to `public-api.gamma.app`.
// Every other module composes content and hands it to `generateGammaDeck`.
//
// Contract honoured here (verified against the Gamma API contract):
//   - Base: https://public-api.gamma.app
//   - POST /v1.0/generations
//       body: { inputText, textMode: 'preserve', format: 'presentation',
//               numCards, cardSplit, exportAs: 'pptx',
//               additionalInstructions, textOptions.tone,
//               textOptions.audience, cardOptions.dimensions: '16x9' }
//       returns { generationId }
//   - GET  /v1.0/generations/{id}
//       poll every 5s until status === 'completed' or 'failed'
//       returns { gammaUrl, exportUrl, gammaId, credits }
//   - Auth: header `X-API-KEY: <key>`; Content-Type: application/json
//   - Rate-limit headers: `x-ratelimit-remaining-burst`,
//     `x-ratelimit-remaining`, `x-ratelimit-remaining-daily` — surfaced when
//     present so the caller can warn at low budgets.
//
// Honesty discipline:
//   - `textMode: 'preserve'` so Gamma will NOT rewrite, summarise, or
//     paraphrase the supplied content.
//   - `additionalInstructions` carries the explicit clause that forbids
//     adding, altering, or inferring any figure, date, source, or claim.
//   - We never log `inputText` or the API key.
//
// Server-only. `GAMMA_API_KEY` is a server-side secret and is read here once.
// The module is the only seam — no client code imports this file.

const GAMMA_API_BASE = 'https://public-api.gamma.app';
const GAMMA_GENERATIONS_ENDPOINT = `${GAMMA_API_BASE}/v1.0/generations`;

/** How often we poll for generation status. */
const POLL_INTERVAL_MS = 5_000;
/**
 * Hard ceiling for a single generation, in milliseconds. Vercel functions cap
 * at 300s; we leave headroom for the initial POST + the final fetch + JSON
 * parsing.
 */
const GENERATION_TIMEOUT_MS = 240_000;

/**
 * The Gamma rate-limit budget returned with every response. Values are
 * strings as returned by the API; `null` when the header is absent.
 */
export interface GammaRateLimit {
  burstRemaining: string | null;
  remaining: string | null;
  dailyRemaining: string | null;
}

/** A single completed Gamma generation. */
export interface GammaGenerationResult {
  /** Hosted, shareable URL on gamma.app. */
  gammaUrl: string;
  /** Signed `.pptx` download URL — expires after roughly one week. */
  exportUrl: string;
  /** The generation id we polled (audit trail). */
  generationId: string;
  /** The persistent gamma id of the rendered deck. */
  gammaId: string;
  /** Credits Gamma charged for this generation. */
  credits: number | null;
  /** Rate-limit headers from the final poll (may be null when absent). */
  rateLimit: GammaRateLimit;
}

/** Inputs for a single Gamma deck generation. */
export interface GenerateGammaDeckInput {
  /**
   * The full text body Gamma turns into the deck. Card breaks are encoded as
   * `\n\n\n` (the `cardSplit: 'inputTextBreaks'` delimiter). Length is
   * bounded by Gamma at 400_000 characters; we surface that limit honestly
   * instead of silently truncating.
   */
  inputText: string;
  /**
   * The honesty-discipline clause for Gamma's render pass. Must explicitly
   * forbid any added, altered, or inferred figure, date, source, or claim.
   */
  additionalInstructions: string;
  /** Suggested card count — Gamma may pick a different number. */
  numCards: number;
  /** Document title — used to label the deck on gamma.app. */
  title: string;
  /**
   * Card-split strategy. Defaults to `'inputTextBreaks'` (split on `\n\n\n`).
   * Pass `'auto'` to fall back to Gamma's heading-based split when
   * `inputTextBreaks` behaves unexpectedly — keep `\n\n\n` separators in the
   * input either way so the fallback remains safe.
   */
  cardSplit?: 'inputTextBreaks' | 'auto';
}

/**
 * True when `GAMMA_API_KEY` is set in the server environment. The route
 * surface uses this to return an honest 503 instead of pretending a key is
 * configured.
 */
export function isGammaConfigured(): boolean {
  const key = process.env.GAMMA_API_KEY?.trim();
  return Boolean(key);
}

/** Read the API key from the environment. Throws if absent — caller-guarded. */
function getGammaApiKey(): string {
  const key = process.env.GAMMA_API_KEY?.trim();
  if (!key) {
    throw new GammaError(
      'GAMMA_API_KEY is not configured. Set it in the server environment.',
      { kind: 'not_configured' },
    );
  }
  return key;
}

/**
 * The structured error type raised by the client. The route layer maps these
 * to honest HTTP responses (503 for `not_configured`, 502 for `gamma_failed`
 * / `unexpected_status`, 504 for `timeout`, 502 for `transport`).
 */
export class GammaError extends Error {
  readonly kind:
    | 'not_configured'
    | 'gamma_failed'
    | 'unexpected_status'
    | 'timeout'
    | 'transport';
  constructor(
    message: string,
    opts: {
      kind:
        | 'not_configured'
        | 'gamma_failed'
        | 'unexpected_status'
        | 'timeout'
        | 'transport';
    },
  ) {
    super(message);
    this.name = 'GammaError';
    this.kind = opts.kind;
  }
}

/** Extract the (possibly absent) rate-limit headers from a response. */
function readRateLimit(res: Response): GammaRateLimit {
  return {
    burstRemaining: res.headers.get('x-ratelimit-remaining-burst'),
    remaining: res.headers.get('x-ratelimit-remaining'),
    dailyRemaining: res.headers.get('x-ratelimit-remaining-daily'),
  };
}

/** Sleep helper — promise-backed so the poll loop is awaitable. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a polished Gamma deck for the supplied content and return the
 * hosted URL plus the signed `.pptx` export URL. Polls every 5s up to a hard
 * 240s ceiling so the call fits comfortably inside Vercel's 300s function
 * limit.
 */
export async function generateGammaDeck(
  input: GenerateGammaDeckInput,
): Promise<GammaGenerationResult> {
  const apiKey = getGammaApiKey();
  const cardSplit = input.cardSplit ?? 'inputTextBreaks';

  // --- POST the generation request -----------------------------------------
  const requestBody = {
    inputText: input.inputText,
    textMode: 'preserve' as const,
    format: 'presentation' as const,
    numCards: input.numCards,
    cardSplit,
    exportAs: 'pptx' as const,
    additionalInstructions: input.additionalInstructions,
    textOptions: {
      tone: 'professional, board-grade, conservative',
      audience: 'executive board / sponsor',
    },
    cardOptions: { dimensions: '16x9' as const },
    title: input.title,
  };

  let initialRes: Response;
  try {
    initialRes = await fetch(GAMMA_GENERATIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
  } catch (err) {
    throw new GammaError(
      `Network failure calling Gamma: ${
        err instanceof Error ? err.message : String(err)
      }`,
      { kind: 'transport' },
    );
  }

  if (!initialRes.ok) {
    const text = await safeReadText(initialRes);
    throw new GammaError(
      `Gamma rejected the generation request (HTTP ${initialRes.status}): ${
        text || initialRes.statusText
      }`,
      { kind: 'unexpected_status' },
    );
  }

  let body: unknown;
  try {
    body = await initialRes.json();
  } catch (err) {
    throw new GammaError(
      `Gamma response was not valid JSON: ${
        err instanceof Error ? err.message : String(err)
      }`,
      { kind: 'unexpected_status' },
    );
  }

  const generationId =
    body && typeof body === 'object' && 'generationId' in body
      ? String((body as { generationId: unknown }).generationId ?? '')
      : '';
  if (!generationId) {
    throw new GammaError(
      'Gamma response did not include a generationId.',
      { kind: 'unexpected_status' },
    );
  }

  // --- Poll for completion -------------------------------------------------
  const pollUrl = `${GAMMA_GENERATIONS_ENDPOINT}/${encodeURIComponent(
    generationId,
  )}`;
  const start = Date.now();

  while (Date.now() - start < GENERATION_TIMEOUT_MS) {
    await sleep(POLL_INTERVAL_MS);

    let pollRes: Response;
    try {
      pollRes = await fetch(pollUrl, {
        method: 'GET',
        headers: {
          'X-API-KEY': apiKey,
          Accept: 'application/json',
        },
      });
    } catch (err) {
      throw new GammaError(
        `Network failure polling Gamma: ${
          err instanceof Error ? err.message : String(err)
        }`,
        { kind: 'transport' },
      );
    }

    if (!pollRes.ok) {
      const text = await safeReadText(pollRes);
      throw new GammaError(
        `Gamma polling failed (HTTP ${pollRes.status}): ${
          text || pollRes.statusText
        }`,
        { kind: 'unexpected_status' },
      );
    }

    let pollBody: Record<string, unknown>;
    try {
      pollBody = (await pollRes.json()) as Record<string, unknown>;
    } catch (err) {
      throw new GammaError(
        `Gamma poll response was not valid JSON: ${
          err instanceof Error ? err.message : String(err)
        }`,
        { kind: 'unexpected_status' },
      );
    }

    const status = String(pollBody.status ?? '').toLowerCase();

    if (status === 'completed') {
      const gammaUrl = stringOrEmpty(pollBody.gammaUrl);
      const exportUrl = stringOrEmpty(pollBody.exportUrl);
      const gammaId = stringOrEmpty(pollBody.gammaId);
      const credits = numberOrNull(pollBody.credits);

      if (!gammaUrl || !exportUrl) {
        throw new GammaError(
          'Gamma reported completion but did not return a gammaUrl + exportUrl.',
          { kind: 'unexpected_status' },
        );
      }

      return {
        gammaUrl,
        exportUrl,
        generationId,
        gammaId,
        credits,
        rateLimit: readRateLimit(pollRes),
      };
    }

    if (status === 'failed') {
      // Surface the upstream error message honestly — never paper over it.
      const detail =
        stringOrEmpty(pollBody.error) ||
        stringOrEmpty(pollBody.message) ||
        'Gamma reported the generation failed without a message.';
      throw new GammaError(`Gamma generation failed: ${detail}`, {
        kind: 'gamma_failed',
      });
    }
    // Any other status (queued / running / pending) → keep polling.
  }

  throw new GammaError(
    `Gamma generation did not complete within ${Math.round(
      GENERATION_TIMEOUT_MS / 1000,
    )} seconds.`,
    { kind: 'timeout' },
  );
}

/** Safely read a response body as text — never throws. */
async function safeReadText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return '';
  }
}

/** Coerce an unknown value to a non-empty string, or `''`. */
function stringOrEmpty(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

/** Coerce an unknown value to a finite number, or `null`. */
function numberOrNull(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

// Internal constants exported for tests only — the route and serializer must
// not depend on these. Tests use them to assert the documented timing.
export const __testing = {
  POLL_INTERVAL_MS,
  GENERATION_TIMEOUT_MS,
  GAMMA_GENERATIONS_ENDPOINT,
};
