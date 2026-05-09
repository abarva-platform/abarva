import {
  buildSentinelGroundingSummary,
  formatGroundingFlagText,
  normalizeCanonicalIndustry,
} from '@/lib/sentinel/canonical-grounding';
import type { CanonicalPatternIndexHit, CanonicalPatternIndexResult } from '@/lib/intelligence/canonical/runtime-pattern-index';
import type { PatternApplicableProgram, PatternManifestEntry } from '@/lib/intelligence/pattern-manifest';

function pattern(overrides: Partial<PatternManifestEntry> = {}): PatternManifestEntry {
  return {
    id: 'pattern_test',
    slug: 'test-pattern',
    name: 'Test Pattern',
    version: '1.0.0',
    status: 'validated',
    category: 'Test',
    crossIndustry: true,
    sectorApplicability: ['retail'],
    primarySector: 'retail',
    shortDescription: 'Short description.',
    longDescription: 'Long description.',
    confidenceFloor: 0.7,
    nObservationsFloor: 3,
    relatedPatternIds: [],
    regulatoryFrameworkIds: [],
    sourceFile: 'src/lib/intelligence/seed-patterns-test.ts',
    sourceSection: null,
    lastUpdatedAt: '2026-05-09T00:00:00.000Z',
    contentHash: 'hash',
    evidenceCount: 0,
    observationCount: 0,
    observations: [],
    demoCritical: false,
    sections: [],
    triggerSymptoms: [],
    detectionSignals: [],
    diagnosticQuestions: [],
    evidenceRequirements: [],
    interventions: [],
    ...overrides,
  };
}

function program(overrides: Partial<PatternApplicableProgram> = {}): PatternApplicableProgram {
  return {
    tenantKey: 'apex-retail',
    tenantRouteSlug: 'apex-retail',
    clientDisplayName: 'Apex Retail',
    code: 'APX-001',
    name: 'Apex AI Program',
    programSlug: 'apex-ai-program',
    currentPhaseSpec: 4,
    status: 'active',
    roleInDemo: 'primary',
    routePath: '/programs/apex-ai-program',
    deliverables: [],
    ...overrides,
  };
}

function canonicalHit(overrides: Partial<CanonicalPatternIndexHit> = {}): CanonicalPatternIndexHit {
  const hit: CanonicalPatternIndexHit = {
    canonical_id: 'AIP-TEST-001',
    title: 'Canonical Test Pattern',
    summary: 'Canonical summary.',
    industry: ['retail'],
    enterprise_area: 'front_office',
    function: 'contact_center',
    process_area: 'service_routing',
    use_case_category: 'agentic_workflow',
    strategic_move_phases: ['charter'],
    maturity_level: 'proven',
    confidence_level: 'high',
    value_hypothesis: 'Better routing improves customer experience and frontline productivity.',
    primary_kpis: ['containment_rate', 'aht', 'csat'],
    secondary_kpis: ['first_contact_resolution', 'transfer_rate'],
    baseline_needed: ['current_contact_volume', 'current_aht', 'current_csat'],
    measurement_method: 'Compare baseline and pilot cohorts by channel and intent.',
    value_levers: ['experience', 'productivity', 'cost_takeout'],
    quantitative_claims: [],
    source_basis: 'internal_pattern',
    source_references: [],
    confidence_rationale: 'Internal pattern only.',
    missing_required_fields: [
      'primary_kpis',
      'recommended_artifacts',
      'responsible_ai_guardrails',
      'common_failure_modes',
    ],
    missing_provenance: true,
    unsupported_claim_flags: [],
    duplicate_risk: null,
    score: 0.8,
    match_reasons: ['query:test'],
  };

  return { ...hit, ...overrides } as CanonicalPatternIndexHit;
}

function canonicalResult(patterns: CanonicalPatternIndexHit[]): CanonicalPatternIndexResult {
  return {
    source: 'persisted_canonical_corpus',
    status: 'ready',
    patterns,
    total: patterns.length,
    warnings: [],
    filters_applied: { tenant_key: 'apex-retail' },
    cache: { mode: 'disabled', key: null, ttl_ms: 60_000 },
  };
}

describe('Sentinel canonical grounding', () => {
  it('normalizes tenant industry codes before canonical lookup', () => {
    expect(normalizeCanonicalIndustry('retail-omni')).toBe('retail');
    expect(normalizeCanonicalIndustry('healthcare_idn')).toBe('healthcare');
    expect(normalizeCanonicalIndustry('banking')).toBe('financial_services');
  });

  it('flags canonical evidence, artifact, KPI, guardrail, failure-mode, phase, and tenant-assumption gaps', () => {
    const summary = buildSentinelGroundingSummary({
      canonicalResult: canonicalResult([canonicalHit()]),
      tenantKey: 'apex-retail',
      rankedPatterns: [{
        pattern: pattern({ evidenceCount: 0, evidenceRequirements: [] }),
        applicablePrograms: [program()],
      }],
    });

    expect(summary.status).toBe('ready');
    expect(summary.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'pattern_to_evidence_gap', source: 'canonical_pattern_index' }),
      expect.objectContaining({ type: 'artifact_gap', missing: ['recommended_artifacts'] }),
      expect.objectContaining({ type: 'kpi_gap', missing: ['primary_kpis'] }),
      expect.objectContaining({ type: 'guardrail_gap', missing: ['responsible_ai_guardrails'] }),
      expect.objectContaining({ type: 'failure_mode_gap', missing: ['common_failure_modes'] }),
      expect.objectContaining({ type: 'phase_requirement_gap', missing: ['design'] }),
      expect.objectContaining({ type: 'tenant_pattern_assumption_gap', source: 'canonical_pattern_index' }),
      expect.objectContaining({ type: 'pattern_to_evidence_gap', source: 'pattern_manifest' }),
      expect.objectContaining({ type: 'artifact_gap', source: 'tenant_program_map', missing: ['tenant_artifacts'] }),
    ]));
  });

  it('flags tenant-pattern assumptions when Sentinel ranks a pattern without tenant program support', () => {
    const summary = buildSentinelGroundingSummary({
      canonicalResult: canonicalResult([canonicalHit({ missing_required_fields: [], missing_provenance: false })]),
      tenantKey: 'apex-retail',
      rankedPatterns: [{
        pattern: pattern({ evidenceCount: 2, evidenceRequirements: ['Baseline KPI report'] }),
        applicablePrograms: [],
      }],
    });

    expect(summary.gaps).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'tenant_pattern_assumption_gap',
        source: 'tenant_program_map',
        severity: 'warning',
      }),
    ]));
  });

  it('formats material grounding flags for the Sentinel answer text', () => {
    const summary = buildSentinelGroundingSummary({
      canonicalResult: {
        ...canonicalResult([]),
        status: 'no_match',
        warnings: ['WARNING_CANONICAL_PATTERN_NO_MATCH: no persisted canonical patterns matched the query.'],
      },
      tenantKey: 'apex-retail',
      rankedPatterns: [],
    });

    expect(formatGroundingFlagText(summary)).toContain('Grounding check:');
    expect(formatGroundingFlagText(summary)).toContain('No canonical pattern matched');
  });
});
