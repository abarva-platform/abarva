import type { PersistedCanonicalIndustryAIPatternRow } from './persistence-contract';
import {
  WARNING_CANONICAL_CORPUS_EMPTY,
  WARNING_CANONICAL_CORPUS_READ_FAILED,
  WARNING_CANONICAL_PATTERN_NO_MATCH,
  clearCanonicalPatternIndexCache,
  searchCanonicalPatternIndex,
} from './runtime-pattern-index';

type QueryResponse = {
  data: PersistedCanonicalIndustryAIPatternRow[] | null;
  error: { message?: string } | null;
  count?: number | null;
};

class FakeQueryBuilder {
  readonly calls: Array<{ method: string; args: unknown[] }> = [];

  constructor(private readonly response: QueryResponse) {}

  select(...args: unknown[]): this {
    this.calls.push({ method: 'select', args });
    return this;
  }

  eq(...args: unknown[]): this {
    this.calls.push({ method: 'eq', args });
    return this;
  }

  neq(...args: unknown[]): this {
    this.calls.push({ method: 'neq', args });
    return this;
  }

  contains(...args: unknown[]): this {
    this.calls.push({ method: 'contains', args });
    return this;
  }

  or(...args: unknown[]): this {
    this.calls.push({ method: 'or', args });
    return this;
  }

  order(...args: unknown[]): this {
    this.calls.push({ method: 'order', args });
    return this;
  }

  async limit(...args: unknown[]): Promise<QueryResponse> {
    this.calls.push({ method: 'limit', args });
    return this.response;
  }
}

function fakeSupabase(response: QueryResponse) {
  const builders: FakeQueryBuilder[] = [];
  return {
    builders,
    supabase: {
      from: jest.fn(() => {
        const builder = new FakeQueryBuilder(response);
        builders.push(builder);
        return builder;
      }),
    },
  };
}

const baseRow: PersistedCanonicalIndustryAIPatternRow = {
  canonical_id: 'AIP-RETAIL-CONTACT-CENTER-AI-ROUTING',
  title: 'Contact Center AI Routing',
  summary: 'Route customer contacts using intent, value, and service context.',
  source_crosswalk: [{
    source_system: 'pattern_seed',
    source_id: 'PAT-CCAI-001',
    relationship: 'primary',
  }],
  source_systems: ['pattern_seed'],
  source_ids: ['PAT-CCAI-001'],
  version: '1.0.0',
  schema_version: '2026-05-09',
  lifecycle_status: 'reviewed',
  owner: 'abarva-corpus',
  last_reviewed_at: '2026-05-09T00:00:00.000Z',
  visibility_scope: 'global',
  tenant_key: null,
  client_id: null,
  industry: ['retail'],
  enterprise_area: 'front_office',
  function: 'contact_center',
  process_area: 'service_routing_and_resolution',
  use_case_category: 'agentic_workflow',
  strategic_move_phases: ['design'],
  maturity_level: 'proven',
  confidence_level: 'high',
  executive_question_answered: 'How should we route customer contacts with AI?',
  target_personas: ['CIO', 'COO', 'CX leader'],
  business_problem: 'Manual routing creates wait time and inconsistent resolution.',
  why_now: 'Interaction volume and service expectations are rising.',
  value_hypothesis: 'Intent-aware routing improves containment, CSAT, and handle time.',
  primary_kpis: ['containment_rate', 'aht', 'csat'],
  secondary_kpis: ['repeat_contact_rate'],
  baseline_needed: ['current_contact_volume', 'current_aht', 'current_csat'],
  measurement_method: 'Compare baseline and pilot cohorts by channel and intent.',
  value_levers: ['experience', 'productivity', 'cost_takeout'],
  time_to_value_band: '8-12 weeks',
  implementation_complexity: 'medium',
  required_data_domains: ['interaction_history', 'customer_profile', 'agent_skills'],
  data_quality_dependencies: ['intent labels', 'agent skill taxonomy'],
  source_system_dependencies: ['crm', 'contact_center_platform'],
  integration_dependencies: ['routing engine', 'knowledge base'],
  vector_graph_semantic_dependencies: ['customer intent embeddings'],
  agentic_architecture_pattern: 'Supervisor agent recommends next routing action.',
  human_agent_workflow_design: 'Agents handle escalations and exception paths.',
  autonomous_agent_action_boundaries: ['recommend route', 'summarize context'],
  escalation_points: ['VIP customer', 'regulated complaint'],
  responsible_ai_guardrails: ['bias monitoring', 'audit trail'],
  operating_model_changes: ['routing governance forum'],
  change_management_needs: ['agent enablement'],
  recommended_workshops: ['contact center journey workshop'],
  recommended_artifacts: ['routing decision matrix'],
  entry_criteria: ['baseline contact data available'],
  exit_criteria: ['pilot design approved'],
  gate_evidence_required: ['baseline KPI report'],
  common_failure_modes: ['optimizing containment while hurting CSAT'],
  anti_patterns: ['thin data labels'],
  intervention_options: ['narrow initial intents'],
  failure_mode_mitigations: ['paired CSAT and containment gates'],
  source_basis: 'internal_pattern',
  source_references: [],
  confidence_rationale: 'Reviewed internal pattern.',
  quantitative_claims: [],
  unsupported_claim_flags: [],
  content_hash: 'sha256:test',
  full_pattern: {},
  missing_required_fields: [],
  missing_provenance: false,
  duplicate_risk: null,
  source_snapshot_at: '2026-05-09T00:00:00.000Z',
  created_at: '2026-05-09T00:00:00.000Z',
  updated_at: '2026-05-09T00:00:00.000Z',
  created_by: null,
  updated_by: null,
};

describe('runtime canonical pattern index', () => {
  beforeEach(() => {
    clearCanonicalPatternIndexCache();
  });

  it('reads from the persisted canonical corpus table and returns scored hits', async () => {
    const { supabase, builders } = fakeSupabase({ data: [baseRow], error: null, count: 1 });

    const result = await searchCanonicalPatternIndex({
      industry: 'retail',
      enterprise_area: 'front_office',
      query: 'contact center routing',
      strategic_move_phase: 'design',
      limit: 3,
    }, { supabase, useCache: false });

    expect(supabase.from).toHaveBeenCalledWith('canonical_industry_ai_patterns');
    expect(result.status).toBe('ready');
    expect(result.source).toBe('persisted_canonical_corpus');
    expect(result.patterns).toHaveLength(1);
    expect(result.patterns[0]).toMatchObject({
      canonical_id: baseRow.canonical_id,
      source_basis: 'internal_pattern',
      confidence_level: 'high',
      missing_provenance: false,
    });
    expect(result.patterns[0].match_reasons).toEqual(expect.arrayContaining([
      'industry:retail',
      'enterprise_area:front_office',
      'phase:design',
    ]));
    expect(builders[0].calls).toEqual(expect.arrayContaining([
      { method: 'contains', args: ['industry', ['retail']] },
      { method: 'eq', args: ['enterprise_area', 'front_office'] },
      { method: 'contains', args: ['strategic_move_phases', ['design']] },
      { method: 'limit', args: [3] },
    ]));
  });

  it('uses in-memory cache only as a short-lived optimization', async () => {
    let now = 1000;
    const { supabase } = fakeSupabase({ data: [baseRow], error: null, count: 1 });

    const first = await searchCanonicalPatternIndex({ industry: 'retail' }, { supabase, now: () => now });
    const second = await searchCanonicalPatternIndex({ industry: 'retail' }, { supabase, now: () => now });
    now += 61_000;
    const third = await searchCanonicalPatternIndex({ industry: 'retail' }, { supabase, now: () => now });

    expect(first.cache.mode).toBe('miss');
    expect(second.cache.mode).toBe('hit');
    expect(third.cache.mode).toBe('miss');
    expect(supabase.from).toHaveBeenCalledTimes(2);
  });

  it('returns explicit empty status when the persisted corpus has no rows', async () => {
    const { supabase } = fakeSupabase({ data: [], error: null, count: 0 });

    const result = await searchCanonicalPatternIndex({}, { supabase, useCache: false });

    expect(result.status).toBe('empty');
    expect(result.patterns).toEqual([]);
    expect(result.warnings).toEqual([WARNING_CANONICAL_CORPUS_EMPTY]);
  });

  it('returns explicit no-match status when filters match no rows', async () => {
    const { supabase } = fakeSupabase({ data: [], error: null, count: 0 });

    const result = await searchCanonicalPatternIndex({
      industry: 'healthcare',
      query: 'prior auth agentic workflow',
    }, { supabase, useCache: false });

    expect(result.status).toBe('no_match');
    expect(result.patterns).toEqual([]);
    expect(result.warnings).toEqual([WARNING_CANONICAL_PATTERN_NO_MATCH]);
  });

  it('returns an error result when the persisted read fails', async () => {
    const { supabase } = fakeSupabase({
      data: null,
      error: { message: 'relation does not exist' },
    });

    const result = await searchCanonicalPatternIndex({ query: 'retail AI' }, { supabase, useCache: false });

    expect(result.status).toBe('error');
    expect(result.error).toBe('relation does not exist');
    expect(result.warnings).toEqual([WARNING_CANONICAL_CORPUS_READ_FAILED]);
  });
});
