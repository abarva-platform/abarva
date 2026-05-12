import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

import {
  buildMeridianEnterpriseContextIngestionPlan,
  parseMeridianEnterpriseContextDataset,
} from '../ingestion/meridian-loader';
import { buildEnterpriseContextChunksFromPlan } from '../chunking';

type CsvRow = Record<string, string>;

const clientDatasets = [
  {
    tenantKey: 'apexretail',
    root: path.join(process.cwd(), 'docs/enterprise-context/synthetic/apexretail'),
    expectedTerms: ['CDP Vendor Selection', 'Store Associate Productivity Tools', 'NCR POS Store Platform'],
    forbiddenTerms: ['Epic Hyperspace', 'Meridian Health'],
  },
  {
    tenantKey: 'arcturus',
    root: path.join(process.cwd(), 'docs/enterprise-context/synthetic/arcturus'),
    expectedTerms: ['FedNow Payment Rails', 'FIS HORIZON Core Banking', 'AI Model Governance Workflow'],
    forbiddenTerms: ['Epic Hyperspace', 'Apex Retail Group'],
  },
];

function readCsv(root: string, fileName: string): CsvRow[] {
  const parsed = Papa.parse<CsvRow>(readFileSync(path.join(root, fileName), 'utf8'), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length) {
    throw new Error(parsed.errors.map((error) => error.message).join('; '));
  }
  return parsed.data;
}

describe.each(clientDatasets)('$tenantKey enterprise context dataset', ({ tenantKey, root, expectedTerms, forbiddenTerms }) => {
  it('is generated as a fictional tenant-scoped Day One package', () => {
    const manifest = JSON.parse(readFileSync(path.join(root, 'manifest.json'), 'utf8')) as {
      tenantKey: string;
      fictional: boolean;
      noPhi: boolean;
      totalRows: number;
      validation: { unresolvedReferences: number };
      datasets: Array<{ csv: string; xlsx: string; rows: number }>;
    };

    expect(manifest.tenantKey).toBe(tenantKey);
    expect(manifest.fictional).toBe(true);
    expect(manifest.noPhi).toBe(true);
    expect(manifest.totalRows).toBe(1029);
    expect(manifest.validation.unresolvedReferences).toBe(0);

    for (const dataset of manifest.datasets) {
      expect(existsSync(path.join(root, dataset.csv))).toBe(true);
      expect(existsSync(path.join(root, dataset.xlsx))).toBe(true);
      expect(readCsv(root, dataset.csv)).toHaveLength(dataset.rows);
    }
  });

  it('keeps domain content client-specific and avoids cross-client story leakage', () => {
    const searchableText = [
      '03-cmdb-applications-services.csv',
      '08-policies-procedures.csv',
      '13-initiative-portfolio.csv',
    ].map((fileName) => readFileSync(path.join(root, fileName), 'utf8')).join('\n');

    for (const term of expectedTerms) {
      expect(searchableText).toContain(term);
    }
    for (const term of forbiddenTerms) {
      expect(searchableText).not.toContain(term);
    }
  });

  it('builds a tenant-isolated ingestion plan and chunk set', () => {
    const parsed = parseMeridianEnterpriseContextDataset(root);
    const plan = buildMeridianEnterpriseContextIngestionPlan(parsed);
    const chunks = buildEnterpriseContextChunksFromPlan(plan, root);

    expect(plan.tenantKey).toBe(tenantKey);
    expect(plan.summary.records).toBe(1029);
    expect(plan.summary.relationships).toBe(220);
    expect(plan.summary.evidence).toBe(1029);
    expect(plan.summary.chunkQueue).toBe(1029);
    expect(plan.qualityIssues.some((issue) => issue.issueType === 'unresolved_reference')).toBe(false);
    expect(plan.records.every((record) => record.tenantKey === tenantKey)).toBe(true);
    expect(plan.facts.every((fact) => fact.tenantKey === tenantKey)).toBe(true);
    expect(chunks).toHaveLength(plan.records.length);
    expect(chunks.every((chunk) => chunk.tenantKey === tenantKey)).toBe(true);
    expect(chunks.every((chunk) => chunk.embeddingStatus === 'pending')).toBe(true);
  });
});
