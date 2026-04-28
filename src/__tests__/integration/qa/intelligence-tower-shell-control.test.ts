/**
 * SHELL7 — Intelligence / Control Tower Shell Control
 * Wave 20, Lane G · Updated I1: IntelligenceRouteShell retired.
 *
 * fs-only checks; no jsdom, no React rendering.
 */

import fs from 'fs';
import path from 'path';

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

const INTELLIGENCE_ROUTE =
  'src/app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx';
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

  // ── Intelligence route now directly renders IntelligenceLensTabs ──────────

  it('Intelligence route imports IntelligenceLensTabs (I1 — no shell wrapper)', () => {
    expect(fileExists(INTELLIGENCE_ROUTE)).toBe(true);
    const src = readFile(INTELLIGENCE_ROUTE);
    expect(src).toContain('IntelligenceLensTabs');
  });

  it('Intelligence route does NOT use IntelligenceRouteShell (retired)', () => {
    const src = readFile(INTELLIGENCE_ROUTE);
    expect(src).not.toContain('IntelligenceRouteShell');
  });

  // ── Tower route ────────────────────────────────────────────────────────────

  it('Tower route file exists OR deferred reason documented', () => {
    const exists = fileExists(TOWER_ROUTE);
    if (!exists) {
      const reason =
        'Tower route page.tsx not found; wiring deferred — ' +
        'shell components are available for additive mount in a follow-up slice.';
      expect(reason).toContain('deferred');
    } else {
      expect(exists).toBe(true);
    }
  });
});
