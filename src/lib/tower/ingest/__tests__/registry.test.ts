import { existsSync } from 'node:fs';
import path from 'node:path';

import {
  getTowerIngestSource,
  listTowerIngestSources,
  registerTowerIngestSource,
} from '@/lib/tower/ingest/registry';
import { SERVICENOW_CMDB_MANIFEST } from '@/lib/tower/ingest/servicenow-cmdb/manifest';

describe('Tower ingest registry', () => {
  it('includes the ServiceNow CMDB source', () => {
    const source = getTowerIngestSource('servicenow-cmdb');
    expect(source).not.toBeNull();
    expect(source!.label).toBe('ServiceNow CMDB');
    expect(source!.targetTables).toEqual(['tower_cmdb_cis', 'tower_cmdb_dependencies']);
  });

  it('points to files that actually exist on disk', () => {
    for (const manifest of listTowerIngestSources()) {
      for (const relPath of [
        manifest.templatePath,
        manifest.samplePath,
        manifest.readmePath,
        manifest.migrationPath,
      ]) {
        const abs = path.join(process.cwd(), relPath);
        expect(existsSync(abs)).toBe(true);
      }
    }
  });

  it('rejects a conflicting registration for an existing key (union-merge guard)', () => {
    expect(() =>
      registerTowerIngestSource({
        ...SERVICENOW_CMDB_MANIFEST,
        label: 'Bogus stomp',
      }),
    ).toThrow(/already registered/);
  });

  it('is a no-op when the same manifest is re-registered (idempotent)', () => {
    expect(() => registerTowerIngestSource(SERVICENOW_CMDB_MANIFEST)).not.toThrow();
  });
});
