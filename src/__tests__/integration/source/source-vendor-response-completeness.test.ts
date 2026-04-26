import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  SOURCE_GOLDEN_EVENT_IDS,
  buildSourceVendorResponseCompleteness,
  formatSourceVendorResponseCompletenessAsMarkdown,
  getSourceEventSeed,
} from '@/lib/source';

type SeededSourceEvent = NonNullable<ReturnType<typeof getSourceEventSeed>>;

function getSeededEvent() {
  const event = getSourceEventSeed(SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild) as SeededSourceEvent | null;
  expect(event).toBeTruthy();
  return event as SeededSourceEvent;
}

describe('Source vendor response completeness model', () => {
  it('builds seeded records for all vendors', () => {
    const event = getSeededEvent();
    const readiness = buildSourceVendorResponseCompleteness({ event });

    expect(readiness.summary.totalVendors).toBe(3);
    expect(readiness.records.map((record) => record.vendorName)).toEqual(
      expect.arrayContaining([
        'Vertex CloudOps',
        'Nova Partner Group',
        'Aegis Digital',
      ]),
    );
    expect(readiness.records.every((record) => record.requiredSections.length > 0)).toBe(true);
  });

  it('marks vendor with missing pricing template as not comparable', () => {
    const event = getSeededEvent();
    const readiness = buildSourceVendorResponseCompleteness({ event });
    const vendorB = readiness.records.find((record) => record.vendorId === 'vendor-b');
    const vendorA = readiness.records.find((record) => record.vendorId === 'vendor-a');

    expect(vendorB).toBeTruthy();
    expect(vendorB?.completenessStatus).toBe('not_comparable');
    expect(vendorB?.comparabilityStatus).toBe('not_comparable');
    expect(vendorB?.missingSections).toEqual(expect.arrayContaining(['Pricing template']));
    expect(vendorB?.pricingTemplateStatus).toBe('missing');

    expect(vendorA).toBeTruthy();
    expect(vendorA?.completenessStatus).toBe('complete');
    expect(vendorA?.comparabilityStatus).toBe('comparable');
    expect(readiness.comparabilityReadiness).toBe('not_comparable');
  });

  it('surfaces assumptions, exclusions, and evidence weakness notes', () => {
    const event = getSeededEvent();
    const readiness = buildSourceVendorResponseCompleteness({ event });
    const vendorC = readiness.records.find((record) => record.vendorId === 'vendor-c');

    expect(vendorC).toBeTruthy();
    expect(vendorC?.assumptions.length).toBeGreaterThan(0);
    expect(vendorC?.exclusions.length).toBeGreaterThan(0);
    expect(vendorC?.sentinelEvidenceNotes).toEqual(
      expect.arrayContaining([expect.stringContaining('low confidence')]),
    );
    expect(vendorC?.comparabilityStatus).toBe('partially_comparable');
  });

  it('provides required recommended next action and markdown summary', () => {
    const event = getSeededEvent();
    const readiness = buildSourceVendorResponseCompleteness({ event });
    const markdown = formatSourceVendorResponseCompletenessAsMarkdown(readiness);

    expect(readiness.recommendedNextAction).toEqual(expect.any(String));
    expect(readiness.recommendedNextAction.length).toBeGreaterThan(0);
    expect(readiness.records.every((record) => typeof record.recommendedNextAction === 'string')).toBe(true);
    expect(markdown).toContain('# Source Vendor Response Completeness');
    expect(markdown).toContain('Vertex CloudOps');
    expect(markdown).toContain('Nova Partner Group');
    expect(markdown).toContain('Aegis Digital');
    expect(markdown).toContain('Top Blockers');
  });

  it('is dependency-free and deterministic', () => {
    getSeededEvent();
    const sources = [
      'src/lib/source/vendor-response-completeness.ts',
      'src/lib/source/vendor-response-types.ts',
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
    ];

    for (const line of lines) {
      if (!line.startsWith('import ')) continue;
      for (const token of bannedImportTokens) {
        expect(line).not.toContain(token);
      }
    }

    expect(sources).not.toMatch(/fetch\(/i);
    expect(sources).not.toMatch(/createDataset|uploadFile|from 'openai'|from "openai"/i);
  });

  it('returns deterministic top blockers across seeded runs', () => {
    const event = getSeededEvent();
    const runOne = buildSourceVendorResponseCompleteness({ event });
    const runTwo = buildSourceVendorResponseCompleteness({ event });

    expect(runTwo.comparabilityReadiness).toBe(runOne.comparabilityReadiness);
    expect(runTwo.summary).toEqual(runOne.summary);
    expect(runTwo.blockers).toEqual(runOne.blockers);
  });
});
