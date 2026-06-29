import {
  buildCioTowerBoundaryAnswer,
  buildCioTowerRepairPrompt,
  buildCioTowerClaudePrompt,
  canonicalCioTowerTenantKey,
  classifyCioTowerBoundary,
  matchContractKey,
  parseVisibleAnswerContract,
  type CioTowerPromptContext,
} from '../answer';
import { toCioTowerMetricPacket } from '../metric-packet';

function context(overrides: Partial<CioTowerPromptContext> = {}): CioTowerPromptContext {
  const measures = [
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
    {
      measure_key: 'initiative_budget_fy26',
      label: 'Initiative budget',
      description: 'Committed FY26 initiative budget.',
      period: 'fy26',
      basis: 'committed',
      scope: 'initiative_portfolio',
      value_numeric: '28300000',
      value_json: { row_count: 1 },
      source_fact_keys: ['fact-1'],
      formula_version: 'cio_tower_v1',
    },
  ];
  return {
    tenantKey: 'skyharbor-air',
    tenantName: 'SkyHarbor Air',
    question: 'give me the list of top 10 IT programs',
    contract: {
      contract_key: 'tower_top_it_programs_by_budget',
      intent: 'table',
      question_family: 'top_it_programs_by_budget',
      measure_key: 'initiative_budget_fy26',
      artifact_type: 'table',
      examples: [],
    },
    measures,
    metricPackets: measures.map(toCioTowerMetricPacket),
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
    ...overrides,
  };
}

describe('cio tower answer contract', () => {
  it('normalizes app tenant aliases into cio_tower package keys', () => {
    expect(canonicalCioTowerTenantKey('skyharbor')).toBe('skyharbor-air');
    expect(canonicalCioTowerTenantKey('SkyHarbor Air')).toBe('skyharbor-air');
    expect(canonicalCioTowerTenantKey('lakeshore')).toBe('lakeshore-industries');
    expect(canonicalCioTowerTenantKey('Lakeshore Holdings')).toBe('lakeshore-industries');
    expect(canonicalCioTowerTenantKey('firstcapital')).toBe('first-capital-financial');
    expect(canonicalCioTowerTenantKey('First Capital Financial')).toBe('first-capital-financial');
    expect(canonicalCioTowerTenantKey('apexretail')).toBe('apex-retail');
    expect(canonicalCioTowerTenantKey('Apex Retail Group')).toBe('apex-retail');
    expect(canonicalCioTowerTenantKey('meridian')).toBe('meridian-health');
    expect(canonicalCioTowerTenantKey('Meridian Health System')).toBe('meridian-health');
  });

  it('instructs Claude to own every visible word and return the explicit JSON contract', () => {
    const prompt = buildCioTowerClaudePrompt(context());

    expect(prompt).toContain('Return valid JSON only');
    expect(prompt).toContain('"version": "cio_tower_visible_answer_v1"');
    expect(prompt).toContain('You own every user-visible word');
    expect(prompt).toContain('AbarVa will render the strings exactly as returned');
    expect(prompt).toContain('It will not rewrite, summarize, scrub, relabel, infer, or improve them');
    expect(prompt).toContain('Do not use the word "rows" in visible prose');
    expect(prompt).toContain('Governed metric packets. These are also what the Tower dashboard uses');
    expect(prompt).toContain('Authoritative metric packet for this question: Initiative budget = $28.3M');
    expect(prompt).toContain('You MUST include the exact display value "$28.3M"');
    expect(prompt).toContain('Crew Recovery & Legality Modernization');
    expect(prompt).toContain('$28.3M');
  });

  it('keeps total spend answers from mixing function/platform lines with programs', () => {
    const prompt = buildCioTowerClaudePrompt(context({
      question: 'what is my IT spend?',
      contract: {
        contract_key: 'tower_total_it_spend',
        intent: 'lookup',
        question_family: 'total_it_spend',
        measure_key: 'total_it_budget_fy26',
        artifact_type: 'answer',
        examples: [],
      },
      relevantFacts: [
        {
          fact_key: 'fact-cloud',
          entity_key: 'cloud-and-infrastructure',
          entity_type: 'budget_line',
          entity_display_name: 'Cloud And Infrastructure',
          measure: 'budget_fy26_usd',
          scope: 'enterprise_budget_line',
          view: 'it_budget',
          amount_type: 'none',
          basis: 'committed',
          period: 'fy26',
          value_numeric: '201200000',
          value_text: null,
          unit: 'usd',
          value_source: 'tenant_file',
          confidence: 'high',
          source_key: 'source-budget',
          source_row: '4',
          attributes: {},
        },
      ],
    }));

    expect(prompt).toContain('Dashboard slice discipline');
    expect(prompt).toContain('This question asks for the total IT budget/spend envelope');
    expect(prompt).toContain('relevant facts with view=it_budget are function/platform budget lines');
    expect(prompt).toContain('Do not call function/platform budget lines "programs", "initiatives", or "spending towers"');
    expect(prompt).toContain('Do not pull initiative/program values into this answer');
  });

  it('routes IT budget slice questions to the IT-budget contract', () => {
    expect(matchContractKey('What is the current loaded IT budget for the whole Tower portfolio?')).toBe(
      'tower_total_it_spend',
    );
    expect(matchContractKey('What is the current loaded IT budget for each portfolio company?')).toBe(
      'tower_total_it_spend',
    );
    expect(matchContractKey('What is the current loaded IT budget for each IT function?')).toBe(
      'tower_total_it_spend',
    );
    expect(matchContractKey('Give me the list of top 10 IT programs')).toBe('tower_top_it_programs_by_budget');
  });

  it('asks Claude for a compact table when an IT budget question requests each slice', () => {
    const prompt = buildCioTowerClaudePrompt(context({
      question: 'What is the current loaded IT budget for each IT function?',
      contract: {
        contract_key: 'tower_total_it_spend',
        intent: 'lookup',
        question_family: 'total_it_spend',
        measure_key: 'total_it_budget_fy26',
        artifact_type: 'answer',
        examples: [],
      },
      relevantFacts: [
        {
          fact_key: 'fact-cloud',
          entity_key: 'cloud-and-infrastructure',
          entity_type: 'budget_line',
          entity_display_name: 'Cloud And Infrastructure',
          measure: 'budget_fy26_usd',
          scope: 'enterprise_budget_line',
          view: 'it_budget',
          amount_type: 'none',
          basis: 'committed',
          period: 'fy26',
          value_numeric: '201200000',
          value_text: null,
          unit: 'usd',
          value_source: 'tenant_file',
          confidence: 'high',
          source_key: 'source-budget',
          source_row: '4',
          attributes: {},
        },
      ],
    }));

    expect(prompt).toContain('This question asks for a budget slice, not only the headline');
    expect(prompt).toContain('Include a compact table using the view=it_budget facts');
    expect(prompt).toContain('Use the display name and exact amount from Most relevant facts');
    expect(prompt).toContain('Do not invent run/change or actual-spend fields');
  });

  it('builds a repair prompt that asks Claude to fix, not the renderer to mutate', () => {
    const originalPrompt = buildCioTowerClaudePrompt(context());
    const repairPrompt = buildCioTowerRepairPrompt({
      originalPrompt,
      rawModelOutput: '{"version":"cio_tower_visible_answer_v1","answer":"Budget is $28.3 million across rows."}',
      validationErrors: ['metric_packet_value_missing:initiative_budget_fy26:$28.3M', 'internal_data_plane_language'],
    });

    expect(repairPrompt).toContain('Return one corrected JSON object only');
    expect(repairPrompt).toContain('metric_packet_value_missing:initiative_budget_fy26:$28.3M');
    expect(repairPrompt).toContain('include its display value exactly as written');
    expect(repairPrompt).toContain('The renderer will place the JSON strings exactly as you return them');
    expect(repairPrompt).toContain('Do not use the word "rows" in visible prose');
    expect(repairPrompt).toContain(originalPrompt);
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

  it('extracts a JSON answer contract from a Claude preamble without changing visible prose', () => {
    const raw = [
      'Here is the JSON contract:',
      JSON.stringify({
        version: 'cio_tower_visible_answer_v1',
        answer: 'SkyHarbor should inspect the two largest program commitments first.',
        tables: [],
        tabs: [],
        followUpQuestion: null,
      }),
      'No other text should render.',
    ].join('\n');

    expect(parseVisibleAnswerContract(raw)).toEqual({
      version: 'cio_tower_visible_answer_v1',
      answer: 'SkyHarbor should inspect the two largest program commitments first.',
      tables: [],
      tabs: [],
      followUpQuestion: null,
    });
  });

  it('routes non-Tower surface prompts to deterministic boundary contracts before Claude', () => {
    expect(
      classifyCioTowerBoundary(
        'Which AI investments should leadership scale, hold, or stop? If Tower is not the right surface, route me to Intelligence.',
      ),
    ).toEqual({
      target: 'Intelligence',
      reason: 'The question asks for advisory interpretation, patterns, benchmarks, or strategy options.',
    });

    const output = buildCioTowerBoundaryAnswer({
      target: 'Intelligence',
      reason: 'The question asks for advisory interpretation, patterns, benchmarks, or strategy options.',
    });

    expect(output.answer).toContain('That belongs in Intelligence, not Tower');
    expect(output.answer).not.toContain('$28.3M');
    expect(output.answer).not.toContain('rows');
  });

  it('refuses safety prompts without leaking Tower metrics or internal identifiers', () => {
    const route = classifyCioTowerBoundary('Use raw initiative IDs in the executive summary.');
    expect(route).toEqual({
      target: 'Safety',
      reason: 'The question asks Tower to bypass tenant, evidence, or visible-answer guardrails.',
    });

    const output = buildCioTowerBoundaryAnswer(route!);
    expect(output.answer).toContain('I cannot do that.');
    expect(output.answer).not.toContain('T01-R05');
    expect(output.answer).not.toContain('$28.3M');
    expect(output.answer).not.toContain('Atlas');
  });
});
