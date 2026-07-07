import fs from 'node:fs';
import path from 'node:path';

import { prepareCorpusJsonlImport } from '../../../../../src/lib/context-ingestion/corpus-jsonl-import';

const PACK_PATH = path.resolve(process.cwd(), 'reports/healthcare-harden/wave-2/new-patterns.jsonl');

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
  ['CDAO-SEQ', 45],
  ['CDAO-RACI', 40],
  ['CDAO-CASE', 45],
  ['CDAO-PRIOR', 40],
  ['CDAO-SCOPE', 35],
  ['CDAO-TCO', 50],
  ['CDAO-SKILL', 30],
  ['CDAO-SUNSET', 35],
  ['CDAO-CONTRACT', 30],
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

describe('healthcare CDAO wave 2 pattern pack', () => {
  it('meets the CDAO-charter batch-count contract and schema floor', () => {
    const patterns = readPatterns();
    expect(patterns).toHaveLength(350);

    const counts = new Map<string, number>();
    for (const pattern of patterns) {
      for (const field of REQUIRED_FIELDS) {
        expect(pattern).toHaveProperty(field);
      }
      const domain = String(pattern.domain);
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
      expect(String(pattern.code)).toMatch(/^PAT-CDAO-MOD-[A-Z]+-\d{3}$/);
      expect(pattern.tenant_scope).toBe('global');
      expect(pattern.vertical).toBe('healthcare_provider');
      expect(pattern.specificity).toBe('healthcare_specific');
      expect(pattern.personas).toEqual(expect.arrayContaining(['cdao']));
      expect(['high', 'medium', 'low']).toContain(pattern.confidence);
      expect(['premium', 'standard']).toContain(pattern.quality_tier);
      expect(Array.isArray(pattern.supporting_evidence)).toBe(true);
      expect((pattern.supporting_evidence as unknown[]).length).toBeGreaterThanOrEqual(2);
      expect(String(pattern.embedding_text).length).toBeGreaterThan(500);
      expect(String(pattern.embedding_text)).toContain('CDAO');
      expect(String(pattern.embedding_text)).toContain('healthcare');
      for (const relationship of pattern.graph_relationships as Array<Record<string, unknown>>) {
        expect(ALLOWED_RELATIONS.has(String(relationship.relation))).toBe(true);
        expect(String(relationship.target)).toMatch(/^PAT-MODERN-/);
      }
    }

    expect(counts).toEqual(EXPECTED_COUNTS);
  });

  it('validates through the governed corpus import preparation path', () => {
    const prepared = prepareCorpusJsonlImport({
      clientId: 'client-meridian',
      tenantKey: 'meridian-health',
      uploadedBy: 'wave-2-test',
      fileName: 'healthcare-cdao-wave2.jsonl',
      jsonlText: fs.readFileSync(PACK_PATH, 'utf8'),
      uploadedAt: '2026-06-04T21:00:00.000Z',
    });

    expect(prepared.errors).toEqual([]);
    expect(prepared.rowsParsed).toBe(350);
    expect(prepared.patternsPrepared).toBe(350);
    expect(prepared.edgesPrepared).toBe(700);
    expect(prepared.patternRows[0]).toMatchObject({
      vertical: 'healthcare_provider',
      doctrine_context: expect.objectContaining({
        doctrine: expect.any(String),
        triggers: expect.any(Array),
        decision_owner: expect.stringContaining('CDAO'),
        supporting_evidence: expect.any(Array),
        anti_patterns: expect.any(Array),
        failure_modes: expect.any(Array),
        graph_relationships: expect.any(Array),
        personas: expect.arrayContaining(['cdao']),
        specificity: 'healthcare_specific',
      }),
    });
  });
});
