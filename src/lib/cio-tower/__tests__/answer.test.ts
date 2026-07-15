import {
  buildCioTowerClaudePrompt,
  canonicalCioTowerTenantKey,
  parseVisibleAnswerContract,
  type CioTowerPromptContext,
} from '../answer';

function context(overrides: Partial<CioTowerPromptContext> = {}): CioTowerPromptContext {
  return {
    tenantKey: 'skyharbor-air',
    tenantName: 'Airline Demo',
    question: 'give me the list of top 10 IT programs',
    contract: {
      contract_key: 'tower_top_it_programs_by_budget',
      intent: 'table',
      question_family: 'top_it_programs_by_budget',
      measure_key: 'initiative_budget_fy26',
      artifact_type: 'table',
      examples: [],
    },
    measures: [
      {
        measure_key: 'total_it_budget_fy26',
        label: 'FY26 IT budget',
        description: 'Committed FY26 IT budget envelope.',
        period: 'fy26',
        basis: 'committed',
        scope: 'enterprise_envelope',
        value_numeric: '2578000000',
        value_json: { row_count: 13 },
        source_fact_keys: ['fact-1'],
        formula_version: 'cio_tower_v1',
      },
    ],
    relevantFacts: [
      {
        fact_key: 'fact-1',
        entity_key: 'initiative-1',
        entity_type: 'initiative',
        entity_display_name: 'Crew Recovery & Legality Modernization',
        measure: 'budget_fy26_usd',
        scope: 'initiative',
        view: 'initiative_budget',
        amount_type: 'none',
        basis: 'committed',
        period: 'fy26',
        value_numeric: '28300000',
        value_text: null,
        unit: 'usd',
        value_source: 'tenant_file',
        confidence: 'high',
        source_key: 'source-1',
        source_row: '12',
        attributes: {},
      },
    ],
    relationships: [],
    gaps: ['Actual spend YTD is missing or not separately loaded.'],
    valueClaimPolicy: {
      projectionRole: 'derived_read_model',
      projectionPath: 'path_a_derived_projection',
      sourceOfTruthStatus: 'bridge_only',
      v3ReconciliationStatus: 'not_v3_reconciled',
      realizedValueLanguageAllowed: false,
      caveat: 'Realized value requires finance-attested measured evidence.',
      claim: {
        claimId: 'test-claim',
        claimKind: 'realized_value',
        label: 'Measured value YTD',
        value: null,
        valueType: 'currency',
        sourceFactIds: [],
        evidenceIds: [],
        gateStatus: 'blocked',
        realizedValueLanguageAllowed: false,
        reason: 'Realized value requires finance-attested measured evidence.',
        requiredEvidence: ['v3 canonical fact reconciliation'],
      },
    },
    ...overrides,
  };
}

describe('cio tower answer contract', () => {
  it('normalizes app tenant aliases into cio_tower package keys', () => {
    expect(canonicalCioTowerTenantKey('skyharbor')).toBe('skyharbor-air');
    expect(canonicalCioTowerTenantKey('lakeshore')).toBe('lakeshore-industries');
    expect(canonicalCioTowerTenantKey('firstcapital')).toBe('first-capital-financial');
    expect(canonicalCioTowerTenantKey('apexretail')).toBe('apex-retail');
    expect(canonicalCioTowerTenantKey('meridian')).toBe('meridian-health');
  });

  it('instructs Claude to own every visible word and return the explicit JSON contract', () => {
    const prompt = buildCioTowerClaudePrompt(context());

    expect(prompt).toContain('Return valid JSON only');
    expect(prompt).toContain('"version": "cio_tower_visible_answer_v1"');
    expect(prompt).toContain('You own every user-visible word');
    expect(prompt).toContain('AbarVa will render the strings exactly as returned');
    expect(prompt).toContain('It will not rewrite, summarize, scrub, relabel, infer, or improve them');
    expect(prompt).toContain('Realized-value language allowed: no');
    expect(prompt).toContain('Projection role: derived_read_model');
    expect(prompt).toContain('Crew Recovery & Legality Modernization');
    expect(prompt).toContain('$28.3M');
  });

  it('parses the visible answer contract without changing prose or table labels', () => {
    const raw = JSON.stringify({
      version: 'cio_tower_visible_answer_v1',
      answer: 'SkyHarbor has three material IT programs to inspect first.',
      tables: [
        {
          id: 'top_programs',
          title: 'Top IT programs',
          columns: ['Program', 'Budget'],
          rows: [['Crew Recovery & Legality Modernization', '$28.3M']],
        },
      ],
      tabs: [
        {
          id: 'risk',
          label: 'Risk read',
          prose: 'The largest risk is spending past value proof.',
          tables: [],
        },
      ],
      followUpQuestion: 'Do you want the value-proof view next?',
    });

    expect(parseVisibleAnswerContract(raw)).toEqual({
      version: 'cio_tower_visible_answer_v1',
      answer: 'SkyHarbor has three material IT programs to inspect first.',
      tables: [
        {
          id: 'top_programs',
          title: 'Top IT programs',
          columns: ['Program', 'Budget'],
          rows: [['Crew Recovery & Legality Modernization', '$28.3M']],
        },
      ],
      tabs: [
        {
          id: 'risk',
          label: 'Risk read',
          prose: 'The largest risk is spending past value proof.',
          tables: [],
        },
      ],
      followUpQuestion: 'Do you want the value-proof view next?',
    });
  });
});
