import {
  TOWER_INGEST_SOURCES,
  findTowerIngestSource,
  towerIngestKindsCovered,
} from '@/lib/tower/ingest/registry';

describe('tower ingest registry', () => {
  it('includes the azure-cost entry', () => {
    const entry = findTowerIngestSource('azure-cost');
    expect(entry).toBeTruthy();
    expect(entry?.targetTable).toBe('tower_cloud_cost');
    expect(entry?.kind).toBe('cost');
  });

  it('keys are unique', () => {
    const keys = TOWER_INGEST_SOURCES.map((s) => s.key);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });

  it('target tables are unique', () => {
    const tables = TOWER_INGEST_SOURCES.map((s) => s.targetTable);
    const unique = new Set(tables);
    expect(unique.size).toBe(tables.length);
  });

  it('every entry has a template, sample, README, parser, validator, CLI', () => {
    for (const s of TOWER_INGEST_SOURCES) {
      expect(s.templatePath).toMatch(/^\/templates\/tower\//);
      expect(s.samplePath).toMatch(/^\/templates\/tower\//);
      expect(s.readmePath).toMatch(/^docs\/templates\/tower\//);
      expect(s.parserModule).toMatch(/^lib\/tower\/ingest\//);
      expect(s.validatorModule).toMatch(/^lib\/tower\/ingest\//);
      expect(s.cliScript.length).toBeGreaterThan(0);
    }
  });

  it('kinds covered includes cost (post-S10)', () => {
    expect(towerIngestKindsCovered()).toContain('cost');
  });
});
