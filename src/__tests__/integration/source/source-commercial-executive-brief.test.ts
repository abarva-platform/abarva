import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  buildCommercialExecutiveBrief,
  type CommercialPosture,
} from '@/lib/source/source-commercial-executive-brief';

const VALID_POSTURES: CommercialPosture[] = ['strong', 'developing', 'at-risk', 'incomplete'];
const VALID_SEVERITIES = ['critical', 'high', 'medium'] as const;

describe('Source Commercial Executive Brief', () => {
  const brief = buildCommercialExecutiveBrief('rfp-test-001', ['vendor-a', 'vendor-b', 'vendor-c']);

  it('returns exactly 3 topRisks', () => {
    expect(brief.topRisks).toHaveLength(3);
  });

  it('returns exactly 3 topBafoLevers', () => {
    expect(brief.topBafoLevers).toHaveLength(3);
  });

  it('commercialPosture is a valid value', () => {
    expect(VALID_POSTURES).toContain(brief.commercialPosture);
  });

  it('atlasCaveat is non-empty', () => {
    expect(brief.atlasCaveat.length).toBeGreaterThan(0);
  });

  it('atlasCaveat contains "deterministic" (case-insensitive)', () => {
    expect(brief.atlasCaveat.toLowerCase()).toContain('deterministic');
  });

  it('generatedAt is 2026-04-26', () => {
    expect(brief.generatedAt).toBe('2026-04-26');
  });

  it('all risk severities are valid', () => {
    for (const risk of brief.topRisks) {
      expect(VALID_SEVERITIES).toContain(risk.severity);
    }
  });

  it('all lever estimatedImpact values are non-empty', () => {
    for (const lever of brief.topBafoLevers) {
      expect(lever.estimatedImpact.length).toBeGreaterThan(0);
    }
  });

  it('vendorComparabilityState is non-empty for any input', () => {
    const emptyBrief = buildCommercialExecutiveBrief('rfp-empty', []);
    const singleBrief = buildCommercialExecutiveBrief('rfp-single', ['vendor-a']);
    const fullBrief = buildCommercialExecutiveBrief('rfp-full', ['v1', 'v2', 'v3', 'v4']);

    expect(emptyBrief.vendorComparabilityState.length).toBeGreaterThan(0);
    expect(singleBrief.vendorComparabilityState.length).toBeGreaterThan(0);
    expect(fullBrief.vendorComparabilityState.length).toBeGreaterThan(0);
  });

  it('SourceCommercialExecutiveBrief component exports a function', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('@/components/source/SourceCommercialExecutiveBrief');
    expect(typeof mod.SourceCommercialExecutiveBrief).toBe('function');
  });

  it('no teal color values in component source', () => {
    const componentSource = readFileSync(
      join(process.cwd(), 'src/components/source/SourceCommercialExecutiveBrief.tsx'),
      'utf8',
    );
    expect(componentSource).not.toContain('#14B8A6');
    expect(componentSource).not.toContain('#0E9F8C');
  });
});
