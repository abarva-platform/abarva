export type AgentOutputShape =
  | 'cxo-decision-digest'
  | 'lead-bullets'
  | 'lead-table'
  | 'stat-stack'
  | 'sequential-steps'
  | 'brief-narrative';

export type OutputDisciplinedAgent = 'nexus' | 'sentinel' | 'atlas' | 'source' | 'steward';

interface AgentLengthBudget {
  softWords: number;
  hardWords: number;
  guidance: string;
}

export const AGENT_OUTPUT_CONTRACT_VERSION = '2026-06-05';

export const AGENT_OUTPUT_SHAPES: readonly AgentOutputShape[] = [
  'cxo-decision-digest',
  'lead-bullets',
  'lead-table',
  'stat-stack',
  'sequential-steps',
  'brief-narrative',
];

export const AGENT_OUTPUT_LENGTH_BUDGETS: Record<OutputDisciplinedAgent, AgentLengthBudget> = {
  nexus: {
    softWords: 200,
    hardWords: 350,
    guidance: 'Move shaping should stay decisive.',
  },
  sentinel: {
    softWords: 250,
    hardWords: 400,
    guidance: 'Pattern and use-case answers may need provenance.',
  },
  atlas: {
    softWords: 220,
    hardWords: 350,
    guidance: 'Portfolio answers should be action-oriented.',
  },
  source: {
    softWords: 350,
    hardWords: 500,
    guidance: 'Vendor comparisons may need tables.',
  },
  steward: {
    softWords: 180,
    hardWords: 300,
    guidance: 'Setup/readiness answers should be short and operational.',
  },
};

export function normalizeOutputDisciplinedAgent(agentName: string | null | undefined): OutputDisciplinedAgent {
  const normalized = (agentName ?? '').trim().toLowerCase();
  if (normalized.includes('sentinel')) return 'sentinel';
  if (normalized.includes('atlas')) return 'atlas';
  if (normalized.includes('source')) return 'source';
  if (normalized.includes('steward')) return 'steward';
  return 'nexus';
}

export function composeRuntimeOutputDisciplineBlock(agentName: string | null | undefined): string {
  const agent = normalizeOutputDisciplinedAgent(agentName);
  const budget = AGENT_OUTPUT_LENGTH_BUDGETS[agent];

  return [
    `AGENT OUTPUT CONTRACT v${AGENT_OUTPUT_CONTRACT_VERSION}`,
    `Length budget for ${agent}: soft ${budget.softWords} words, hard ${budget.hardWords} words. ${budget.guidance}`,
    'Use the three-depth CXO reading model: answer visible in 5 seconds, evidence browsable in 30 seconds, deeper provenance available only when needed.',
    'Always lead with a 1-2 sentence answer to the exact question before adding support.',
    'For hard CXO or strategic questions, default to cxo-decision-digest unless the user explicitly asks for a different format.',
    'CXO decision digest labels: My read; Why; Decision fork; What I would do next; Evidence gap.',
    'CXO decision digest rule: the answer must be scannable in 10 seconds, name the recommendation, show 2-3 evidence-backed reasons, present 2 clear options when strategy depends on uncertainty, end with one concrete next move or one evidence gap.',
    'Simple factual questions stay simple: answer in one short paragraph or 2-3 bullets and do not force a report-shaped response.',
    'Choose exactly one top-level answer shape: cxo-decision-digest, lead-bullets, lead-table, stat-stack, sequential-steps, or brief-narrative.',
    'Shape selection: hard CXO recommendation or strategic judgment = cxo-decision-digest; simple recommendation or warning = lead-bullets; comparison = lead-table; evidence or benchmark = stat-stack; workflow or path = sequential-steps; context or causal explanation = brief-narrative.',
    'Limits: no paragraph over 3 sentences; no more than 5 bullets or numbered steps at one level; no table over 5 columns; no bullet that reads like a paragraph.',
    'CXO digestibility: avoid wall-of-text answers over roughly 120 words before the first visual break; break complex answers into the named short sections.',
    'Format hygiene: do not emit raw markdown emphasis markers such as **bold** or *italic*. Use plain text, spacing, bullets, numbered steps, or compact tables.',
    'Citation hygiene: do not show raw pattern, use-case, vendor, database field, or artifact IDs as user-facing text unless the user explicitly asks for evidence-field references. Name the human-readable pattern or source basis, then include confidence when it changes the recommendation.',
    'Specificity: when the user asks where the value is, rank from available tenant KPIs, financials, strategic priorities, systems, current programs, and evidence. State exactly what is missing.',
    'Overflow rule: if a full answer would exceed the hard limit, give the recommendation plus the top evidence and end with "I have more context if useful. What should I go deeper on?"',
  ].join('\n');
}
