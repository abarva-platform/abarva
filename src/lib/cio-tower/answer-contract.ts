import type { CioTowerVisibleAnswerContract } from './answer';

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

const RAW_ID_RE =
  /\b(?:[A-Z]{2,}(?:-[A-Z0-9]+)+-\d{2,}|[A-Z]{2,}-[A-Z0-9]+-\d{3,}|TWR-[A-Z0-9-]+|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})\b/i;

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

export function scoreCioTowerRightAnswerContract(
  contract: CioTowerRightAnswerContract,
  observation: CioTowerAnswerObservation,
): CioTowerAnswerContractScore {
  const modelVisibleText = visibleTextFromModelOutput(observation.modelOutput);
  const visibleText = [observation.visibleText, modelVisibleText].filter(Boolean).join('\n');
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
