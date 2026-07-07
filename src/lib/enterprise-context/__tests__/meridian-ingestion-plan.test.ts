import path from 'node:path';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  parseMeridianEnterpriseContextDataset,
  retargetEnterpriseContextIngestionPlan,
} from '../ingestion/meridian-loader';

const root = path.join(process.cwd(), 'docs/enterprise-context/synthetic/meridian');

describe('Meridian enterprise context ingestion plan', () => {
  const parsed = parseMeridianEnterpriseContextDataset(root);
  const plan = buildMeridianEnterpriseContextIngestionPlan(parsed);

  it('plans the full synthetic dataset without crossing tenant boundaries', () => {
    expect(plan.tenantKey).toBe('meridian');
    expect(plan.summary.records).toBe(1030);
    expect(plan.summary.sourceFiles).toBe(15);
    expect(plan.summary.relationships).toBe(220);
    expect(plan.summary.evidence).toBe(1030);
    expect(plan.summary.chunkQueue).toBe(1030);
    expect(plan.summary.facts).toBeGreaterThan(10_000);
    expect(plan.sources.map((source) => source.sourceSystem)).toContain('day_one_template');
    expect(plan.sources.map((source) => source.sourceSystem)).toEqual(
      expect.arrayContaining(['ServiceNow', 'Workday', 'Coupa', 'GRC']),
    );
    expect(plan.records.every((record) => record.tenantKey === 'meridian')).toBe(true);
    expect(plan.facts.every((fact) => fact.tenantKey === 'meridian')).toBe(true);
    expect(plan.relationships.every((relationship) => relationship.tenantKey === 'meridian')).toBe(true);
    expect(plan.records.some((record) => record.tenantKey === 'apexretail' || record.tenantKey === 'arcturus')).toBe(false);
  });

  it('keeps stable IDs and resolves cross-template references before DB writes', () => {
    const canonicalIds = new Set(plan.records.map((record) => record.canonicalRecordId));
    const recordSourceRows = new Set(plan.records.map((record) => `${record.sourceFile}:${record.sourceRowNumber}`));
    const unresolvedReferences = plan.qualityIssues.filter((issue) => issue.issueType === 'unresolved_reference');

    expect(canonicalIds.size).toBe(plan.records.length);
    expect(unresolvedReferences).toHaveLength(0);

    for (const evidence of plan.evidence) {
      expect(canonicalIds.has(evidence.canonicalRecordId)).toBe(true);
      expect(recordSourceRows.has(`${evidence.sourceFile}:${evidence.sourceRowNumber}`)).toBe(true);
      expect(evidence.sourceSheet).toBe('Data');
    }

    for (const queued of plan.chunkQueue) {
      expect(canonicalIds.has(queued.canonicalRecordId)).toBe(true);
      expect(queued.operation).toBe('upsert');
    }
  });

  it('turns data gaps into quality and stewardship work', () => {
    expect(plan.summary.qualityIssues).toBeGreaterThan(0);
    expect(plan.summary.stewardshipTasks).toBe(plan.summary.qualityIssues);
    expect(plan.qualityIssues.map((issue) => issue.issueType)).toEqual(
      expect.arrayContaining(['low_confidence', 'evidence_unusable']),
    );

    for (const task of plan.stewardshipTasks) {
      expect(task.taskKey).toBe(`${task.issueKey}:task`);
      expect(task.title).toContain(task.issueType);
      expect(task.sourceSheet).toBe('Data');
    }
  });

  it('can retarget alias packages to the canonical production tenant key', () => {
    const retargeted = retargetEnterpriseContextIngestionPlan(plan, 'meridian-health');

    expect(retargeted.tenantKey).toBe('meridian-health');
    expect(retargeted.summary).toEqual(plan.summary);
    expect(retargeted.records).toHaveLength(plan.records.length);
    expect(retargeted.facts).toHaveLength(plan.facts.length);
    expect(retargeted.evidence).toHaveLength(plan.evidence.length);
    expect(retargeted.chunkQueue).toHaveLength(plan.chunkQueue.length);
    expect(retargeted.records.every((record) => record.tenantKey === 'meridian-health')).toBe(true);
    expect(retargeted.facts.every((fact) => fact.tenantKey === 'meridian-health')).toBe(true);
    expect(retargeted.evidence.every((evidence) => evidence.tenantKey === 'meridian-health')).toBe(true);
    expect(retargeted.relationships.every((relationship) => relationship.tenantKey === 'meridian-health')).toBe(true);
    expect(retargeted.records[0]?.canonicalRecordId.startsWith('meridian-health:')).toBe(true);
    expect(retargeted.facts[0]?.factKey.startsWith('meridian-health:')).toBe(true);
    expect(retargeted.evidence[0]?.evidenceKey.startsWith('meridian-health:')).toBe(true);
    expect(retargeted.chunkQueue[0]?.queueKey.startsWith('meridian-health:')).toBe(true);
  });
});
