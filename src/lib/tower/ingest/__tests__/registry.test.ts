import {
  TOWER_INGEST_SOURCES,
  assertRegistryUniqueKeys,
  findIngestSource,
} from '../registry';

describe('TOWER_INGEST_SOURCES registry', () => {
  test('every entry has the required fields', () => {
    for (const entry of TOWER_INGEST_SOURCES) {
      expect(entry.source).toMatch(/^[a-z][a-z0-9-]*$/);
      expect(entry.displayName.length).toBeGreaterThan(0);
      expect(entry.dimensions.length).toBeGreaterThan(0);
      expect(entry.targetTable).toMatch(/^[a-z_]+$/);
      expect(entry.templatePath).toMatch(/^\/templates\/tower\//);
      expect(entry.readmePath).toMatch(/^docs\/templates\/tower\//);
      expect(entry.cliScript).toMatch(/^tower:ingest:/);
      expect(entry.migration).toMatch(/^\d{14}_/);
    }
  });

  test('source keys are unique', () => {
    expect(() => assertRegistryUniqueKeys()).not.toThrow();
  });

  test('duplicate keys throw via assertRegistryUniqueKeys', () => {
    const dupe = [...TOWER_INGEST_SOURCES, { ...TOWER_INGEST_SOURCES[0] }];
    expect(() => assertRegistryUniqueKeys(dupe)).toThrow(/duplicate keys/);
  });

  test('Jira entry is registered', () => {
    const jira = findIngestSource('jira');
    expect(jira).toBeDefined();
    expect(jira?.targetTable).toBe('tower_jira_issues');
    expect(jira?.dimensions).toContain('engineering');
  });
});
