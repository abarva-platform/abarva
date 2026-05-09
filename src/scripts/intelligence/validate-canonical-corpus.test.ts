import {
  formatCanonicalCorpusValidationMarkdown,
  validateCanonicalCorpusPreview,
  type CanonicalCorpusPreviewReport,
} from './validate-canonical-corpus';

const completePayload = {
  canonical_id: 'AIP-RETAIL-CONTACT-CENTER-AI-ROUTING',
  title: 'Contact Center AI Routing',
  industry: ['retail'],
  enterprise_area: 'front_office',
  function: 'contact_center',
  process_area: 'service_routing',
  use_case_category: 'agentic_workflow',
  strategic_move_phases: ['design'],
  source_basis: 'internal_pattern',
  confidence_rationale: 'Reviewed internal pattern.',
  primary_kpis: ['containment_rate', 'aht'],
  secondary_kpis: ['csat'],
  required_data_domains: ['interaction_history', 'customer_profile', 'agent_capacity'],
  common_failure_modes: ['Routing rules are not monitored after launch.'],
  failure_mode_mitigations: ['Review routing outcomes weekly during pilot.'],
  recommended_artifacts: ['routing_design'],
  recommended_workshops: ['service_journey_workshop'],
  quantitative_claims: [],
  unsupported_claim_flags: [],
};

function preview(overrides: Record<string, unknown> = {}): CanonicalCorpusPreviewReport {
  return {
    preview_rows: [{
      canonical_id: 'AIP-RETAIL-CONTACT-CENTER-AI-ROUTING',
      title: 'Contact Center AI Routing',
      source_systems: ['pattern_seed'],
      source_ids: ['pattern_1'],
      missing_required_fields: [],
      missing_provenance: false,
      unsupported_claim_count: 0,
      upsert_payload: {
        ...completePayload,
        ...overrides,
      },
    }],
    db_status: {
      note: 'DB unavailable; source-code preview only.',
    },
  };
}

describe('canonical corpus validator', () => {
  it('passes complete canonical preview rows', () => {
    const result = validateCanonicalCorpusPreview(preview());

    expect(result.summary.total_patterns).toBe(1);
    expect(result.summary.error_count).toBe(0);
    expect(result.summary.warning_count).toBe(0);
    expect(result.summary.phase_coverage.design).toBe(1);
    expect(result.summary.source_system_counts.pattern_seed).toBe(1);
  });

  it('flags missing classification, KPI, data, failure mode, artifact, workshop, and provenance gaps', () => {
    const result = validateCanonicalCorpusPreview(preview({
      industry: [],
      process_area: '',
      primary_kpis: ['aht'],
      secondary_kpis: [],
      required_data_domains: ['interaction_history'],
      common_failure_modes: [],
      failure_mode_mitigations: [],
      recommended_artifacts: [],
      recommended_workshops: [],
      source_basis: '',
      confidence_rationale: '',
    }));

    expect(result.summary.error_count).toBeGreaterThanOrEqual(9);
    expect(result.issues.map((item) => item.rule)).toEqual(expect.arrayContaining([
      'required_identity',
      'minimum_kpis',
      'minimum_data_requirements',
      'failure_modes_required',
      'failure_mitigations_required',
      'recommended_artifacts_required',
      'recommended_workshops_required',
      'provenance_required',
    ]));
  });

  it('warns on unsupported quantitative claims', () => {
    const result = validateCanonicalCorpusPreview(preview({
      quantitative_claims: [{
        claim: '10% cost reduction',
        value: '10%',
        confidence_level: 'medium',
      }],
      unsupported_claim_flags: [],
    }));

    expect(result.summary.warning_count).toBe(1);
    expect(result.issues[0]?.rule).toBe('unsupported_quantitative_claim');
  });

  it('formats markdown with gate notes', () => {
    const markdown = formatCanonicalCorpusValidationMarkdown(validateCanonicalCorpusPreview(preview()));

    expect(markdown).toContain('# Canonical Corpus Validation Report - 2026-05-09');
    expect(markdown).toContain('Use `--strict`');
  });
});
