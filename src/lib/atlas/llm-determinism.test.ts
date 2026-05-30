/**
 * Atlas Fix C — determinism + truncation guard
 *
 * The CXO-quality audit (PR #2562) found two structural bugs on the Atlas
 * Anthropic call path in `src/lib/atlas/llm.ts`:
 *
 *   1. No `temperature` was set, so the SDK default (~1.0) applied. The same
 *      `signal:<id>` rendered as "critical-severity" on one read and
 *      "93rd-percentile outlier" on the next.
 *   2. `max_tokens: 500` truncated industry-context responses mid-sentence
 *      (audit example: "...vs peer median.").
 *
 * Follow-up (Atlas-IAC E2E audit, 2026-05-30): `claude-opus-4-7` removed the
 * `temperature` parameter — Anthropic now returns 400 invalid_request_error
 * when it is set. Determinism is intrinsic to the model. The
 * `ATLAS_TEMPERATURE` constant is kept exported (value 0) to record the
 * intent and to fail this guard if someone re-introduces the literal
 * `temperature: ATLAS_TEMPERATURE` into the call site.
 *
 * These tests pin the contract so a future refactor that loosens either
 * lever fails loudly. They live alongside `llm.ts` because they exercise the
 * exact exported symbols the code path uses.
 */

import { ATLAS_MAX_TOKENS, ATLAS_TEMPERATURE } from './llm';

describe('Atlas LLM determinism and truncation guards', () => {
  it('declares ATLAS_TEMPERATURE=0 as intent (model no longer accepts temperature)', () => {
    expect(ATLAS_TEMPERATURE).toBe(0);
  });

  it('uses a max_tokens cap that covers the canonical CXO response shapes', () => {
    // The audit-flagged 500-token cap was the bug. 500 chops industry-context
    // responses mid-sentence. The new cap must comfortably cover the canon
    // (lead-bullet briefs, lead-tables, 12-20 line industry-context reads).
    expect(ATLAS_MAX_TOKENS).toBeGreaterThanOrEqual(1500);
  });

  it('passes max_tokens into the Anthropic call but no longer sets temperature', async () => {
    // Walk the file source to assert the call site wires ATLAS_MAX_TOKENS into
    // messages.create and does NOT pass `temperature` (deprecated on
    // claude-opus-4-7). A test that only checks the constants without checking
    // the call site would miss the case where someone re-introduces a literal
    // `temperature: …` later — which now causes a 400 on every Atlas turn.
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const source = await fs.readFile(
      path.join(__dirname, 'llm.ts'),
      'utf8',
    );
    // Strip the constant definitions so we can verify the call site itself
    // references the symbols (not just the constant declarations).
    const callSite = source.split('async function runAtlasLlm')[1] ?? '';
    expect(callSite).toContain('max_tokens: ATLAS_MAX_TOKENS');
    expect(callSite).not.toContain('max_tokens: 500');
    // Anthropic returns 400 invalid_request_error if `temperature` is set on
    // claude-opus-4-7. Guard the regression so we never reintroduce it.
    expect(callSite).not.toMatch(/\btemperature\s*:/);
  });
});
