/**
 * I1 — Intelligence Route Shell Retirement
 * Deterministic filesystem checks (no jsdom, no network).
 *
 * I1 retired IntelligenceRouteShell (per audit §1 gap G4).
 * This suite now verifies:
 *   - IntelligenceRouteShell.tsx does NOT exist (correctly deleted)
 *   - Tenant intelligence route directly renders IntelligenceLensTabs
 *   - Route resolves tab from searchParams (tab-driven navigation preserved)
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

describe('I1 — IntelligenceRouteShell retirement', () => {
  let routeSource: string;

  beforeAll(() => {
    routeSource = fs.readFileSync(ROUTE_PAGE_PATH, 'utf8');
  });

  // ── Retirement verification ───────────────────────────────────────────────

  it('IntelligenceRouteShell.tsx has been deleted (I1 retirement)', () => {
    expect(fs.existsSync(SHELL_PATH)).toBe(false);
  });

  it('Tenant intelligence route file exists', () => {
    expect(fs.existsSync(ROUTE_PAGE_PATH)).toBe(true);
  });

  it('Tenant intelligence route does NOT import IntelligenceRouteShell', () => {
    expect(routeSource).not.toContain('IntelligenceRouteShell');
  });

  it('Tenant intelligence route does NOT use <IntelligenceRouteShell', () => {
    expect(routeSource).not.toContain('<IntelligenceRouteShell');
  });

  // ── IntelligenceLensTabs wiring (preserved from INTEL4) ──────────────────

  it('Tenant intelligence route imports IntelligenceLensTabs', () => {
    expect(routeSource).toContain('IntelligenceLensTabs');
  });

  it('Tenant intelligence route renders <IntelligenceLensTabs', () => {
    expect(routeSource).toContain('<IntelligenceLensTabs');
  });

  it('Route resolves the active intelligence tab from search params', () => {
    expect(routeSource).toContain('resolveIntelligenceTab');
  });

  it('Route passes activeTab to IntelligenceLensTabs', () => {
    expect(routeSource).toContain('activeTab={activeTab}');
  });

  it('Route passes tenant to IntelligenceLensTabs', () => {
    expect(routeSource).toContain('tenant={tenant}');
  });

  it('Route passes baseUrl to IntelligenceLensTabs', () => {
    expect(routeSource).toContain('baseUrl={baseUrl}');
  });
});
