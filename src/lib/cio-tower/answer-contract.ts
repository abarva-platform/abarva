import type { CioTowerVisibleAnswerContract } from './answer';
import type { CioTowerMetricPacket } from './metric-packet';
import type { TowerQuestionBankItem } from '@/lib/tower/tower-question-bank';

export type CioTowerExpectedRoute = 'deterministic' | 'dossier' | 'handoff';
export type CioTowerExpectedArtifact = 'prose' | 'table' | 'chart' | 'graph' | 'card';

export interface CioTowerMetricExpectation {
  measureKey: string;
  label: string;
  displayValue: string;
}

export interface CioTowerRightAnswerContract {
  id: string;
  tenantKey: string;
  question: string;
  route: CioTowerExpectedRoute;
  artifact: CioTowerExpectedArtifact;
  expectedMetrics?: CioTowerMetricExpectation[];
  requiredPhrases?: string[];
  forbiddenPhrases?: string[];
  mustNotIncludeMetricValues?: string[];
  minimumTableRows?: number;
  maximumLatencyMs?: number;
  notes?: string;
}

export interface CioTowerAnswerObservation {
  visibleText: string;
  modelOutput?: CioTowerVisibleAnswerContract | null;
  latencyMs?: number | null;
}

export interface CioTowerAnswerContractCheck {
  id: string;
  pass: boolean;
  detail: string;
}

export interface CioTowerAnswerContractScore {
  pass: boolean;
  checks: CioTowerAnswerContractCheck[];
}

export interface BuildCioTowerRightAnswerContractArgs {
  tenantKey: string;
  item: TowerQuestionBankItem;
  metricPackets: readonly CioTowerMetricPacket[];
}

export interface BuildCioTowerRightAnswerContractsArgs {
  tenantKey: string;
  items: readonly TowerQuestionBankItem[];
  metricPackets: readonly CioTowerMetricPacket[];
}

const RAW_ID_RE =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)+-\d{2,}|[A-Z0-9]{2,}-[A-Z0-9]+-\d{2,}|[A-Z]{2,}-[A-Z0-9]+-\d{3,}|T\d{2,}-R\d{2,}|TWR-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i;

const ALWAYS_FORBIDDEN_VISIBLE_PHRASES = [
  'Atlas',
  'semantic packet',
  'source signals',
  'evidence ledger',
  'retrieved context',
  'source_key',
  'source table',
  'debug',
  'JSON',
  'rows',
  'Read:',
  'Evidence:',
  'Implication:',
  'Next move:',
];

const QUESTION_BANK_METRIC_TO_MEASURE_KEYS: Record<string, readonly string[]> = {
  loaded_it_budget: ['total_it_budget_fy26'],
  portfolio_company_it_budget: ['total_it_budget_fy26'],
  loaded_program_budget: ['initiative_budget_fy26'],
  initiative_count: ['initiative_budget_fy26'],
  ai_initiative_count: ['initiative_budget_fy26'],
  run_change_split: ['run_budget_fy26', 'change_budget_fy26'],
  capex_opex_split: ['capex_budget_fy26', 'opex_budget_fy26'],
  function_spend: ['total_it_budget_fy26'],
  shared_services_allocation: ['total_it_budget_fy26'],
  ai_spend: ['initiative_budget_fy26'],
  true_ai_initiative_spend: ['initiative_budget_fy26'],
  measured_value: ['measured_value_ytd'],
  value_gap: ['promised_value_fy26', 'measured_value_ytd'],
  portfolio_roi: ['measured_value_ytd', 'total_it_budget_fy26'],
  portfolio_company_value_proof: ['measured_value_ytd'],
  benefit_leakage: ['promised_value_fy26', 'measured_value_ytd'],
  vendor_exposure: ['vendor_exposure_fy26'],
  renewal_exposure: ['renewal_exposure_90d'],
  contract_concentration: ['vendor_exposure_fy26'],
  spend_at_risk: ['spend_at_risk_fy26'],
  program_pressure_count: ['program_pressure_count'],
  board_readiness_score: ['board_readiness_score'],
};

function includesNormalized(haystack: string, needle: string): boolean {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function visibleTextFromModelOutput(output: CioTowerVisibleAnswerContract | null | undefined): string {
  if (!output) return '';
  const parts: string[] = [output.answer];
  for (const table of output.tables ?? []) {
    parts.push(table.title, ...table.columns, ...table.rows.flat());
  }
  for (const tab of output.tabs ?? []) {
    parts.push(tab.label, tab.prose);
    for (const table of tab.tables ?? []) {
      parts.push(table.title, ...table.columns, ...table.rows.flat());
    }
  }
  if (output.followUpQuestion) parts.push(output.followUpQuestion);
  return parts.filter(Boolean).join('\n');
}

function hasArtifact(
  expected: CioTowerExpectedArtifact,
  output: CioTowerVisibleAnswerContract | null | undefined,
): boolean {
  if (expected === 'prose') return true;
  if (!output) return false;
  if (expected === 'table') return (output.tables?.length ?? 0) > 0
    || (output.tabs ?? []).some((tab) => (tab.tables?.length ?? 0) > 0);
  if (expected === 'card') return Boolean(output.answer?.trim());
  return false;
}

function tableRowCount(output: CioTowerVisibleAnswerContract | null | undefined): number {
  if (!output) return 0;
  const directRows = (output.tables ?? []).reduce((sum, table) => sum + table.rows.length, 0);
  const tabRows = (output.tabs ?? []).reduce(
    (sum, tab) => sum + (tab.tables ?? []).reduce((tableSum, table) => tableSum + table.rows.length, 0),
    0,
  );
  return directRows + tabRows;
}

function findMetricPacket(
  packets: readonly CioTowerMetricPacket[],
  measureKey: string,
): CioTowerMetricPacket | null {
  return packets.find((packet) => packet.measureKey === measureKey && packet.valueNumeric !== null) ?? null;
}

function expectedMetricsForItem(
  item: TowerQuestionBankItem,
  metricPackets: readonly CioTowerMetricPacket[],
): CioTowerMetricExpectation[] {
  const measureKeys = new Set<string>();
  for (const metric of item.requiredMetrics) {
    for (const measureKey of QUESTION_BANK_METRIC_TO_MEASURE_KEYS[metric] ?? []) {
      measureKeys.add(measureKey);
    }
  }
  const expectations: CioTowerMetricExpectation[] = [];
  for (const measureKey of measureKeys) {
    const packet = findMetricPacket(metricPackets, measureKey);
    if (!packet || packet.displayValue === 'not loaded') continue;
    expectations.push({
      measureKey,
      label: packet.label,
      displayValue: packet.displayValue,
    });
  }
  return expectations;
}

function artifactForItem(item: TowerQuestionBankItem): CioTowerExpectedArtifact {
  if (item.artifact === 'prose' || item.artifact === 'table' || item.artifact === 'chart' || item.artifact === 'graph' || item.artifact === 'card') {
    return item.artifact;
  }
  return 'prose';
}

export function buildCioTowerRightAnswerContract({
  tenantKey,
  item,
  metricPackets,
}: BuildCioTowerRightAnswerContractArgs): CioTowerRightAnswerContract {
  const expectedMetrics = expectedMetricsForItem(item, metricPackets);
  const forbiddenPhrases = [
    ...(expectedMetrics.length ? ['not loaded', 'no committed spend', 'No Tower program'] : []),
    ...(item.route === 'handoff' ? [] : ['not a Tower portfolio question']),
  ];
  const mustNotIncludeMetricValues =
    item.route === 'handoff'
      ? metricPackets
        .filter((packet) => packet.valueNumeric !== null && packet.displayValue !== 'not loaded')
        .map((packet) => packet.displayValue)
      : [];

  return {
    id: `${tenantKey}:${item.id}`,
    tenantKey,
    question: item.question,
    route: item.route,
    artifact: artifactForItem(item),
    expectedMetrics,
    forbiddenPhrases,
    mustNotIncludeMetricValues,
    minimumTableRows: item.artifact === 'table' ? 1 : undefined,
    maximumLatencyMs: Math.max(item.latencyTargetMs * 2, item.route === 'deterministic' ? 2500 : 5000),
    notes: [
      `category=${item.category}`,
      `dataset=${item.dataset}`,
      `intent=${item.intent}`,
      `readModels=${item.requiredReadModels.join(',')}`,
      `metrics=${item.requiredMetrics.join(',')}`,
    ].join('; '),
  };
}

export function buildCioTowerRightAnswerContracts({
  tenantKey,
  items,
  metricPackets,
}: BuildCioTowerRightAnswerContractsArgs): CioTowerRightAnswerContract[] {
  return items.map((item) => buildCioTowerRightAnswerContract({ tenantKey, item, metricPackets }));
}

export function scoreCioTowerRightAnswerContract(
  contract: CioTowerRightAnswerContract,
  observation: CioTowerAnswerObservation,
): CioTowerAnswerContractScore {
  const modelVisibleText = visibleTextFromModelOutput(observation.modelOutput);
  const visibleText = modelVisibleText.trim().length > 0
    ? modelVisibleText
    : observation.visibleText;
  const checks: CioTowerAnswerContractCheck[] = [];

  const add = (id: string, pass: boolean, detail: string) => {
    checks.push({ id, pass, detail });
  };

  add('non_empty_visible_answer', visibleText.trim().length > 0, 'Visible answer must not be blank.');
  add('no_raw_ids', !RAW_ID_RE.test(visibleText), 'Visible answer must not expose raw record IDs.');

  for (const phrase of ALWAYS_FORBIDDEN_VISIBLE_PHRASES) {
    add(`forbidden_visible_phrase:${phrase}`, !includesNormalized(visibleText, phrase), `Must not include "${phrase}".`);
  }

  for (const phrase of contract.forbiddenPhrases ?? []) {
    add(`contract_forbidden_phrase:${phrase}`, !includesNormalized(visibleText, phrase), `Must not include "${phrase}".`);
  }

  for (const phrase of contract.requiredPhrases ?? []) {
    add(`required_phrase:${phrase}`, includesNormalized(visibleText, phrase), `Must include "${phrase}".`);
  }

  for (const metric of contract.expectedMetrics ?? []) {
    add(
      `required_metric:${metric.measureKey}`,
      visibleText.includes(metric.displayValue),
      `Must include ${metric.label} exactly as ${metric.displayValue}.`,
    );
  }

  for (const displayValue of contract.mustNotIncludeMetricValues ?? []) {
    add(
      `forbidden_metric_value:${displayValue}`,
      !visibleText.includes(displayValue),
      `Must not include contradictory metric value ${displayValue}.`,
    );
  }

  add(
    `artifact:${contract.artifact}`,
    hasArtifact(contract.artifact, observation.modelOutput),
    `Expected artifact type ${contract.artifact}.`,
  );

  if (contract.minimumTableRows !== undefined) {
    add(
      'minimum_table_rows',
      tableRowCount(observation.modelOutput) >= contract.minimumTableRows,
      `Expected at least ${contract.minimumTableRows} table row(s).`,
    );
  }

  if (contract.maximumLatencyMs !== undefined && observation.latencyMs !== null && observation.latencyMs !== undefined) {
    add(
      'latency_budget',
      observation.latencyMs <= contract.maximumLatencyMs,
      `Expected latency <= ${contract.maximumLatencyMs} ms.`,
    );
  }

  return {
    pass: checks.every((check) => check.pass),
    checks,
  };
}
