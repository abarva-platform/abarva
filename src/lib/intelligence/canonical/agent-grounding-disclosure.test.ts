import {
  buildAgentGroundingDisclosure,
  formatUnsupportedClaimFlag,
} from '@/lib/intelligence/canonical/agent-grounding-disclosure';

describe('agent grounding disclosure', () => {
  it('summarizes source basis, confidence, missing fields, and unsupported claims', () => {
    const disclosure = buildAgentGroundingDisclosure({
      source: 'persisted_canonical_corpus',
      status: 'ready',
      warnings: [],
      patterns: [
        {
          canonicalId: 'AIP-RETAIL-001',
          title: 'Retail contact center routing',
          sourceBasis: 'internal_pattern',
          confidenceLevel: 'high',
          confidenceRationale: 'Reviewed internal pattern.',
          sourceReferenceCount: 1,
          missingRequiredFields: ['primary_kpis'],
          missingProvenance: false,
          unsupportedClaimFlags: ['outcome lift: source required'],
          quantitativeClaimCount: 0,
          matchReasons: ['industry:retail'],
        },
      ],
    });

    expect(disclosure).toMatchObject({
      source: 'persisted_canonical_corpus',
      status: 'ready',
      retrievedPatternCount: 1,
      sourceBasis: ['internal_pattern'],
      confidenceLevels: ['high'],
      unsupportedClaimFlags: ['outcome lift: source required'],
    });
    expect(disclosure.missingEvidence).toContain('AIP-RETAIL-001: missing primary_kpis');
  });

  it('formats structured unsupported-claim flags without inventing citations', () => {
    expect(formatUnsupportedClaimFlag({
      claim: '15% conversion lift',
      reason: 'no source reference',
      recommended_action: 'source_required',
    })).toBe('15% conversion lift: no source reference');
  });
});
