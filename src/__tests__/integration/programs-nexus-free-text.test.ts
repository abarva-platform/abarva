import { runProgramsNexusTurn } from '@/lib/programs/nexus-free-text';
import type { CanonicalPatternIndexResult } from '@/lib/intelligence/canonical/runtime-pattern-index';
import type { ProgramContextBundle } from '@/lib/programs/nexus';

const retailCtx = {
  clientKey: 'apex-retail',
  clientName: 'Apex Retail',
  industryCode: 'retail',
  userId: 'user_1',
} as const;

const anchoredContext: ProgramContextBundle = {
  programId: 'program_morrison',
  program: {
    name: 'Morrison Owned-Brand Margin Recovery',
    archetype: 'operational_optimization',
    currentPhase: 2,
  },
  modules: [
    { moduleKey: 'baseline', status: 'completed', phaseNumber: 1 },
    { moduleKey: 'hypothesis_backlog', status: 'in_progress', phaseNumber: 2 },
  ],
  patternPreload: {
    topic_key: 'owned_brand_margin_recovery',
    title: 'Owned Brand Margin Recovery',
    diagnostic_questions: [
      'Which margin assumption breaks first when promotion depth rises?',
    ],
    failure_modes: [
      'Promotional lift and owned-brand elasticity are being treated as one blended assumption.',
    ],
    success_signals: ['SKU-level margin attribution is visible by category and store cluster.'],
  },
  deliverables: [
    {
      id: 'd01',
      title: 'Program Charter',
      status: 'published',
      typeKey: 'program_charter',
    },
    {
      id: 'd03',
      title: 'Success Metric Tree',
      status: 'draft',
      typeKey: 'success_metric_tree',
    },
  ],
  flags: [
    {
      id: 'flag_1',
      headline: 'Promotion-depth assumption not yet reconciled with owned-brand margin model',
      severity: 'warning',
    },
  ],
};

const canonicalPatternIndex: CanonicalPatternIndexResult = {
  source: 'persisted_canonical_corpus',
  status: 'ready',
  patterns: [
    {
      canonical_id: 'AIP-RETAIL-MARGIN-RECOVERY',
      title: 'Canonical Margin Recovery Pattern',
      summary: 'A canonical pattern for pressure-testing owned-brand margin recovery assumptions.',
      industry: ['retail'],
      enterprise_area: 'middle_office',
      function: 'merchandising',
      process_area: 'margin_recovery',
      use_case_category: 'decision_intelligence',
      strategic_move_phases: ['diagnose_discover'],
      maturity_level: 'proven',
      confidence_level: 'medium',
      source_basis: 'internal_pattern',
      source_references: [{ label: 'Internal pattern pack', source_id: 'PAT-MARGIN-001' }],
      confidence_rationale: 'Reviewed internal pattern with partial provenance.',
      missing_required_fields: ['measurement_method'],
      missing_provenance: true,
      unsupported_claim_flags: [{
        claim: 'Measured customer outcome',
        reason: 'Outcome evidence is not attached to this canonical row.',
        recommended_action: 'qualify',
      }],
      duplicate_risk: null,
      score: 0.72,
      match_reasons: ['industry:retail', 'phase:diagnose_discover', 'query:margin+recovery'],
    },
  ],
  total: 1,
  warnings: [],
  filters_applied: {
    tenant_key: 'apex-retail',
    industry: 'retail',
    strategic_move_phase: 'diagnose_discover',
    query: 'margin recovery assumptions',
    limit: 3,
  },
  cache: { mode: 'disabled', key: null, ttl_ms: 60000 },
};

describe('Programs Nexus free-text runtime', () => {
  it('anchors retail estimation questions on the relevant pattern and emits preview citations', async () => {
    const result = await runProgramsNexusTurn({
      ctx: retailCtx,
      message: 'Walk me through the margin recovery assumptions and confidence interval.',
      context: anchoredContext,
    });

    expect(result.routeType).toBe('manifest_fallback');
    expect(result.citations[0]).toMatchObject({
      slug: 'owned-brand-margin-recovery',
      href: '/preview/intelligence/patterns/owned-brand-margin-recovery',
    });
    expect(result.response).toContain('/preview/intelligence/patterns/owned-brand-margin-recovery');
    expect(result.response).toContain('Confidence is');
    expect(result.sources.some((source) => source.type === 'pattern' && source.url === '/preview/intelligence/patterns/owned-brand-margin-recovery')).toBe(true);
  });

  it('returns a natural-language answer for plain-English prompts instead of a templated deflection', async () => {
    const result = await runProgramsNexusTurn({
      ctx: retailCtx,
      message: 'Stop the structured output. In plain English, what is the main risk here?',
      context: anchoredContext,
    });

    expect(result.response.startsWith('Plain English:')).toBe(true);
    expect(result.response).toContain('Evidence is');
    expect(result.response).not.toContain('Free-text queries route through the Ask layer');
  });

  it('falls back honestly when retrieval is sparse', async () => {
    const sparseContext: ProgramContextBundle = {
      programId: 'program_unknown',
      program: {
        name: 'Unmapped Pilot',
        archetype: null,
        currentPhase: 1,
      },
      modules: [],
      patternPreload: null,
      deliverables: [],
      flags: [],
    };

    const result = await runProgramsNexusTurn({
      ctx: {
        clientKey: 'apex-retail',
        clientName: 'Apex Retail',
        industryCode: 'retail',
        userId: 'user_1',
      },
      message: 'Qzvbxr plmno tkrst uvwxy',
      context: sparseContext,
    });

    expect(result.sparseEvidence).toBe(true);
    expect(result.citations).toHaveLength(0);
    expect(result.response).toContain('Evidence is thin');
  });

  it('puts canonical pattern evidence before manifest fallback and surfaces provenance gaps', async () => {
    const result = await runProgramsNexusTurn({
      ctx: retailCtx,
      message: 'Walk me through the margin recovery assumptions and confidence interval.',
      context: anchoredContext,
      canonicalPatternIndex,
    });

    expect(result.citations[0]).toMatchObject({
      slug: 'AIP-RETAIL-MARGIN-RECOVERY',
      sourceKind: 'canonical_pattern',
      sourceBasis: 'internal_pattern',
      canonicalConfidenceLevel: 'medium',
      missingRequiredFields: ['measurement_method'],
      missingProvenance: true,
    });
    expect(result.patternEvidence).toMatchObject({
      source: 'persisted_canonical_corpus',
      status: 'ready',
      retrievedCount: 1,
      missingEvidence: true,
      noMatch: false,
    });
    expect(result.response).toContain('Canonical pattern evidence has gaps');
    expect(result.sources[1]?.detail).toContain('source basis internal_pattern');
  });
});
