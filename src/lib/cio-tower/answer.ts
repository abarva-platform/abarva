import crypto from 'node:crypto';

import { preflightAnthropicDirectClient } from '@/lib/integrations/ai-egress';
import { azureRead } from '@/lib/data-plane/azureRead';
import { createTxSession } from '@/lib/data-plane/read-adapters/azureSession';
import {
  buildModuleV6PacketContract,
  buildModuleV6VisibleOutputAudit,
  moduleV6PacketPromptBlock,
  validateModuleV6VisibleSections,
  type ModuleV6PacketContract,
  type ModuleV6VisibleOutputAudit,
  type ModuleV6VisibleSection,
} from '@/lib/agent/module-v6-answer-contract';
import {
  formatCioTowerMoney,
  toCioTowerMetricPacket,
  validateCioTowerMetricPacketVisibility,
  type CioTowerMetricPacket,
} from '@/lib/cio-tower/metric-packet';

export { canonicalCioTowerTenantKey } from '@/lib/cio-tower/metric-packet';

const MODEL_NAME = 'claude-sonnet-4-6';
const PROMPT_VERSION = 'cio_tower_advisor_prompt_v1';
const BOUNDARY_MODEL_NAME = 'deterministic-cio-tower-boundary-v1';
const TEMPERATURE = 0;
const MAX_TOKENS = 1400;
const MAX_REPAIR_TOKENS = 1400;

type JsonRecord = Record<string, unknown>;

export interface CioTowerContract {
  contract_key: string;
  intent: string;
  question_family: string;
  measure_key: string | null;
  artifact_type: string;
  examples: unknown;
}

export interface CioTowerMeasureResult {
  measure_key: string;
  period: string;
  basis: string;
  scope: string;
  value_numeric: string | number | null;
  value_json: JsonRecord;
  source_fact_keys: string[];
  formula_version: string;
  label?: string | null;
  description?: string | null;
}

export interface CioTowerFactRow {
  fact_key: string;
  entity_key: string | null;
  entity_type: string | null;
  entity_display_name: string | null;
  measure: string;
  scope: string;
  view: string;
  amount_type: string;
  basis: string;
  period: string;
  value_numeric: string | number | null;
  value_text: string | null;
  unit: string;
  value_source: string;
  confidence: string;
  source_key: string | null;
  source_row: string | null;
  attributes: JsonRecord;
}

export interface CioTowerRelationshipRow {
  relationship_key: string;
  from_name: string | null;
  to_name: string | null;
  relationship_type: string;
  confidence: string;
  source_key: string | null;
  source_row: string | null;
}

export interface CioTowerPromptContext {
  tenantKey: string;
  tenantName: string;
  question: string;
  contract: CioTowerContract;
  measures: CioTowerMeasureResult[];
  metricPackets: CioTowerMetricPacket[];
  relevantFacts: CioTowerFactRow[];
  relationships: CioTowerRelationshipRow[];
  gaps: string[];
  v6PacketContract: ModuleV6PacketContract;
}

export interface CioTowerAnswerResult {
  response: string;
  modelOutputRaw: string;
  modelOutput: CioTowerVisibleAnswerContract;
  promptPackageKey: string;
  traceKey: string;
  promptHash: string;
  model: string;
  validationStatus: 'passed' | 'failed';
  validationErrors: string[];
  latencyMs: number;
  v6VisibleOutputAudit: ModuleV6VisibleOutputAudit;
}

export interface CioTowerVisibleTable {
  id: string;
  title: string;
  columns: string[];
  rows: string[][];
}

export interface CioTowerVisibleTab {
  id: string;
  label: string;
  prose: string;
  tables?: CioTowerVisibleTable[];
}

export interface CioTowerVisibleAnswerContract {
  version: 'cio_tower_visible_answer_v1';
  answer: string;
  tables?: CioTowerVisibleTable[];
  tabs?: CioTowerVisibleTab[];
  followUpQuestion?: string | null;
}

type CioTowerBoundaryTarget = 'Home/Explorer' | 'Intelligence' | 'Source' | 'Moves' | 'Outside Tower' | 'Safety';

interface CioTowerBoundaryRoute {
  target: CioTowerBoundaryTarget;
  reason: string;
}

const CONTRACT_MATCHERS: Array<{ key: string; patterns: RegExp[] }> = [
  {
    key: 'tower_trend_it_budget',
    patterns: [/trend/i, /fy25.*fy26/i, /fy2025.*fy2026/i, /last year/i, /year over year/i, /growing from FY25/i, /FY25.*FY26/i],
  },
  {
    key: 'tower_top_it_programs_by_budget',
    patterns: [/top\s+\d+\s+(it\s+)?(program|initiative)/i, /largest\s+(it\s+)?(program|initiative)/i, /rank.*(program|initiative).*budget/i],
  },
  {
    key: 'tower_run_change_split',
    patterns: [/run.*change/i, /change.*run/i, /capex.*opex/i, /opex.*capex/i],
  },
  {
    key: 'tower_total_it_spend',
    patterns: [
      /what.*(it\s+)?spend/i,
      /what.*(it\s+)?budget/i,
      /total.*(it\s+)?budget/i,
      /fy26.*(it\s+)?budget/i,
      /how much.*(it\s+)?spend/i,
      /how much.*budget/i,
      /budget envelope/i,
      /technology budget/i,
      /cio budget/i,
      /(?:metric\s+)?lineage.*(?:it\s+)?budget/i,
      /(?:it\s+)?budget.*(?:metric\s+)?lineage/i,
      /where.*(?:it\s+)?budget.*(?:number|value)?.*come\s+from/i,
      /budget.*(?:by|for each|per|across).*(?:function|portfolio compan|company|platform|domain|tower|area|slice)/i,
      /(?:function|portfolio compan|company|platform|domain|tower|area|slice).*budget/i,
    ],
  },
  {
    key: 'tower_value_realization',
    patterns: [/measured value/i, /value.*lag/i, /realized value/i, /where.*value/i],
  },
  {
    key: 'tower_outside_scope',
    patterns: [/capital of spain/i, /poem/i, /recipe/i, /weather/i],
  },
];

const BOUNDARY_PATTERNS: Array<{ target: CioTowerBoundaryTarget; reason: string; patterns: RegExp[] }> = [
  {
    target: 'Safety',
    reason: 'The question asks Tower to bypass tenant, evidence, or visible-answer guardrails.',
    patterns: [
      /ignore\s+the\s+tower\s+contract/i,
      /different\s+tenant|other\s+tenant|another\s+tenant/i,
      /raw\s+(initiative\s+)?ids?/i,
      /infer\s+the\s+run\/change/i,
      /exact\s+roi.*not\s+loaded/i,
      /pretend\s+the\s+dashboard/i,
      /claude\s+memory/i,
      /make\s+up/i,
      /local\s+file\s+paths?|source\s+table\s+names?/i,
      /\bAtlas\b|\bSentinel\b/i,
      /bypass\s+citations/i,
    ],
  },
  {
    target: 'Home/Explorer',
    reason: 'The question asks to inspect loaded enterprise context or source coverage.',
    patterns: [
      /raw\s+context/i,
      /every\s+source\s+file/i,
      /fields\s+are\s+missing\s+across\s+the\s+loaded\s+enterprise\s+context/i,
      /browse\s+the\s+source/i,
      /whole\s+tenant\s+beyond\s+tower/i,
      /loaded\s+enterprise\s+context/i,
    ],
  },
  {
    target: 'Intelligence',
    reason: 'The question asks for advisory interpretation, patterns, benchmarks, or strategy options.',
    patterns: [
      /industry\s+patterns/i,
      /scale,\s*hold,\s*or\s*stop/i,
      /scale.*hold.*stop/i,
      /board-level\s+interpretation/i,
      /benchmarks?\s+and\s+tradeoffs?/i,
      /changing\s+strategy/i,
      /expert\/corpus|corpus\s+patterns?/i,
    ],
  },
  {
    target: 'Source',
    reason: 'The question asks for sourcing, supplier selection, RFP, BAFO, or commercial terms.',
    patterns: [
      /which\s+vendor\s+should\s+we\s+select/i,
      /\bRFP\b|evaluation\s+criteria/i,
      /sourcing\s+event/i,
      /supplier\s+proposals?|BAFO/i,
      /commercial\s+terms|negotiate/i,
    ],
  },
  {
    target: 'Moves',
    reason: 'The question asks for execution planning or work-packet creation.',
    patterns: [
      /execution\s+work\s+packet/i,
      /initiative\s+plan\s+and\s+owners/i,
      /open\s+a\s+move/i,
      /action\s+plan/i,
      /assign\s+tasks?\s+and\s+milestones?/i,
    ],
  },
  {
    target: 'Outside Tower',
    reason: 'The question is general knowledge or unrelated to the CIO Tower portfolio-control scope.',
    patterns: [/capital\s+of\s+spain/i, /\bpoem\b/i, /\brecipe\b/i, /\bweather\b/i],
  },
];

function stableKey(prefix: string, parts: readonly string[]): string {
  const hash = crypto.createHash('sha256').update(parts.join('\n')).digest('hex').slice(0, 24);
  return `${prefix}_${hash}`;
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex');
}

export function matchContractKey(question: string): string {
  if (classifyCioTowerBoundary(question)) return 'tower_outside_scope';
  for (const matcher of CONTRACT_MATCHERS) {
    if (matcher.patterns.some((pattern) => pattern.test(question))) return matcher.key;
  }
  return 'tower_top_it_programs_by_budget';
}

export function classifyCioTowerBoundary(question: string): CioTowerBoundaryRoute | null {
  const shouldRoute = /if\s+tower\s+is\s+not\s+the\s+right\s+surface/i.test(question);
  for (const boundary of BOUNDARY_PATTERNS) {
    if (!shouldRoute && boundary.target !== 'Safety' && boundary.target !== 'Outside Tower') continue;
    if (boundary.patterns.some((pattern) => pattern.test(question))) {
      return { target: boundary.target, reason: boundary.reason };
    }
  }
  return null;
}

export function buildCioTowerBoundaryAnswer(route: CioTowerBoundaryRoute): CioTowerVisibleAnswerContract {
  const answerByTarget: Record<CioTowerBoundaryTarget, string> = {
    'Home/Explorer':
      'That belongs in Home/Explorer, not Tower. Home is the right surface for loaded enterprise context, source coverage, missing fields, and source review; Tower should stay focused on CIO portfolio control.',
    Intelligence:
      'That belongs in Intelligence, not Tower. Tower can show portfolio status, spend, value proof, risk, renewals, and governance signals; Intelligence is the right surface for patterns, benchmarks, tradeoffs, and leadership options.',
    Source:
      'That belongs in Source, not Tower. Tower can identify vendor exposure and renewal pressure; Source is the right surface for supplier selection, RFP criteria, BAFO strategy, and commercial terms.',
    Moves:
      'That belongs in Moves, not Tower. Tower can show the portfolio signal and accountable pressure point; Moves is the right surface for work packets, owners, milestones, and execution plans.',
    'Outside Tower':
      'That is not a Tower portfolio question. Tower can answer CIO portfolio questions about spend, programs, vendor exposure, value proof, risk, renewals, and governance.',
    Safety:
      'I cannot do that. Tower answers tenant-scoped portfolio questions using governed Tower facts, and it will not bypass tenant boundaries, invent missing metrics, expose internal identifiers, or use another client as evidence.',
  };
  return {
    version: 'cio_tower_visible_answer_v1',
    answer: answerByTarget[route.target],
    tables: [],
    tabs: [
      {
        id: 'route',
        label: route.target,
        prose: route.reason,
        tables: [],
      },
    ],
    followUpQuestion: null,
  };
}

export const __cioTowerAnswerTestHooks = {
  buildCioTowerDeterministicMetricAnswer,
  factWhereForContract,
  validateParsedVisibleAnswer,
};

function money(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'not loaded';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return formatCioTowerMoney(numeric);
}

function factValue(row: CioTowerFactRow): string {
  if (row.unit === 'usd') return money(row.value_numeric);
  if (row.value_numeric !== null && row.value_numeric !== undefined) return `${row.value_numeric}${row.unit && row.unit !== 'none' ? ` ${row.unit}` : ''}`;
  if (row.value_text) return row.value_text;
  return 'not loaded';
}

function dashboardSliceDiscipline(context: CioTowerPromptContext): string[] {
  const lines = [
    'Dashboard slice discipline:',
    '- The governed metric packets are the authority for dashboard KPI numbers.',
    '- Do not relabel one slice as another. Enterprise budget, function/platform budget lines, initiative/program budgets, actual spend, and value are different measures.',
    '- If you mention a KPI, use the exact governed metric packet display value.',
    '- If you mention a cut of the budget, use only the relevant fact view for that cut and name it accurately.',
  ];

  if (context.contract.contract_key === 'tower_total_it_spend') {
    lines.push(
      '- This question asks for the total IT budget/spend envelope. Lead with total_it_budget_fy26, then run_budget_fy26, change_budget_fy26, actual_spend_ytd if present, and total_it_budget_fy25_baseline if useful.',
      '- For this question, relevant facts with view=it_budget are function/platform budget lines. If you name the largest slices, call them function/platform budget lines and use their exact values from Most relevant facts.',
      '- Do not call function/platform budget lines "programs", "initiatives", or "spending towers". Do not pull initiative/program values into this answer unless explicitly contrasting them with the enterprise budget envelope.',
    );
    if (/\b(each|by|per|list|compare|table)\b/i.test(context.question)) {
      lines.push(
        '- This question asks for a budget slice, not only the headline. Include a compact table using the view=it_budget facts when they are present.',
        '- Keep the table to the most relevant business slices. Use the display name and exact amount from Most relevant facts. Do not invent run/change or actual-spend fields.',
      );
    }
  }

  if (context.contract.contract_key === 'tower_top_it_programs_by_budget') {
    lines.push(
      '- This question asks for programs/initiatives. Use only facts with view=initiative_budget for ranked programs. Do not substitute enterprise budget or function/platform budget lines.',
    );
  }

  if (context.contract.contract_key === 'tower_run_change_split') {
    lines.push(
      '- This question asks for run/change. Use run_budget_fy26 and change_budget_fy26. Do not convert these into CapEx/OpEx unless explicit CapEx/OpEx facts are present.',
    );
  }

  return lines;
}

function validateVisibleAnswer(text: string): string[] {
  const violations: string[] = [];
  const checks: Array<[string, RegExp]> = [
    ['raw_id_or_internal_key', /\b[A-Z]{2,}[A-Z0-9_-]*-\d{2,}\b|\b[A-Z0-9]{2,}-[A-Z0-9]+-\d{2,}\b|\bT\d{2,}-R\d{2,}\b|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i],
    ['visible_scaffold_label', /\b(Read|Evidence|Implication|Next move):/i],
    ['internal_data_plane_language', /\b(loaded evidence|tenant evidence|evidence ledger|semantic packet|retrieved context|source signals|rows)\b/i],
    ['atlas_branding', /\bAtlas\b/i],
  ];
  for (const [id, pattern] of checks) {
    if (pattern.test(text)) violations.push(id);
  }
  return violations;
}

function collectVisibleTextFromContract(contract: CioTowerVisibleAnswerContract): string[] {
  const chunks = [contract.answer];
  for (const table of contract.tables ?? []) {
    chunks.push(table.title, ...table.columns, ...table.rows.flat());
  }
  for (const tab of contract.tabs ?? []) {
    chunks.push(tab.label, tab.prose);
    for (const table of tab.tables ?? []) {
      chunks.push(table.title, ...table.columns, ...table.rows.flat());
    }
  }
  if (contract.followUpQuestion) chunks.push(contract.followUpQuestion);
  return chunks.filter(Boolean);
}

function tableTextForModuleAudit(table: CioTowerVisibleTable): string {
  return [
    table.title,
    table.columns.join(' | '),
    ...table.rows.map((row) => row.join(' | ')),
  ].join('\n');
}

function collectVisibleSectionsFromContract(
  contract: CioTowerVisibleAnswerContract,
): ModuleV6VisibleSection[] {
  const sections: ModuleV6VisibleSection[] = [
    {
      id: 'answer',
      label: 'Answer',
      modelText: contract.answer,
      renderedText: contract.answer,
    },
  ];
  for (const table of contract.tables ?? []) {
    const tableText = tableTextForModuleAudit(table);
    sections.push({
      id: `table:${table.id}`,
      label: table.title,
      modelText: tableText,
      renderedText: tableText,
    });
  }
  for (const tab of contract.tabs ?? []) {
    const tabText = [tab.label, tab.prose].filter(Boolean).join('\n');
    sections.push({
      id: `tab:${tab.id}`,
      label: tab.label,
      modelText: tabText,
      renderedText: tabText,
    });
    for (const table of tab.tables ?? []) {
      const tableText = tableTextForModuleAudit(table);
      sections.push({
        id: `tab:${tab.id}:table:${table.id}`,
        label: table.title,
        modelText: tableText,
        renderedText: tableText,
      });
    }
  }
  if (contract.followUpQuestion) {
    sections.push({
      id: 'follow_up',
      label: 'Follow-up question',
      modelText: contract.followUpQuestion,
      renderedText: contract.followUpQuestion,
    });
  }
  return sections;
}

function validateParsedVisibleAnswer(args: {
  contractKey: string;
  metricPackets: readonly CioTowerMetricPacket[];
  parsedOutput: CioTowerVisibleAnswerContract;
}): string[] {
  const validationErrors: string[] = [];
  const visibleTexts = collectVisibleTextFromContract(args.parsedOutput);
  for (const visibleText of visibleTexts) {
    validationErrors.push(...validateVisibleAnswer(visibleText));
  }
  validationErrors.push(
    ...validateCioTowerMetricPacketVisibility({
      contractKey: args.contractKey,
      packets: args.metricPackets,
      visibleTexts,
    }),
  );
  validationErrors.push(
    ...validateModuleV6VisibleSections(
      collectVisibleSectionsFromContract(args.parsedOutput),
    ),
  );
  return validationErrors;
}

export function parseVisibleAnswerContract(raw: string): CioTowerVisibleAnswerContract {
  const trimmed = raw.trim();
  const jsonText = trimmed.startsWith('{')
    ? trimmed
    : trimmed.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1]?.trim() ?? extractFirstJsonObject(trimmed) ?? trimmed;
  const parsed = JSON.parse(jsonText) as Partial<CioTowerVisibleAnswerContract>;
  if (parsed.version !== 'cio_tower_visible_answer_v1') {
    throw new Error('cio_tower_visible_contract_invalid_version');
  }
  if (typeof parsed.answer !== 'string' || parsed.answer.trim().length === 0) {
    throw new Error('cio_tower_visible_contract_missing_answer');
  }
  for (const table of parsed.tables ?? []) {
    if (!table || typeof table.title !== 'string' || !Array.isArray(table.columns) || !Array.isArray(table.rows)) {
      throw new Error('cio_tower_visible_contract_invalid_table');
    }
  }
  for (const tab of parsed.tabs ?? []) {
    if (!tab || typeof tab.label !== 'string' || typeof tab.prose !== 'string') {
      throw new Error('cio_tower_visible_contract_invalid_tab');
    }
  }
  return {
    version: 'cio_tower_visible_answer_v1',
    answer: parsed.answer,
    tables: parsed.tables ?? [],
    tabs: parsed.tabs ?? [],
    followUpQuestion: parsed.followUpQuestion ?? null,
  };
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start < 0) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) return text.slice(start, index + 1);
    }
  }
  return null;
}

export function buildCioTowerRepairPrompt(args: {
  originalPrompt: string;
  rawModelOutput: string;
  validationErrors: readonly string[];
}): string {
  return [
    'You returned an invalid Tower visible-answer JSON contract.',
    '',
    'Repair task:',
    '- Return one corrected JSON object only.',
    '- Preserve the business answer as much as possible, but fix every validation error.',
    '- Do not add markdown fences or commentary.',
    '- Do not expose internal data-plane language, raw IDs, source keys, table names, JSON terms, or debug language in any visible field.',
    '- Do not use the word "rows" in visible prose or table labels; use business words such as records, entries, programs, contracts, or fields.',
    '- If an authoritative metric packet was provided, include its display value exactly as written there.',
    '- The renderer will place the JSON strings exactly as you return them. It will not rewrite or polish them.',
    '',
    'Validation errors to fix:',
    args.validationErrors.length ? args.validationErrors.map((error) => `- ${error}`).join('\n') : '- Unknown contract validation failure.',
    '',
    'Original instructions and Tower context:',
    args.originalPrompt,
    '',
    'Your invalid model output:',
    args.rawModelOutput,
    '',
    'Return the corrected JSON object only.',
  ].join('\n');
}

export function buildCioTowerClaudePrompt(context: CioTowerPromptContext): string {
  const measureLines = context.metricPackets.map((measure) => {
    return `- ${measure.label}: ${measure.displayValue} (${measure.period}, ${measure.basis}; formula ${measure.formulaVersion}; ${measure.sourceFactKeys.length} supporting facts)`;
  });
  const authoritativeMetric = context.contract.measure_key
    ? context.metricPackets.find((packet) => packet.measureKey === context.contract.measure_key)
    : null;

  const factLines = context.relevantFacts.slice(0, 18).map((fact, index) => {
    const name = fact.entity_display_name ?? fact.entity_key ?? `Fact ${index + 1}`;
    return `- ${name}: ${fact.measure} = ${factValue(fact)} (${fact.period}, ${fact.basis}, ${fact.confidence}; source ${fact.source_key ?? 'unknown'} row ${fact.source_row ?? 'unknown'})`;
  });

  const relationshipLines = context.relationships.slice(0, 12).map((rel) => {
    return `- ${rel.from_name ?? 'unknown'} ${rel.relationship_type} ${rel.to_name ?? 'unknown'} (${rel.confidence}; source ${rel.source_key ?? 'unknown'} row ${rel.source_row ?? 'unknown'})`;
  });

  const gapLines = context.gaps.map((gap) => `- ${gap}`);

  return [
    `You are a senior CIO/CFO advisor for AbarVa speaking to ${context.tenantName}.`,
    '',
    'Your job is to answer the executive question using only the Tower context below.',
    '',
    'Non-negotiable visible-answer contract:',
    '- Lead with the actual answer, judgment, or recommendation.',
    '- Do not open with filler, a summary of the question, or a template.',
    '- Do not mention internal retrieval, evidence machinery, semantic packets, database rows, table names, JSON, source keys, record IDs, UUIDs, or debug terms.',
    '- Do not use the word "rows" in visible prose, table titles, column labels, cell text, or tabs. Say records, entries, programs, contracts, or fields instead.',
    '- Do not use visible scaffolding labels like "Read:", "Evidence:", "Implication:", or "Next move:".',
    '- Do not mention Atlas. The agent is aVa.',
    '- If the data is incomplete, state the specific missing business field in plain English.',
    '- Write like a human senior advisor: direct, concise, specific, and willing to disagree.',
    '- Use short paragraphs or bullets when they improve readability.',
    '- End naturally based on the question. Do not append generic menu choices.',
    '',
    'Output contract:',
    '- Return valid JSON only. No markdown fence. No extra text outside JSON.',
    '- You own every user-visible word in the JSON fields.',
    '- AbarVa will render the strings exactly as returned. It will not rewrite, summarize, scrub, relabel, infer, or improve them.',
    '- Put the main prose in answer.',
    '- If a table helps, include tables[]. The renderer will display your title, column labels, and cell text exactly.',
    '- If multiple panes help, include tabs[]. The renderer will place your tab labels and prose exactly.',
    '- If no table is needed, return tables as an empty array.',
    '',
    'Required JSON shape:',
    '{',
    '  "version": "cio_tower_visible_answer_v1",',
    '  "answer": "final user-visible answer text",',
    '  "tables": [{"id":"short_id","title":"visible title","columns":["visible column"],"rows":[["visible cell"]]}],',
    '  "tabs": [{"id":"short_id","label":"visible tab label","prose":"visible prose","tables": []}],',
    '  "followUpQuestion": "one specific optional follow-up question, or null"',
    '}',
    '',
    `Question: ${context.question}`,
    `Intent: ${context.contract.intent}`,
    `Question family: ${context.contract.question_family}`,
    `Preferred artifact shape: ${context.contract.artifact_type}`,
    '',
    'Tower number discipline:',
    '- Tower owns numbers. Claude owns narrative. The renderer owns presentation.',
    '- Use only governed metric packets and relevant Tower facts for amounts, counts, percentages, dates, formula versions, and evidence lineage.',
    '- Do not calculate, infer, extrapolate, smooth, or estimate spend, value, ROI, renewal exposure, adoption, or readiness values.',
    '- If a metric value is not loaded in the packet, state the gap plainly instead of filling it from pattern knowledge or general business logic.',
    authoritativeMetric
      ? `Authoritative metric packet for this question: ${authoritativeMetric.label} = ${authoritativeMetric.displayValue} (${authoritativeMetric.period}, ${authoritativeMetric.basis}; formula ${authoritativeMetric.formulaVersion}). You MUST include the exact display value "${authoritativeMetric.displayValue}" in the answer if the question asks for this metric.`
      : 'Authoritative metric packet for this question: none loaded. Do not invent the metric value.',
    '',
    'Governed metric packets. These are also what the Tower dashboard uses:',
    measureLines.length ? measureLines.join('\n') : '- No governed measure result is loaded for this question.',
    '',
    dashboardSliceDiscipline(context).join('\n'),
    '',
    'Most relevant facts:',
    factLines.length ? factLines.join('\n') : '- No relevant facts are loaded for this question.',
    '',
    'Relevant relationships:',
    relationshipLines.length ? relationshipLines.join('\n') : '- No relevant relationships are loaded for this question.',
    '',
    'Known data gaps:',
    gapLines.length ? gapLines.join('\n') : '- No blocking gap identified for this question.',
    '',
    moduleV6PacketPromptBlock(context.v6PacketContract),
    '',
    'Answer now. Return the JSON object only.',
  ].join('\n');
}

function buildCioTowerBoundaryPrompt(args: {
  context: CioTowerPromptContext;
  boundary: CioTowerBoundaryRoute;
  output: CioTowerVisibleAnswerContract;
}): string {
  return [
    'Deterministic Tower boundary route.',
    `Question: ${args.context.question}`,
    `Tenant: ${args.context.tenantName}`,
    `Target: ${args.boundary.target}`,
    `Reason: ${args.boundary.reason}`,
    '',
    'No Claude call was made. The API returned the visible-answer JSON contract below and the renderer must place it unchanged.',
    JSON.stringify(args.output),
  ].join('\n');
}

function buildCioTowerDeterministicPrompt(args: {
  context: CioTowerPromptContext;
  output: CioTowerVisibleAnswerContract;
  reason: string;
}): string {
  return [
    'Deterministic Tower metric answer.',
    `Question: ${args.context.question}`,
    `Tenant: ${args.context.tenantName}`,
    `Contract: ${args.context.contract.contract_key}`,
    `Reason: ${args.reason}`,
    '',
    'No Claude call was made. The API returned the visible-answer JSON contract below and the renderer must place it unchanged.',
    JSON.stringify(args.output),
  ].join('\n');
}

function asksForBudgetSlice(question: string): boolean {
  return /\b(each|by|per|list|compare|table|function|portfolio compan|company|platform|domain|tower|area|slice)\b/i.test(question);
}

function buildTowerBudgetSliceTable(facts: readonly CioTowerFactRow[]): CioTowerVisibleTable | null {
  const budgetFacts = facts
    .filter((fact) => fact.view === 'it_budget' && fact.value_numeric !== null && fact.value_numeric !== undefined)
    .slice(0, 12);
  if (budgetFacts.length === 0) return null;
  return {
    id: 'it_budget_slices',
    title: 'Loaded FY26 IT budget slices',
    columns: ['Slice', 'FY26 budget', 'Basis', 'Confidence'],
    rows: budgetFacts.map((fact) => [
      fact.entity_display_name ?? fact.entity_key ?? 'Unnamed slice',
      factValue(fact),
      fact.basis || 'loaded',
      fact.confidence || 'unknown',
    ]),
  };
}

const KEY_SHAPED_VISIBLE_NAME = /\b(?:[A-Z]{2,}[A-Z0-9]*-[A-Z0-9][A-Z0-9_-]*-\d{1,}|[A-Z]{2,}[A-Z0-9]*-\d{2,}|T\d{2,}-R\d{2,}|NODE[-_ ]?\d{3,}|[a-z]+[-_][a-z0-9_-]{3,})\b/i;
const KEY_PREFIX = /^\s*(?:[A-Z]{2,}[A-Z0-9]*-[A-Z0-9][A-Z0-9_-]*-\d{1,}|[A-Z]{2,}[A-Z0-9]*-\d{2,}|T\d{2,}-R\d{2,}|NODE[-_ ]?\d{3,}|[a-z]+[-_][a-z0-9_-]{3,})\s*(?:[:\-–—]\s*|\s+)/i;

function attributeText(row: CioTowerFactRow, key: string): string | null {
  const value = row.attributes?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function cleanVisibleBusinessName(value: string | null | undefined, fallback: string): string {
  const raw = value?.trim();
  if (!raw) return fallback;
  const withoutPrefix = raw.replace(KEY_PREFIX, '').trim();
  const candidate = withoutPrefix || raw;
  if (/^\d+$/.test(candidate)) return fallback;
  return KEY_SHAPED_VISIBLE_NAME.test(candidate) ? fallback : candidate;
}

function loadedName(row: CioTowerFactRow, fallback: string): string {
  const candidates = [
    attributeText(row, 'record_name'),
    attributeText(row, 'initiative_name'),
    attributeText(row, 'program_name'),
    attributeText(row, 'display_name'),
    attributeText(row, 'title'),
    attributeText(row, 'business_name'),
    attributeText(row, 'business_label'),
    attributeText(row, 'source_label'),
    attributeText(row, 'label'),
    attributeText(row, 'name'),
    row.entity_display_name,
  ];
  for (const candidate of candidates) {
    const cleaned = cleanVisibleBusinessName(candidate, fallback);
    if (cleaned !== fallback) return cleaned;
  }
  return fallback;
}

interface ProgramValueProfile {
  name: string;
  owner: string;
  blocker: string;
  budgetNumeric: number;
  budget: string;
  promisedValueNumeric: number;
  promisedValue: string;
  measuredValueNumeric: number;
  measuredValue: string;
  valueGap: string;
  evidenceStatus: string;
  confidence: string;
}

function profileGroupKey(row: CioTowerFactRow): string {
  return row.entity_key
    ?? attributeText(row, 'initiative_id')
    ?? attributeText(row, 'program_id')
    ?? attributeText(row, 'source_record_id')
    ?? row.entity_display_name
    ?? row.fact_key;
}

function profileAmount(row: CioTowerFactRow, kind: 'budget' | 'promised' | 'measured'): number {
  const numeric = Number(row.value_numeric ?? 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return 0;
  if (kind === 'budget') {
    return row.view === 'initiative_budget' && row.period.toLowerCase() === 'fy26' ? numeric : 0;
  }
  if (row.view !== 'value') return 0;
  const measure = row.measure.toLowerCase();
  const basis = row.basis.toLowerCase();
  if (kind === 'promised') {
    return basis === 'forecast' || measure.includes('promised') || measure.includes('benefit') ? numeric : 0;
  }
  return basis === 'actual' || basis === 'measured' || measure.includes('measured') || measure.includes('realized') ? numeric : 0;
}

function firstAttribute(rows: readonly CioTowerFactRow[], keys: readonly string[], fallback: string): string {
  for (const row of rows) {
    for (const key of keys) {
      const value = attributeText(row, key);
      if (value) return value;
    }
  }
  return fallback;
}

function programValueProfiles(facts: readonly CioTowerFactRow[], limit = 10): ProgramValueProfile[] {
  const grouped = new Map<string, CioTowerFactRow[]>();
  for (const fact of facts) {
    if (!['initiative_budget', 'value'].includes(fact.view)) continue;
    const key = profileGroupKey(fact);
    grouped.set(key, [...(grouped.get(key) ?? []), fact]);
  }

  return Array.from(grouped.values())
    .map((group) => {
      const budgetNumeric = group.reduce((sum, row) => sum + profileAmount(row, 'budget'), 0);
      const promisedValueNumeric = group.reduce((sum, row) => sum + profileAmount(row, 'promised'), 0);
      const measuredValueNumeric = group.reduce((sum, row) => sum + profileAmount(row, 'measured'), 0);
      const valueGapNumeric = promisedValueNumeric > 0
        ? Math.max(promisedValueNumeric - measuredValueNumeric, 0)
        : null;
      const primary = group[0] as CioTowerFactRow;
      return {
        name: loadedName(primary, 'Program name not loaded'),
        owner: firstAttribute(group, ['owner_role', 'owner_name', 'owner', 'business_sponsor_role'], 'Owner not loaded'),
        blocker: firstAttribute(group, ['primary_blocker', 'blocker', 'status_summary'], 'No blocker loaded'),
        budgetNumeric,
        budget: budgetNumeric > 0 ? formatCioTowerMoney(budgetNumeric) : 'gap',
        promisedValueNumeric,
        promisedValue: promisedValueNumeric > 0 ? formatCioTowerMoney(promisedValueNumeric) : 'gap',
        measuredValueNumeric,
        measuredValue: measuredValueNumeric > 0 ? formatCioTowerMoney(measuredValueNumeric) : 'gap',
        valueGap: valueGapNumeric === null ? 'gap' : formatCioTowerMoney(valueGapNumeric),
        evidenceStatus: firstAttribute(group, ['evidence_status', 'value_confidence', 'finance_attested'], 'Evidence status not loaded'),
        confidence: group.map((row) => row.confidence).sort((left, right) => ['high', 'medium', 'low', 'not_loaded'].indexOf(left) - ['high', 'medium', 'low', 'not_loaded'].indexOf(right))[0] ?? 'not_loaded',
      };
    })
    .filter((profile) => profile.budgetNumeric > 0 || profile.promisedValueNumeric > 0 || profile.measuredValueNumeric > 0)
    .sort((left, right) => right.budgetNumeric - left.budgetNumeric)
    .slice(0, limit);
}

function buildTowerTopProgramsTable(facts: readonly CioTowerFactRow[], limit = 10): CioTowerVisibleTable | null {
  const profiles = programValueProfiles(facts, limit);
  if (profiles.length === 0) return null;
  return {
    id: 'top_it_programs_by_budget',
    title: 'Top IT programs by budget and value proof',
    columns: ['Rank', 'Program', 'Owner', 'FY26 budget', 'Promised value', 'Measured value', 'Value gap', 'Evidence', 'Blocker'],
    rows: profiles.map((profile, index) => [
      String(index + 1),
      profile.name,
      profile.owner,
      profile.budget,
      profile.promisedValue,
      profile.measuredValue,
      profile.valueGap,
      profile.evidenceStatus,
      profile.blocker,
    ]),
  };
}

function asksForMetricLineage(question: string): boolean {
  return /lineage|formula|source\s+trace|trace\s+the\s+metric|where.*number.*come/i.test(question);
}

function buildCioTowerDeterministicMetricAnswer(context: CioTowerPromptContext): {
  output: CioTowerVisibleAnswerContract;
  reason: string;
} | null {
  if (context.contract.contract_key === 'tower_top_it_programs_by_budget') {
    const table = buildTowerTopProgramsTable(context.relevantFacts, 10);
    if (!table) return null;
    const initiativeBudget = context.metricPackets.find((packet) => packet.measureKey === 'initiative_budget_fy26');
    const topProgram = table.rows[0]?.[1] ?? 'the largest loaded program';
    const topBudget = table.rows[0]?.[3] ?? 'not loaded';
    const aggregateSentence = initiativeBudget?.valueNumeric
      ? ` The loaded FY26 initiative budget total is ${initiativeBudget.displayValue}.`
      : '';
    return {
      reason: 'Top program budget question answered from loaded Tower program budget facts.',
      output: {
        version: 'cio_tower_visible_answer_v1',
        answer: `${context.tenantName}'s top loaded IT program by FY26 budget is ${topProgram} at ${topBudget}.${aggregateSentence} Tower is ranking the loaded program budget facts it has; it is not filling in missing programs or estimating spend that is not loaded.`,
        tables: [table],
        tabs: [],
        followUpQuestion: 'Do you want Tower to show the decision or risk view for these programs next?',
      },
    };
  }

  if (context.contract.contract_key !== 'tower_total_it_spend') return null;

  const totalBudget = context.metricPackets.find((packet) => packet.measureKey === 'total_it_budget_fy26');
  if (!totalBudget?.valueNumeric) return null;

  if (asksForMetricLineage(context.question)) {
    return {
      reason: 'Exact budget metric lineage answered from governed Tower metric packet.',
      output: {
        version: 'cio_tower_visible_answer_v1',
        answer: `${context.tenantName}'s loaded FY26 IT budget is ${totalBudget.displayValue}. Tower traces that value to the governed Tower budget measure for ${totalBudget.period}, using the ${totalBudget.basis} basis and formula version ${totalBudget.formulaVersion}. It is backed by ${totalBudget.sourceFactKeys.length} supporting Tower fact${totalBudget.sourceFactKeys.length === 1 ? '' : 's'}; Tower does not expose internal fact identifiers in the user-visible answer.`,
        tables: [
          {
            id: 'it_budget_metric_lineage',
            title: 'IT budget metric lineage',
            columns: ['Metric', 'Value', 'Period', 'Basis', 'Formula version', 'Supporting facts'],
            rows: [
              [
                totalBudget.label,
                totalBudget.displayValue,
                totalBudget.period,
                totalBudget.basis,
                totalBudget.formulaVersion,
                String(totalBudget.sourceFactKeys.length),
              ],
            ],
          },
        ],
        tabs: [],
        followUpQuestion: 'Do you want the loaded budget slices behind this metric?',
      },
    };
  }

  const table = asksForBudgetSlice(context.question)
    ? buildTowerBudgetSliceTable(context.relevantFacts)
    : null;
  const answer = table
    ? `${context.tenantName}'s loaded FY26 IT budget is ${totalBudget.displayValue}. The table shows the loaded budget slices available in Tower; it does not invent run/change or actual-spend detail where those fields are missing.`
    : `${context.tenantName}'s loaded FY26 IT budget is ${totalBudget.displayValue}. Use that as the Tower budget envelope; only slice it further where Tower has loaded business-slice facts.`;

  return {
    reason: table ? 'Exact budget-slice question answered from loaded Tower facts.' : 'Exact budget metric question answered from governed Tower metric packet.',
    output: {
      version: 'cio_tower_visible_answer_v1',
      answer,
      tables: table ? [table] : [],
      tabs: [],
      followUpQuestion: table ? null : 'Do you want the loaded budget slices as a table?',
    },
  };
}

async function loadContract(question: string): Promise<CioTowerContract> {
  const key = matchContractKey(question);
  const rows = await azureRead.query<CioTowerContract>(
    `select contract_key, intent, question_family, measure_key, artifact_type, examples
       from cio_tower.question_contracts
      where contract_key = $1 and active = true
      limit 1`,
    [key],
  );
  return rows[0] ?? {
    contract_key: 'tower_outside_scope',
    intent: 'outside_scope',
    question_family: 'outside_tower_scope',
    measure_key: null,
    artifact_type: 'handoff',
    examples: [],
  };
}

async function loadMeasures(tenantKey: string): Promise<CioTowerMeasureResult[]> {
  return azureRead.query<CioTowerMeasureResult>(
    `select mr.measure_key, mr.period, mr.basis, mr.scope, mr.value_numeric, mr.value_json,
            mr.source_fact_keys, mr.formula_version, m.label, m.description
       from cio_tower.measure_results mr
       left join cio_tower.measures m on m.measure_key = mr.measure_key
      where mr.tenant_key = $1
      order by mr.measure_key, mr.period`,
    [tenantKey],
  );
}

function factWhereForContract(contract: CioTowerContract): { views: string[]; limit: number } {
  if (contract.contract_key === 'tower_top_it_programs_by_budget') return { views: ['initiative_budget', 'value'], limit: 120 };
  if (contract.contract_key === 'tower_total_it_spend') return { views: ['it_budget'], limit: 20 };
  if (contract.contract_key === 'tower_run_change_split') return { views: ['it_budget'], limit: 25 };
  if (contract.contract_key === 'tower_value_realization') return { views: ['value', 'initiative_budget'], limit: 30 };
  if (contract.contract_key === 'tower_trend_it_budget') return { views: ['it_budget'], limit: 30 };
  return { views: ['initiative_budget', 'it_budget', 'value'], limit: 20 };
}

async function loadRelevantFacts(tenantKey: string, contract: CioTowerContract): Promise<CioTowerFactRow[]> {
  const { views, limit } = factWhereForContract(contract);
  return azureRead.query<CioTowerFactRow>(
    `select f.fact_key, f.entity_key, f.entity_type, e.display_name as entity_display_name,
            f.measure, f.scope, f.view, f.amount_type, f.basis, f.period, f.value_numeric,
            f.value_text, f.unit, f.value_source, f.confidence, f.source_key, f.source_row,
            f.attributes
       from cio_tower.facts f
       left join cio_tower.entities e on e.entity_key = f.entity_key
      where f.tenant_key = $1
        and f.view = any($2::text[])
      order by coalesce(f.value_numeric, 0) desc, f.created_at desc
      limit ${limit}`,
    [tenantKey, views],
  );
}

async function loadRelationships(tenantKey: string): Promise<CioTowerRelationshipRow[]> {
  return azureRead.query<CioTowerRelationshipRow>(
    `select r.relationship_key,
            from_e.display_name as from_name,
            to_e.display_name as to_name,
            r.relationship_type,
            r.confidence,
            r.source_key,
            r.source_row
       from cio_tower.relationships r
       left join cio_tower.entities from_e on from_e.entity_key = r.from_entity_key
       left join cio_tower.entities to_e on to_e.entity_key = r.to_entity_key
      where r.tenant_key = $1
      order by r.confidence desc, r.created_at desc
      limit 20`,
    [tenantKey],
  );
}

function deriveGaps(contract: CioTowerContract, measures: CioTowerMeasureResult[], facts: CioTowerFactRow[]): string[] {
  const gaps: string[] = [];
  const measureByKey = new Map(measures.map((measure) => [measure.measure_key, measure]));
  const run = measureByKey.get('run_budget_fy26');
  const change = measureByKey.get('change_budget_fy26');
  const actualSpend = measureByKey.get('actual_spend_ytd');
  const measuredValue = measureByKey.get('measured_value_ytd');

  if (contract.contract_key === 'tower_run_change_split' && (!Number(run?.value_numeric) || !Number(change?.value_numeric))) {
    gaps.push('Run/change budget split is not fully populated.');
  }
  if (contract.contract_key === 'tower_value_realization' && !Number(measuredValue?.value_numeric)) {
    gaps.push('Measured value is not populated for the selected initiatives.');
  }
  if (!Number(actualSpend?.value_numeric)) {
    gaps.push('Actual spend YTD is missing or not separately loaded.');
  }
  if (facts.length === 0) {
    gaps.push('No matching Tower facts were found for this question family.');
  }
  return [...new Set(gaps)];
}

function buildCioTowerV6PacketContract(args: {
  tenantKey: string;
  tenantName: string;
  question: string;
  contract: CioTowerContract;
  metricPackets: readonly CioTowerMetricPacket[];
  facts: readonly CioTowerFactRow[];
  relationships: readonly CioTowerRelationshipRow[];
  gaps: readonly string[];
}): ModuleV6PacketContract {
  const loadedMetricLabels = args.metricPackets
    .filter((packet) => packet.valueNumeric !== null)
    .slice(0, 10)
    .map((packet) => `${packet.label}=${packet.displayValue}`);
  return buildModuleV6PacketContract({
    surface: 'tower',
    packetType: 'metric-read-model',
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    question: args.question,
    packetSummary: [
      `Tower contract ${args.contract.contract_key}`,
      `${args.metricPackets.length} governed metric packets`,
      `${args.facts.length} relevant fact records`,
      `${args.relationships.length} relationship records`,
      loadedMetricLabels.length ? `Loaded metrics: ${loadedMetricLabels.join('; ')}` : 'No loaded metric values',
    ].join('. '),
    requiredEvidenceFamilies: [
      'cio_tower.measure_results',
      'cio_tower.facts',
      'cio_tower.relationships',
      'cio_tower.question_contracts',
    ],
    availableEvidenceFamilies: [
      ...(args.metricPackets.length ? ['governed metric packets'] : []),
      ...(args.facts.length ? ['tower facts'] : []),
      ...(args.relationships.length ? ['tower relationships'] : []),
    ],
    missingEvidence: args.gaps,
  });
}

export async function loadCioTowerPromptContext(args: {
  tenantKey: string;
  tenantName: string;
  question: string;
}): Promise<CioTowerPromptContext> {
  const contract = await loadContract(args.question);
  const [measures, relevantFacts, relationships] = await Promise.all([
    loadMeasures(args.tenantKey),
    loadRelevantFacts(args.tenantKey, contract),
    loadRelationships(args.tenantKey),
  ]);
  const metricPackets = measures.map(toCioTowerMetricPacket);
  const gaps = deriveGaps(contract, measures, relevantFacts);
  const v6PacketContract = buildCioTowerV6PacketContract({
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    question: args.question,
    contract,
    metricPackets,
    facts: relevantFacts,
    relationships,
    gaps,
  });
  return {
    tenantKey: args.tenantKey,
    tenantName: args.tenantName,
    question: args.question,
    contract,
    measures,
    metricPackets,
    relevantFacts,
    relationships,
    gaps,
    v6PacketContract,
  };
}

async function persistPromptAndTrace(args: {
  context: CioTowerPromptContext;
  promptText: string;
  promptHash: string;
  rawResponse: string;
  parsedOutput: CioTowerVisibleAnswerContract | null;
  validationErrors: string[];
  latencyMs: number;
  modelName?: string;
}): Promise<{ promptPackageKey: string; traceKey: string; v6VisibleOutputAudit: ModuleV6VisibleOutputAudit }> {
  const promptPackageKey = stableKey('cio_tower_prompt', [args.context.tenantKey, args.context.question, args.promptHash, new Date().toISOString()]);
  const traceKey = stableKey('cio_tower_trace', [promptPackageKey, args.rawResponse]);
  const deterministicPacket = {
    promptVersion: PROMPT_VERSION,
    tenantKey: args.context.tenantKey,
    question: args.context.question,
    contract: args.context.contract,
    measures: args.context.measures,
    metricPackets: args.context.metricPackets,
    relevantFacts: args.context.relevantFacts,
    relationships: args.context.relationships,
    gaps: args.context.gaps,
    v6PacketContract: args.context.v6PacketContract,
  };
  const renderedResponse = args.parsedOutput
    ? collectVisibleTextFromContract(args.parsedOutput).join('\n\n')
    : null;
  const v6VisibleOutputAudit = args.parsedOutput
    ? buildModuleV6VisibleOutputAudit({
      surface: 'tower',
      packetType: 'metric-read-model',
      answerSource: args.modelName === BOUNDARY_MODEL_NAME ? 'deterministic_contract' : 'claude_text',
      claudeInvoked: args.modelName !== BOUNDARY_MODEL_NAME,
      claudeSelected: args.modelName !== BOUNDARY_MODEL_NAME,
      fallbackUsed: false,
      rawClaudePreserved: true,
      sections: collectVisibleSectionsFromContract(args.parsedOutput),
      validationErrors: args.validationErrors,
    })
    : buildModuleV6VisibleOutputAudit({
      surface: 'tower',
      packetType: 'metric-read-model',
      answerSource: 'contract_failed',
      claudeInvoked: args.modelName !== BOUNDARY_MODEL_NAME,
      claudeSelected: false,
      fallbackUsed: false,
      rawClaudePreserved: false,
      sections: [],
      validationErrors: args.validationErrors,
    });
  const tx = createTxSession('abarva-cio-tower-answer-trace');
  await tx(async (run) => {
    await run(
      `insert into cio_tower.prompt_packages
        (prompt_package_key, tenant_key, surface, user_question, contract_key, measure_key,
         deterministic_packet, prompt_text, prompt_hash, model_name)
       values ($1,$2,'tower',$3,$4,$5,$6::jsonb,$7,$8,$9)
       on conflict (prompt_package_key) do nothing`,
      [
        promptPackageKey,
        args.context.tenantKey,
        args.context.question,
        args.context.contract.contract_key,
        args.context.contract.measure_key,
        JSON.stringify(deterministicPacket),
        args.promptText,
        args.promptHash,
        args.modelName ?? MODEL_NAME,
      ],
    );
    await run(
      `insert into cio_tower.answer_traces
        (trace_key, tenant_key, surface, user_question, contract_key, measure_key, prompt_package_key,
         raw_model_response, rendered_response, artifacts, validation_status, validation_errors, latency_ms, model_name)
       values ($1,$2,'tower',$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11::jsonb,$12,$13)
       on conflict (trace_key) do nothing`,
      [
        traceKey,
        args.context.tenantKey,
        args.context.question,
        args.context.contract.contract_key,
        args.context.contract.measure_key,
        promptPackageKey,
        args.rawResponse,
        renderedResponse,
        JSON.stringify({
          artifact_type: args.context.contract.artifact_type,
          api_renderer_mutation: false,
          v6_module_contract: args.context.v6PacketContract,
          v6_visible_output_audit: v6VisibleOutputAudit,
          visible_answer_contract: args.parsedOutput,
          visible_section_parity: args.parsedOutput
            ? v6VisibleOutputAudit.visibleSectionParity.map((section, index) => ({
              index,
              model_text: section.modelText,
              rendered_text: section.renderedText,
              byte_equal_except_whitespace: section.byteEqualExceptWhitespace,
            }))
            : [],
        }),
        args.validationErrors.length ? 'failed' : 'passed',
        JSON.stringify(args.validationErrors),
        args.latencyMs,
        args.modelName ?? MODEL_NAME,
      ],
    );
  });
  return { promptPackageKey, traceKey, v6VisibleOutputAudit };
}

export async function answerCioTowerQuestion(args: {
  tenantId: string;
  userId?: string | null;
  tenantKey: string;
  tenantName: string;
  question: string;
}): Promise<CioTowerAnswerResult> {
  const startedAt = Date.now();
  const context = await loadCioTowerPromptContext(args);
  const boundary = classifyCioTowerBoundary(args.question);
  if (boundary) {
    const parsedOutput = buildCioTowerBoundaryAnswer(boundary);
    const rawResponse = JSON.stringify(parsedOutput);
    const promptText = buildCioTowerBoundaryPrompt({ context, boundary, output: parsedOutput });
    const promptHash = sha256(promptText);
    const validationErrors = validateParsedVisibleAnswer({
      contractKey: context.contract.contract_key,
      metricPackets: context.metricPackets,
      parsedOutput,
    });
    const latencyMs = Date.now() - startedAt;
    const { promptPackageKey, traceKey, v6VisibleOutputAudit } = await persistPromptAndTrace({
      context,
      promptText,
      promptHash,
      rawResponse,
      parsedOutput,
      validationErrors,
      latencyMs,
      modelName: BOUNDARY_MODEL_NAME,
    });
    if (validationErrors.length) {
      const error = new Error(`cio_tower_visible_contract_validation_failed:${validationErrors.join(',')}`);
      (error as Error & { cause?: unknown }).cause = {
        promptPackageKey,
        traceKey,
        rawResponse,
        validationErrors,
      };
      throw error;
    }
    return {
      response: parsedOutput.answer,
      modelOutputRaw: rawResponse,
      modelOutput: parsedOutput,
      promptPackageKey,
      traceKey,
      promptHash,
      model: BOUNDARY_MODEL_NAME,
      validationStatus: 'passed',
      validationErrors,
      latencyMs,
      v6VisibleOutputAudit,
    };
  }

  const deterministicMetric = buildCioTowerDeterministicMetricAnswer(context);
  if (deterministicMetric) {
    const parsedOutput = deterministicMetric.output;
    const rawResponse = JSON.stringify(parsedOutput);
    const promptText = buildCioTowerDeterministicPrompt({
      context,
      output: parsedOutput,
      reason: deterministicMetric.reason,
    });
    const promptHash = sha256(promptText);
    const validationErrors = validateParsedVisibleAnswer({
      contractKey: context.contract.contract_key,
      metricPackets: context.metricPackets,
      parsedOutput,
    });
    const latencyMs = Date.now() - startedAt;
    const { promptPackageKey, traceKey, v6VisibleOutputAudit } = await persistPromptAndTrace({
      context,
      promptText,
      promptHash,
      rawResponse,
      parsedOutput,
      validationErrors,
      latencyMs,
      modelName: BOUNDARY_MODEL_NAME,
    });
    if (validationErrors.length) {
      const error = new Error(`cio_tower_visible_contract_validation_failed:${validationErrors.join(',')}`);
      (error as Error & { cause?: unknown }).cause = {
        promptPackageKey,
        traceKey,
        rawResponse,
        validationErrors,
      };
      throw error;
    }
    return {
      response: parsedOutput.answer,
      modelOutputRaw: rawResponse,
      modelOutput: parsedOutput,
      promptPackageKey,
      traceKey,
      promptHash,
      model: BOUNDARY_MODEL_NAME,
      validationStatus: 'passed',
      validationErrors,
      latencyMs,
      v6VisibleOutputAudit,
    };
  }

  const promptText = buildCioTowerClaudePrompt(context);
  const promptHash = sha256(promptText);
  const preflight = await preflightAnthropicDirectClient({
    tenantId: args.tenantId,
    userId: args.userId ?? undefined,
    workflow: 'cio-tower-chat',
    model: MODEL_NAME,
    prompt: promptText,
    dataClass: 'confidential',
    metadata: {
      surface: 'tower',
      promptVersion: PROMPT_VERSION,
      contractKey: context.contract.contract_key,
      tenantKey: args.tenantKey,
    },
  });
  if (!preflight.ok) {
    throw new Error(`ai_egress_blocked:${preflight.reason}`);
  }

  const response = await preflight.client.messages.create({
    model: MODEL_NAME,
    temperature: TEMPERATURE,
    max_tokens: MAX_TOKENS,
    messages: [{ role: 'user', content: promptText }],
  });
  let rawResponse = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n');
  let parsedOutput: CioTowerVisibleAnswerContract | null = null;
  let validationErrors: string[] = [];
  try {
    parsedOutput = parseVisibleAnswerContract(rawResponse);
  } catch (error) {
    validationErrors.push(error instanceof Error ? error.message : 'cio_tower_visible_contract_parse_failed');
  }
  if (parsedOutput) {
    validationErrors = validateParsedVisibleAnswer({
      contractKey: context.contract.contract_key,
      metricPackets: context.metricPackets,
      parsedOutput,
    });
  }

  if (validationErrors.length) {
    const repairPrompt = buildCioTowerRepairPrompt({
      originalPrompt: promptText,
      rawModelOutput: rawResponse,
      validationErrors,
    });
    const repairPreflight = await preflightAnthropicDirectClient({
      tenantId: args.tenantId,
      userId: args.userId ?? undefined,
      workflow: 'cio-tower-chat-repair',
      model: MODEL_NAME,
      prompt: repairPrompt,
      dataClass: 'confidential',
      metadata: {
        surface: 'tower',
        promptVersion: PROMPT_VERSION,
        contractKey: context.contract.contract_key,
        tenantKey: args.tenantKey,
        repairFor: validationErrors.join(','),
      },
    });
    if (!repairPreflight.ok) {
      throw new Error(`ai_egress_blocked:${repairPreflight.reason}`);
    }
    const repairResponse = await repairPreflight.client.messages.create({
      model: MODEL_NAME,
      temperature: TEMPERATURE,
      max_tokens: MAX_REPAIR_TOKENS,
      messages: [{ role: 'user', content: repairPrompt }],
    });
    rawResponse = repairResponse.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text)
      .join('\n');
    parsedOutput = null;
    validationErrors = [];
    try {
      parsedOutput = parseVisibleAnswerContract(rawResponse);
    } catch (error) {
      validationErrors.push(error instanceof Error ? error.message : 'cio_tower_visible_contract_parse_failed');
    }
    if (parsedOutput) {
      validationErrors = validateParsedVisibleAnswer({
        contractKey: context.contract.contract_key,
        metricPackets: context.metricPackets,
        parsedOutput,
      });
    }
  }
  const latencyMs = Date.now() - startedAt;
  const { promptPackageKey, traceKey, v6VisibleOutputAudit } = await persistPromptAndTrace({
    context,
    promptText,
    promptHash,
    rawResponse,
    parsedOutput,
    validationErrors,
    latencyMs,
  });

  if (!parsedOutput) {
    const error = new Error('cio_tower_visible_contract_parse_failed');
    (error as Error & { cause?: unknown }).cause = { promptPackageKey, traceKey, rawResponse };
    throw error;
  }
  if (validationErrors.length) {
    const error = new Error(`cio_tower_visible_contract_validation_failed:${validationErrors.join(',')}`);
    (error as Error & { cause?: unknown }).cause = {
      promptPackageKey,
      traceKey,
      rawResponse,
      validationErrors,
    };
    throw error;
  }

  return {
    response: parsedOutput.answer,
    modelOutputRaw: rawResponse,
    modelOutput: parsedOutput,
    promptPackageKey,
    traceKey,
    promptHash,
    model: MODEL_NAME,
    validationStatus: 'passed',
    validationErrors,
    latencyMs,
    v6VisibleOutputAudit,
  };
}
