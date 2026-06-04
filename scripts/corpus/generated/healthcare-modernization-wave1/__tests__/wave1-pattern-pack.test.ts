import fs from 'node:fs';
import path from 'node:path';

import { prepareCorpusJsonlImport } from '../../../../../src/lib/context-ingestion/corpus-jsonl-import';

const PACK_PATH = path.resolve(
  process.cwd(),
  'reports/healthcare-harden/wave-1/new-patterns.jsonl',
);

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
  ['MOD-ARCH', 50],
  ['MOD-ESTATE', 120],
  ['MOD-7R', 70],
  ['MOD-WA', 105],
  ['MOD-AUTO', 30],
  ['MOD-SI', 50],
  ['MOD-BRICK', 25],
  ['MOD-RFP', 30],
  ['MOD-EFFORT', 50],
  ['MOD-INV', 20],
  ['MOD-ACCEL', 30],
  ['MOD-ANTI', 50],
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

describe('healthcare modernization wave 1 pattern pack', () => {
  it('meets the addendum batch-count contract and schema floor', () => {
    const patterns = readPatterns();
    expect(patterns).toHaveLength(630);

    const counts = new Map<string, number>();
    for (const pattern of patterns) {
      for (const field of REQUIRED_FIELDS) {
        expect(pattern).toHaveProperty(field);
      }
      const domain = String(pattern.domain);
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
      expect(String(pattern.code)).toMatch(/^PAT-MODERN-[A-Z0-9]+-\d{3}$/);
      expect(pattern.tenant_scope).toBe('global');
      expect(['healthcare_provider', 'retail', 'airline']).toContain(pattern.vertical);
      expect(['high', 'medium', 'low']).toContain(pattern.confidence);
      expect(['premium', 'standard']).toContain(pattern.quality_tier);
      expect(Array.isArray(pattern.supporting_evidence)).toBe(true);
      expect((pattern.supporting_evidence as unknown[]).length).toBeGreaterThanOrEqual(1);
      expect(String(pattern.embedding_text).length).toBeGreaterThan(300);
      for (const relationship of pattern.graph_relationships as Array<Record<string, unknown>>) {
        expect(ALLOWED_RELATIONS.has(String(relationship.relation))).toBe(true);
        expect(typeof relationship.target).toBe('string');
      }
    }

    expect(counts).toEqual(EXPECTED_COUNTS);
  });

  it('validates through the governed corpus import preparation path', () => {
    const prepared = prepareCorpusJsonlImport({
      clientId: 'client-meridian',
      tenantKey: 'meridian-health',
      uploadedBy: 'wave-1-test',
      fileName: 'healthcare-modernization-wave1.jsonl',
      jsonlText: fs.readFileSync(PACK_PATH, 'utf8'),
      uploadedAt: '2026-06-04T20:30:00.000Z',
    });

    expect(prepared.errors).toEqual([]);
    expect(prepared.rowsParsed).toBe(630);
    expect(prepared.patternsPrepared).toBe(630);
    expect(prepared.edgesPrepared).toBe(1_260);
    expect(prepared.patternRows[0]).toMatchObject({
      doctrine_context: expect.objectContaining({
        doctrine: expect.any(String),
        triggers: expect.any(Array),
        applies_when: expect.any(String),
        decision_owner: expect.any(String),
        supporting_evidence: expect.any(Array),
        anti_patterns: expect.any(Array),
        failure_modes: expect.any(Array),
        graph_relationships: expect.any(Array),
      }),
    });
  });
});
