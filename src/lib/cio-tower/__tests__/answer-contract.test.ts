import {
  buildCioTowerRightAnswerContract,
  scoreCioTowerRightAnswerContract,
  type CioTowerRightAnswerContract,
} from '../answer-contract';
import type { CioTowerVisibleAnswerContract } from '../answer';
import type { CioTowerMetricPacket } from '../metric-packet';
import type { TowerQuestionBankItem } from '@/lib/tower/tower-question-bank';

const topProgramsContract: CioTowerRightAnswerContract = {
  id: 'skyharbor-top-programs',
  tenantKey: 'skyharbor-air',
  question: 'Give me the list of top 10 IT programs.',
  route: 'deterministic',
  artifact: 'table',
  expectedMetrics: [
    {
      measureKey: 'initiative_budget_fy26',
      label: 'FY26 initiative budget',
      displayValue: '$248.0M',
    },
  ],
  requiredPhrases: ['SkyHarbor', 'program'],
  forbiddenPhrases: ['$3.6B', '$0', 'not loaded'],
  minimumTableRows: 3,
  maximumLatencyMs: 2500,
};

function visibleOutput(overrides: Partial<CioTowerVisibleAnswerContract> = {}): CioTowerVisibleAnswerContract {
  return {
    version: 'cio_tower_visible_answer_v1',
    answer: 'SkyHarbor has $248.0M in FY26 initiative budget across the top IT program set.',
    tables: [
      {
        id: 'top_programs',
        title: 'Top IT programs',
        columns: ['Program', 'Budget', 'Owner'],
        rows: [
          ['Crew Recovery & Legality Modernization', '$28.3M', 'VP Integration'],
          ['IROPS Recovery Decisioning Modernization', '$26.5M', 'VP Data Platforms'],
          ['Engineering Productivity AI', '$24.8M', 'VP Cloud Platform'],
        ],
      },
    ],
    tabs: [],
    followUpQuestion: null,
    ...overrides,
  };
}

describe('CIO Tower right-answer contract scorer', () => {
  it('builds right-answer contracts from question-bank metadata and governed metric packets', () => {
    const item: TowerQuestionBankItem = {
      id: 'tower-q-test',
      category: 'metric',
      dataset: 'budget_lines',
      intent: 'lookup',
      route: 'deterministic',
      artifact: 'prose',
      question: 'What is the current loaded IT budget for the enterprise?',
      requiredReadModels: ['tower_overview_read_model'],
      requiredMetrics: ['loaded_it_budget'],
      requiredEntities: ['tenant'],
      guardrails: ['must match dashboard metric contract'],
      latencyTargetMs: 1200,
    };
    const packets: CioTowerMetricPacket[] = [
      {
        measureKey: 'total_it_budget_fy26',
        label: 'FY26 IT budget',
        description: null,
        period: 'fy26',
        basis: 'committed',
        scope: 'enterprise',
        valueNumeric: 877_900_000,
        displayValue: '$877.9M',
        valueJson: {},
        sourceFactKeys: ['fact-budget'],
        formulaVersion: 'cio_tower_v1',
      },
    ];

    expect(buildCioTowerRightAnswerContract({ tenantKey: 'skyharbor-air', item, metricPackets: packets })).toMatchObject({
      id: 'skyharbor-air:tower-q-test',
      tenantKey: 'skyharbor-air',
      question: item.question,
      route: 'deterministic',
      artifact: 'prose',
      expectedMetrics: [
        {
          measureKey: 'total_it_budget_fy26',
          label: 'FY26 IT budget',
          displayValue: '$877.9M',
        },
      ],
      maximumLatencyMs: 2500,
    });
  });

  it('passes when the visible answer carries the expected metric and artifact', () => {
    const score = scoreCioTowerRightAnswerContract(topProgramsContract, {
      visibleText: 'SkyHarbor has $248.0M in FY26 initiative budget across the top IT program set.',
      modelOutput: visibleOutput(),
      latencyMs: 1200,
    });

    expect(score.pass).toBe(true);
  });

  it('fails plausible prose that contradicts the expected metric', () => {
    const score = scoreCioTowerRightAnswerContract(topProgramsContract, {
      visibleText: 'SkyHarbor has $3.6B of FY26 IT budget loaded across 15 portfolio-company rollups.',
      modelOutput: visibleOutput({
        answer: 'SkyHarbor has $3.6B of FY26 IT budget loaded across 15 portfolio-company rollups.',
      }),
      latencyMs: 1400,
    });

    expect(score.pass).toBe(false);
    expect(score.checks.filter((check) => !check.pass).map((check) => check.id)).toEqual(
      expect.arrayContaining(['contract_forbidden_phrase:$3.6B']),
    );
  });

  it('fails when the table artifact is missing for a deterministic table question', () => {
    const score = scoreCioTowerRightAnswerContract(topProgramsContract, {
      visibleText: 'SkyHarbor has $248.0M in FY26 initiative budget.',
      modelOutput: visibleOutput({ tables: [] }),
      latencyMs: 1100,
    });

    expect(score.pass).toBe(false);
    expect(score.checks.filter((check) => !check.pass).map((check) => check.id)).toEqual(
      expect.arrayContaining(['artifact:table', 'minimum_table_rows']),
    );
  });

  it('fails raw IDs, old branding, and internal machinery language even when the metric is present', () => {
    const score = scoreCioTowerRightAnswerContract(topProgramsContract, {
      visibleText:
        'Atlas found $248.0M in source_key tower_program_rankings rows for SKY-INIT-0017.',
      modelOutput: visibleOutput({
        answer: 'Atlas found $248.0M in source_key tower_program_rankings rows for SKY-INIT-0017.',
      }),
      latencyMs: 1000,
    });

    expect(score.pass).toBe(false);
    expect(score.checks.filter((check) => !check.pass).map((check) => check.id)).toEqual(
      expect.arrayContaining([
        'no_raw_ids',
        'forbidden_visible_phrase:Atlas',
        'forbidden_visible_phrase:source_key',
        'forbidden_visible_phrase:rows',
      ]),
    );
  });

  it('fails out-of-scope answers that incorrectly pull Tower metrics into the response', () => {
    const outOfScopeContract: CioTowerRightAnswerContract = {
      id: 'outside-scope-capital',
      tenantKey: 'skyharbor-air',
      question: 'What is the capital of Spain?',
      route: 'handoff',
      artifact: 'card',
      requiredPhrases: ['not a Tower portfolio question'],
      mustNotIncludeMetricValues: ['$248.0M', '$877.9M'],
    };

    const score = scoreCioTowerRightAnswerContract(outOfScopeContract, {
      visibleText:
        'This is not a Tower portfolio question. Madrid is the capital of Spain. SkyHarbor has $248.0M in initiative budget.',
      modelOutput: visibleOutput({
        answer:
          'This is not a Tower portfolio question. Madrid is the capital of Spain. SkyHarbor has $248.0M in initiative budget.',
        tables: [],
      }),
      latencyMs: 900,
    });

    expect(score.pass).toBe(false);
    expect(score.checks.filter((check) => !check.pass).map((check) => check.id)).toEqual(
      expect.arrayContaining(['forbidden_metric_value:$248.0M']),
    );
  });
});
