import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourcePricingNormalization,
  formatSourcePricingNormalizationAsMarkdown,
  getSourceEventSeed,
} from '@/lib/source';

function getSeededEvent() {
  const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild);
  expect(event).toBeTruthy();
  return event as NonNullable<ReturnType<typeof getSourceEventSeed>>;
}

describe('Source pricing normalization model', () => {
  it('builds seeded snapshots for all pricing vendors', () => {
    const event = getSeededEvent();
    const readiness = buildSourcePricingNormalization({ event });

    expect(readiness.snapshots.length).toBe(3);
    expect(readiness.snapshots.map((snapshot) => snapshot.vendorName)).toEqual(
      expect.arrayContaining([
        'Vertex CloudOps',
        'Nova Partner Group',
        'Aegis Digital',
      ]),
    );
  });

  it('marks vendor with missing pricing template as not comparable', () => {
    const event = getSeededEvent();
    const readiness = buildSourcePricingNormalization({ event });

    const vendorB = readiness.snapshots.find((snapshot) => snapshot.vendorId === 'vendor-b');
    const vendorA = readiness.snapshots.find((snapshot) => snapshot.vendorId === 'vendor-a');

    expect(vendorB).toBeTruthy();
    expect(vendorB?.comparabilityStatus).toBe('not_comparable');
    expect(vendorB?.readinessStatus).toBe('not_comparable');
    expect(vendorB?.commercialTraps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        category: 'Pricing template',
      }),
    ]));

    expect(vendorA).toBeTruthy();
    expect(vendorA?.comparabilityStatus).not.toBe('not_comparable');
  });

  it('surfaces assumptions and exclusions and flags weak-evidence vendor', () => {
    const event = getSeededEvent();
    const readiness = buildSourcePricingNormalization({ event });

    const vendorA = readiness.snapshots.find((snapshot) => snapshot.vendorId === 'vendor-a');
    const vendorC = readiness.snapshots.find((snapshot) => snapshot.vendorId === 'vendor-c');

    expect(vendorA).toBeTruthy();
    expect(vendorA?.notes.join(' ')).toMatch(/Assumptions|assumptions/);
    expect(vendorA?.exclusions.length).toBeGreaterThan(0);

    expect(vendorC).toBeTruthy();
    expect(vendorC?.sentinelEvidenceNotes).toEqual(expect.arrayContaining([
      expect.stringContaining('Evidence usability'),
    ]));
    expect(vendorC?.readinessStatus).toBe('risk_adjusted');
  });

  it('provides deterministic summary, blockers, and recommendation', () => {
    const event = getSeededEvent();
    const runOne = buildSourcePricingNormalization({ event });
    const runTwo = buildSourcePricingNormalization({ event });

    expect(runTwo.summary).toEqual(runOne.summary);
    expect(runTwo.blockers).toEqual(runOne.blockers);
    expect(runTwo.comparison).toEqual(runOne.comparison);
    expect(runTwo.recommendedNextAction.length).toBeGreaterThan(0);
    expect(runTwo.summaryNarrative.length).toBeGreaterThan(0);
  });

  it('renders markdown summary output', () => {
    const event = getSeededEvent();
    const readiness = buildSourcePricingNormalization({ event });
    const markdown = formatSourcePricingNormalizationAsMarkdown(readiness);

    expect(markdown).toContain('# Source Pricing Normalization');
    expect(markdown).toContain('Vertex CloudOps');
    expect(markdown).toContain('Nova Partner Group');
    expect(markdown).toContain('Aegis Digital');
    expect(markdown).toContain('## Comparison');
    expect(markdown).toContain('## Top traps');
    expect(readiness.summary.totalVendors).toBe(3);
  });

  it('enforces dependency-free, deterministic read-model behavior', () => {
    getSeededEvent();
    const sources = [
      'src/lib/source/pricing-normalization.ts',
      'src/lib/source/pricing-normalization-types.ts',
      'src/lib/source/mock-seed.ts',
      'src/lib/source/index.ts',
    ].map((filePath) => readFileSync(join(process.cwd(), filePath), 'utf8')).join('\n');

    const lines = sources.split('\n');
    const bannedImportTokens = [
      'openai',
      'anthropic',
      'api/v1',
      'artifact-drawer',
      'scorecard-ui',
      'parser',
      'upload',
      'fetch(',
      'createConnector',
      'completion',
    ];

    for (const line of lines) {
      if (!line.startsWith('import ')) continue;
      for (const token of bannedImportTokens) {
        expect(line).not.toContain(token);
      }
    }

    expect(sources).not.toMatch(/fetch\(/i);
    expect(sources).not.toMatch(/uploadFile|from 'openai'|from "openai"|from 'anthropic'|from "anthropic"/i);
  });
});
