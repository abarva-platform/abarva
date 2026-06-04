import fs from 'node:fs';
import path from 'node:path';

import { prepareCorpusJsonlImport } from '../../../../../src/lib/context-ingestion/corpus-jsonl-import';

const REPORT_DIR = path.resolve(process.cwd(), 'reports/healthcare-harden/wave-4');
const BATCH_DIR = path.resolve(process.cwd(), 'scripts/corpus/generated/healthcare-wave4-audit-refine');

function readJsonl(filePath: string): Array<Record<string, unknown>> {
  return fs
    .readFileSync(filePath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('healthcare Wave 4 audit and refine pack', () => {
  it('audits dom31-dom80 with the expected verdict mix', () => {
    const auditRows = readJsonl(path.join(REPORT_DIR, 'audit.jsonl'));
    expect(auditRows).toHaveLength(1_000);

    const domains = new Set(auditRows.map((row) => row.domain));
    expect(domains.size).toBe(50);
    expect(domains.has('dom31')).toBe(true);
    expect(domains.has('dom80')).toBe(true);

    const verdictCounts = auditRows.reduce<Record<string, number>>(
      (acc, row) => {
        acc[String(row.verdict)] = (acc[String(row.verdict)] ?? 0) + 1;
        expect(row).toMatchObject({
          wave: 4,
          pattern_id: expect.stringMatching(/^H\d+$/),
          source_file: expect.stringContaining('src/scripts/seed/seed-healthcare-dom'),
          scores: expect.objectContaining({
            G8_no_direct_db_write: true,
          }),
        });
        return acc;
      },
      {},
    );

    expect(verdictCounts.REFINE).toBe(264);
    expect(verdictCounts.KEEP).toBe(736);
    expect(verdictCounts.KILL ?? 0).toBe(0);
  });

  it('produces doctrine-context refinements and gap-fill patterns with CXO-ready fields', () => {
    const refinedRows = readJsonl(path.join(REPORT_DIR, 'refined.jsonl'));
    const gapRows = readJsonl(path.join(REPORT_DIR, 'new-patterns.jsonl'));

    expect(refinedRows).toHaveLength(264);
    expect(gapRows).toHaveLength(75);

    for (const row of [...refinedRows, ...gapRows]) {
      expect(row).toMatchObject({
        tenant_scope: 'global',
        vertical: 'healthcare_provider',
        version: expect.any(String),
        doctrine: expect.any(String),
        decision_owner: expect.any(String),
        supporting_evidence: expect.any(Array),
        anti_patterns: expect.any(Array),
        failure_modes: expect.any(Array),
        decision_artifacts: expect.any(Array),
        graph_relationships: expect.any(Array),
        embedding_text: expect.stringContaining('Wave 4'),
      });
      expect((row.supporting_evidence as unknown[]).length).toBeGreaterThanOrEqual(3);
      expect((row.personas as unknown[]).length).toBeGreaterThanOrEqual(2);
      expect(String(row.embedding_text).length).toBeGreaterThan(700);
    }

    expect(refinedRows.some((row) => row.domain === 'dom50')).toBe(true);
    expect(refinedRows.some((row) => row.domain === 'dom70')).toBe(true);
    expect(gapRows.every((row) => String(row.code).startsWith('HC-W4-GAP-'))).toBe(true);
  });

  it('validates both upload units through the governed corpus import preparation path', () => {
    const batchFiles = ['wave4-refined-doctrine-context.jsonl', 'wave4-gap-fill-patterns.jsonl'];

    const totals = batchFiles.reduce(
      (acc, fileName) => {
        const prepared = prepareCorpusJsonlImport({
          clientId: 'client-meridian',
          tenantKey: 'meridian-health',
          uploadedBy: 'wave-4-test',
          fileName,
          jsonlText: fs.readFileSync(path.join(BATCH_DIR, fileName), 'utf8'),
          uploadedAt: '2026-06-04T23:00:00.000Z',
        });
        expect(prepared.errors).toEqual([]);
        expect(prepared.rowsParsed).toBeLessThanOrEqual(1_000);
        acc.rowsParsed += prepared.rowsParsed;
        acc.patternsPrepared += prepared.patternsPrepared;
        acc.edgesPrepared += prepared.edgesPrepared;
        acc.firstPattern ??= prepared.patternRows[0];
        return acc;
      },
      {
        rowsParsed: 0,
        patternsPrepared: 0,
        edgesPrepared: 0,
        firstPattern: undefined as Record<string, unknown> | undefined,
      },
    );

    expect(totals.rowsParsed).toBe(339);
    expect(totals.patternsPrepared).toBe(339);
    expect(totals.edgesPrepared).toBeGreaterThanOrEqual(400);
    expect(totals.firstPattern).toMatchObject({
      vertical: 'healthcare_provider',
      doctrine_context: expect.objectContaining({
        doctrine: expect.any(String),
        triggers: expect.any(Array),
        decision_owner: expect.any(String),
        supporting_evidence: expect.any(Array),
        anti_patterns: expect.any(Array),
        graph_relationships: expect.any(Array),
      }),
    });
  });
});
