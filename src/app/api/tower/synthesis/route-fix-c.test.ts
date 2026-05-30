/**
 * Atlas Fix C — synthesis determinism + honest timeout
 *
 * The CXO-quality audit (PR #2562) flagged the tower synthesis route for two
 * structural problems:
 *
 *   1. The Anthropic `messages.stream` call had no `temperature`, so the
 *      default (~1.0) drifted across reads of the same portfolio state.
 *   2. The stream had no `AbortController`, so when the upstream hung the UI
 *      sat indefinitely on "Atlas is thinking…".
 *
 * These tests pin the exported levers and the honest-failure message so a
 * future refactor that strips either fails loudly. They live alongside the
 * route so refactors that move the route move the test.
 */

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
    expect(TOWER_SYNTHESIS_TIMEOUT_MESSAGE).toMatch(/Atlas/);
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
