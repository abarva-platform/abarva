import fs from 'node:fs';
import path from 'node:path';

import { prepareCorpusJsonlImport } from '../../../../../src/lib/context-ingestion/corpus-jsonl-import';

const PROFILE_PATH = path.resolve(process.cwd(), 'intelligence/seeds/tenant-portfolios/meridian.json');
const PACK_PATH = path.resolve(process.cwd(), 'reports/healthcare-harden/wave-6/new-patterns.jsonl');
const BATCH_DIR = path.resolve(process.cwd(), 'scripts/corpus/generated/healthcare-meridian-wave6');

const EXPECTED_COUNTS = new Map([
  ['MRD-OVL-D01', 50],
  ['MRD-OVL-D02', 50],
  ['MRD-OVL-D03', 50],
  ['MRD-OVL-D04', 50],
  ['MRD-OVL-D05', 50],
  ['MRD-OVL-D06', 50],
]);

const STALE_PROFILE_TERMS = ['14 hospitals', '220 ambulatory sites', '$7.8B revenue'];

function readPatterns(): Array<Record<string, unknown>> {
  return fs
    .readFileSync(PACK_PATH, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe('healthcare Wave 6 Meridian tenant overlay', () => {
  it('uses the corrected Sacramento-based 30+ hospital Meridian profile', () => {
    const profile = JSON.parse(fs.readFileSync(PROFILE_PATH, 'utf8')) as { profile: string };
    expect(profile.profile).toContain('Sacramento-based');
    expect(profile.profile).toContain('30+ hospital');
    for (const staleTerm of STALE_PROFILE_TERMS) {
      expect(profile.profile).not.toContain(staleTerm);
    }
  });

  it('meets the tenant overlay count and schema floor', () => {
    const patterns = readPatterns();
    expect(patterns).toHaveLength(300);

    const counts = new Map<string, number>();
    const serialized = JSON.stringify(patterns);
    for (const staleTerm of STALE_PROFILE_TERMS) {
      expect(serialized).not.toContain(staleTerm);
    }

    for (const pattern of patterns) {
      const domain = String(pattern.domain);
      counts.set(domain, (counts.get(domain) ?? 0) + 1);
      expect(String(pattern.code)).toMatch(/^MRD-OVL-D0[1-6]-\d{4}$/);
      expect(pattern.tenant_scope).toBe('meridian');
      expect(pattern.tenant_key).toBe('meridian');
      expect(pattern.client_id).toBe('client-meridian');
      expect(pattern.vertical).toBe('healthcare_provider');
      expect(pattern.specificity).toBe('tenant_specific');
      expect(pattern.vocabulary).toEqual(expect.arrayContaining(['Meridian', 'Sacramento', '30+ hospitals']));
      expect(pattern.tags).toEqual(expect.arrayContaining(['meridian', 'tenant-overlay', 'governed-loader']));
      expect(pattern.supporting_evidence).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            label: 'Meridian tenant portfolio profile',
            source_url: 'intelligence/seeds/tenant-portfolios/meridian.json',
          }),
        ]),
      );
      expect(String(pattern.embedding_text)).toContain('Sacramento-based');
      expect(String(pattern.embedding_text)).toContain('governed admin data loader');

      const relationships = pattern.graph_relationships as Array<Record<string, unknown>>;
      expect(relationships).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ relation: 'extends_pattern', target: expect.any(String) }),
          expect.objectContaining({ relation: 'contextualizes', target: 'meridian' }),
        ]),
      );
    }

    expect(counts).toEqual(EXPECTED_COUNTS);
  });

  it('validates every overlay batch through the governed corpus import preparation path', () => {
    const batchFiles = fs
      .readdirSync(BATCH_DIR)
      .filter((fileName) => fileName.endsWith('.jsonl'))
      .sort();
    expect(batchFiles).toHaveLength(6);

    const totals = batchFiles.reduce(
      (acc, fileName) => {
        const prepared = prepareCorpusJsonlImport({
          clientId: 'client-meridian',
          tenantKey: 'meridian-health',
          uploadedBy: 'wave-6-test',
          fileName,
          jsonlText: fs.readFileSync(path.join(BATCH_DIR, fileName), 'utf8'),
          uploadedAt: '2026-06-04T22:45:00.000Z',
        });
        expect(prepared.errors).toEqual([]);
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

    expect(totals.rowsParsed).toBe(300);
    expect(totals.patternsPrepared).toBe(300);
    expect(totals.edgesPrepared).toBe(900);
    expect(totals.firstPattern).toMatchObject({
      vertical: 'healthcare_provider',
      doctrine_context: expect.objectContaining({
        doctrine: expect.any(String),
        supporting_evidence: expect.any(Array),
        graph_relationships: expect.any(Array),
        specificity: 'tenant_specific',
      }),
    });
  });
});
