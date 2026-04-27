// PAT1–PAT5 · Pattern Library Expansion tests.
//
// Covers: shape contracts, determinism, scoring, mapping correctness,
// manifest completeness, and module hygiene for all five Wave-27 pattern slices.

import {
  DATA_PLATFORM_MANAGED_SERVICES_PATTERNS,
  DATA_PLATFORM_PATTERN_SLUGS,
  getDataPlatformBafoChecklist,
  getDataPlatformPattern,
  getDataPlatformPatternsByCategory,
  type DataPlatformSourcingPattern,
} from '@/lib/solutions/data-platform-managed-services-pack';

import {
  IMS_MANAGED_SERVICES_PATTERNS,
  IMS_PATTERN_SLUGS,
  getIMSBafoChecklist,
  getIMSPattern,
  getIMSStandardSLA,
  type IMSSourcingPattern,
} from '@/lib/solutions/ims-managed-services-pack';

import {
  VENDOR_EVALUATION_DIMENSIONS,
  VENDOR_EVALUATION_PATTERN,
  buildVendorScorecard,
  getVendorEvaluationCriteriaByDimension,
  type VendorEvaluationPattern,
  type VendorScoreRating,
} from '@/lib/solutions/vendor-evaluation-pattern';

import {
  ALL_FAILURE_MODE_SOLUTION_MAPPINGS,
  MAPPED_FAILURE_MODE_KEYS,
  SOLUTION_PATTERN_PACKS,
  buildFailureModesSolutionReport,
  failureModeHasSolutionMapping,
  getFailureModesByPatternPack,
  getMappingsForPatternPack,
  mapFailureModeToSolutions,
  type FailureModeSolutionMapping,
} from '@/lib/solutions/ai-failure-modes-solution-map';

import {
  PATTERN_MANIFEST,
  PATTERN_MANIFEST_PACK_IDS,
  findManifestEntriesBySlug,
  getAllManifestSlugs,
  getManifestEntriesByCategory,
  getManifestEntriesForAgent,
  getPatternManifestEntry,
  listPatternManifestEntries,
} from '@/lib/solutions/pattern-manifest';

// ---------------------------------------------------------------------------
// PAT1 · Data Platform Managed Services
// ---------------------------------------------------------------------------

describe('PAT1 · DataPlatformManagedServicesPack', () => {
  describe('pattern list', () => {
    it('contains exactly 2 patterns', () => {
      expect(DATA_PLATFORM_MANAGED_SERVICES_PATTERNS.length).toBe(2);
    });

    it('slug list matches pattern list length', () => {
      expect(DATA_PLATFORM_PATTERN_SLUGS.length).toBe(DATA_PLATFORM_MANAGED_SERVICES_PATTERNS.length);
    });

    it('is deterministic across repeated reads', () => {
      expect(DATA_PLATFORM_MANAGED_SERVICES_PATTERNS).toEqual(DATA_PLATFORM_MANAGED_SERVICES_PATTERNS);
    });
  });

  describe.each(DATA_PLATFORM_MANAGED_SERVICES_PATTERNS.map((p) => [p.slug, p] as const))(
    'pattern %s — required field schema',
    (_slug, pattern) => {
      it('has required string fields', () => {
        expect(typeof pattern.id).toBe('string');
        expect(typeof pattern.slug).toBe('string');
        expect(typeof pattern.name).toBe('string');
        expect(typeof pattern.shortDescription).toBe('string');
        expect(typeof pattern.primaryQuestion).toBe('string');
      });

      it('has createdFrom discriminator', () => {
        expect(pattern.createdFrom).toBe('pat1_data_platform_managed_services');
      });

      it('has at least one criterion', () => {
        expect(pattern.criteria.length).toBeGreaterThan(0);
      });

      it('has at least one BAFO readiness signal', () => {
        expect(pattern.bafoReadinessSignals.length).toBeGreaterThan(0);
      });

      it('has sentinel signals', () => {
        expect(pattern.sentinelSignals.length).toBeGreaterThan(0);
      });
    },
  );

  describe('criteria schema', () => {
    it('every criterion has required fields', () => {
      for (const pattern of DATA_PLATFORM_MANAGED_SERVICES_PATTERNS) {
        for (const c of pattern.criteria) {
          expect(typeof c.id).toBe('string');
          expect(typeof c.area).toBe('string');
          expect(typeof c.criterion).toBe('string');
          expect(typeof c.rationale).toBe('string');
          expect(c.evidenceRequired.length).toBeGreaterThan(0);
          expect(['critical', 'high', 'medium', 'low']).toContain(c.severity);
        }
      }
    });
  });

  describe('accessor functions', () => {
    it('getDataPlatformPattern returns the correct pattern', () => {
      const p = getDataPlatformPattern('data-platform-vendor-selection-criteria');
      expect(p).toBeDefined();
      expect(p!.slug).toBe('data-platform-vendor-selection-criteria');
    });

    it('getDataPlatformPattern returns undefined for unknown slug', () => {
      expect(getDataPlatformPattern('no-such-slug')).toBeUndefined();
    });

    it('getDataPlatformPatternsByCategory returns patterns for sourcing', () => {
      const sourcing = getDataPlatformPatternsByCategory('sourcing');
      expect(sourcing.length).toBeGreaterThan(0);
      sourcing.forEach((p) => expect(p.category).toBe('sourcing'));
    });

    it('getDataPlatformPatternsByCategory returns patterns for transition', () => {
      const transition = getDataPlatformPatternsByCategory('transition');
      expect(transition.length).toBeGreaterThan(0);
      transition.forEach((p) => expect(p.category).toBe('transition'));
    });

    it('getDataPlatformBafoChecklist returns signals for known slug', () => {
      const checklist = getDataPlatformBafoChecklist('data-platform-vendor-selection-criteria');
      expect(checklist.length).toBeGreaterThan(0);
    });

    it('getDataPlatformBafoChecklist returns empty array for unknown slug', () => {
      expect(getDataPlatformBafoChecklist('unknown')).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// PAT2 · IMS Managed Services
// ---------------------------------------------------------------------------

describe('PAT2 · IMSManagedServicesPack', () => {
  describe('pattern list', () => {
    it('contains at least 1 pattern', () => {
      expect(IMS_MANAGED_SERVICES_PATTERNS.length).toBeGreaterThan(0);
    });

    it('slug list matches pattern count', () => {
      expect(IMS_PATTERN_SLUGS.length).toBe(IMS_MANAGED_SERVICES_PATTERNS.length);
    });
  });

  describe.each(IMS_MANAGED_SERVICES_PATTERNS.map((p) => [p.slug, p] as const))(
    'pattern %s — required field schema',
    (_slug, pattern) => {
      it('has createdFrom discriminator', () => {
        expect(pattern.createdFrom).toBe('pat2_ims_managed_services');
      });

      it('has required string fields', () => {
        expect(typeof pattern.id).toBe('string');
        expect(typeof pattern.slug).toBe('string');
        expect(typeof pattern.name).toBe('string');
        expect(typeof pattern.shortDescription).toBe('string');
        expect(typeof pattern.primaryQuestion).toBe('string');
      });

      it('has at least one criterion', () => {
        expect(pattern.criteria.length).toBeGreaterThan(0);
      });

      it('has a recommended SLA structure', () => {
        expect(pattern.recommendedSLAStructure.length).toBeGreaterThan(0);
      });

      it('has BAFO readiness signals', () => {
        expect(pattern.bafoReadinessSignals.length).toBeGreaterThan(0);
      });
    },
  );

  describe('SLA structure', () => {
    it('standard SLA includes P1 through P4 tiers', () => {
      const sla = getIMSStandardSLA();
      const tiers = sla.map((s) => s.tier);
      expect(tiers).toContain('P1');
      expect(tiers).toContain('P2');
      expect(tiers).toContain('P3');
      expect(tiers).toContain('P4');
    });

    it('every SLA tier has required fields', () => {
      const sla = getIMSStandardSLA();
      for (const tier of sla) {
        expect(typeof tier.description).toBe('string');
        expect(typeof tier.targetResponseTime).toBe('string');
        expect(typeof tier.targetResolutionTime).toBe('string');
        expect(typeof tier.creditPerBreach).toBe('string');
      }
    });
  });

  describe('criteria schema', () => {
    it('every criterion has required fields', () => {
      for (const pattern of IMS_MANAGED_SERVICES_PATTERNS) {
        for (const c of pattern.criteria) {
          expect(typeof c.id).toBe('string');
          expect(typeof c.area).toBe('string');
          expect(typeof c.criterion).toBe('string');
          expect(c.evidenceRequired.length).toBeGreaterThan(0);
          expect(['critical', 'high', 'medium', 'low']).toContain(c.severity);
        }
      }
    });
  });

  describe('accessor functions', () => {
    it('getIMSPattern returns pattern by slug', () => {
      const p = getIMSPattern('ims-vendor-selection-criteria');
      expect(p).toBeDefined();
      expect(p!.slug).toBe('ims-vendor-selection-criteria');
    });

    it('getIMSPattern returns undefined for unknown slug', () => {
      expect(getIMSPattern('no-such-slug')).toBeUndefined();
    });

    it('getIMSBafoChecklist returns signals for known slug', () => {
      const checklist = getIMSBafoChecklist('ims-vendor-selection-criteria');
      expect(checklist.length).toBeGreaterThan(0);
    });

    it('getIMSBafoChecklist returns empty array for unknown slug', () => {
      expect(getIMSBafoChecklist('unknown-slug')).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// PAT3 · Vendor Evaluation Scorecard
// ---------------------------------------------------------------------------

describe('PAT3 · VendorEvaluationPattern', () => {
  describe('pattern structure', () => {
    it('has the expected id and slug', () => {
      expect(VENDOR_EVALUATION_PATTERN.id).toBe('vep-001');
      expect(VENDOR_EVALUATION_PATTERN.slug).toBe('vendor-evaluation-scorecard');
    });

    it('has createdFrom discriminator', () => {
      expect(VENDOR_EVALUATION_PATTERN.createdFrom).toBe('pat3_vendor_evaluation');
    });

    it('has exactly 8 dimensions', () => {
      expect(VENDOR_EVALUATION_PATTERN.dimensions.length).toBe(8);
      expect(VENDOR_EVALUATION_DIMENSIONS.length).toBe(8);
    });

    it('has exactly 10 criteria', () => {
      expect(VENDOR_EVALUATION_PATTERN.criteria.length).toBe(10);
    });

    it('has at least 3 commercial risks', () => {
      expect(VENDOR_EVALUATION_PATTERN.commercialRisks.length).toBeGreaterThanOrEqual(3);
    });

    it('has auto-exclusion criteria', () => {
      expect(VENDOR_EVALUATION_PATTERN.autoExclusionCriteria.length).toBeGreaterThan(0);
    });

    it('bafoInviteThreshold is between 0 and 100', () => {
      expect(VENDOR_EVALUATION_PATTERN.bafoInviteThreshold).toBeGreaterThan(0);
      expect(VENDOR_EVALUATION_PATTERN.bafoInviteThreshold).toBeLessThan(100);
    });
  });

  describe('criteria schema', () => {
    it('every criterion has required fields', () => {
      for (const c of VENDOR_EVALUATION_PATTERN.criteria) {
        expect(typeof c.id).toBe('string');
        expect(typeof c.criterion).toBe('string');
        expect([1, 2, 3, 4, 5]).toContain(c.weight);
        expect(c.evidenceRequired.length).toBeGreaterThan(0);
        expect(c.weakSignals.length).toBeGreaterThan(0);
        expect(c.strongSignals.length).toBeGreaterThan(0);
        expect(VENDOR_EVALUATION_PATTERN.dimensions).toContain(c.dimension);
      }
    });
  });

  describe('getVendorEvaluationCriteriaByDimension', () => {
    it('returns criteria for a known dimension', () => {
      const criteria = getVendorEvaluationCriteriaByDimension('technical_capability');
      expect(criteria.length).toBeGreaterThan(0);
      criteria.forEach((c) => expect(c.dimension).toBe('technical_capability'));
    });

    it('returns empty array for unknown dimension cast', () => {
      // TypeScript won't normally allow this, but test the runtime guard
      const criteria = getVendorEvaluationCriteriaByDimension('nonexistent' as any);
      expect(criteria).toEqual([]);
    });
  });

  describe('buildVendorScorecard', () => {
    it('returns correct shape for empty ratings', () => {
      const scorecard = buildVendorScorecard('TestVendor', {});
      expect(scorecard.vendorName).toBe('TestVendor');
      expect(scorecard.totalWeightedScore).toBe(0);
      expect(scorecard.normalizedScore).toBe(0);
      expect(scorecard.bafoEligible).toBe(false);
      expect(scorecard.rows.length).toBe(VENDOR_EVALUATION_PATTERN.criteria.length);
      expect(scorecard.createdFrom).toBe('pat3_vendor_evaluation');
    });

    it('returns normalizedScore 100 when all criteria rated leading', () => {
      const allLeading: Partial<Record<string, VendorScoreRating>> = {};
      VENDOR_EVALUATION_PATTERN.criteria.forEach((c) => {
        allLeading[c.id] = 'leading';
      });
      const scorecard = buildVendorScorecard('PerfectVendor', allLeading);
      expect(scorecard.normalizedScore).toBe(100);
      expect(scorecard.bafoEligible).toBe(true);
    });

    it('bafoEligible is true when normalizedScore >= bafoInviteThreshold', () => {
      // Set all criteria to 'strong' (score 3 out of 4 leading)
      const allStrong: Partial<Record<string, VendorScoreRating>> = {};
      VENDOR_EVALUATION_PATTERN.criteria.forEach((c) => {
        allStrong[c.id] = 'strong';
      });
      const scorecard = buildVendorScorecard('StrongVendor', allStrong);
      expect(scorecard.normalizedScore).toBe(75);
      expect(scorecard.bafoEligible).toBe(true);
    });

    it('rows use not_assessed for unrated criteria', () => {
      const scorecard = buildVendorScorecard('Unrated', {});
      const allNotAssessed = scorecard.rows.every((r) => r.rating === 'not_assessed');
      expect(allNotAssessed).toBe(true);
    });

    it('totalWeightedScore and maxPossibleScore are positive', () => {
      const scorecard = buildVendorScorecard('Tester', { 'vep-c001': 'adequate' });
      expect(scorecard.maxPossibleScore).toBeGreaterThan(0);
      expect(scorecard.totalWeightedScore).toBeGreaterThan(0);
    });

    it('normalizedScore is between 0 and 100 inclusive', () => {
      const ratings: Partial<Record<string, VendorScoreRating>> = {};
      VENDOR_EVALUATION_PATTERN.criteria.forEach((c, i) => {
        ratings[c.id] = i % 2 === 0 ? 'weak' : 'strong';
      });
      const scorecard = buildVendorScorecard('Mixed', ratings);
      expect(scorecard.normalizedScore).toBeGreaterThanOrEqual(0);
      expect(scorecard.normalizedScore).toBeLessThanOrEqual(100);
    });

    it('is deterministic — same inputs produce same output', () => {
      const ratings: Partial<Record<string, VendorScoreRating>> = {
        'vep-c001': 'strong',
        'vep-c002': 'adequate',
      };
      const a = buildVendorScorecard('Alpha', ratings);
      const b = buildVendorScorecard('Alpha', ratings);
      expect(a).toEqual(b);
    });
  });
});

// ---------------------------------------------------------------------------
// PAT4 · AI Failure Modes → Solution Map
// ---------------------------------------------------------------------------

describe('PAT4 · AIFailureModesSolutionMap', () => {
  describe('mapping table', () => {
    it('has mappings (non-empty table)', () => {
      expect(ALL_FAILURE_MODE_SOLUTION_MAPPINGS.length).toBeGreaterThan(0);
    });

    it('every mapping has createdFrom discriminator', () => {
      ALL_FAILURE_MODE_SOLUTION_MAPPINGS.forEach((m) => {
        expect(m.createdFrom).toBe('pat4_ai_failure_modes_solution_map');
      });
    });

    it('every mapping references a valid solution pattern pack', () => {
      const validPacks = new Set(SOLUTION_PATTERN_PACKS);
      ALL_FAILURE_MODE_SOLUTION_MAPPINGS.forEach((m) => {
        expect(validPacks).toContain(m.patternPack);
      });
    });

    it('every mapping has at least one pattern slug', () => {
      ALL_FAILURE_MODE_SOLUTION_MAPPINGS.forEach((m) => {
        expect(m.patternSlugs.length).toBeGreaterThan(0);
      });
    });

    it('every mapping has at least one salient criterion id', () => {
      ALL_FAILURE_MODE_SOLUTION_MAPPINGS.forEach((m) => {
        expect(m.salientCriteriaIds.length).toBeGreaterThan(0);
      });
    });

    it('every mapping primaryAgent is a valid agent', () => {
      const valid = new Set(['nexus', 'sentinel', 'atlas', 'steward']);
      ALL_FAILURE_MODE_SOLUTION_MAPPINGS.forEach((m: FailureModeSolutionMapping) => {
        expect(valid).toContain(m.primaryAgent);
      });
    });
  });

  describe('mapFailureModeToSolutions', () => {
    it('returns hasMappings true for weak_data_foundation', () => {
      const result = mapFailureModeToSolutions('weak_data_foundation');
      expect(result.hasMappings).toBe(true);
      expect(result.mappings.length).toBeGreaterThan(0);
    });

    it('all mappings in result carry the queried key', () => {
      const result = mapFailureModeToSolutions('missing_governance_risk');
      result.mappings.forEach((m) => {
        expect(m.failureModeKey).toBe('missing_governance_risk');
      });
    });

    it('is deterministic across repeated calls', () => {
      const a = mapFailureModeToSolutions('pilot_purgatory');
      const b = mapFailureModeToSolutions('pilot_purgatory');
      expect(a).toEqual(b);
    });
  });

  describe('buildFailureModesSolutionReport', () => {
    it('aggregates unique slugs across multiple failure modes', () => {
      const report = buildFailureModesSolutionReport([
        'weak_data_foundation',
        'missing_governance_risk',
        'pilot_purgatory',
      ]);
      expect(report.createdFrom).toBe('pat4_ai_failure_modes_solution_map');
      expect(report.uniquePatternSlugs.length).toBeGreaterThan(0);
      expect(report.uniquePatternPacks.length).toBeGreaterThan(0);
      expect(report.totalMappings).toBeGreaterThan(0);
    });

    it('handles empty input without throwing', () => {
      const report = buildFailureModesSolutionReport([]);
      expect(report.results).toEqual([]);
      expect(report.totalMappings).toBe(0);
    });
  });

  describe('getFailureModesByPatternPack', () => {
    it('returns failure mode keys for pat1', () => {
      const keys = getFailureModesByPatternPack('pat1_data_platform_managed_services');
      expect(keys.length).toBeGreaterThan(0);
    });

    it('returns no duplicate keys', () => {
      const keys = getFailureModesByPatternPack('pat3_vendor_evaluation');
      const unique = new Set(keys);
      expect(unique.size).toBe(keys.length);
    });
  });

  describe('getMappingsForPatternPack', () => {
    it('filters by pack', () => {
      const mappings = getMappingsForPatternPack('pat2_ims_managed_services');
      mappings.forEach((m) => {
        expect(m.patternPack).toBe('pat2_ims_managed_services');
      });
    });

    it('filters by pack and slug', () => {
      const mappings = getMappingsForPatternPack(
        'pat3_vendor_evaluation',
        'vendor-evaluation-scorecard',
      );
      mappings.forEach((m) => {
        expect(m.patternSlugs).toContain('vendor-evaluation-scorecard');
      });
    });
  });

  describe('failureModeHasSolutionMapping', () => {
    it('returns true for a mapped failure mode', () => {
      expect(failureModeHasSolutionMapping('weak_data_foundation')).toBe(true);
    });

    it('MAPPED_FAILURE_MODE_KEYS is consistent with the table', () => {
      MAPPED_FAILURE_MODE_KEYS.forEach((key) => {
        expect(failureModeHasSolutionMapping(key)).toBe(true);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// PAT5 · Pattern Manifest
// ---------------------------------------------------------------------------

describe('PAT5 · PatternManifest', () => {
  describe('manifest structure', () => {
    it('has version 1.0', () => {
      expect(PATTERN_MANIFEST.version).toBe('1.0');
    });

    it('has createdFrom discriminator', () => {
      expect(PATTERN_MANIFEST.createdFrom).toBe('pat5_pattern_manifest');
    });

    it('has exactly 4 packs (PAT1–PAT4)', () => {
      expect(PATTERN_MANIFEST.totalPacks).toBe(4);
      expect(PATTERN_MANIFEST.packs.length).toBe(4);
    });

    it('totalSlugs is consistent with the sum of slugs across packs', () => {
      const computed = PATTERN_MANIFEST.packs.reduce((sum, p) => sum + p.slugs.length, 0);
      expect(PATTERN_MANIFEST.totalSlugs).toBe(computed);
    });

    it('PATTERN_MANIFEST_PACK_IDS matches packs', () => {
      expect(PATTERN_MANIFEST_PACK_IDS.length).toBe(PATTERN_MANIFEST.packs.length);
    });
  });

  describe('every pack entry schema', () => {
    it.each(PATTERN_MANIFEST.packs.map((p) => [p.id, p] as const))(
      'pack %s has required fields',
      (_id, pack) => {
        expect(typeof pack.id).toBe('string');
        expect(typeof pack.name).toBe('string');
        expect(typeof pack.description).toBe('string');
        expect(typeof pack.modulePath).toBe('string');
        expect(pack.categories.length).toBeGreaterThan(0);
        expect(pack.slugs.length).toBeGreaterThan(0);
        expect(pack.consumers.length).toBeGreaterThan(0);
        expect(pack.applicableCategories.length).toBeGreaterThan(0);
        expect(typeof pack.authoredInWave).toBe('string');
        expect(pack.createdFrom).toBe('pat5_pattern_manifest');
      },
    );
  });

  describe('every pack slug entry schema', () => {
    it('all slug entries have required fields', () => {
      for (const pack of PATTERN_MANIFEST.packs) {
        for (const s of pack.slugs) {
          expect(typeof s.slug).toBe('string');
          expect(typeof s.name).toBe('string');
          expect(typeof s.category).toBe('string');
          expect(s.criteriaCount).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('accessor functions', () => {
    it('listPatternManifestEntries returns all 4 packs', () => {
      expect(listPatternManifestEntries().length).toBe(4);
    });

    it('getPatternManifestEntry returns entry for known id', () => {
      const entry = getPatternManifestEntry('pat1_data_platform_managed_services');
      expect(entry).not.toBeNull();
      expect(entry!.id).toBe('pat1_data_platform_managed_services');
    });

    it('getPatternManifestEntry returns null for unknown id', () => {
      // TypeScript would complain, so cast
      expect(getPatternManifestEntry('unknown_pack' as any)).toBeNull();
    });

    it('findManifestEntriesBySlug returns entry for known slug', () => {
      const entries = findManifestEntriesBySlug('vendor-evaluation-scorecard');
      expect(entries.length).toBeGreaterThan(0);
    });

    it('findManifestEntriesBySlug returns empty for unknown slug', () => {
      expect(findManifestEntriesBySlug('no-such-slug')).toEqual([]);
    });

    it('getManifestEntriesByCategory returns entries for evaluation', () => {
      const entries = getManifestEntriesByCategory('evaluation');
      expect(entries.length).toBeGreaterThan(0);
      entries.forEach((e) => expect(e.categories).toContain('evaluation'));
    });

    it('getManifestEntriesForAgent returns entries for steward', () => {
      const entries = getManifestEntriesForAgent('steward');
      expect(entries.length).toBeGreaterThan(0);
    });

    it('getAllManifestSlugs returns all slugs without duplicates', () => {
      const slugs = getAllManifestSlugs();
      const unique = new Set(slugs);
      expect(unique.size).toBe(slugs.length);
      expect(slugs.length).toBe(PATTERN_MANIFEST.totalSlugs);
    });
  });

  describe('all packs reference correct pack IDs', () => {
    it('every pack id is in PATTERN_MANIFEST_PACK_IDS', () => {
      const idSet = new Set(PATTERN_MANIFEST_PACK_IDS);
      PATTERN_MANIFEST.packs.forEach((p) => {
        expect(idSet).toContain(p.id);
      });
    });
  });
});

// ---------------------------------------------------------------------------
// Cross-pack hygiene: no dollar fabrication in pattern content
// ---------------------------------------------------------------------------

const DOLLAR_PATTERN = /\$\s?\d/;

describe('pattern content — no fabricated dollar amounts', () => {
  it('PAT1 criteria rationale contains no dollar amounts', () => {
    for (const pattern of DATA_PLATFORM_MANAGED_SERVICES_PATTERNS) {
      for (const c of pattern.criteria) {
        expect(c.rationale).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });

  it('PAT2 criteria rationale contains no dollar amounts', () => {
    for (const pattern of IMS_MANAGED_SERVICES_PATTERNS) {
      for (const c of pattern.criteria) {
        expect(c.rationale).not.toMatch(DOLLAR_PATTERN);
      }
    }
  });

  it('PAT3 criteria criterion text contains no dollar amounts', () => {
    for (const c of VENDOR_EVALUATION_PATTERN.criteria) {
      expect(c.criterion).not.toMatch(DOLLAR_PATTERN);
    }
  });

  it('PAT4 mapping rationale contains no dollar amounts', () => {
    ALL_FAILURE_MODE_SOLUTION_MAPPINGS.forEach((m) => {
      expect(m.rationale).not.toMatch(DOLLAR_PATTERN);
    });
  });
});
