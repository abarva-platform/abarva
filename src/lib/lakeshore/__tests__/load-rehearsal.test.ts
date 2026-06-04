import path from 'node:path';

import {
  buildLakeshoreQuarantineProbe,
  loadLakeshoreManifest,
  rehearseLakeshoreLoad,
} from '../load-rehearsal';

const lakeshoreRoot = path.resolve(process.cwd(), 'docs/build/lakeshore/loaded');

describe('Lakeshore governed load rehearsal', () => {
  it('loads the generated manifest with all expected load artifacts', async () => {
    const manifest = await loadLakeshoreManifest(lakeshoreRoot);

    expect(manifest.tenantKey).toBe('lakeshore');
    expect(manifest.brokerKey).toBe('lakeshore-holdings');
    expect(manifest.dataFiles).toHaveLength(18);
    expect(manifest.documents).toHaveLength(21);
    expect(manifest.totals.structuredRecords).toBeGreaterThanOrEqual(1_250);
  });

  it('dry-runs every CSV through the real connector without writing tenant rows', async () => {
    const result = await rehearseLakeshoreLoad({
      rootDir: lakeshoreRoot,
      mode: 'dry-run',
      clientId: 'lakeshore-client-test-id',
      includeDocuments: false,
      generatedAt: '2026-06-04T00:00:00.000Z',
    });

    expect(result.mode).toBe('dry-run');
    expect(result.totals.csvFiles).toBe(18);
    expect(result.totals.csvRowsExpected).toBe(1_329);
    expect(result.totals.csvRowsParsed).toBe(1_329);
    expect(result.totals.csvChunksQueued).toBe(1_329);
    expect(result.documents).toHaveLength(0);
    expect(result.csv.every((item) => item.persistenceStatus === 'dry_run')).toBe(true);
    expect(result.csv.every((item) => item.ingestionRunRecorded === false)).toBe(true);
  });

  it('keeps the deliberate PHI/PII probe quarantined before storage or indexing', () => {
    const probe = buildLakeshoreQuarantineProbe();

    expect(probe.decision).toBe('quarantine');
    expect(probe.storageAllowed).toBe(false);
    expect(probe.indexingAllowed).toBe(false);
    expect(probe.suspectedPii).toBe(true);
  });
});
