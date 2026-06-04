import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from '@jest/globals';
import { extractPatterns, loadSeedFile } from '../load-authored-genome-seeds';

type UpsertCall = {
  table: string;
  rows: Array<Record<string, unknown>>;
  options: { onConflict: string };
};

function createCapturingClient(calls: UpsertCall[]) {
  return {
    from(table: string) {
      return {
        async upsert(rows: Array<Record<string, unknown>>, options: { onConflict: string }) {
          calls.push({ table, rows, options });
          return { error: null };
        },
      };
    },
  };
}

function writeTempSeed(fileName: string, contents: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'abarva-seed-loader-'));
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, contents, 'utf8');
  return filePath;
}

describe('load-authored-genome-seeds doctrine context', () => {
  it('preserves all rich doctrine fields from JSONL into genome_patterns.doctrine_context', async () => {
    const seedFile = writeTempSeed(
      'seed-healthcare-rich-doctrine.jsonl',
      `${JSON.stringify({
        code: 'HC-MOD-001',
        name: 'Lakehouse disposition doctrine',
        office_category: 'middle_office',
        failure_rate_pct: 42,
        description: 'Choose disposition only after dependency, value, and regulatory evidence are visible.',
        keywords: ['modernization', 'lakehouse'],
        demo_relevant: true,
        qualityTier: 'gold',
        qualityScore: 96,
        doctrine: 'Pick the lowest-risk modernization path that preserves clinical evidence lineage.',
        triggers: ['EHR reporting latency exceeds SLA', 'duplicated lakehouse ingestion path'],
        applies_when: 'The workload has measurable downstream clinical or financial decisions.',
        does_not_apply_when: 'The workload is an isolated archive with no active decision path.',
        decision_owner: 'CDAO',
        supporting_evidence: [
          { source_type: 'architecture_review', label: 'Lakehouse review', detail: 'Lineage gaps found.' },
        ],
        anti_patterns: ['lift-and-shift without lineage'],
        failure_modes: ['quality gate bypass'],
        decision_artifacts: ['workload inventory', 'disposition scorecard'],
        graph_relationships: [
          { relation: 'depends_on', target: 'HC-DATA-LINEAGE-001' },
        ],
        personas: ['cdao', 'cio'],
        specificity: 'healthcare_specific',
        confidence: 'high',
      })}\n`,
    );
    const calls: UpsertCall[] = [];

    const summary = await loadSeedFile(createCapturingClient(calls) as never, seedFile);

    expect(summary).toMatchObject({
      vertical: 'healthcare_provider',
      sourceKey: 'meridian-health',
      parsed: 1,
      patternsUpserted: 1,
      edgesUpserted: 2,
    });
    const genomeUpsert = calls.find((call) => call.table === 'genome_patterns');
    expect(genomeUpsert?.options).toEqual({ onConflict: 'code' });
    expect(genomeUpsert?.rows).toHaveLength(1);
    expect(genomeUpsert?.rows[0]).toMatchObject({
      code: 'HC-MOD-001',
      vertical: 'healthcare_provider',
      data: expect.objectContaining({
        demo_relevant: true,
        quality_tier: 'gold',
        quality_score: 96,
      }),
      confidence: 84,
      doctrine_context: {
        doctrine: 'Pick the lowest-risk modernization path that preserves clinical evidence lineage.',
        triggers: ['EHR reporting latency exceeds SLA', 'duplicated lakehouse ingestion path'],
        applies_when: 'The workload has measurable downstream clinical or financial decisions.',
        does_not_apply_when: 'The workload is an isolated archive with no active decision path.',
        decision_owner: 'CDAO',
        supporting_evidence: [
          { source_type: 'architecture_review', label: 'Lakehouse review', detail: 'Lineage gaps found.' },
        ],
        anti_patterns: ['lift-and-shift without lineage'],
        failure_modes: ['quality gate bypass'],
        decision_artifacts: ['workload inventory', 'disposition scorecard'],
        graph_relationships: [
          { relation: 'depends_on', target: 'HC-DATA-LINEAGE-001' },
        ],
        personas: ['cdao', 'cio'],
        specificity: 'healthcare_specific',
        confidence: 'high',
      },
    });
  });

  it('continues to parse legacy TypeScript seed arrays without writing doctrine_context', async () => {
    const seedFile = writeTempSeed(
      'seed-healthcare-legacy-patterns.ts',
      `export const LEGACY_PATTERNS = [{
        code: 'HC-LEGACY-001',
        name: 'Legacy pattern',
        officeCategory: 'back_office',
        failureRatePct: 55,
        description: 'Legacy classification-only pattern.',
        keywords: ['legacy'],
        demoRelevant: false
      }];`,
    );
    const calls: UpsertCall[] = [];

    expect(extractPatterns(seedFile)).toHaveLength(1);
    await loadSeedFile(createCapturingClient(calls) as never, seedFile);

    const genomeRow = calls.find((call) => call.table === 'genome_patterns')?.rows[0];
    expect(genomeRow).toMatchObject({
      code: 'HC-LEGACY-001',
      vertical: 'healthcare_provider',
      office_category: 'back_office',
      data: expect.objectContaining({
        demo_relevant: false,
        source_key: 'meridian-health',
      }),
    });
    expect(genomeRow).not.toHaveProperty('doctrine_context');
  });
});
