import {
  SOURCE_CATEGORIES,
  SOURCE_CATEGORY_IDS,
  SOURCE_CATEGORY_TAXONOMY,
  getSourceCategory,
} from '../category-taxonomy';
import type {
  SourceCategory,
  SourceCategoryId,
  TenantContextSegment,
} from '../category-taxonomy';

const VALID_SEGMENTS: readonly TenantContextSegment[] = [
  'vendor_contracts',
  'it_landscape',
  'it_financials',
  'program_inventory',
  'operating_telemetry',
  'industry_context',
  'compliance',
];

describe('SOURCE_CATEGORY_TAXONOMY — structure', () => {
  it('encodes exactly the 9 sourcing categories from the Wave 0 plan', () => {
    expect(SOURCE_CATEGORY_IDS).toHaveLength(9);
    expect(SOURCE_CATEGORIES).toHaveLength(9);
    expect(Object.keys(SOURCE_CATEGORY_TAXONOMY)).toHaveLength(9);
  });

  it('keys every registry entry by its own id (discriminant integrity)', () => {
    for (const id of SOURCE_CATEGORY_IDS) {
      expect(SOURCE_CATEGORY_TAXONOMY[id].id).toBe(id);
    }
  });

  it('exposes categories in canonical id order', () => {
    expect(SOURCE_CATEGORIES.map((c) => c.id)).toEqual([...SOURCE_CATEGORY_IDS]);
  });

  it('has unique category ids', () => {
    expect(new Set(SOURCE_CATEGORY_IDS).size).toBe(SOURCE_CATEGORY_IDS.length);
  });
});

describe.each(SOURCE_CATEGORIES.map((c) => [c.id, c] as const))(
  'category "%s"',
  (_id, category: SourceCategory) => {
    it('has a non-empty label and summary', () => {
      expect(category.label.length).toBeGreaterThan(0);
      expect(category.summary.length).toBeGreaterThan(0);
    });

    it('has all four expert field groups populated', () => {
      expect(category.decisionQuestions.length).toBeGreaterThan(0);
      expect(category.evidenceInputs.length).toBeGreaterThan(0);
      expect(category.outputArtifacts.length).toBeGreaterThan(0);
      expect(category.antiPatterns.length).toBeGreaterThan(0);
    });

    it('has decision questions with valid stage and unique ids', () => {
      const ids = category.decisionQuestions.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const q of category.decisionQuestions) {
        expect(q.question.length).toBeGreaterThan(0);
        expect(q.stage).toBeGreaterThanOrEqual(0);
        expect(q.stage).toBeLessThanOrEqual(7);
      }
    });

    it('grounds evidence inputs in real tenant context segments', () => {
      for (const ev of category.evidenceInputs) {
        expect(VALID_SEGMENTS).toContain(ev.segment);
        expect(ev.whatItProves.length).toBeGreaterThan(0);
        expect(typeof ev.required).toBe('boolean');
      }
    });

    it('has at least one required evidence input', () => {
      expect(category.evidenceInputs.some((ev) => ev.required)).toBe(true);
    });

    it('has output artifacts with unique ids and a purpose', () => {
      const ids = category.outputArtifacts.map((a) => a.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const a of category.outputArtifacts) {
        expect(a.name.length).toBeGreaterThan(0);
        expect(a.purpose.length).toBeGreaterThan(0);
      }
    });

    it('has anti-patterns with unique ids, a trap, and a correction', () => {
      const ids = category.antiPatterns.map((x) => x.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const x of category.antiPatterns) {
        expect(x.trap.length).toBeGreaterThan(0);
        expect(x.correction.length).toBeGreaterThan(0);
      }
    });
  },
);

describe('getSourceCategory', () => {
  it('resolves every known category id', () => {
    for (const id of SOURCE_CATEGORY_IDS) {
      expect(getSourceCategory(id)?.id).toBe(id);
    }
  });

  it('returns undefined for an unknown id', () => {
    expect(getSourceCategory('not_a_category')).toBeUndefined();
  });
});

describe('discriminated union exhaustiveness', () => {
  it('narrows every member through an exhaustive switch with no fallthrough', () => {
    // A compile-time exhaustiveness guard: if a new SourceCategoryId is added
    // without a case here, `never` assignment fails to type-check.
    function classify(category: SourceCategory): string {
      switch (category.id) {
        case 'ams':
        case 'data_ai_platform':
        case 'ai_engineering_partner':
        case 'saas_renewal':
        case 'cloud_finops':
        case 'bpo_contact_centre':
        case 'bpo_shared_services':
        case 'cyber_grc':
        case 'staff_aug_vs_managed_service':
          return category.id;
        default: {
          const exhaustive: never = category.id;
          return exhaustive;
        }
      }
    }

    for (const category of SOURCE_CATEGORIES) {
      expect(classify(category)).toBe(category.id);
    }
  });

  it('keeps SourceCategoryId and the id list in lockstep', () => {
    const fromList: SourceCategoryId = SOURCE_CATEGORY_IDS[0];
    expect(SOURCE_CATEGORY_IDS).toContain(fromList);
  });
});
