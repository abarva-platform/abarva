import fs from 'node:fs';
import path from 'node:path';

import { prepareCorpusJsonlImport } from '../../../../../src/lib/context-ingestion/corpus-jsonl-import';

const PACK_PATH = path.resolve(process.cwd(), 'reports/healthcare-harden/wave-3/new-patterns.jsonl');
const BATCH_DIR = path.resolve(process.cwd(), 'scripts/corpus/generated/healthcare-cpo-wave3');

const REQUIRED_FIELDS = [
  'id',
  'code',
  'version',
  'tenant_scope',
  'vertical',
  'title',
  'summary',
  'doctrine',
  'domain',
  'category',
  'subcategory',
  'personas',
  'triggers',
  'applies_when',
  'does_not_apply_when',
  'decision_owner',
  'supporting_evidence',
  'anti_patterns',
  'failure_modes',
  'decision_artifacts',
  'vocabulary',
  'tags',
  'related_patterns',
  'graph_relationships',
  'embedding_text',
  'confidence',
  'vintage',
  'quality_tier',
  'specificity',
];

const EXPECTED_COUNTS = new Map([
  ['HC-CPO-D01', 200],
  ['HC-CPO-D02', 150],
  ['HC-CPO-D03', 120],
  ['HC-CPO-D04', 120],
  ['HC-CPO-D05', 200],
  ['HC-CPO-D06', 120],
  ['HC-CPO-D07', 120],
  ['HC-CPO-D08', 120],
  ['HC-CPO-D09', 150],
  ['HC-CPO-D10', 120],
]);

const ALLOWED_RELATIONS = new Set([
  'supersedes',
  'depends_on',
  'conflicts_with',
  'implements',
  'refines',
  'extends_pattern',
  'enables_workflow',
]);

function readPatterns(): Array<Record<string, unknown>> {
  return fs
    .readFileSync(PACK_PATH, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('healthcare CPO wave 3 pattern pack', () => {
  it('meets the CPO-domain count contract and schema floor', () => {
    const patterns = readPatterns();
    expect(patterns).toHaveLength(1_420);

    const counts = new Map<string, number>();
    for (const pattern of patterns) {
      for (const field of REQUIRED_FIELDS) {
        expect(pattern).toHaveProperty(field);
      }
      const domain = String(pattern.domain);
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
      expect(String(pattern.code)).toMatch(/^HC-CPO-D\d{2}-\d{4}$/);
      expect(pattern.tenant_scope).toBe('global');
      expect(pattern.vertical).toBe('healthcare_provider');
      expect(pattern.specificity).toBe('healthcare_specific');
      expect(pattern.personas).toEqual(expect.arrayContaining(['cpo']));
      expect(pattern.vocabulary).toEqual(expect.arrayContaining(['CPO', 'BAFO', 'RFP', 'TCO']));
      expect(['high', 'medium', 'low']).toContain(pattern.confidence);
      expect(['premium', 'standard']).toContain(pattern.quality_tier);
      expect(Array.isArray(pattern.supporting_evidence)).toBe(true);
      expect((pattern.supporting_evidence as unknown[]).length).toBeGreaterThanOrEqual(2);
      expect(String(pattern.embedding_text).length).toBeGreaterThan(500);
      expect(String(pattern.embedding_text)).toContain('healthcare CPO');
      for (const relationship of pattern.graph_relationships as Array<Record<string, unknown>>) {
        expect(ALLOWED_RELATIONS.has(String(relationship.relation))).toBe(true);
        expect(typeof relationship.target).toBe('string');
      }
    }

    expect(counts).toEqual(EXPECTED_COUNTS);
  });

  it('validates every upload batch through the governed corpus import preparation path', () => {
    const batchFiles = fs
      .readdirSync(BATCH_DIR)
      .filter((fileName) => fileName.endsWith('.jsonl'))
      .sort();
    expect(batchFiles).toHaveLength(10);

    const totals = batchFiles.reduce(
      (acc, fileName) => {
        const prepared = prepareCorpusJsonlImport({
          clientId: 'client-meridian',
          tenantKey: 'meridian-health',
          uploadedBy: 'wave-3-test',
          fileName,
          jsonlText: fs.readFileSync(path.join(BATCH_DIR, fileName), 'utf8'),
          uploadedAt: '2026-06-04T22:00:00.000Z',
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

    expect(totals.rowsParsed).toBe(1_420);
    expect(totals.patternsPrepared).toBe(1_420);
    expect(totals.edgesPrepared).toBe(2_840);
    expect(totals.firstPattern).toMatchObject({
      vertical: 'healthcare_provider',
      doctrine_context: expect.objectContaining({
        doctrine: expect.any(String),
        triggers: expect.any(Array),
        decision_owner: expect.stringContaining('CPO'),
        supporting_evidence: expect.any(Array),
        anti_patterns: expect.any(Array),
        failure_modes: expect.any(Array),
        graph_relationships: expect.any(Array),
        personas: expect.arrayContaining(['cpo']),
        specificity: 'healthcare_specific',
      }),
    });
  });
});
