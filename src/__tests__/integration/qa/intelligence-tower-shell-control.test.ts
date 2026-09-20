/**
 * SHELL7 — Intelligence / Control Tower Shell Control
 * Wave 20, Lane G · Updated I1: IntelligenceRouteShell retired.
 *
 * fs-only checks; no jsdom, no React rendering.
 */

import fs from 'fs';
import path from 'path';

import {
  resolvePathStatus,
  SHARED_PATH_DISPOSITIONS,
} from '@/lib/qa/path-disposition';

const ROOT = path.resolve(__dirname, '../../../../');

function readFile(relPath: string): string {
  const abs = path.join(ROOT, relPath);
  if (!fs.existsSync(abs)) return '';
  return fs.readFileSync(abs, 'utf-8');
}

function fileExists(relPath: string): boolean {
  return fs.existsSync(path.join(ROOT, relPath));
}

// I1: IntelligenceRouteShell.tsx retired — this constant is kept as the
// expected-absent path for the retirement assertion.
const INTELLIGENCE_SHELL = 'src/components/intelligence/IntelligenceRouteShell.tsx';
const TOWER_SHELL = 'src/components/tower/TowerRouteShell.tsx';

const REGISTER_NAME = 'SHARED_PATH_DISPOSITIONS in src/lib/qa/path-disposition.ts';

// The tenant-scoped Intelligence route, removed by the legacy surface sunset
// at 0c6a86c51 together with the tab strip it rendered. Kept as a named
// expected-absent path rather than deleted, so the loss stays on the record.
const RETIRED_INTELLIGENCE_ROUTE =
  'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx';
const RETIRED_LENS_TABS = 'src/components/intelligence/IntelligenceLensTabs.tsx';

// The Intelligence route that serves the surface today.
const LIVE_INTELLIGENCE_ROUTE = 'src/app/(maestro)/intelligence/page.tsx';
const TOWER_ROUTE =
  'src/app/(maestro)/tenant/[tenantSlug]/tower/page.tsx';

describe('SHELL7: Intelligence Tower Shell Control', () => {
  // ── I1 Retirement ─────────────────────────────────────────────────────────

  it('IntelligenceRouteShell.tsx has been retired (deleted in I1)', () => {
    // I1 removed IntelligenceRouteShell per audit §1 gap G4.
    // Tenant intelligence page now renders IntelligenceLensTabs directly.
    expect(fileExists(INTELLIGENCE_SHELL)).toBe(false);
  });

  // ── Tower shell still present ─────────────────────────────────────────────

  it('TowerRouteShell.tsx exists', () => {
    expect(fileExists(TOWER_SHELL)).toBe(true);
  });

  // ── No teal ────────────────────────────────────────────────────────────────

  it('TowerRouteShell.tsx does not contain #14B8A6 or teal', () => {
    const src = readFile(TOWER_SHELL);
    expect(src).not.toMatch(/#14B8A6/i);
    expect(src).not.toMatch(/teal/i);
  });

  // ── Deterministic caveat ───────────────────────────────────────────────────

  it('TowerRouteShell.tsx contains Deterministic caveat', () => {
    const src = readFile(TOWER_SHELL);
    expect(src).toContain('Deterministic');
  });

  // ── Orientation strings ────────────────────────────────────────────────────

  it('TowerRouteShell.tsx contains CONTROL TOWER orientation string', () => {
    const src = readFile(TOWER_SHELL);
    expect(src).toContain('CONTROL TOWER');
  });

  // ── The tenant Intelligence route, and the tab strip it rendered ─────────

  it.each([RETIRED_INTELLIGENCE_ROUTE, RETIRED_LENS_TABS])(
    '%s is absent, and the register names the commit that removed it',
    (rel) => {
      // This case used to require the route to exist and import
      // IntelligenceLensTabs. Both are gone, removed by the same commit, and
      // the component survives nowhere in the product.
      expect(fileExists(rel)).toBe(false);

      const resolved = resolvePathStatus(rel, false, SHARED_PATH_DISPOSITIONS, REGISTER_NAME);
      expect(resolved.status).toBe('removed');
      expect(resolved.detail).toContain('0c6a86c51');
    },
  );

  it('does not wave through an absence nobody declared', () => {
    // Without this the case above is satisfied by a register that says yes to
    // everything, and the declaration would stop being a claim.
    const resolved = resolvePathStatus(
      'src/app/(maestro)/tenant/[tenantSlug]/nowhere/page.tsx',
      false,
      SHARED_PATH_DISPOSITIONS,
      REGISTER_NAME,
    );
    expect(resolved.status).toBe('fail');
  });

  it('the surviving Intelligence route uses no shell wrapper', () => {
    // The old version of this asked whether the RETIRED route contained
    // 'IntelligenceRouteShell'. `readFile` returns '' for a missing file, so
    // it passed by reading nothing — a green case that proved nothing. Asked
    // of the route that exists, it is a real question.
    expect(fileExists(LIVE_INTELLIGENCE_ROUTE)).toBe(true);
    const src = readFile(LIVE_INTELLIGENCE_ROUTE);
    expect(src.length).toBeGreaterThan(0);
    expect(src).not.toContain('IntelligenceRouteShell');
    expect(src).not.toContain('IntelligenceLensTabs');
  });

  // ── Tower route ────────────────────────────────────────────────────────────

  it('Tower route file exists', () => {
    // This was written as "exists OR deferred reason documented", and the
    // second arm asserted that a string literal defined one line above
    // contained the word 'deferred'. That branch could not fail for any
    // state of the tree. The file exists, so the check is simply the check.
    expect(fileExists(TOWER_ROUTE)).toBe(true);
  });
});
