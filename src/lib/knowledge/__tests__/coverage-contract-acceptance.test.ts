import {
  QUESTION_CATEGORIES,
  categoryToRequiredSegments,
  retailCategoryToRequiredOverlayPacks,
} from '@/lib/knowledge/coverage';
import type { SegmentId } from '@/lib/knowledge/tenant-data';
import fs from 'node:fs';
import path from 'node:path';

const KNOWN_SUBSTRATE_SEGMENTS: ReadonlySet<SegmentId> = new Set([
  'enterprise_profile',
  'org_structure',
  'it_landscape',
  'it_financials',
  'kpi_dictionary',
  'program_inventory',
  'evidence_ledger',
  'vendor_contracts',
  'cross_program_signals',
  'risk_register',
  'compliance_posture',
  'data_estate',
  'workflow_inventory',
  'capability_map',
  'org_change_signals',
  'application_portfolio',
  'initiative_financials',
  'regulatory_and_dependency_context',
  'vendor_contract',
  'sponsor_signal',
]);

describe('coverage contract acceptance', () => {
  it('maps every category to substrate segments known by the tenant-data contract', () => {
    for (const [category, required] of Object.entries(categoryToRequiredSegments)) {
      for (const segment of required) {
        expect(KNOWN_SUBSTRATE_SEGMENTS.has(segment)).toBe(true);
      }
      for (const segment of QUESTION_CATEGORIES[category as keyof typeof QUESTION_CATEGORIES].optionalSegments) {
        expect(KNOWN_SUBSTRATE_SEGMENTS.has(segment)).toBe(true);
      }
      expect(QUESTION_CATEGORIES[category as keyof typeof QUESTION_CATEGORIES].minSources).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps category labels human-readable for verifier reports', () => {
    for (const spec of Object.values(QUESTION_CATEGORIES)) {
      expect(spec.label).toMatch(/[A-Za-z]/);
      expect(spec.keywords.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('maps every retail category pack to the consolidated retail overlay manifest', () => {
    const manifestPath = path.join(
      process.cwd(),
      'verification/retail-overlay-v1/RETAIL_OVERLAY_v1_CONSOLIDATED_MANIFEST.json',
    );
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as {
      totalPacks: number;
      waves: Array<{
        categories: Array<{ code: string; packs: number }>;
      }>;
    };
    const categoryCodes = new Set(
      manifest.waves.flatMap((wave) => wave.categories.map((category) => category.code)),
    );
    const knownPackCodes = new Set<string>();
    for (const category of manifest.waves.flatMap((wave) => wave.categories)) {
      for (let index = 1; index <= category.packs; index += 1) {
        knownPackCodes.add(`${category.code}.${index}`);
      }
    }

    expect(manifest.totalPacks).toBeGreaterThanOrEqual(300);
    expect(categoryCodes.size).toBeGreaterThanOrEqual(60);
    for (const [category, packs] of Object.entries(retailCategoryToRequiredOverlayPacks)) {
      expect({ category, packs }).toEqual({ category, packs: expect.arrayContaining([]) });
      expect(packs.length).toBeGreaterThanOrEqual(3);
      for (const pack of packs) {
        expect(knownPackCodes.has(pack)).toBe(true);
      }
    }
  });
});
