// Registry tests — union-merge and entry shape.

import {
  TOWER_INGEST_SOURCES,
  findIngestSource,
  mergeIngestSources,
  type TowerIngestSource,
} from '../registry';

describe('tower ingest registry', () => {
  it('exposes the servicenow-itsm entry', () => {
    const e = findIngestSource('servicenow-itsm');
    expect(e).toBeDefined();
    expect(e?.targetTable).toBe('tower_itsm_records');
    expect(e?.status).toBe('available');
  });

  it('keys are unique', () => {
    const keys = TOWER_INGEST_SOURCES.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('every entry has a template and a parser module', () => {
    for (const s of TOWER_INGEST_SOURCES) {
      expect(s.templatePath).toMatch(/^public\/templates\/tower\//);
      expect(s.readmePath).toMatch(/^docs\/templates\/tower\//);
      expect(s.parserModule).toMatch(/^@\/lib\/tower\/ingest\//);
      expect(s.cliScript).toMatch(/^src\/scripts\/tower\//);
    }
  });

  it('mergeIngestSources is union-merge by key (last write wins)', () => {
    const a: TowerIngestSource[] = [
      {
        key: 'x',
        label: 'X',
        recordType: 'other',
        description: 'old',
        templatePath: 'public/templates/tower/x/template.xlsx',
        readmePath: 'docs/templates/tower/x/README.md',
        parserModule: '@/lib/tower/ingest/x',
        cliScript: 'src/scripts/tower/x.ts',
        targetTable: 'tower_x',
        status: 'planned',
      },
    ];
    const b: TowerIngestSource[] = [
      {
        ...a[0],
        description: 'new',
        status: 'available',
      },
    ];
    const merged = mergeIngestSources(a, b);
    expect(merged).toHaveLength(1);
    expect(merged[0].description).toBe('new');
    expect(merged[0].status).toBe('available');
  });

  it('merge preserves additive entries', () => {
    const a: TowerIngestSource[] = [TOWER_INGEST_SOURCES[0]];
    const b: TowerIngestSource[] = [
      {
        ...TOWER_INGEST_SOURCES[0],
        key: 'datadog-apm',
        label: 'Datadog APM',
        recordType: 'observability',
      },
    ];
    const merged = mergeIngestSources(a, b);
    expect(merged.map((s) => s.key)).toEqual(
      expect.arrayContaining(['servicenow-itsm', 'datadog-apm']),
    );
  });
});
