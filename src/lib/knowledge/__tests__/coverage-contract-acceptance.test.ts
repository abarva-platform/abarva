import {
  QUESTION_CATEGORIES,
  categoryToRequiredSegments,
} from '@/lib/knowledge/coverage';
import type { SegmentId } from '@/lib/knowledge/tenant-data';

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
});
