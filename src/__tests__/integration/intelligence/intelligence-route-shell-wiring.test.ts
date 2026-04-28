/**
 * INTEL1 — Intelligence Route Shell Wiring
 * Deterministic filesystem checks (no jsdom, no network).
 * Verifies IntelligenceRouteShell is correctly structured and wired
 * into the intelligence route page.
 */

import * as fs from 'fs';
import * as path from 'path';

// __dirname is src/__tests__/integration/intelligence/
// 4 levels up lands at the project root
const ROOT = path.resolve(__dirname, '../../../../');
const SRC = path.join(ROOT, 'src');

const SHELL_PATH = path.join(
  SRC,
  'components/intelligence/IntelligenceRouteShell.tsx',
);

const ROUTE_PAGE_PATH = path.join(
  SRC,
  'app/(maestro)/tenant/[tenantSlug]/intelligence/page.tsx',
);

describe('INTEL1 — IntelligenceRouteShell wiring', () => {
  let shellSource: string;
  let routeSource: string;

  beforeAll(() => {
    shellSource = fs.readFileSync(SHELL_PATH, 'utf8');
    routeSource = fs.readFileSync(ROUTE_PAGE_PATH, 'utf8');
  });

  // ── Existence checks ─────────────────────────────────────────────────────

  it('IntelligenceRouteShell.tsx exists', () => {
    expect(fs.existsSync(SHELL_PATH)).toBe(true);
  });

  it('Intelligence route page file exists', () => {
    expect(fs.existsSync(ROUTE_PAGE_PATH)).toBe(true);
  });

  // ── Orientation strip / agent label ──────────────────────────────────────

  it('IntelligenceRouteShell.tsx contains INTELLIGENCE orientation string', () => {
    expect(shellSource).toContain('INTELLIGENCE');
  });

  it('IntelligenceRouteShell.tsx contains Sentinel or SENTINEL agent label', () => {
    const hasSentinel =
      shellSource.includes('Sentinel') || shellSource.includes('SENTINEL');
    expect(hasSentinel).toBe(true);
  });

  // ── Deterministic caveat ─────────────────────────────────────────────────

  it('IntelligenceRouteShell.tsx contains Deterministic caveat', () => {
    expect(shellSource).toContain('Deterministic');
  });

  // ── Design canon — no teal ───────────────────────────────────────────────

  it('IntelligenceRouteShell.tsx does NOT contain forbidden teal color #14B8A6', () => {
    expect(shellSource).not.toContain('#14B8A6');
  });

  // ── Tenant data tier ─────────────────────────────────────────────────────

  it('IntelligenceRouteShell.tsx references tenant data tier or caveat system', () => {
    const hasTierReference =
      shellSource.includes('dataTier') ||
      shellSource.includes('TenantDataTier') ||
      shellSource.includes('thin') ||
      shellSource.includes('data tier');
    expect(hasTierReference).toBe(true);
  });

  // ── Route wiring ─────────────────────────────────────────────────────────

  it('Route page imports IntelligenceRouteShell', () => {
    expect(routeSource).toContain('IntelligenceRouteShell');
  });

  it('Route page wraps content with IntelligenceRouteShell', () => {
    expect(routeSource).toContain('<IntelligenceRouteShell');
  });

  it('Route page passes tenantName to IntelligenceRouteShell', () => {
    expect(routeSource).toContain('tenantName=');
  });

  it('Route page passes pageMode to IntelligenceRouteShell', () => {
    expect(routeSource).toContain('pageMode=');
  });

  it('Route page imports IntelligenceLensTabs', () => {
    expect(routeSource).toContain('IntelligenceLensTabs');
  });

  it('Route page resolves the active intelligence tab from search params', () => {
    expect(routeSource).toContain('resolveIntelligenceTab');
  });

  it('Route page passes the active tab into IntelligenceLensTabs', () => {
    expect(routeSource).toContain('activeTab={activeTab}');
  });
});
