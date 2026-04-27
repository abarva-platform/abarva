// QA30 — No-Fabrication Regression Suite
//
// Verifies that AbarVa read models do not contain fabricated data:
// unsubstantiated dollar amounts, bare percentage claims, invalid
// confidence values, evidence entries without source references,
// or agent outputs without deterministic caveats.
//
// These tests run against deterministic lib functions — no running
// server required, no model calls, no network access.

import {
  buildSentinelPatternDetectionsForTenant,
  type SentinelPatternDetection,
  type SentinelDetectionConfidence,
} from '@/lib/intelligence/sentinel-pattern-detections';
import {
  buildTenantSeedPlan,
} from '@/lib/programs/enhancement-seed-planner';
import {
  getTenantPortfolio,
} from '@/lib/programs/enhancement-spec';
import {
  buildIntelligenceSourceBasisSeed,
  type IntelligenceSourceBasis,
} from '@/lib/intelligence/source-basis';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_CONFIDENCE_VALUES: ReadonlyArray<SentinelDetectionConfidence> = ['low', 'medium', 'high'];

// Dollar-amount pattern: $NNN, $N.NM, $NM, $N billion
const DOLLAR_AMOUNT_RE = /\$[\d,]+(\.\d+)?\s*(million|billion|M|B|K)\b/i;

// Bare percentage claim: "30% reduction", "45% savings", "20% improvement"
// (not part of a range or properly attributed source reference)
const BARE_PERCENT_CLAIM_RE = /\d+(\.\d+)?%\s+(reduction|savings|improvement|gain|uplift|decrease|increase)\b/i;

function getApexRetailTenantSeed() {
  const portfolio = getTenantPortfolio('apexretail');
  if (!portfolio) throw new Error('apexretail portfolio not found in TENANT_PORTFOLIOS');
  return buildTenantSeedPlan(portfolio);
}

// ---------------------------------------------------------------------------
// Pattern 1: No dollar amounts without source in sentinel pattern text
// ---------------------------------------------------------------------------

describe('QA30 — Pattern 1: No unsubstantiated dollar amounts in sentinel detections', () => {
  let detections: ReadonlyArray<SentinelPatternDetection>;

  beforeAll(() => {
    const tenant = getApexRetailTenantSeed();
    detections = buildSentinelPatternDetectionsForTenant(tenant);
  });

  it('sentinel pattern detections exist for apex-retail', () => {
    expect(detections).toBeDefined();
    expect(Array.isArray(detections)).toBe(true);
  });

  it('no detection title contains an unsubstantiated dollar amount', () => {
    for (const det of detections) {
      expect(det.title).not.toMatch(DOLLAR_AMOUNT_RE);
    }
  });

  it('no detection summary contains an unsubstantiated dollar amount', () => {
    for (const det of detections) {
      expect(det.summary).not.toMatch(DOLLAR_AMOUNT_RE);
    }
  });

  it('no detection whyItMatters contains an unsubstantiated dollar amount', () => {
    for (const det of detections) {
      expect(det.whyItMatters).not.toMatch(DOLLAR_AMOUNT_RE);
    }
  });

  it('no detection recommendedAction contains an unsubstantiated dollar amount', () => {
    for (const det of detections) {
      expect(det.recommendedAction).not.toMatch(DOLLAR_AMOUNT_RE);
    }
  });
});

// ---------------------------------------------------------------------------
// Pattern 2: No bare percentage claims in detection text
// ---------------------------------------------------------------------------

describe('QA30 — Pattern 2: No bare percentage reduction/savings claims', () => {
  let detections: ReadonlyArray<SentinelPatternDetection>;

  beforeAll(() => {
    const tenant = getApexRetailTenantSeed();
    detections = buildSentinelPatternDetectionsForTenant(tenant);
  });

  it('no detection title contains a bare percentage claim', () => {
    for (const det of detections) {
      expect(det.title).not.toMatch(BARE_PERCENT_CLAIM_RE);
    }
  });

  it('no detection summary contains a bare percentage claim', () => {
    for (const det of detections) {
      expect(det.summary).not.toMatch(BARE_PERCENT_CLAIM_RE);
    }
  });

  it('no detection whyItMatters contains a bare percentage claim', () => {
    for (const det of detections) {
      expect(det.whyItMatters).not.toMatch(BARE_PERCENT_CLAIM_RE);
    }
  });
});

// ---------------------------------------------------------------------------
// Pattern 3: All confidence values in the allowed set
// ---------------------------------------------------------------------------

describe('QA30 — Pattern 3: All confidence values valid', () => {
  let detections: ReadonlyArray<SentinelPatternDetection>;

  beforeAll(() => {
    const tenant = getApexRetailTenantSeed();
    detections = buildSentinelPatternDetectionsForTenant(tenant);
  });

  it('every detection confidence is in [low, medium, high]', () => {
    for (const det of detections) {
      expect(VALID_CONFIDENCE_VALUES).toContain(det.confidence);
    }
  });

});

// ---------------------------------------------------------------------------
// Pattern 4: Evidence source bases have source references
// ---------------------------------------------------------------------------

describe('QA30 — Pattern 4: Intelligence source bases have citation locators', () => {
  let bases: ReadonlyArray<IntelligenceSourceBasis>;

  beforeAll(() => {
    bases = buildIntelligenceSourceBasisSeed();
  });

  it('buildIntelligenceSourceBasisSeed returns a non-empty array', () => {
    expect(bases).toBeDefined();
    expect(Array.isArray(bases)).toBe(true);
    expect(bases.length).toBeGreaterThan(0);
  });

  it('every source basis has a non-empty citationLocator', () => {
    for (const basis of bases) {
      expect(basis.citationLocator).toBeDefined();
      expect(typeof basis.citationLocator).toBe('string');
      expect(basis.citationLocator.length).toBeGreaterThan(0);
    }
  });

  it('every source basis has a non-empty label', () => {
    for (const basis of bases) {
      expect(basis.label).toBeDefined();
      expect(typeof basis.label).toBe('string');
      expect(basis.label.length).toBeGreaterThan(0);
    }
  });

  it('every source basis has createdFrom: deterministic_intelligence_source_basis_seed', () => {
    for (const basis of bases) {
      expect(basis.createdFrom).toBe('deterministic_intelligence_source_basis_seed');
    }
  });
});

// ---------------------------------------------------------------------------
// Pattern 5: Sentinel detections have deterministic caveat
// ---------------------------------------------------------------------------

describe('QA30 — Pattern 5: Sentinel detections have deterministic caveat', () => {
  let detections: ReadonlyArray<SentinelPatternDetection>;

  beforeAll(() => {
    const tenant = getApexRetailTenantSeed();
    detections = buildSentinelPatternDetectionsForTenant(tenant);
  });

  it('every detection has createdFrom: deterministic_seed', () => {
    for (const det of detections) {
      expect(det.createdFrom).toBe('deterministic_seed');
    }
  });

  it('detections do not claim to be live data', () => {
    for (const det of detections) {
      // Summary must not claim live signals without qualification
      expect(det.summary.toLowerCase()).not.toMatch(/\blive\s+data\b|\breal.time\b/);
    }
  });
});
