type AgentKey = 'ava' | 'sentinel' | 'nexus';
type ModuleKey = 'intelligence' | 'moves' | 'source';

export interface AgentContextSourceLike {
  type?: string | null;
  id?: string | null;
  name?: string | null;
  detail?: string | null;
  confidence?: number | string | null;
}

export interface AgentContextMix {
  totalSources: number;
  tenantFactCount: number;
  industryPatternCount: number;
  aiInsertionPatternCount: number;
  sourceDiligenceSignalCount: number;
}

interface AgentContextContractInput {
  agent: AgentKey;
  module: ModuleKey;
  sources?: readonly AgentContextSourceLike[];
}

const TENANT_SOURCE_TYPES = new Set([
  'tenant',
  'graph',
  'surface',
  'client_fact',
  'engagement',
]);

const PATTERN_SOURCE_TYPES = new Set([
  'pattern',
  'framework',
  'benchmark',
  'research',
  'regulation',
]);

const AI_INSERTION_RE =
  /\b(ai|genai|generative|agentic|ambient|copilot|code assistant|model drift|ml|machine learning|prediction|personalization|computer vision|document ai|chatbot|bot|automation)\b/i;

const SOURCE_DILIGENCE_RE =
  /\b(source|sourcing|rfp|rfi|bafo|vendor|contract|renewal|clause|sla|baa|subprocessor|indemnity|telemetry|exit rights?|pricing|procurement)\b/i;

function normalizeType(source: AgentContextSourceLike): string {
  return String(source.type ?? '').trim().toLowerCase();
}

function sourceText(source: AgentContextSourceLike): string {
  return [source.id, source.name, source.detail]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ');
}

export function classifyAgentContextMix(sources: readonly AgentContextSourceLike[] = []): AgentContextMix {
  let tenantFactCount = 0;
  let industryPatternCount = 0;
  let aiInsertionPatternCount = 0;
  let sourceDiligenceSignalCount = 0;

  for (const source of sources) {
    const type = normalizeType(source);
    const text = sourceText(source);
    if (TENANT_SOURCE_TYPES.has(type)) tenantFactCount += 1;
    if (PATTERN_SOURCE_TYPES.has(type)) industryPatternCount += 1;
    if (PATTERN_SOURCE_TYPES.has(type) && AI_INSERTION_RE.test(text)) aiInsertionPatternCount += 1;
    if (SOURCE_DILIGENCE_RE.test(text)) sourceDiligenceSignalCount += 1;
  }

  return {
    totalSources: sources.length,
    tenantFactCount,
    industryPatternCount,
    aiInsertionPatternCount,
    sourceDiligenceSignalCount,
  };
}

function moduleMandate(module: ModuleKey): string {
  if (module === 'moves') {
    return [
      'Module mandate: MOVES.',
      'Translate context into a fundable or killable Move: thesis, scope, sponsor, business case, value model, risks, dependencies, adoption/change plan, approval gates, unsafe-to-fund conditions, and Tower handoff.',
      'When AI is involved, include model/data governance, human approval points, adoption telemetry, value-realization evidence, and failure pre-mortem conditions.',
    ].join('\n');
  }
  if (module === 'source') {
    return [
      'Module mandate: SOURCE.',
      'Translate context into procurement leverage: vendor diligence, RFI/RFP questions, contract clauses, BAA/subprocessor or regulatory checks where relevant, productivity guarantees, adoption telemetry, exit rights, BAFO counters, and savings proof.',
      'When AI is involved, test indemnity, model-risk controls, data-use rights, deployment-site validation, drift monitoring, and human-review obligations.',
    ].join('\n');
  }
  return [
    'Module mandate: INTELLIGENCE.',
    'Answer what is true, what matters, what is uncertain, and what decision should be shaped next. Use tenant facts first, industry/corpus patterns second, and general model expertise only as the third layer.',
    'When AI is involved, identify the specific AI capability category, the workflow insertion point, the governance/control hook, and whether it belongs in Moves, Source, or Tower next.',
  ].join('\n');
}

function agentName(agent: AgentKey): string {
  if (agent === 'ava') return 'aVa';
  if (agent === 'sentinel') return 'aVa';
  return agent === 'nexus' ? 'Moves' : 'aVa';
}

export function buildAgentContextContractBlock(input: AgentContextContractInput): string {
  const mix = classifyAgentContextMix(input.sources ?? []);
  const tenantEvidenceRule = mix.tenantFactCount > 0
    ? 'Tenant evidence is present. Lead with it for tenant-specific claims and cite the business implication.'
    : 'Tenant evidence is thin or absent. Label guidance as pattern-based; do not invent tenant names, dollars, dates, systems, vendors, or sponsors.';
  const patternRule = mix.industryPatternCount > 0
    ? 'Industry/corpus patterns are present. Use them to explain failure modes, approval gates, sourcing traps, and value-realization risks.'
    : 'Industry/corpus patterns are absent. Use domain expertise carefully and name the missing corpus lens if it would materially change the recommendation.';
  const aiRule = mix.aiInsertionPatternCount > 0
    ? 'AI-insertion patterns are present. Tie AI recommendations to workflow controls, human gates, telemetry, and vendor obligations.'
    : 'If the question involves AI, still reason through the AI insertion point, control hook, adoption telemetry, and vendor obligations; do not leave AI as a generic capability label.';

  return [
    `AGENT CONTEXT CONTRACT — ${agentName(input.agent).toUpperCase()} / ${input.module.toUpperCase()}`,
    `Context mix: tenant facts=${mix.tenantFactCount}; industry/corpus patterns=${mix.industryPatternCount}; AI-insertion patterns=${mix.aiInsertionPatternCount}; Source diligence signals=${mix.sourceDiligenceSignalCount}; total sources=${mix.totalSources}.`,
    tenantEvidenceRule,
    patternRule,
    aiRule,
    moduleMandate(input.module),
    'Consultant-replacement bar: every substantive answer must improve a decision. Prefer concrete gates, artifacts, clauses, evidence gaps, risks, owners, and next actions over generic summaries.',
  ].join('\n');
}
