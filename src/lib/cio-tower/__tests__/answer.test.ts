import {
  buildCioTowerFallbackAnswer,
  buildCioTowerClaudePrompt,
  canonicalCioTowerTenantKey,
  matchContractKey,
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
    expect(prompt).toContain('Shape the answer as a point of view');
    expect(prompt).toContain('must directly continue from your answer');
    expect(prompt).toContain('Do not use generic menu choices');
    expect(prompt).toContain('Answer the current question literally');
    expect(prompt).toContain('do not repeat the generic budget-mix answer');
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

  it('routes portfolio-company budget and value-proof questions to the right Tower contracts', () => {
    expect(
      matchContractKey(
        'Show the holding-company IT budget by portfolio company and shared services.',
      ),
    ).toBe('tower_total_it_spend');
    expect(
      matchContractKey(
        'Which funded programs have the largest gap between promised and measured value?',
      ),
    ).toBe('tower_value_realization');
  });

  it('builds a user-safe deterministic fallback when Claude misses the Tower answer contract', () => {
    const fallback = buildCioTowerFallbackAnswer(
      context({
        tenantName: 'Healthcare Demo',
        question: 'Where is our technology budget actually going, and is run spend crowding out change?',
        contract: {
          contract_key: 'tower_total_it_spend',
          intent: 'budget_control',
          question_family: 'total_it_spend',
          measure_key: 'total_it_budget_fy26',
          artifact_type: 'summary_table',
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
            value_numeric: '1069500000',
            value_json: { row_count: 12 },
            source_fact_keys: ['fact-budget-1'],
            formula_version: 'cio_tower_v1',
          },
          {
            measure_key: 'run_budget_fy26',
            label: 'FY26 run budget',
            description: 'Run budget.',
            period: 'fy26',
            basis: 'committed',
            scope: 'enterprise_envelope',
            value_numeric: '713000000',
            value_json: { row_count: 12 },
            source_fact_keys: ['fact-run-1'],
            formula_version: 'cio_tower_v1',
          },
          {
            measure_key: 'change_budget_fy26',
            label: 'FY26 change budget',
            description: 'Change budget.',
            period: 'fy26',
            basis: 'committed',
            scope: 'enterprise_envelope',
            value_numeric: '356500000',
            value_json: { row_count: 12 },
            source_fact_keys: ['fact-change-1'],
            formula_version: 'cio_tower_v1',
          },
        ],
      }),
    );

    expect(fallback.version).toBe('cio_tower_visible_answer_v1');
    expect(fallback.answer).toContain(
      'My read: this is a run-cost pressure question, not a value-realization win yet.',
    );
    expect(fallback.answer).toContain(
      'In the Healthcare Demo synthetic Tower planning context, $1.1B of FY26 technology budget is in view',
    );
    expect(fallback.answer).toContain('$713.0M is run versus $356.5M change');
    expect(fallback.followUpQuestion).toBe(
      'Which services or vendors are driving the $713.0M run base before we protect the $356.5M change pool?',
    );
    expect(fallback.answer).not.toMatch(/valid Tower answer contract|No fallback answer|JSON|source key|record ID/i);
    expect(fallback.answer).not.toMatch(/\brealized\b|\bproven\b|\bdelivered\b/i);
    expect(fallback.tables?.[0]?.rows).toEqual([
      ['Total technology budget', '$1.1B'],
      ['Run budget', '$713.0M'],
      ['Change budget', '$356.5M'],
    ]);
  });

  it('does not repeat the budget-mix fallback when the generated follow-up asks for run drivers', () => {
    const fallback = buildCioTowerFallbackAnswer(
      context({
        tenantName: 'Healthcare Demo',
        question:
          'Which services or vendors are driving the $713.0M run base before we protect the $356.5M change pool?',
        contract: {
          contract_key: 'tower_run_change_split',
          intent: 'budget_control',
          question_family: 'run_change_split',
          measure_key: 'run_budget_fy26',
          artifact_type: 'summary_table',
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
            value_numeric: '1069500000',
            value_json: { row_count: 12 },
            source_fact_keys: ['fact-budget-1'],
            formula_version: 'cio_tower_v1',
          },
          {
            measure_key: 'run_budget_fy26',
            label: 'FY26 run budget',
            description: 'Run budget.',
            period: 'fy26',
            basis: 'committed',
            scope: 'enterprise_envelope',
            value_numeric: '713000000',
            value_json: { row_count: 12 },
            source_fact_keys: ['fact-run-1'],
            formula_version: 'cio_tower_v1',
          },
          {
            measure_key: 'change_budget_fy26',
            label: 'FY26 change budget',
            description: 'Change budget.',
            period: 'fy26',
            basis: 'committed',
            scope: 'enterprise_envelope',
            value_numeric: '356500000',
            value_json: { row_count: 12 },
            source_fact_keys: ['fact-change-1'],
            formula_version: 'cio_tower_v1',
          },
        ],
      }),
    );

    expect(fallback.answer).toContain('this is the right drill-down');
    expect(fallback.answer).toContain('does not yet prove the service-by-service or vendor-by-vendor drivers');
    expect(fallback.answer).toContain('run allocation, contract owner, renewal date, and application dependency fields');
    expect(fallback.answer).not.toContain(
      'this is a run-cost pressure question, not a value-realization win yet',
    );
    expect(fallback.followUpQuestion).toBe(
      'Which vendor, service, and contract-owner fields should be loaded first to rank run-cost exposure without guessing?',
    );
  });
});
