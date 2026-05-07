/**
 * Production Readiness — PR 9 polish.
 *
 * Locks in the two changes from `PR_09_PRODUCTION_READINESS_POLISH.md`:
 *   - §2.1: the Pilot tile carries blockerLinks pointing at the
 *     panel that resolves each blocker (Access → SSO docs;
 *     Security/Connectors → Connectors panel; Approvals → Overview).
 *   - §2.2: tile body + demo-seed gate criterion substitute the
 *     active tenant's display name instead of hardcoded
 *     "Apex Retail".
 */

import { buildProductionReadinessPageView } from '../production-readiness-page-view';

describe('Production Readiness · PR 9 §2.1 — Pilot blockerLinks', () => {
  it('Pilot tile exposes 4 linked blockers in the documented order', async () => {
    const view = await buildProductionReadinessPageView('apex-retail', 'Apex Retail Group');
    const pilot = view.tiles.find((t) => t.id === 'pilot');
    expect(pilot).toBeDefined();
    expect(pilot?.blockerLinks).toBeDefined();
    expect(pilot?.blockerLinks?.map((b) => b.label)).toEqual([
      'Access',
      'Security',
      'Connectors',
      'Approvals',
    ]);
  });

  it('each Pilot blocker link points at the correct destination', async () => {
    const view = await buildProductionReadinessPageView('apex-retail', 'Apex Retail Group');
    const pilot = view.tiles.find((t) => t.id === 'pilot');
    const byLabel = new Map(
      (pilot?.blockerLinks ?? []).map((b) => [b.label, b.href]),
    );
    expect(byLabel.get('Access')).toBe('/admin/users-access/sso-configuration');
    expect(byLabel.get('Security')).toBe('/admin/connectors?tab=health');
    expect(byLabel.get('Connectors')).toBe('/admin/connectors?tab=requirements');
    expect(byLabel.get('Approvals')).toBe('/admin');
  });

  it('Pilot tile body becomes "Needs:" (header), no longer the comma list', async () => {
    const view = await buildProductionReadinessPageView('apex-retail', 'Apex Retail Group');
    const pilot = view.tiles.find((t) => t.id === 'pilot');
    expect(pilot?.body).toBe('Needs:');
    expect(pilot?.body).not.toContain('access, security');
  });

  it('Demo and Production tiles do NOT carry blockerLinks', async () => {
    const view = await buildProductionReadinessPageView('apex-retail', 'Apex Retail Group');
    const demo = view.tiles.find((t) => t.id === 'demo');
    const production = view.tiles.find((t) => t.id === 'production');
    expect(demo?.blockerLinks).toBeUndefined();
    expect(production?.blockerLinks).toBeUndefined();
  });
});

describe('Production Readiness · PR 9 §2.2 — tenant-substituted copy', () => {
  it('Demo tile body reflects the passed tenant name', async () => {
    const view = await buildProductionReadinessPageView('first-capital', 'First Capital Financial');
    const demo = view.tiles.find((t) => t.id === 'demo');
    expect(demo?.body).toContain('First Capital Financial rich seed available');
    expect(demo?.body).not.toContain('Apex Retail');
  });

  it('demo-seed gate criterion evidenceBasis reflects the passed tenant name', async () => {
    const view = await buildProductionReadinessPageView('first-capital', 'First Capital Financial');
    const demoGate = view.gateCriteria.find((g) => g.gateId === 'demo');
    const demoSeed = demoGate?.criteria.find((c) => c.id === 'demo-seed');
    expect(demoSeed?.evidenceBasis).toContain('First Capital Financial');
    expect(demoSeed?.evidenceBasis).not.toContain('Apex Retail');
  });

  it('Apex still renders correctly when its name is passed (regression check)', async () => {
    const view = await buildProductionReadinessPageView('apex-retail', 'Apex Retail Group');
    const demo = view.tiles.find((t) => t.id === 'demo');
    expect(demo?.body).toContain('Apex Retail Group rich seed available');
  });

  it('falls back to Apex when no tenant name passed (backward compat)', async () => {
    const view = await buildProductionReadinessPageView();
    const demo = view.tiles.find((t) => t.id === 'demo');
    expect(demo?.body).toContain('Apex Retail Group');
  });
});
