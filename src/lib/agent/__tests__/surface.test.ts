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

  it('unknown semantic surfaces pass through unchanged', () => {
    expect(canonicalizeSurface('home', {})).toBe('home');
    expect(canonicalizeSurface('tower', {})).toBe('tower');
    expect(canonicalizeSurface('source-detail', { programId: 'x' })).toBe('source-detail');
  });

  it('empty surface stays empty', () => {
    expect(canonicalizeSurface('', {})).toBe('');
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

  it('returns programId=undefined when neither field has it', () => {
    const r = canonicalizeFromBody({ surface: 'home' });
    expect(r).toEqual({ surface: 'home', programId: undefined });
  });

  it('preserves URL-shaped surface untouched', () => {
    const r = canonicalizeFromBody({
      surface: '/programs/apx-cdp-2026',
      programId: 'apx-cdp-2026',
    });
    expect(r.surface).toBe('/programs/apx-cdp-2026');
  });
});
