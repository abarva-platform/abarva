/**
 * Tower synthesis Fix C — determinism + honest timeout
 *
 * The CXO-quality audit (PR #2562) flagged the tower synthesis route for two
 * structural problems:
 *
 *   1. The Anthropic `messages.stream` call had no `temperature`, so the
 *      default (~1.0) drifted across reads of the same portfolio state.
 *   2. The stream had no `AbortController`, so when the upstream hung the UI
 *      sat indefinitely on the agent's "thinking…" state. At the time that
 *      state read "Atlas is thinking…"; see the timeout-message case below
 *      for why the product no longer says that.
 *
 * These tests pin the exported levers and the honest-failure message so a
 * future refactor that strips either fails loudly. They live alongside the
 * route so refactors that move the route move the test.
 */

import { assertVisibleAnswerContract } from '@/lib/agent/visible-answer-contract';
import { TOWER_LEAD_AGENT } from '@/lib/tower/constants';

/*
 * Item T-484. The last case in this suite drives the real exported handler, so
 * the route's surroundings are stubbed at the module boundary: tenancy, the
 * tenant portfolio read, the synthesis context, the user-context block and the
 * AI egress preflight. The model client returned by the preflight is the
 * observation point -- it is where "did the route actually pass temperature and
 * a signal into the SDK call" can be answered at all.
 *
 * The constants under test are NOT stubbed. `@/lib/tower/constants` and
 * `@/lib/agent/visible-answer-contract` are the repository's own authorities
 * for the agent's user-facing name and for what a reader may be shown, and the
 * three cases above ask them directly.
 */
jest.mock('server-only', () => ({}));
jest.mock('@/lib/auth/tenancy', () => ({
  requireTenancy: jest.fn(),
  // A spy rather than a plain stub: the fence case below asserts the route hands
  // the refusal to the fence's own mapper instead of composing a status itself.
  tenancyErrorResponse: jest.fn(() => new Response('tenancy', { status: 401 })),
}));
jest.mock('@/lib/auth/program-access-policy', () => ({
  loadUserProgramAccessPolicy: jest.fn(),
  formatUserProgramAccessPolicyForPrompt: () => '',
}));
jest.mock('@/lib/reasoning/tenant-tower-portfolio', () => ({
  loadTenantTowerPortfolio: jest.fn(),
}));
jest.mock('@/lib/reasoning/tower-synthesis-context-builder', () => ({
  buildTowerSynthesisContext: jest.fn(),
  towerStateHash: jest.fn(),
}));
jest.mock('@/lib/active-client', () => ({
  getActiveClientRow: jest.fn(),
}));
jest.mock('@/lib/agent/userContext', () => ({
  getUserContextPromptBlock: jest.fn(async () => ''),
}));
jest.mock('@/lib/integrations/ai-egress', () => ({
  preflightAnthropicDirectClient: jest.fn(),
}));

import { getActiveClientRow } from '@/lib/active-client';
import { loadUserProgramAccessPolicy } from '@/lib/auth/program-access-policy';
import { requireTenancy, tenancyErrorResponse } from '@/lib/auth/tenancy';
import { preflightAnthropicDirectClient } from '@/lib/integrations/ai-egress';
import { loadTenantTowerPortfolio } from '@/lib/reasoning/tenant-tower-portfolio';
import {
  buildTowerSynthesisContext,
  towerStateHash,
} from '@/lib/reasoning/tower-synthesis-context-builder';

import {
  POST,
  TOWER_SYNTHESIS_TEMPERATURE,
  TOWER_SYNTHESIS_TIMEOUT_MS,
  TOWER_SYNTHESIS_TIMEOUT_MESSAGE,
} from './route';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Tower synthesis Fix C levers', () => {
  it('uses temperature=0 so the same portfolio state produces the same read', () => {
    expect(TOWER_SYNTHESIS_TEMPERATURE).toBe(0);
  });

  it('has an explicit upstream timeout, not an open-ended wait', () => {
    // The bug was no timeout at all. Any finite cap is correct in principle;
    // the audit's policy guidance was ~30s. Sanity-clamp to "not silly".
    expect(TOWER_SYNTHESIS_TIMEOUT_MS).toBeGreaterThan(5_000);
    expect(TOWER_SYNTHESIS_TIMEOUT_MS).toBeLessThanOrEqual(60_000);
  });

  it('emits an honest user-facing timeout message instead of silence', () => {
    // The message must clear the "thinking…" state. Asserting wording in case
    // a future refactor swaps in a generic "error" string and loses the
    // CXO-grade phrasing the audit called for.
    //
    // This case used to assert /Atlas/, and was red from 2026-06-27 until it
    // was corrected. `bdbfff54b` — "fix(home,tower): enforce visible answer
    // contract (#4037)" — rewrote this constant from "Atlas couldn't complete
    // …" to "aVa could not complete …" as part of a change whose whole point
    // was that legacy internal agent branding must not reach a reader. So the
    // old expectation was not merely stale: it pinned a string the product's
    // own contract now forbids on a user-facing surface, and a "fix" that
    // satisfied it would have reintroduced the defect #4037 removed.
    //
    // The replacement therefore asserts the identity through the repository's
    // own authorities rather than through a second brand literal that would go
    // stale the same way: `TOWER_LEAD_AGENT` is where Tower states its agent's
    // name — and, since this change, where the route's message gets it from too,
    // so there is one declaration rather than two copies free to drift — and
    // `assertVisibleAnswerContract` is the checker production runs over model
    // output, whose `atlas_branding` rule is the executable form of the sentence
    // "the user-facing identity is aVa".
    //
    // The assertions are ordered so that each one is the FIRST to fail for a
    // distinct defect, because jest abandons a case at its first failed
    // expectation and an assertion that is always pre-empted by an earlier one
    // is an assertion nothing proves. Reinstating the pre-#4037 wording trips
    // the branding clause; rewriting the sentence around a different name, or
    // reducing it to a generic error string, trips the identity check; a raw ID
    // trips the whole-contract check. Each is recorded in the pull request.
    //
    // Note what the identity check does NOT catch, now that the route derives
    // the name from the same constant: renaming the agent in `TOWER_LEAD_AGENT`
    // moves both sides together and this case stays green. That is the point of
    // a single declaration, not a hole — a rename is not a defect. What would be
    // a defect is the message drifting away from the declared name, and that is
    // what these assertions see.
    const contract = assertVisibleAnswerContract(TOWER_SYNTHESIS_TIMEOUT_MESSAGE);
    expect(contract.violations.map((violation) => violation.id)).not.toContain(
      'atlas_branding',
    );
    // A timeout notice is prose a user reads, so it owes the whole contract,
    // not only the branding clause — a raw ID or a stock closing would be just
    // as wrong here as in an answer.
    expect(contract.violations).toEqual([]);
    expect(contract.passed).toBe(true);

    expect(TOWER_SYNTHESIS_TIMEOUT_MESSAGE).toContain(TOWER_LEAD_AGENT);
    expect(TOWER_SYNTHESIS_TIMEOUT_MESSAGE).toMatch(/time/i);
    expect(TOWER_SYNTHESIS_TIMEOUT_MESSAGE.length).toBeGreaterThan(20);
  });

  /*
   * Item T-484. This case used to read `route.ts` as text and match four
   * substrings: `temperature: TOWER_SYNTHESIS_TEMPERATURE`,
   * `new AbortController()`, `abortController.signal` and
   * `TOWER_SYNTHESIS_TIMEOUT_MESSAGE`. Its own comment said what it was for --
   * "a constant test alone would not catch a refactor that imports the constant
   * but does not actually pass it into the SDK call" -- and that is precisely
   * the question reading the file cannot answer. It answers a spelling question
   * instead, and the pull request records both directions measured against
   * mutations of `route.ts`: an override spread in after the literal, and a
   * signal bound to a local and then not passed, each left all four substrings
   * in place and the old case green; binding the temperature through a local
   * changed no behaviour and turned it red.
   *
   * So the subject is what the SDK call receives, and what a caller gets back
   * when the upstream never produces a token. Both are read from the real
   * exported handler.
   */
  it('passes temperature and an abort signal into the model call', async () => {
    let params: Record<string, unknown> | undefined;
    let options: { signal?: AbortSignal } | undefined;
    const stream = jest.fn(async (...args: unknown[]) => {
      params = args[0] as Record<string, unknown>;
      options = args[1] as { signal?: AbortSignal } | undefined;
      return oneTextChunk('Portfolio read stands.');
    });
    givenRoute({ stream, stateHash: 'temperature-case' });

    const response = await POST(new Request('https://test.local/api/tower/synthesis', { method: 'POST' }));

    expect(response.status).toBe(200);
    expect(stream).toHaveBeenCalledTimes(1);

    // The received argument, not the text of the call site. A refactor that
    // imports the constant and then overrides it fails here.
    expect(params?.temperature).toBe(TOWER_SYNTHESIS_TEMPERATURE);
    expect(params?.temperature).toBe(0);

    // Cancellation has to reach the SDK to bound anything. An AbortController
    // constructed and not handed over is the defect this replaces.
    expect(options?.signal).toBeInstanceOf(AbortSignal);
    expect(options?.signal?.aborted).toBe(false);
  });

  /*
   * Not part of T-484's four cases, and here for a reason the CI gate found
   * rather than one this item predicted.
   *
   * `docs/security/tenancy-fence-coverage.json` classifies a route as
   * `behavioral` as soon as a suite loads it and calls an HTTP-method handler.
   * The two cases above do exactly that, which moved this route out of the
   * census's `byteScannerOnly` bucket -- and they stub `requireTenancy`, so on
   * their own they say nothing about the fence. Measured, not assumed: with the
   * fence deleted (tenancy hard-coded to a foreign tenant and the refusal arm
   * returning 200) both covering suites stayed GREEN, 9 passed / 4 skipped,
   * byte-identical to the clean baseline. A change that improves how a security
   * census reads without improving what it measures is the shape this backlog
   * exists against, so the gap is closed here rather than recorded as a caveat.
   *
   * What this asserts is the part a stubbed fence can still prove honestly: the
   * route CONSULTS the fence before doing anything else, and a fence refusal
   * becomes the fence's own error response rather than an answer. That is
   * precisely what the census's recorded mutation destroys.
   */
  it('refuses before reading anything when the tenancy fence rejects', async () => {
    const stream = jest.fn();
    givenRoute({ stream, stateHash: 'fence-case' });
    const refusal = new Error('unauthenticated');
    (requireTenancy as jest.Mock).mockRejectedValue(refusal);

    const response = await POST(new Request('https://test.local/api/tower/synthesis', { method: 'POST' }));

    // The fence's own mapper decides the status; the route does not invent one.
    expect(tenancyErrorResponse).toHaveBeenCalledWith(refusal);
    expect(response.status).toBe(401);
    // And nothing tenant-scoped was read or sent: no portfolio load, no model call.
    expect(loadTenantTowerPortfolio).not.toHaveBeenCalled();
    expect(preflightAnthropicDirectClient).not.toHaveBeenCalled();
    expect(stream).not.toHaveBeenCalled();
  });

  it('answers a stalled upstream with the honest timeout message and aborts it', async () => {
    jest.useFakeTimers();
    try {
      let observed: AbortSignal | undefined;
      const stream = jest.fn(async (...args: unknown[]) => {
        const options = args[1] as { signal?: AbortSignal } | undefined;
        observed = options?.signal;
        return stallsUntilAborted(options?.signal);
      });
      givenRoute({ stream, stateHash: 'timeout-case' });

      const pending = POST(new Request('https://test.local/api/tower/synthesis', { method: 'POST' }));
      // Let the handler reach the stream before the clock moves.
      await jest.advanceTimersByTimeAsync(0);
      await jest.advanceTimersByTimeAsync(TOWER_SYNTHESIS_TIMEOUT_MS);
      const response = await pending;

      expect(response.status).toBe(504);
      expect(response.headers.get('X-Synthesis-Timeout')).toBe('true');
      // The body a reader receives, produced by the route rather than quoted
      // from its source.
      expect(await response.text()).toBe(TOWER_SYNTHESIS_TIMEOUT_MESSAGE);
      // And the upstream was actually cancelled, not merely abandoned.
      expect(observed?.aborted).toBe(true);
    } finally {
      jest.useRealTimers();
    }
  });
});

/** One text delta, then end of stream. */
async function* oneTextChunk(text: string) {
  yield { type: 'content_block_delta', delta: { type: 'text_delta', text } };
}

/**
 * An upstream that produces nothing and only ends when the route's own
 * AbortController fires -- which is the stall Fix C exists for. A stream that
 * simply never settles could not tell a working timeout from a hung request.
 */
function stallsUntilAborted(signal: AbortSignal | undefined) {
  return {
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<never>> {
          return new Promise((_resolve, reject) => {
            if (!signal) {
              // The route handed the SDK no way to cancel. Say so instead of
              // hanging: a case that times out reads like flake, and this is a
              // finding.
              reject(
                new Error(
                  'the route called the model without an abort signal, so nothing can bound this stream',
                ),
              );
              return;
            }
            if (signal.aborted) {
              reject(new Error('aborted'));
              return;
            }
            signal.addEventListener('abort', () => reject(new Error('aborted')), {
              once: true,
            });
          });
        },
      };
    },
  };
}

/**
 * Everything the route reaches for other than the model client. Kept in one
 * place so a test states only what it is about.
 */
function givenRoute({
  stream,
  stateHash,
}: {
  stream: jest.Mock;
  stateHash: string;
}) {
  (requireTenancy as jest.Mock).mockResolvedValue({
    clientId: '00000000-0000-4000-8000-000000000001',
    clientKey: `t484-${stateHash}`,
    userId: '00000000-0000-4000-8000-000000000002',
  });
  (loadUserProgramAccessPolicy as jest.Mock).mockResolvedValue({
    outputPolicy: { exactFinancialValues: true },
  });
  (loadTenantTowerPortfolio as jest.Mock).mockReturnValue({
    programInstances: [],
    sourceEventInstances: [],
  });
  (towerStateHash as jest.Mock).mockReturnValue(stateHash);
  (buildTowerSynthesisContext as jest.Mock).mockReturnValue({
    citations: [],
    activeContradictions: [],
    failureModes: [],
    gatesSummary: { total: 0 },
    instanceSnapshot: {
      programCount: 1,
      sourceEventCount: 1,
      pendingGateCount: 0,
      activeBlockerCount: 0,
      programs: [
        {
          id: 'p1',
          name: 'Network Modernisation',
          phase: 2,
          phaseLabel: 'Design',
          gateStatus: 'open',
          openBlockerCount: 0,
          linkedSourceEventIds: [],
        },
      ],
      sourceEvents: [
        {
          id: 's1',
          name: 'Core Platform Renewal',
          stage: 'Evaluation',
          vendorCount: 2,
          activeVendors: [],
          openBlockerCount: 0,
          linkedProgramIds: [],
        },
      ],
    },
  });
  (getActiveClientRow as jest.Mock).mockResolvedValue({ name: 'Test Tenant' });
  (preflightAnthropicDirectClient as jest.Mock).mockResolvedValue({
    ok: true,
    client: { messages: { stream } },
  });
}
