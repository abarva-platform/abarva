// EVID1 · Evidence Manifest Schema tests.
//
// Pure deterministic coverage of the evidence manifest schema read model.

import {
  buildEvidenceClaimSchemaSeed,
  getConfidenceTierDescriptor,
  getFreshnessRule,
  listEvidenceConfidenceTiers,
  listEvidenceFreshnessRules,
  resolveConfidenceTier,
  summarizeEvidenceClaimSchema,
  EVIDENCE_CLAIM_KINDS_IN_ORDER,
  EVIDENCE_CONFIDENCE_TIERS_IN_ORDER,
  type EvidenceConfidenceTier,
} from '@/lib/data-trust/evidence-manifest-schema';

// ---------------------------------------------------------------------
// Determinism
// ---------------------------------------------------------------------

describe('buildEvidenceClaimSchemaSeed · determinism', () => {
  it('returns a deterministic seed across repeated calls', () => {
    const a = buildEvidenceClaimSchemaSeed();
    const b = buildEvidenceClaimSchemaSeed();
    expect(a).toEqual(b);
  });

  it('serialized seed is byte-equal across repeated calls', () => {
    const a = JSON.stringify(buildEvidenceClaimSchemaSeed());
    const b = JSON.stringify(buildEvidenceClaimSchemaSeed());
    expect(a).toBe(b);
  });

  it('every claim carries the deterministic createdFrom marker', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      expect(claim.createdFrom).toBe(
        'deterministic_evidence_manifest_schema_seed',
      );
    }
  });

  it('every citationDisplay carries the deterministic createdFrom marker', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      expect(claim.citationDisplay.createdFrom).toBe(
        'deterministic_evidence_manifest_schema_seed',
      );
    }
  });
});

// ---------------------------------------------------------------------
// Seed shape
// ---------------------------------------------------------------------

describe('buildEvidenceClaimSchemaSeed · shape', () => {
  it('returns at least 3 seed claims', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    expect(claims.length).toBeGreaterThanOrEqual(3);
  });

  it('every claim has a non-empty claimId and anchorKey', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      expect(claim.claimId.trim().length).toBeGreaterThan(0);
      expect(claim.anchorKey.trim().length).toBeGreaterThan(0);
    }
  });

  it('every claim has a valid confidenceTier from the canonical set', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      expect(EVIDENCE_CONFIDENCE_TIERS_IN_ORDER).toContain(
        claim.confidenceTier,
      );
    }
  });

  it('every claim has a valid claimKind from the canonical set', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      expect(EVIDENCE_CLAIM_KINDS_IN_ORDER).toContain(claim.claimKind);
    }
  });

  it('missing-source claims have empty provenanceRecords array', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const missingClaims = claims.filter((c) => c.sourceAbsent);
    for (const claim of missingClaims) {
      expect(claim.provenanceRecords).toHaveLength(0);
      expect(claim.confidenceTier).toBe('missing');
    }
  });

  it('non-missing claims have at least one provenance record', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const sourcedClaims = claims.filter(
      (c) => !c.sourceAbsent && !c.sourceBlocked,
    );
    for (const claim of sourcedClaims) {
      expect(claim.provenanceRecords.length).toBeGreaterThan(0);
    }
  });

  it('seed covers at least 3 distinct confidence tiers', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const tiers = new Set(claims.map((c) => c.confidenceTier));
    expect(tiers.size).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------
// Citation display
// ---------------------------------------------------------------------

describe('citationDisplay · contract', () => {
  it('missing-source claims have a disclosureCaveat', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const missingClaims = claims.filter((c) => c.sourceAbsent);
    for (const claim of missingClaims) {
      expect(claim.citationDisplay.disclosureCaveat).toBeTruthy();
      expect(
        (claim.citationDisplay.disclosureCaveat as string).length,
      ).toBeGreaterThan(10);
    }
  });

  it('low-confidence claims have a disclosureCaveat', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const lowClaims = claims.filter((c) => c.confidenceTier === 'low');
    for (const claim of lowClaims) {
      expect(claim.citationDisplay.disclosureCaveat).toBeTruthy();
    }
  });

  it('high-confidence sourced claims have no disclosureCaveat', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const highClaims = claims.filter(
      (c) => c.confidenceTier === 'high' && !c.sourceAbsent,
    );
    expect(highClaims.length).toBeGreaterThan(0);
    for (const claim of highClaims) {
      expect(claim.citationDisplay.disclosureCaveat).toBeUndefined();
    }
  });

  it('citationDisplay.confidenceTier matches claim.confidenceTier', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      expect(claim.citationDisplay.confidenceTier).toBe(claim.confidenceTier);
    }
  });

  it('no raw payload patterns in valueLabel across all claims', () => {
    const urlSchemePattern = /[a-zA-Z]{2,6}:\/\//;
    const longTokenPattern = /[A-Za-z0-9]{32,}/;
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      expect(urlSchemePattern.test(claim.citationDisplay.valueLabel)).toBe(
        false,
      );
      expect(longTokenPattern.test(claim.citationDisplay.valueLabel)).toBe(
        false,
      );
    }
  });
});

// ---------------------------------------------------------------------
// listEvidenceConfidenceTiers
// ---------------------------------------------------------------------

describe('listEvidenceConfidenceTiers', () => {
  it('returns exactly 6 canonical tiers', () => {
    const tiers = listEvidenceConfidenceTiers();
    expect(tiers).toHaveLength(6);
  });

  it('includes all tiers from EVIDENCE_CONFIDENCE_TIERS_IN_ORDER', () => {
    const tiers = listEvidenceConfidenceTiers();
    const tierNames = tiers.map((t) => t.tier);
    for (const tier of EVIDENCE_CONFIDENCE_TIERS_IN_ORDER) {
      expect(tierNames).toContain(tier);
    }
  });

  it('high confidence permits decision citation, requires no disclosure', () => {
    const high = listEvidenceConfidenceTiers().find((t) => t.tier === 'high');
    expect(high).toBeDefined();
    expect(high!.permitsDecisionCitation).toBe(true);
    expect(high!.requiresDisclosure).toBe(false);
  });

  it('missing and blocked tiers require disclosure', () => {
    const tiers = listEvidenceConfidenceTiers();
    const missingTier = tiers.find((t) => t.tier === 'missing');
    const blockedTier = tiers.find((t) => t.tier === 'blocked');
    expect(missingTier!.requiresDisclosure).toBe(true);
    expect(blockedTier!.requiresDisclosure).toBe(true);
  });

  it('missing and blocked tiers do not permit decision citation', () => {
    const tiers = listEvidenceConfidenceTiers();
    const missingTier = tiers.find((t) => t.tier === 'missing');
    const blockedTier = tiers.find((t) => t.tier === 'blocked');
    expect(missingTier!.permitsDecisionCitation).toBe(false);
    expect(blockedTier!.permitsDecisionCitation).toBe(false);
  });

  it('is deterministic across repeated calls', () => {
    expect(JSON.stringify(listEvidenceConfidenceTiers())).toBe(
      JSON.stringify(listEvidenceConfidenceTiers()),
    );
  });
});

// ---------------------------------------------------------------------
// listEvidenceFreshnessRules
// ---------------------------------------------------------------------

describe('listEvidenceFreshnessRules', () => {
  it('returns exactly 7 canonical freshness rules', () => {
    const rules = listEvidenceFreshnessRules();
    expect(rules).toHaveLength(7);
  });

  it('covers all canonical claim kinds', () => {
    const rules = listEvidenceFreshnessRules();
    const kinds = rules.map((r) => r.claimKind);
    for (const kind of EVIDENCE_CLAIM_KINDS_IN_ORDER) {
      expect(kinds).toContain(kind);
    }
  });

  it('operational_kpi stale threshold is 90 days', () => {
    const rule = listEvidenceFreshnessRules().find(
      (r) => r.claimKind === 'operational_kpi',
    );
    expect(rule?.staleDaysThreshold).toBe(90);
    expect(rule?.requiresStalenessWarning).toBe(true);
  });

  it('all staleDaysThreshold values are positive', () => {
    for (const rule of listEvidenceFreshnessRules()) {
      expect(rule.staleDaysThreshold).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------
// getFreshnessRule
// ---------------------------------------------------------------------

describe('getFreshnessRule', () => {
  it('returns the rule for a known kind', () => {
    const rule = getFreshnessRule('financial_result');
    expect(rule).toBeDefined();
    expect(rule?.claimKind).toBe('financial_result');
    expect(rule?.staleDaysThreshold).toBe(180);
  });

  it('returns undefined for an unknown kind', () => {
    // Cast to bypass TS type check in test
    const rule = getFreshnessRule('unknown_kind' as never);
    expect(rule).toBeUndefined();
  });
});

// ---------------------------------------------------------------------
// getConfidenceTierDescriptor
// ---------------------------------------------------------------------

describe('getConfidenceTierDescriptor', () => {
  it('returns a descriptor for each canonical tier', () => {
    for (const tier of EVIDENCE_CONFIDENCE_TIERS_IN_ORDER) {
      const descriptor = getConfidenceTierDescriptor(tier);
      expect(descriptor).toBeDefined();
      expect(descriptor?.tier).toBe(tier);
    }
  });

  it('returns undefined for an unknown tier', () => {
    const descriptor = getConfidenceTierDescriptor(
      'unknown_tier' as EvidenceConfidenceTier,
    );
    expect(descriptor).toBeUndefined();
  });
});

// ---------------------------------------------------------------------
// resolveConfidenceTier
// ---------------------------------------------------------------------

describe('resolveConfidenceTier', () => {
  it('returns blocked when sourceBlocked is true', () => {
    expect(resolveConfidenceTier('audited', false, false, true)).toBe(
      'blocked',
    );
  });

  it('returns missing when sourceAbsent is true (and not blocked)', () => {
    expect(resolveConfidenceTier('self_attested', false, true, false)).toBe(
      'missing',
    );
  });

  it('returns stale when isStale is true (and not absent or blocked)', () => {
    expect(resolveConfidenceTier('co_signed', true, false, false)).toBe(
      'stale',
    );
  });

  it('audited → high when not stale/absent/blocked', () => {
    expect(resolveConfidenceTier('audited', false, false, false)).toBe('high');
  });

  it('co_signed → high when not stale/absent/blocked', () => {
    expect(resolveConfidenceTier('co_signed', false, false, false)).toBe(
      'high',
    );
  });

  it('owner_signed → medium when not stale/absent/blocked', () => {
    expect(resolveConfidenceTier('owner_signed', false, false, false)).toBe(
      'medium',
    );
  });

  it('self_attested → low when not stale/absent/blocked', () => {
    expect(resolveConfidenceTier('self_attested', false, false, false)).toBe(
      'low',
    );
  });

  it('blocked takes precedence over absent', () => {
    expect(resolveConfidenceTier('audited', false, true, true)).toBe('blocked');
  });

  it('absent takes precedence over stale', () => {
    expect(resolveConfidenceTier('audited', true, true, false)).toBe('missing');
  });
});

// ---------------------------------------------------------------------
// summarizeEvidenceClaimSchema
// ---------------------------------------------------------------------

describe('summarizeEvidenceClaimSchema', () => {
  it('returns zeros for empty input', () => {
    const summary = summarizeEvidenceClaimSchema([]);
    expect(summary.total).toBe(0);
    expect(summary.missingSourceCount).toBe(0);
    expect(summary.blockedSourceCount).toBe(0);
  });

  it('total matches input length', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const summary = summarizeEvidenceClaimSchema(claims);
    expect(summary.total).toBe(claims.length);
  });

  it('missingSourceCount matches claims with sourceAbsent=true', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const summary = summarizeEvidenceClaimSchema(claims);
    const expected = claims.filter((c) => c.sourceAbsent).length;
    expect(summary.missingSourceCount).toBe(expected);
  });

  it('byConfidenceTier counts sum to total', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const summary = summarizeEvidenceClaimSchema(claims);
    const tierTotal = Object.values(summary.byConfidenceTier).reduce(
      (acc, v) => acc + v,
      0,
    );
    expect(tierTotal).toBe(summary.total);
  });

  it('byClaimKind counts sum to total', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const summary = summarizeEvidenceClaimSchema(claims);
    const kindTotal = Object.values(summary.byClaimKind).reduce(
      (acc, v) => acc + v,
      0,
    );
    expect(kindTotal).toBe(summary.total);
  });

  it('requiresDisclosureCount >= missingSourceCount + blockedSourceCount', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    const summary = summarizeEvidenceClaimSchema(claims);
    expect(summary.requiresDisclosureCount).toBeGreaterThanOrEqual(
      summary.missingSourceCount + summary.blockedSourceCount,
    );
  });

  it('is deterministic for the same input', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    expect(JSON.stringify(summarizeEvidenceClaimSchema(claims))).toBe(
      JSON.stringify(summarizeEvidenceClaimSchema(claims)),
    );
  });
});

// ---------------------------------------------------------------------
// Source purity
// ---------------------------------------------------------------------

describe('source purity', () => {
  it('no Date.now or Math.random references in seed claims (marker check)', () => {
    const claims = buildEvidenceClaimSchemaSeed();
    for (const claim of claims) {
      const serialized = JSON.stringify(claim);
      expect(serialized).not.toMatch(/Date\.now/);
      expect(serialized).not.toMatch(/Math\.random/);
    }
  });
});
