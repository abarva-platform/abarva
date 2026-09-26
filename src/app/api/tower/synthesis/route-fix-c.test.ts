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

import {
  TOWER_SYNTHESIS_TEMPERATURE,
  TOWER_SYNTHESIS_TIMEOUT_MS,
  TOWER_SYNTHESIS_TIMEOUT_MESSAGE,
} from './route';

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

  it('wires temperature, AbortController, and honest fallback into the route source', async () => {
    // Source-level audit: a constant test alone would not catch a refactor
    // that imports the constant but does not actually pass it into the SDK
    // call, or one that drops AbortController.
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const source = await fs.readFile(
      path.join(__dirname, 'route.ts'),
      'utf8',
    );
    expect(source).toContain('temperature: TOWER_SYNTHESIS_TEMPERATURE');
    expect(source).toContain('new AbortController()');
    expect(source).toContain('abortController.signal');
    expect(source).toContain('TOWER_SYNTHESIS_TIMEOUT_MESSAGE');
    // The original bug: max_tokens=350 with no temperature. The temperature
    // must now be present; max_tokens is a different concern for this route
    // (a 90–140 word quote) so we do not require a raise.
    expect(source).not.toMatch(/messages\.stream\(\s*\{\s*model: "claude-sonnet-4-6",\s*max_tokens:/);
  });
});
