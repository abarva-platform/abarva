import {
  detectCommercialRisks,
  RISK_PATTERNS,
  CommercialRiskCategory,
  CommercialRiskSeverity,
  CommercialRiskStatus,
  CommercialRiskDetectionResult,
} from '../../../lib/source/commercial-risk-detection';

const CATEGORIES: CommercialRiskCategory[] = [
  'pricing_anomaly', 'scope_ambiguity', 'governance_gap',
  'evidence_deficit', 'contract_trap', 'transition_risk',
  'liability_exposure', 'timeline_compression',
];

const SEVERITIES: CommercialRiskSeverity[] = ['critical', 'high', 'medium', 'low'];
const STATUSES: CommercialRiskStatus[] = ['open', 'acknowledged', 'mitigated', 'accepted', 'resolved'];

const allRisksInput = {
  eventId: 'evt-risk-test',
  eventName: 'Risk Test Event',
  vendorIds: ['vendor-a', 'vendor-b'],
  hasIncompleteEvidence: true,
  hasPricingAnomalies: true,
  hasScopeAmbiguity: true,
  hasGovernanceGap: true,
};

const noRisksInput = {
  eventId: 'evt-clean-test',
  eventName: 'Clean Event',
  vendorIds: ['vendor-a'],
  hasIncompleteEvidence: false,
  hasPricingAnomalies: false,
  hasScopeAmbiguity: false,
  hasGovernanceGap: false,
};

describe('commercial-risk-detection - detectCommercialRisks (all risks)', () => {
  let result: CommercialRiskDetectionResult;

  beforeAll(() => {
    result = detectCommercialRisks(allRisksInput);
  });

  it('returns correct eventId', () => {
    expect(result.eventId).toBe('evt-risk-test');
  });

  it('sets generatedAt to 2026-04-26', () => {
    expect(result.generatedAt).toBe('2026-04-26');
  });

  it('returns at least one exception when all flags set', () => {
    expect(result.exceptions.length).toBeGreaterThan(0);
  });

  it('every exception has a valid category', () => {
    for (const e of result.exceptions) {
      expect(CATEGORIES).toContain(e.category);
    }
  });

  it('every exception has a valid severity', () => {
    for (const e of result.exceptions) {
      expect(SEVERITIES).toContain(e.severity);
    }
  });

  it('every exception has a valid status', () => {
    for (const e of result.exceptions) {
      expect(STATUSES).toContain(e.status);
    }
  });

  it('every exception has non-empty title and description', () => {
    for (const e of result.exceptions) {
      expect(e.title.length).toBeGreaterThan(0);
      expect(e.description.length).toBeGreaterThan(0);
    }
  });

  it('counts match exception array', () => {
    expect(result.criticalCount + result.highCount + result.mediumCount + result.lowCount)
      .toBe(result.totalCount);
    expect(result.totalCount).toBe(result.exceptions.length);
  });

  it('overallRiskLevel is in canonical set', () => {
    expect(SEVERITIES).toContain(result.overallRiskLevel);
  });

  it('returns patterns array with at least 5 patterns', () => {
    expect(Array.isArray(result.patterns)).toBe(true);
    expect(result.patterns.length).toBeGreaterThanOrEqual(5);
  });

  it('every pattern has a valid category', () => {
    for (const p of result.patterns) {
      expect(CATEGORIES).toContain(p.category);
    }
  });
});

describe('commercial-risk-detection - RISK_PATTERNS export', () => {
  it('exports RISK_PATTERNS with at least 5 entries', () => {
    expect(Array.isArray(RISK_PATTERNS)).toBe(true);
    expect(RISK_PATTERNS.length).toBeGreaterThanOrEqual(5);
  });

  it('every exported pattern has a valid category', () => {
    for (const p of RISK_PATTERNS) {
      expect(CATEGORIES).toContain(p.category);
    }
  });
});

describe('commercial-risk-detection - detectCommercialRisks (no risks)', () => {
  it('returns zero exceptions and low overall risk when all flags false', () => {
    const result = detectCommercialRisks(noRisksInput);
    expect(result.exceptions).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.overallRiskLevel).toBe('low');
  });
});

describe('commercial-risk-detection - determinism', () => {
  it('two calls with same input return identical JSON', () => {
    const r1 = detectCommercialRisks(allRisksInput);
    const r2 = detectCommercialRisks(allRisksInput);
    expect(JSON.stringify(r1)).toBe(JSON.stringify(r2));
  });
});
