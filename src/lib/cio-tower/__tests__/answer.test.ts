import {
  buildCioTowerFallbackAnswer,
  buildCioTowerClaudePrompt,
  canonicalCioTowerTenantKey,
  matchContractKey,
  parseVisibleAnswerContract,
  validateVisibleAnswer,
  type CioTowerPromptContext,
} from '../answer';
import type { TowerV3RuntimeViewModel } from '@/lib/tower/tower-v3-runtime-view';

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

function towerV3RuntimeView(): TowerV3RuntimeViewModel {
  return {
    enabled: true,
    tenantKey: 'meridian-health',
    tenantName: 'Healthcare Demo',
    contextPackId: 'meridian-health-tower-v3-live-context-pack',
    headline:
      'Tower is using the governed context pack for measurement planning, readiness, and value-hypothesis control.',
    mode: 'active',
    truthStatus: 'active',
    cxoStory: {
      tenantDisplayName: 'Meridian',
      eyebrow: 'Tower · CIO/CFO value cockpit',
      headline:
        "Meridian's technology value cockpit: budget, portfolio, evidence, and decisions.",
      executiveBrief:
        'Meridian Tower is ready for a leadership value conversation, but not certified financial outcome claims.',
      cards: [
        {
          label: 'Budget lens',
          value: 'In view',
          caption: 'Spend signals are available for management review.',
        },
        {
          label: 'Planned value',
          value: '$134.0M',
          caption: 'Planning hypotheses require proof before board use.',
        },
        {
          label: 'Proof posture',
          value: '79 gated',
          caption: 'Claims need baseline, owner, and finance evidence.',
        },
        {
          label: 'Leadership blockers',
          value: '1 theme',
          caption: 'Evidence gaps are grouped for executive action.',
        },
      ],
      tabs: {
        overview: {
          key: 'overview',
          headline: 'What leadership should inspect this week.',
          summary: 'Align on budget posture, planned value, and proof blockers.',
          decisionImplication: 'Use Tower as a value-governance cockpit.',
          nextAction: 'Confirm the baseline evidence required for the next steering meeting.',
          visualType: 'executive_brief',
        },
        value: {
          key: 'value',
          headline: 'Where planned value exists but proof is still missing.',
          summary: 'Rank planning hypotheses and proof gaps.',
          decisionImplication: 'Discuss value at stake without approving claims.',
          nextAction: 'Prioritize baseline validation.',
          visualType: 'value_waterfall',
        },
        budget: {
          key: 'budget',
          headline: 'Where budget pressure needs finance validation.',
          summary: 'Separate spend signals from numbers that need attestation.',
          decisionImplication: 'Decide where ownership needs to sharpen.',
          nextAction: 'Load the finance budget extract.',
          visualType: 'budget_mix',
        },
        portfolio: {
          key: 'portfolio',
          headline: 'Which programs need governance before funding confidence improves.',
          summary: 'Tie initiatives to value basis and proof posture.',
          decisionImplication: 'Sequence programs by evidence readiness.',
          nextAction: 'Assign owners to the top programs.',
          visualType: 'portfolio_lanes',
        },
        benchmark: {
          key: 'benchmark',
          headline: 'Which external patterns are useful.',
          summary: 'Use comparators without claiming measured performance.',
          decisionImplication: 'Choose the right validation questions.',
          nextAction: 'Validate the tenant baseline.',
          visualType: 'benchmark_blockers',
        },
        evidence: {
          key: 'evidence',
          headline: 'What proof is missing before the view becomes board-ready.',
          summary: 'Keep lineage and diagnostics out of the executive first read.',
          decisionImplication: 'Use evidence gaps as the control list.',
          nextAction: 'Assign source owners and finance attestation.',
          visualType: 'evidence_checklist',
        },
        insights: {
          key: 'insights',
          headline: 'What the CIO and CFO should do next.',
          summary: 'Convert posture into executive decisions.',
          decisionImplication: 'CIO owns readiness; CFO owns measurement confidence.',
          nextAction: 'Create a joint measurement sprint.',
          visualType: 'role_decision_cards',
        },
      },
    },
    cxoStorySource: 'deterministic',
    cxoStoryValidation: { attempted: false, passed: true, issues: [] },
    cxoVisualSpecs: {
      overview: {
        key: 'overview',
        visualType: 'executive_brief',
        title: 'What leadership should inspect this week.',
        insight: 'Align on budget posture, planned value, and proof blockers.',
        dataRefs: [],
        caveat: 'Use Tower as a value-governance cockpit.',
      },
      value: {
        key: 'value',
        visualType: 'value_waterfall',
        title: 'Where planned value exists but proof is still missing.',
        insight: 'Rank planning hypotheses and proof gaps.',
        dataRefs: [],
        caveat: 'Discuss value at stake without approving claims.',
      },
      budget: {
        key: 'budget',
        visualType: 'budget_mix',
        title: 'Where budget pressure needs finance validation.',
        insight: 'Separate spend signals from numbers that need attestation.',
        dataRefs: [],
        caveat: 'Decide where ownership needs to sharpen.',
      },
      portfolio: {
        key: 'portfolio',
        visualType: 'portfolio_lanes',
        title: 'Which programs need governance before funding confidence improves.',
        insight: 'Tie initiatives to value basis and proof posture.',
        dataRefs: [],
        caveat: 'Sequence programs by evidence readiness.',
      },
      benchmark: {
        key: 'benchmark',
        visualType: 'benchmark_blockers',
        title: 'Which external patterns are useful.',
        insight: 'Use comparators without claiming measured performance.',
        dataRefs: [],
        caveat: 'Choose the right validation questions.',
      },
      evidence: {
        key: 'evidence',
        visualType: 'evidence_checklist',
        title: 'What proof is missing before the view becomes board-ready.',
        insight: 'Keep lineage and diagnostics out of the executive first read.',
        dataRefs: [],
        caveat: 'Use evidence gaps as the control list.',
      },
      insights: {
        key: 'insights',
        visualType: 'role_decision_cards',
        title: 'What the CIO and CFO should do next.',
        insight: 'Convert posture into executive decisions.',
        dataRefs: [],
        caveat: 'CIO owns readiness; CFO owns measurement confidence.',
      },
    },
    metricCount: 140,
    valueRecordCount: 79,
    valueClaimCount: 79,
    gateCounts: { allowed: 0, caveated: 79, blocked: 0 },
    measurementLanguageAllowed: true,
    blockedOutcomeProof: true,
    metricFamilies: [],
    valueHypotheses: [
      {
        label: 'Agent Assist non-clinical adoption',
        value: '$93.0M',
        claimBasis: 'forecast',
        gateStatus: 'caveated',
        evidenceIds: ['evidence-agent-assist'],
      },
      {
        label: 'Contact-center workflow automation',
        value: '$41.0M',
        claimBasis: 'forecast',
        gateStatus: 'caveated',
        evidenceIds: ['evidence-contact-center'],
      },
    ],
    defaultTabs: [],
    executiveInsights: [
      {
        role: 'CIO',
        insightTitle: 'The data foundation is the critical path.',
        insightSummary:
          'The technology team can steer the measurement plan, but scale decisions need certified data, integration, and control readiness.',
        whyItMatters:
          'Without the foundation, AI programs create operational risk faster than they create board-ready value evidence.',
        evidenceBasis: 'TowerContextPack evidence',
        decisionImplication:
          'Do not expand the portfolio until the measurement spine and source ownership are explicit.',
        nextAction:
          'Name the accountable owner for baseline metrics and source-system lineage.',
        moduleHandoff: 'Tower',
        claimStrength: 'hypothesis',
        evidenceRefsUsed: ['evidence-cio'],
        contextGapsUsed: ['gap-baseline'],
        valueClaimGateStatus: 'caveated',
      },
      {
        role: 'CFO',
        insightTitle: 'Value is visible, but not claimable yet.',
        insightSummary:
          'The finance team can see where forecast value sits, but the evidence does not yet support board claims.',
        whyItMatters:
          'The CFO should protect claim quality before the dashboard is used in a funding committee.',
        evidenceBasis: 'TowerContextPack value-claim gates',
        decisionImplication:
          'Hold value language to forecast and measurement readiness until baselines and actuals are attached.',
        nextAction:
          'Approve the value formula and finance-attested baseline package before the next review.',
        moduleHandoff: 'Tower',
        claimStrength: 'evidence_gap',
        evidenceRefsUsed: ['evidence-cfo'],
        contextGapsUsed: ['gap-finance'],
        valueClaimGateStatus: 'caveated',
      },
    ],
    gapThemes: [
      {
        themeId: 'baseline_metrics',
        title: 'Baseline metrics need validation',
        whyItMatters:
          'The dashboard can sequence measurement work, but board use needs validated baselines and formula lineage.',
        affectedRecordCount: 117,
        representativeEvidenceRefs: ['evidence-baseline'],
        requiredEvidence: [
          'baseline extract',
          'measurement period',
          'formula owner attestation',
        ],
        ownerOrSteward: 'CFO / Value Office',
        moduleHandoff: 'Tower',
      },
    ],
    caveats: [],
    nextMeasurementActions: [],
    bridgeDiagnostics: {
      source: 'cio_tower',
      projectionRole: 'derived_read_model',
      sourceOfTruthStatus: 'bridge_only',
      v3ReconciliationStatus: 'not_v3_reconciled',
      message: 'Bridge diagnostics only.',
    },
  };
}

describe('cio tower answer contract', () => {
  it('normalizes app tenant aliases into cio_tower package keys', () => {
    expect(canonicalCioTowerTenantKey('skyharbor')).toBe('skyharbor-air');
    expect(canonicalCioTowerTenantKey('lakeshore')).toBe('lakeshore-holdings');
    expect(canonicalCioTowerTenantKey('Lakeshore Holdings')).toBe('lakeshore-holdings');
    expect(canonicalCioTowerTenantKey('lakeshore-industries')).toBe('lakeshore-holdings');
    expect(canonicalCioTowerTenantKey('morgan-street')).toBe('morgan-street');
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
    expect(prompt).toContain('Valid JSON is more important than a longer answer');
    expect(prompt).toContain('Do not duplicate table content inside answer. Use tables[] only.');
    expect(prompt).toContain('Never use markdown code fences');
    expect(prompt).toContain('"ROI"');
    expect(prompt).toContain('"measured outcome"');
    expect(prompt).toContain('finance-attestation gate');
    expect(prompt).toContain('A table with 6 or more rows is invalid');
    expect(prompt).toContain('must directly continue from your answer');
    expect(prompt).toContain('Do not use generic menu choices');
    expect(prompt).toContain('Answer the current question literally');
    expect(prompt).toContain('do not repeat the generic budget-mix answer');
    expect(prompt).toContain('Realized-value language allowed: no');
    expect(prompt).toContain('Projection role: derived_read_model');
    expect(prompt).toContain('Crew Recovery & Legality Modernization');
    expect(prompt).toContain('$28.3M');
    expect(prompt).not.toContain('GFM markdown table');
    expect(prompt).not.toContain('```chart');
    expect(prompt).not.toContain('CHART');
  });

  it('does not expose raw measured-value labels to Claude when outcome proof is blocked', () => {
    const prompt = buildCioTowerClaudePrompt(
      context({
        measures: [
          {
            measure_key: 'measured_value_ytd',
            label: 'Measured value YTD',
            description: 'Legacy bridge field.',
            period: 'fy26',
            basis: 'measured',
            scope: 'enterprise_envelope',
            value_numeric: '185700000',
            value_json: {},
            source_fact_keys: ['fact-value-1'],
            formula_version: 'cio_tower_v1',
          },
        ],
        relevantFacts: [
          {
            fact_key: 'fact-value-1',
            entity_key: 'initiative-1',
            entity_type: 'initiative',
            entity_display_name: 'Agent Assist non-clinical adoption',
            measure: 'measured_value_ytd',
            scope: 'initiative',
            view: 'value',
            amount_type: 'none',
            basis: 'measured',
            period: 'fy26',
            value_numeric: '93000000',
            value_text: null,
            unit: 'usd',
            value_source: 'tenant_file',
            confidence: 'high',
            source_key: 'source-1',
            source_row: '14',
            attributes: {},
          },
        ],
      }),
    );

    expect(prompt).toContain('Value figure awaiting finance attestation');
    expect(prompt).toContain('finance-attestation pending');
    expect(prompt).not.toContain('Measured value YTD');
    expect(prompt).not.toContain('measured_value_ytd');
    expect(prompt).not.toContain('formula cio_tower_v1');
    expect(prompt).not.toContain('source source-1 row 14');
  });

  it('blocks unsafe outcome-proof language while allowing natural prose punctuation', () => {
    expect(
      validateVisibleAnswer(
        'The CIO cannot defend AI ROI until the finance-attestation gate clears.',
      ),
    ).toContain('unsupported_outcome_proof_language');
    expect(
      validateVisibleAnswer(
        'None of the claims can move to realized value until baselines are signed.',
      ),
    ).toContain('unsupported_outcome_proof_language');
    expect(
      validateVisibleAnswer(
        'The dashboard shows $185.7M in measured-value-YTD figures.',
      ),
    ).toContain('unsupported_outcome_proof_language');
    expect(
      validateVisibleAnswer(
        'Fifth, managed-service and contract evidence: service scope, SLA schedules, and vendor baselines are incomplete.',
      ),
    ).not.toContain('visible_scaffold_label');
    expect(validateVisibleAnswer('Evidence: show the row-level proof.')).toContain(
      'visible_scaffold_label',
    );
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

  it('tolerates harmless wrapper text around a valid Tower answer packet', () => {
    const raw = [
      'Here is the packet:',
      JSON.stringify({
        version: 'cio_tower_visible_answer_v1',
        answer: 'The CIO should close the measurement gate before expanding Agent Assist.',
        tables: [],
        tabs: [],
        followUpQuestion: null,
      }),
    ].join('\n');

    expect(parseVisibleAnswerContract(raw).answer).toBe(
      'The CIO should close the measurement gate before expanding Agent Assist.',
    );
  });

  it('rejects malformed raw output and incomplete Tower tables instead of rendering partial content', () => {
    expect(() =>
      parseVisibleAnswerContract(
        '{"version":"cio_tower_visible_answer_v1","answer":"Truncated","tables":[{"id":"x","title":"Bad","columns":["A"],"rows":[["open"',
      ),
    ).toThrow();

    expect(() =>
      parseVisibleAnswerContract(
        JSON.stringify({
          version: 'cio_tower_visible_answer_v1',
          answer: 'The table is incomplete.',
          tables: [
            {
              id: 'bad_table',
              title: 'Incomplete table',
              columns: ['Owner', 'Decision'],
              rows: [['CIO']],
            },
          ],
          tabs: [],
          followUpQuestion: null,
        }),
      ),
    ).toThrow('cio_tower_visible_contract_invalid_table_shape');
  });

  it('rejects oversized tables so Tower answers stay board-readable', () => {
    expect(() =>
      parseVisibleAnswerContract(
        JSON.stringify({
          version: 'cio_tower_visible_answer_v1',
          answer: 'Use the complete table for the executive read.',
          tables: [
            {
              id: 'oversized_table',
              title: 'Oversized ranked view',
              columns: ['Initiative', 'Gate'],
              rows: Array.from({ length: 6 }, (_, index) => [
                `Initiative ${index + 1}`,
                'Caveated',
              ]),
            },
          ],
          tabs: [],
          followUpQuestion: null,
        }),
      ),
    ).toThrow('cio_tower_visible_contract_invalid_table_shape');
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
      'This is a run-cost pressure question, not a value-realization win yet.',
    );
    expect(fallback.answer).not.toContain('My read:');
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

    expect(fallback.answer).toContain('This is the right drill-down');
    expect(fallback.answer).not.toContain('My read:');
    expect(fallback.answer).toContain('does not yet prove the service-by-service or vendor-by-vendor drivers');
    expect(fallback.answer).toContain('run allocation, contract owner, renewal date, and application dependency fields');
    expect(fallback.answer).not.toContain(
      'this is a run-cost pressure question, not a value-realization win yet',
    );
    expect(fallback.followUpQuestion).toBe(
      'Which vendor, service, and contract-owner fields should be loaded first to rank run-cost exposure without guessing?',
    );
  });

  it('makes the Tower v3 fallback board-ready when Claude raw output fails', () => {
    const fallback = buildCioTowerFallbackAnswer(
      context({
        tenantName: 'Healthcare Demo',
        question: 'What evidence is missing before Tower can claim value?',
        contract: {
          contract_key: 'tower_value_realization',
          intent: 'evidence_gap',
          question_family: 'value_readiness',
          measure_key: null,
          artifact_type: 'executive_summary',
          examples: [],
        },
        towerV3RuntimeView: towerV3RuntimeView(),
      }),
    );
    const visible = [
      fallback.answer,
      ...(fallback.tables ?? []).flatMap((table) => [
        table.title,
        ...table.columns,
        ...table.rows.flat(),
      ]),
      ...(fallback.tabs ?? []).flatMap((tab) => [tab.label, tab.prose]),
      fallback.followUpQuestion ?? '',
    ].join(' ');

    expect(fallback.answer).toContain('claim discipline');
    expect(fallback.answer).not.toContain('My read:');
    expect(fallback.answer).toContain('140 metric records');
    expect(fallback.answer).toContain('79 value records');
    expect(fallback.answer).toContain('79 value-claim gates: 0 allowed, 79 caveated, 0 blocked');
    expect(fallback.answer).toContain('CIO');
    expect(fallback.answer).toContain('CFO');
    expect(fallback.tables?.[0]?.title).toBe('Board-readiness inspection path');
    expect(fallback.tables?.[0]?.columns).toEqual([
      'Owner',
      'Inspect first',
      'Why it matters',
      'Decision to unlock',
    ]);
    expect(fallback.tabs?.map((tab) => tab.label)).toEqual([
      'CIO view',
      'CFO view',
      'Proof close path',
    ]);
    expect(fallback.followUpQuestion).toBe(
      'Should Tower turn "Baseline metrics need validation" into a 30-day measurement plan with owners and evidence requests?',
    );
    expect(visible).not.toMatch(/valid Tower answer contract|No fallback answer|JSON|source key|record ID/i);
    expect(visible).not.toMatch(/\bROI\b|savings|achieved|realized value|measured outcome|proven value|delivered value|value captured/i);
    expect(visible).not.toMatch(/\b(Read|Evidence|Implication|Next move|Next):/i);
  });
});
