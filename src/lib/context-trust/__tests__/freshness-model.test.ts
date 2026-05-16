import {
  CONTEXT_SEGMENT_KEYS,
  SEGMENT_CADENCE,
  TRUST_RUNGS,
  assessSegment,
  computeAgeDays,
  computeFreshnessState,
  computeTrustRung,
  deriveGroundingVerdict,
  type SegmentMetadata,
} from '../freshness-model';

// Fixed reference date so every assertion is deterministic.
const AS_OF = new Date('2026-05-16T00:00:00.000Z');

function daysAgo(n: number): string {
  return new Date(AS_OF.getTime() - n * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
}

describe('catalogue contract', () => {
  it('defines exactly the 14 canonical segments', () => {
    expect(CONTEXT_SEGMENT_KEYS).toHaveLength(14);
    expect(new Set(CONTEXT_SEGMENT_KEYS).size).toBe(14);
  });

  it('has a cadence entry for every segment', () => {
    for (const key of CONTEXT_SEGMENT_KEYS) {
      const cadence = SEGMENT_CADENCE[key];
      expect(cadence).toBeDefined();
      expect(cadence.cadenceDays).toBeLessThan(cadence.staleDays);
    }
  });

  it('orders the trust rungs from strongest to weakest', () => {
    expect(TRUST_RUNGS).toEqual([
      'verified',
      'sourced',
      'inferred',
      'stale',
      'missing',
    ]);
  });
});

describe('computeAgeDays', () => {
  it('returns null when no date is supplied', () => {
    expect(computeAgeDays(null, AS_OF)).toBeNull();
  });

  it('returns null for an unparseable date', () => {
    expect(computeAgeDays('not-a-date', AS_OF)).toBeNull();
  });

  it('computes whole-day age', () => {
    expect(computeAgeDays(daysAgo(30), AS_OF)).toBe(30);
  });

  it('clamps future dates to zero', () => {
    expect(computeAgeDays(daysAgo(-10), AS_OF)).toBe(0);
  });
});

describe('computeFreshnessState', () => {
  const cadence = SEGMENT_CADENCE.vendor_contracts; // 90 / 180

  it('is fresh within cadence', () => {
    expect(computeFreshnessState(30, cadence)).toBe('fresh');
    expect(computeFreshnessState(90, cadence)).toBe('fresh');
  });

  it('is aging between cadence and stale window', () => {
    expect(computeFreshnessState(120, cadence)).toBe('aging');
  });

  it('is stale beyond the stale window', () => {
    expect(computeFreshnessState(200, cadence)).toBe('stale');
  });

  it('is unknown when age is null', () => {
    expect(computeFreshnessState(null, cadence)).toBe('unknown');
  });
});

describe('computeTrustRung', () => {
  it('absent source is always missing', () => {
    expect(computeTrustRung('absent', 'fresh')).toBe('missing');
    expect(computeTrustRung('absent', 'unknown')).toBe('missing');
  });

  it('stale freshness collapses any source to stale', () => {
    expect(computeTrustRung('verified', 'stale')).toBe('stale');
    expect(computeTrustRung('sourced', 'stale')).toBe('stale');
  });

  it('fresh verified data reaches the verified rung', () => {
    expect(computeTrustRung('verified', 'fresh')).toBe('verified');
  });

  it('fresh sourced data reaches the sourced rung', () => {
    expect(computeTrustRung('sourced', 'fresh')).toBe('sourced');
  });

  it('inferred source can never exceed inferred', () => {
    expect(computeTrustRung('inferred', 'fresh')).toBe('inferred');
    expect(computeTrustRung('inferred', 'aging')).toBe('inferred');
  });

  it('caps undated data at inferred even when source is verified', () => {
    expect(computeTrustRung('verified', 'unknown')).toBe('inferred');
    expect(computeTrustRung('sourced', 'unknown')).toBe('inferred');
  });
});

describe('assessSegment', () => {
  it('rates a fresh verified segment as high trust', () => {
    const meta: SegmentMetadata = {
      segment: 'vendor_contracts',
      lastUpdated: daysAgo(20),
      sourceType: 'verified',
    };
    const result = assessSegment(meta, AS_OF);
    expect(result.freshness).toBe('fresh');
    expect(result.trustRung).toBe('verified');
    expect(result.ageDays).toBe(20);
  });

  it('rates a 14-month-old segment as stale', () => {
    const meta: SegmentMetadata = {
      segment: 'org_structure',
      lastUpdated: daysAgo(14 * 30),
      sourceType: 'sourced',
    };
    const result = assessSegment(meta, AS_OF);
    expect(result.freshness).toBe('stale');
    expect(result.trustRung).toBe('stale');
  });

  it('rates a never-loaded segment as missing', () => {
    const meta: SegmentMetadata = {
      segment: 'operating_telemetry',
      lastUpdated: null,
      sourceType: 'absent',
    };
    const result = assessSegment(meta, AS_OF);
    expect(result.freshness).toBe('unknown');
    expect(result.trustRung).toBe('missing');
    expect(result.ageDays).toBeNull();
  });
});

describe('deriveGroundingVerdict', () => {
  it('returns insufficient for an empty backing set', () => {
    const verdict = deriveGroundingVerdict([], AS_OF);
    expect(verdict.confidence).toBe('insufficient');
    expect(verdict.action).toBe('decline');
  });

  it('returns high confidence when all segments are fresh and sourced', () => {
    const verdict = deriveGroundingVerdict(
      [
        { segment: 'vendor_contracts', lastUpdated: daysAgo(10), sourceType: 'verified' },
        { segment: 'kpi_dictionary', lastUpdated: daysAgo(15), sourceType: 'sourced' },
      ],
      AS_OF,
    );
    expect(verdict.confidence).toBe('high');
    expect(verdict.action).toBe('answer');
    expect(verdict.weakestRung).toBe('sourced');
  });

  it('downgrades to low when one backing segment is stale', () => {
    const verdict = deriveGroundingVerdict(
      [
        { segment: 'vendor_contracts', lastUpdated: daysAgo(10), sourceType: 'verified' },
        { segment: 'org_structure', lastUpdated: daysAgo(14 * 30), sourceType: 'sourced' },
      ],
      AS_OF,
    );
    expect(verdict.confidence).toBe('low');
    expect(verdict.action).toBe('downgrade');
    expect(verdict.weakestRung).toBe('stale');
    expect(verdict.staleSegments).toEqual(['org_structure']);
  });

  it('caveats when the weakest segment is inferred', () => {
    const verdict = deriveGroundingVerdict(
      [
        { segment: 'kpi_dictionary', lastUpdated: daysAgo(15), sourceType: 'sourced' },
        { segment: 'it_financials', lastUpdated: daysAgo(15), sourceType: 'inferred' },
      ],
      AS_OF,
    );
    expect(verdict.confidence).toBe('partial');
    expect(verdict.action).toBe('caveat');
    expect(verdict.weakestRung).toBe('inferred');
  });

  it('declines when a backing segment is missing', () => {
    const verdict = deriveGroundingVerdict(
      [
        { segment: 'vendor_contracts', lastUpdated: daysAgo(10), sourceType: 'verified' },
        { segment: 'operating_telemetry', lastUpdated: null, sourceType: 'absent' },
      ],
      AS_OF,
    );
    expect(verdict.confidence).toBe('insufficient');
    expect(verdict.action).toBe('decline');
    expect(verdict.missingSegments).toEqual(['operating_telemetry']);
  });

  it('preserves backing-segment input order in the assessment list', () => {
    const verdict = deriveGroundingVerdict(
      [
        { segment: 'kpi_dictionary', lastUpdated: daysAgo(10), sourceType: 'sourced' },
        { segment: 'vendor_contracts', lastUpdated: daysAgo(10), sourceType: 'sourced' },
      ],
      AS_OF,
    );
    expect(verdict.segments.map((s) => s.segment)).toEqual([
      'kpi_dictionary',
      'vendor_contracts',
    ]);
  });

  it('produces a founder-readable summary naming the stale segment', () => {
    const verdict = deriveGroundingVerdict(
      [{ segment: 'org_structure', lastUpdated: daysAgo(14 * 30), sourceType: 'sourced' }],
      AS_OF,
    );
    expect(verdict.summary).toContain('org_structure');
    expect(verdict.summary.toLowerCase()).toContain('stale');
  });
});
