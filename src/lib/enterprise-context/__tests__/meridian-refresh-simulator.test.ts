import path from 'node:path';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  parseMeridianEnterpriseContextDataset,
} from '../ingestion/meridian-loader';
import { buildMeridianRefreshSimulation } from '../refresh-simulator';

const root = path.join(process.cwd(), 'docs/enterprise-context/synthetic/meridian');

describe('Meridian enterprise context refresh simulator', () => {
  const parsed = parseMeridianEnterpriseContextDataset(root);
  const simulation = buildMeridianRefreshSimulation(parsed);

  it('creates deterministic Week 0, Week 1, and Month 1 snapshots', () => {
    expect(simulation.tenantKey).toBe('meridian');
    expect(simulation.report.refreshCadence).toBe('weekly-and-monthly');
    expect(simulation.report.preservesHistory).toBe(true);
    expect(simulation.snapshots.map((snapshot) => snapshot.snapshotKey)).toEqual(['week-0', 'week-1', 'month-1']);
    expect(new Set(simulation.snapshots.map((snapshot) => snapshot.datasetHash)).size).toBe(3);
    expect(simulation.report.totalScenarios).toBe(11);
  });

  it('detects new, changed, and superseded records without duplicating stable IDs', () => {
    const [week0, week1, month1] = simulation.snapshots;

    expect(week0.diffFromPrevious.newRecords).toBe(0);
    expect(week1.diffFromPrevious.newRecords).toBe(9);
    expect(week1.diffFromPrevious.changedRecords).toBeGreaterThanOrEqual(4);
    expect(week1.diffFromPrevious.supersededFacts).toBeGreaterThan(0);
    expect(month1.diffFromPrevious.changedRecords).toBeGreaterThanOrEqual(5);
    expect(month1.diffFromPrevious.supersededFacts).toBeGreaterThan(0);

    const month1Plan = buildMeridianEnterpriseContextIngestionPlan({
      ...parsed,
      tables: month1.tables,
      manifest: {
        ...parsed.manifest,
        totalRows: Object.values(month1.tables).reduce((sum, rows) => sum + rows.length, 0),
        datasets: parsed.manifest.datasets.map((dataset) => ({
          ...dataset,
          rows: month1.tables[dataset.key]?.length ?? dataset.rows,
        })),
      },
    });
    const canonicalIds = new Set(month1Plan.records.map((record) => record.canonicalRecordId));
    expect(canonicalIds.size).toBe(month1Plan.records.length);
    expect(month1Plan.qualityIssues.filter((issue) => issue.issueType === 'unresolved_reference')).toHaveLength(0);
  });

  it('turns hard-to-sync refresh changes into stewardship signals', () => {
    const scenarioKeys = simulation.snapshots.flatMap((snapshot) => snapshot.scenarios.map((scenario) => scenario.scenarioKey));
    expect(scenarioKeys).toEqual(expect.arrayContaining([
      'week-1:owner-change',
      'week-1:renewal-date-change',
      'week-1:new-incidents',
      'week-1:closed-problem',
      'week-1:support-group-change',
      'week-1:new-policy-version',
      'month-1:new-initiative-dependency',
      'month-1:stale-cmdb-record',
      'month-1:vendor-alias-canonicalization',
      'month-1:spend-baseline-update',
      'month-1:sla-breach-worsened',
    ]));

    const month1 = simulation.snapshots.find((snapshot) => snapshot.snapshotKey === 'month-1');
    expect(month1?.diffFromPrevious.stewardshipTasksCreated).toBeGreaterThanOrEqual(5);
    expect(month1?.scenarios.find((scenario) => scenario.scenarioKey === 'month-1:stale-cmdb-record')?.stewardshipSignal)
      .toContain('Open stewardship task');
  });
});
