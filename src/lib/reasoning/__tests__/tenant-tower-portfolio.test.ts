// Atlas Fix A (2026-05-30) — P0 cross-tenant leak invariants for the
// Tower synthesis portfolio loader. The behaviour under test is:
//
//   - Apex tenant with the demo-fixture flag ON → fixture returned.
//   - Meridian / First Capital / unknown tenant → empty arrays, never
//     Apex content.
//
// These tests are the regression net for the audit at
// docs/audits/ATLAS-CXO-QUALITY-AUDIT-2026-05-30.md.

import { loadTenantTowerPortfolio } from '../tenant-tower-portfolio';

describe('loadTenantTowerPortfolio — P0 cross-tenant invariants', () => {
  it('returns the Apex demo fixture for the apexretail tenant', () => {
    const out = loadTenantTowerPortfolio({ clientKey: 'apexretail' });
    expect(out.fromApexFixture).toBe(true);
    expect(out.programInstances.length).toBeGreaterThan(0);
    expect(out.sourceEventInstances.length).toBeGreaterThan(0);
  });

  it('returns EMPTY for a meridian tenant — never Apex content', () => {
    const out = loadTenantTowerPortfolio({ clientKey: 'meridian' });
    expect(out.fromApexFixture).toBe(false);
    expect(out.programInstances).toEqual([]);
    expect(out.sourceEventInstances).toEqual([]);
  });

  it('returns EMPTY for a First Capital (arcturus) tenant — never Apex content', () => {
    const out = loadTenantTowerPortfolio({ clientKey: 'arcturus' });
    expect(out.fromApexFixture).toBe(false);
    expect(out.programInstances).toEqual([]);
    expect(out.sourceEventInstances).toEqual([]);
  });

  it('returns Lakeshore-scoped Kyriba portfolio instances for the Lakeshore tenant', () => {
    const out = loadTenantTowerPortfolio({ clientKey: 'lakeshore' });
    expect(out.fromApexFixture).toBe(false);
    expect(out.programInstances.map((program) => program.id)).toEqual([
      'LSH-KYRIBA-2026',
    ]);
    expect(out.sourceEventInstances.map((event) => event.id)).toEqual([
      'LSH-KYRIBA-TREASURY-2026',
    ]);
    expect(out.programInstances.every((program) => program.tenantId === 'lakeshore-holdings')).toBe(true);
    expect(out.sourceEventInstances.every((event) => event.tenantId === 'lakeshore-holdings')).toBe(true);
  });

  it('normalizes the Lakeshore broker tenant key', () => {
    const out = loadTenantTowerPortfolio({ clientKey: 'LAKESHORE-HOLDINGS' });
    expect(out.programInstances[0]?.id).toBe('LSH-KYRIBA-2026');
    expect(out.sourceEventInstances[0]?.id).toBe('LSH-KYRIBA-TREASURY-2026');
  });

  it('returns EMPTY for an unknown / missing tenant key — never Apex content', () => {
    const unknown = loadTenantTowerPortfolio({ clientKey: 'some-new-tenant' });
    expect(unknown.fromApexFixture).toBe(false);
    expect(unknown.programInstances).toEqual([]);
    expect(unknown.sourceEventInstances).toEqual([]);

    const missing = loadTenantTowerPortfolio({});
    expect(missing.fromApexFixture).toBe(false);
    expect(missing.programInstances).toEqual([]);
    expect(missing.sourceEventInstances).toEqual([]);
  });

  it('tenant-key case is normalized — uppercase APEXRETAIL still resolves', () => {
    const out = loadTenantTowerPortfolio({ clientKey: 'APEXRETAIL' });
    expect(out.fromApexFixture).toBe(true);
  });

  it('Meridian fixture data MUST NOT contain Apex program identifiers', () => {
    // Belt-and-braces: if a future change ever causes Meridian to receive
    // Apex content, this assertion catches it before it ships.
    const out = loadTenantTowerPortfolio({ clientKey: 'meridian' });
    for (const p of out.programInstances) {
      expect(p.id.toLowerCase()).not.toContain('apx');
      expect(p.id.toLowerCase()).not.toContain('apex');
    }
    for (const s of out.sourceEventInstances) {
      expect(s.id.toLowerCase()).not.toContain('apex');
    }
  });

  it('Meridian fixture data MUST NOT contain Lakeshore program identifiers', () => {
    const out = loadTenantTowerPortfolio({ clientKey: 'meridian' });
    for (const p of out.programInstances) {
      expect(p.id.toLowerCase()).not.toContain('lsh');
      expect(p.id.toLowerCase()).not.toContain('lakeshore');
    }
    for (const s of out.sourceEventInstances) {
      expect(s.id.toLowerCase()).not.toContain('lsh');
      expect(s.id.toLowerCase()).not.toContain('lakeshore');
    }
  });
});
