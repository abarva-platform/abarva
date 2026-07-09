import {
  buildProgramsNexusCanonicalPatternQuery,
  runProgramsNexusTurn,
} from '@/lib/programs/nexus-free-text';
import { checkTenantEvidenceClaims } from '@/lib/agent/product-truth/tenant-evidence-claim-guard';
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
  evidence: [],
};

const lakeshoreLegalContext: ProgramContextBundle = {
  programId: 'program_lakeshore_legal',
  program: {
    name: 'Legal and Vendor Contract Obligation Control',
    archetype: 'risk_control',
    currentPhase: 2,
  },
  modules: [
    { moduleKey: 'operational_baseline', status: 'completed', phaseNumber: 2 },
    { moduleKey: 'delivery_scenarios', status: 'in_progress', phaseNumber: 3 },
    { moduleKey: 'business_case', status: 'not_started', phaseNumber: 4 },
  ],
  patternPreload: null,
  deliverables: [],
  flags: [],
  evidence: [
    {
      id: 'e_context',
      title: '01_lakeshore_context_spine.csv',
      evidenceType: 'program_upload',
      summary: 'Synthetic Lakeshore legal contract intake context spine for planning.',
      parseMethod: 'csv',
      structuredSignals: [
        'Legal intake and contract obligation owner ambiguity are the control spine.',
      ],
      extractedText:
        'Lakeshore legal contract intake context spine; synthetic planning-grade demo data; contract obligation ownership and policy exception handling.',
      createdAt: '2026-07-08T00:00:00.000Z',
    },
    {
      id: 'e_baseline',
      title: '02_legal_contract_intake_operational_baseline.csv',
      evidenceType: 'program_upload',
      summary:
        'Baseline includes intake volume, aged queue, status inquiries, missing fields, and rework.',
      parseMethod: 'csv',
      structuredSignals: [
        '2,400 annual requests',
        '780 aged queue items',
        '860 status inquiry loops',
      ],
      extractedText:
        '2,400 annual legal intake requests; 780 aged queue items; 860 status inquiries; missing field rework; policy exceptions.',
      createdAt: '2026-07-08T00:01:00.000Z',
    },
    {
      id: 'e_scenarios',
      title: '04_delivery_scenarios.csv',
      evidenceType: 'program_upload',
      summary:
        'Option B is CLM-embedded assisted triage and obligation extraction.',
      parseMethod: 'csv',
      structuredSignals: [
        'Option B: CLM-embedded assisted triage and obligation extraction',
        'Keep human legal approval and privilege fence',
      ],
      extractedText:
        'Option B CLM-embedded assisted triage and obligation extraction; avoid broad enterprise orchestration in phase one; attorney approval; privilege fence; approval matrix; audit trail.',
      createdAt: '2026-07-08T00:02:00.000Z',
    },
    {
      id: 'e_rate',
      title: '03_estimation_rate_card.csv',
      evidenceType: 'program_upload',
      summary:
        'Rate-card planning ranges include assisted triage, Big Four benchmark, and offshore-heavy alternative.',
      parseMethod: 'csv',
      structuredSignals: [
        '$950K-$1.45M assisted triage base case',
        '$2.4M-$3.6M cross-system orchestration scenario',
        '$620K-$980K offshore-heavy alternative',
      ],
      extractedText:
        '$950K-$1.45M CLM-assisted triage delivery scenario; $2.4M-$3.6M cross-system orchestration scenario; $620K-$980K offshore-heavy alternative with delivery risk; planning-grade, not final SOW.',
      createdAt: '2026-07-08T00:03:00.000Z',
    },
    {
      id: 'e_value',
      title: '05_value_model_assumptions.csv',
      evidenceType: 'program_upload',
      summary:
        'Value model is directional: rework, status-inquiry loops, cycle-time relief, and obligation clarity.',
      parseMethod: 'csv',
      structuredSignals: [
        'Do not claim hard savings',
        'Finance review required before board-grade dollar claims',
      ],
      extractedText:
        'Value assumptions are planning-grade; do not claim hard savings; cite rework reduction, fewer status inquiries, cycle-time relief, obligation-owner clarity, and finance caveat.',
      createdAt: '2026-07-08T00:04:00.000Z',
    },
  ],
};

const contractOpsContext: ProgramContextBundle = {
  programId: 'program_contract_ops',
  program: {
    name: 'Contract Operations Workflow Modernization',
    archetype: 'risk_control',
    currentPhase: 2,
  },
  modules: [
    { moduleKey: 'operational_baseline', status: 'completed', phaseNumber: 2 },
    { moduleKey: 'delivery_scenarios', status: 'in_progress', phaseNumber: 3 },
    { moduleKey: 'business_case', status: 'not_started', phaseNumber: 4 },
  ],
  patternPreload: null,
  deliverables: [],
  flags: [],
  evidence: [
    {
      id: 'ops_baseline',
      title: 'contract_ops_baseline.csv',
      evidenceType: 'program_upload',
      summary:
        'Baseline shows 18,400 workflow requests, 3,120 exception loops, and 42% missing-routing-data rate.',
      parseMethod: 'csv',
      structuredSignals: [
        '18,400 workflow requests',
        '3,120 exception loops',
        '42% missing-routing-data rate',
      ],
      extractedText:
        'The contract operations baseline records 18,400 workflow requests, 3,120 exception loops, and 42% missing-routing-data rate.',
      createdAt: '2026-07-08T01:00:00.000Z',
    },
    {
      id: 'ops_scenarios',
      title: 'contract_ops_delivery_scenarios.csv',
      evidenceType: 'program_upload',
      summary:
        'Scenario B workflow-control layer is estimated at $7.2M-$8.4M; scenario C managed-services path is $4.1M-$5.3M.',
      parseMethod: 'csv',
      structuredSignals: [
        'Scenario B workflow-control layer: $7.2M-$8.4M',
        'Scenario C managed-services path: $4.1M-$5.3M',
      ],
      extractedText:
        'Scenario B workflow-control layer costs $7.2M-$8.4M. Scenario C managed-services path costs $4.1M-$5.3M. Finance caveat: planning estimate only.',
      createdAt: '2026-07-08T01:01:00.000Z',
    },
    {
      id: 'ops_value',
      title: 'contract_ops_value_model.csv',
      evidenceType: 'program_upload',
      summary:
        'Value model uses 11-14% cycle-time relief and $9.6M-$12.2M first-year value range.',
      parseMethod: 'csv',
      structuredSignals: [
        '11-14% cycle-time relief',
        '$9.6M-$12.2M first-year value range',
      ],
      extractedText:
        'Value model: 11-14% cycle-time relief and $9.6M-$12.2M first-year value range, pending finance validation.',
      createdAt: '2026-07-08T01:02:00.000Z',
    },
  ],
};

function evidenceGroundingText(context: ProgramContextBundle): string {
  return context.evidence
    .map((item) =>
      [
        item.title,
        item.evidenceType,
        item.summary ?? '',
        item.structuredSignals.join(' '),
        item.extractedText ?? '',
      ].join(' '),
    )
    .join('\n');
}

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
      value_hypothesis: 'Margin recovery improves owned-brand profitability when discount depth and inventory signals are measured together.',
      primary_kpis: ['gross_margin_rate', 'markdown_rate', 'owned_brand_mix'],
      secondary_kpis: ['inventory_turns', 'promo_roi'],
      baseline_needed: ['current_margin_rate', 'current_markdown_rate', 'current_owned_brand_mix'],
      measurement_method: 'Compare baseline margin, markdown, and owned-brand mix against pilot cohort performance.',
      value_levers: ['revenue_growth', 'working_capital', 'productivity'],
      quantitative_claims: [],
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
      evidence: [],
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

  it('returns uploaded Move evidence as a client-fact source without hardcoded legal-rate claims', async () => {
    const result = await runProgramsNexusTurn({
      ctx: {
        clientKey: 'lakeshore-holdings',
        clientName: 'Lakeshore Holdings',
        industryCode: 'retail',
        userId: 'user_1',
      },
      message:
        'What is the recommended phase-by-phase plan for this legal contract intake Move?',
      context: lakeshoreLegalContext,
    });

    expect(result.routeType).toBe('manifest_fallback');
    expect(result.response).toContain('Evidence is present');
    expect(result.response).toContain('03_estimation_rate_card.csv');
    expect(result.response).toContain('$2.4M-$3.6M');
    expect(result.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: 'client_fact',
          name: 'Program evidence ledger',
          detail: expect.stringContaining('03_estimation_rate_card.csv'),
        }),
      ]),
    );
    expect(result.response).not.toMatch(/\$1\.8M|\$2\.8M/i);
    expect(result.response).not.toContain('Do not sell this as hard savings');
    expect(
      checkTenantEvidenceClaims(
        result.response,
        evidenceGroundingText(lakeshoreLegalContext),
      ),
    ).toEqual([]);
  });

  it('answers the same Moves-style prompts from a different Move evidence bundle without Lakeshore leakage', async () => {
    const rateResult = await runProgramsNexusTurn({
      ctx: {
        clientKey: 'contract-ops-demo',
        clientName: 'Contract Ops Demo',
        industryCode: 'retail',
        userId: 'user_1',
      },
      message:
        'Use the rate card and value model to explain the cost range and business case.',
      context: contractOpsContext,
    });
    const planResult = await runProgramsNexusTurn({
      ctx: {
        clientKey: 'contract-ops-demo',
        clientName: 'Contract Ops Demo',
        industryCode: 'retail',
        userId: 'user_1',
      },
      message:
        'What is the recommended phase-by-phase plan for this contract operations Move?',
      context: contractOpsContext,
    });

    expect(rateResult.response).toContain('$7.2M-$8.4M');
    expect(rateResult.response).toContain('$9.6M-$12.2M');
    expect(rateResult.response).not.toMatch(/\$950K|\$1\.45M|\$2\.4M|\$3\.6M|\$620K|\$980K/i);
    expect(planResult.response).toContain('18,400 workflow requests');
    expect(planResult.response).toContain('42% missing-routing-data rate');
    expect(
      checkTenantEvidenceClaims(
        `${rateResult.response}\n${planResult.response}`,
        evidenceGroundingText(contractOpsContext),
      ),
    ).toEqual([]);
  });

  it('threads uploaded evidence into canonical pattern queries without substituting stale prompt numbers', () => {
    const query = buildProgramsNexusCanonicalPatternQuery({
      ctx: {
        clientKey: 'lakeshore-holdings',
        clientName: 'Lakeshore Holdings',
        industryCode: 'retail',
        userId: 'user_1',
      },
      context: lakeshoreLegalContext,
      message:
        'Use the rate card and value model to explain the cost range and business case.',
    });

    expect(query.query).toContain('$2.4M $3.6M');
    expect(query.query).not.toContain('$1.8M');
    expect(query.query).not.toContain('$2.8M');
  });
});
