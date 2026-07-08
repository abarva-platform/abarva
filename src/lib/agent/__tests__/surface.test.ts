/**
 * Surface key canonicalization · PR-G regression tests
 *
 * Locks in the rule that translated semantic surface keys (e.g.
 * 'programs-detail') into URL-shaped keys (e.g. '/programs/<id>') so
 * tool registration and the artifact-channel gate stay aligned across
 * the two surface-key conventions that exist in the codebase.
 *
 * The bug this guards against: PR-C registered `advance_phase` for
 * `/programs/:id` but AtlasPageStateProvider sends `surface=
 * 'programs-detail'`, so surfaceMatches() returned false (segment
 * count mismatch) and the tool was silently filtered out of the
 * agent's toolset on the program-detail page.
 */

import { canonicalizeSurface, canonicalizeFromBody } from '../surface';

describe('canonicalizeSurface', () => {
  it("'programs-detail' + programId in context → '/programs/<id>'", () => {
    const out = canonicalizeSurface('programs-detail', { programId: 'apx-cdp-2026' });
    expect(out).toBe('/programs/apx-cdp-2026');
  });

  it("'programs-detail' without programId stays semantic (no canonical form available)", () => {
    expect(canonicalizeSurface('programs-detail', {})).toBe('programs-detail');
    expect(canonicalizeSurface('programs-detail', undefined)).toBe('programs-detail');
    expect(canonicalizeSurface('programs-detail', null)).toBe('programs-detail');
  });

  it("'programs-detail' with non-string programId is rejected", () => {
    expect(canonicalizeSurface('programs-detail', { programId: 123 as unknown as string })).toBe(
      'programs-detail',
    );
  });

  it('URL-shaped surfaces pass through unchanged', () => {
    expect(canonicalizeSurface('/programs/apx-cdp-2026', { programId: 'other' })).toBe(
      '/programs/apx-cdp-2026',
    );
    expect(canonicalizeSurface('/programs/new', {})).toBe('/programs/new');
  });

  it('PR-I · single-segment semantic surfaces canonicalize to canonical routes', () => {
    expect(canonicalizeSurface('home', {})).toBe('/home');
    expect(canonicalizeSurface('tower', {})).toBe('/tower');
    expect(canonicalizeSurface('programs', {})).toBe('/programs');
    expect(canonicalizeSurface('source', {})).toBe('/source');
    expect(canonicalizeSurface('intelligence', {})).toBe('/intelligence');
    expect(canonicalizeSurface('setup', {})).toBe('/admin/setup');
  });

  it('still-unknown semantic surfaces pass through unchanged', () => {
    // 'source-detail' / 'setup-detail' would each need their own id in
    // surfaceContext to canonicalize (parallel to programs-detail).
    // Until that's wired they pass through.
    expect(canonicalizeSurface('source-detail', { programId: 'x' })).toBe('source-detail');
    expect(canonicalizeSurface('setup-detail', { programId: 'x' })).toBe('setup-detail');
    expect(canonicalizeSurface('something-bespoke', {})).toBe('something-bespoke');
  });

  it("'intelligence' canonicalizes to '/intelligence' (PR-INT-B)", () => {
    expect(canonicalizeSurface('intelligence', {})).toBe('/intelligence');
    expect(canonicalizeSurface('intelligence', undefined)).toBe('/intelligence');
  });

  it('empty surface stays empty', () => {
    expect(canonicalizeSurface('', {})).toBe('');
  });

  describe("'strategic-moves-workspace' — regression for the live grounding-loss bug", () => {
    // Confirmed live (2026-07-08 Moves aVa chat hardening proof): the phase
    // chat client sent surfaceContext.moveId (not .programId), so this case
    // fell through to the bare "/strategic-moves" branch and every
    // downstream programId-gated block (phase pack, Moves aVa packet) never
    // built — aVa answered "No active Move session is visible."

    it('resolves via programId in context (the documented contract)', () => {
      expect(canonicalizeSurface('strategic-moves-workspace', { programId: 'move-123' })).toBe(
        '/strategic-moves/move-123',
      );
    });

    it('falls back to moveId in context when programId is absent (the bug fix)', () => {
      expect(canonicalizeSurface('strategic-moves-workspace', { moveId: 'move-123' })).toBe(
        '/strategic-moves/move-123',
      );
    });

    it('programId wins over moveId when both are present', () => {
      expect(
        canonicalizeSurface('strategic-moves-workspace', {
          programId: 'from-program-id',
          moveId: 'from-move-id',
        }),
      ).toBe('/strategic-moves/from-program-id');
    });

    it('falls back to the bare surface only when neither id is present', () => {
      expect(canonicalizeSurface('strategic-moves-workspace', {})).toBe('/strategic-moves');
      expect(canonicalizeSurface('strategic-moves-workspace', { moveId: 123 as unknown as string })).toBe(
        '/strategic-moves',
      );
    });
  });
});

describe('canonicalizeFromBody', () => {
  it('extracts programId from top-level body field (useAgentStream path)', () => {
    const r = canonicalizeFromBody({
      surface: 'programs-detail',
      programId: 'apx-cdp-2026',
      surfaceContext: {},
    });
    expect(r).toEqual({ surface: '/programs/apx-cdp-2026', programId: 'apx-cdp-2026' });
  });

  it('extracts programId from surfaceContext (AtlasPageStateProvider path)', () => {
    const r = canonicalizeFromBody({
      surface: 'programs-detail',
      surfaceContext: { programId: 'apx-cc-2026', programName: 'Contact Center AI' },
    });
    expect(r).toEqual({ surface: '/programs/apx-cc-2026', programId: 'apx-cc-2026' });
  });

  it('top-level programId beats surfaceContext.programId when both present', () => {
    const r = canonicalizeFromBody({
      surface: 'programs-detail',
      programId: 'top-wins',
      surfaceContext: { programId: 'context-loses' },
    });
    expect(r).toEqual({ surface: '/programs/top-wins', programId: 'top-wins' });
  });

  it('returns programId=undefined when neither field has it (and canonicalizes the surface)', () => {
    const r = canonicalizeFromBody({ surface: 'home' });
    expect(r).toEqual({ surface: '/home', programId: undefined });
  });

  it('preserves URL-shaped surface untouched', () => {
    const r = canonicalizeFromBody({
      surface: '/programs/apx-cdp-2026',
      programId: 'apx-cdp-2026',
    });
    expect(r.surface).toBe('/programs/apx-cdp-2026');
  });

  it('regression: Moves phase chat body (semantic surface + surfaceContext.moveId only) now resolves programId and the URL-shaped surface', () => {
    // This is the exact shape StrategicMovePhaseClient.tsx sent before the
    // fix — surface as the semantic key, id only under surfaceContext.moveId,
    // no top-level programId. Before the fix this returned
    // { surface: '/strategic-moves', programId: undefined }, which is what
    // caused aVa to lose all Move context live.
    const r = canonicalizeFromBody({
      surface: 'strategic-moves-workspace',
      surfaceContext: { moveId: '908c9bf8-e745-45dc-9ad8-3d493a2a1c8a', phase: 2 },
    });
    expect(r).toEqual({
      surface: '/strategic-moves/908c9bf8-e745-45dc-9ad8-3d493a2a1c8a',
      programId: '908c9bf8-e745-45dc-9ad8-3d493a2a1c8a',
    });
  });

  it('a fresh call with no id anywhere still correctly reports no active Move (no false grounding)', () => {
    const r = canonicalizeFromBody({ surface: 'strategic-moves-workspace', surfaceContext: {} });
    expect(r).toEqual({ surface: '/strategic-moves', programId: undefined });
  });
});
