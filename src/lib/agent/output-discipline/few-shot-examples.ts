import {
  AGENT_OUTPUT_GOLDEN_FIXTURES,
  type AgentOutputGoldenFixture,
  type OutputDisciplineAgent,
  type OutputShapePattern,
} from './golden-fixtures';

export interface AgentOutputFewShotExample {
  id: string;
  agent: OutputDisciplineAgent;
  surface: string;
  pattern: OutputShapePattern;
  question: string;
  retrievalPlan: string[];
  output: string;
}

const selectedFixtureIds: Record<OutputDisciplineAgent, string[]> = {
  nexus: [
    'nexus-retail-merch-value',
    'nexus-retail-compare-moves',
    'nexus-fs-kyc-move',
    'nexus-healthcare-background',
    'nexus-retail-missing-data',
    'nexus-source-handoff',
  ],
  sentinel: [
    'sentinel-retail-usecase-landscape',
    'sentinel-healthcare-ambient-pattern',
    'sentinel-fs-regulatory',
    'sentinel-retail-score-profile',
    'sentinel-healthcare-i-dont-know',
    'sentinel-source-handoff',
  ],
  atlas: [
    'atlas-retail-value-risk',
    'atlas-fs-risk-table',
    'atlas-retail-data-says',
    'atlas-cross-board-summary',
    'atlas-healthcare-steps',
    'atlas-fs-unknown',
  ],
  source: [
    'source-retail-bafo',
    'source-healthcare-vendor-table',
    'source-fs-rfp',
    'source-retail-longlist',
    'source-cross-ambiguous-status',
    'source-cross-handoff-nexus',
  ],
  steward: [
    'steward-retail-readiness',
    'steward-healthcare-connectors',
    'steward-fs-data-trust',
    'steward-cross-role-mapping',
    'steward-retail-unknown',
    'steward-cross-narrative',
  ],
};

const retrievalPlans: Record<string, string[]> = {
  'nexus-retail-merch-value': [
    'Read Apex tenant current-state KPIs, active merchandising Moves, and systems context.',
    'Retrieve retail merchandising and demand-sensing patterns before ranking value.',
    'Name missing KPI evidence that could change the ranking.',
  ],
  'nexus-retail-compare-moves': [
    'Retrieve candidate Move patterns and current Apex strategic priorities.',
    'Compare options by value line, evidence strength, and implementation risk.',
    'Recommend the first Move and identify the second-best path.',
  ],
  'nexus-fs-kyc-move': [
    'Retrieve KYC, model-risk, and compliance workflow patterns.',
    'Separate agent-assist actions from human-owned approval decisions.',
    'Ask for baseline queue, exception, and audit metrics before business-case claims.',
  ],
  'nexus-healthcare-background': [
    'Read tenant clinical context and the relevant healthcare operating-model pattern.',
    'Use brief narrative only when causal context matters more than choices.',
    'Do not create unsupported adoption or savings estimates.',
  ],
  'nexus-retail-missing-data': [
    'Check tenant evidence first, then pattern corpus.',
    'Answer the partial question with what is known.',
    'List the smallest missing data set needed to decide.',
  ],
  'nexus-source-handoff': [
    'Recognize vendor-depth work as Source-owned.',
    'Preserve the Move-shaping recommendation.',
    'Offer a handoff without pretending Nexus has sourced vendor evidence.',
  ],
  'sentinel-retail-usecase-landscape': [
    'Retrieve retail use-case patterns by front, middle, and back office.',
    'Score fit against tenant strategy and available evidence.',
    'Use a table when comparing multiple use-case families.',
  ],
  'sentinel-healthcare-ambient-pattern': [
    'Retrieve healthcare ambient documentation success and failure patterns.',
    'Surface sponsorship, workflow adoption, and privacy evidence requirements.',
    'Avoid vendor evaluation depth; hand off when needed.',
  ],
  'sentinel-fs-regulatory': [
    'Retrieve financial-services regulatory and model-risk patterns.',
    'Separate regulatory exposure from implementation mechanics.',
    'Name evidence gaps explicitly.',
  ],
  'sentinel-retail-score-profile': [
    'Retrieve Apex retail readiness facts and demand-sensing patterns.',
    'Use stat-stack when the user asks for a score or evidence read.',
    'Separate strong signals from weak or missing signals.',
  ],
  'sentinel-healthcare-i-dont-know': [
    'Check corpus coverage and tenant evidence.',
    'When evidence is insufficient, say so directly.',
    'Offer the next retrieval or upload step.',
  ],
  'sentinel-source-handoff': [
    'Answer the pattern landscape briefly.',
    'Defer vendor and commercial evaluation to Source.',
    'Carry the use-case context forward.',
  ],
  'sentinel-cross-long-question': [
    'Compress long user framing into the core decision.',
    'Answer in one concise narrative when detail would distract.',
    'Avoid broad consulting abstractions.',
  ],
  'atlas-retail-value-risk': [
    'Read portfolio value, KPI confidence, and active blocker context.',
    'Separate projected, tracked, and verified value.',
    'Prioritize by evidence-backed enterprise value.',
  ],
  'atlas-fs-risk-table': [
    'Retrieve portfolio risk and financial-services control patterns.',
    'Use a table when comparing risk options.',
    'Tie each option to financial confidence and control evidence.',
  ],
  'atlas-retail-data-says': [
    'Use tenant KPIs before pattern averages.',
    'Use stat-stack for evidence questions.',
    'Keep missing or stale metrics visible.',
  ],
  'atlas-cross-board-summary': [
    'Use brief narrative for board context.',
    'Name the portfolio implication without over-explaining.',
    'Keep provenance available but not noisy.',
  ],
  'atlas-healthcare-steps': [
    'Retrieve value-realization and healthcare operating-model patterns.',
    'Explain the path in numbered steps.',
    'Keep ownership of value verification explicit.',
  ],
  'atlas-fs-unknown': [
    'Do not invent value when baselines are absent.',
    'State what can and cannot be ranked.',
    'Ask for the smallest evidence set required.',
  ],
  'source-retail-bafo': [
    'Read source event stage, vendor evidence, and commercial guardrails.',
    'Use lead-bullets for BAFO guidance.',
    'Keep Source lane focused on vendor/commercial decisions.',
  ],
  'source-healthcare-vendor-table': [
    'Retrieve vendor comparison evidence and healthcare compliance constraints.',
    'Use a compact table for vendor options.',
    'Avoid unsupported superiority claims.',
  ],
  'source-fs-rfp': [
    'Retrieve RFP and regulated-workflow requirements.',
    'Explain construction steps sequentially.',
    'Require control, audit, and data-rights evidence.',
  ],
  'source-retail-longlist': [
    'Compare vendors or categories in a table.',
    'Keep columns to fit, risk, evidence, and next step.',
    'Do not overbuild a full RFP in chat.',
  ],
  'source-cross-ambiguous-status': [
    'When vendor status is ambiguous, do not guess.',
    'Name known evidence and missing commercial facts.',
    'Recommend the next sourcing action.',
  ],
  'source-cross-handoff-nexus': [
    'Identify when a sourcing question is really Move-shaping.',
    'Answer the commercial implication briefly.',
    'Handoff to Nexus with context carried.',
  ],
  'steward-retail-readiness': [
    'Read tenant setup, connector, identity, and evidence readiness.',
    'Use lead-bullets for readiness gaps.',
    'Name the operational owner or missing owner.',
  ],
  'steward-healthcare-connectors': [
    'Compare setup dependencies in a table.',
    'Prioritize privacy, identity, and clinical data readiness.',
    'Avoid claiming clinical facts from setup metadata alone.',
  ],
  'steward-fs-data-trust': [
    'Explain data-trust remediation as steps.',
    'Separate access, lineage, freshness, and approval state.',
    'Escalate blocked governance items.',
  ],
  'steward-cross-role-mapping': [
    'Use stat-stack when the question asks what setup data proves.',
    'Show only evidence-backed readiness facts.',
    'Keep governance terms operational.',
  ],
  'steward-retail-unknown': [
    'Say when setup lacks the answer.',
    'Name the exact missing owner or connector.',
    'Offer the next setup action.',
  ],
  'steward-cross-narrative': [
    'Use brief narrative for why setup quality affects agent quality.',
    'Connect identity, evidence freshness, access scope, and retrieval.',
    'Do not blame the model for missing source-of-truth data.',
  ],
};

const fixturesById = new Map<string, AgentOutputGoldenFixture>(
  AGENT_OUTPUT_GOLDEN_FIXTURES.map((fixture) => [fixture.id, fixture]),
);

function fewShotFromFixture(id: string): AgentOutputFewShotExample {
  const fixture = fixturesById.get(id);
  if (!fixture) {
    throw new Error(`Missing golden fixture for few-shot example: ${id}`);
  }

  return {
    id,
    agent: fixture.agent,
    surface: fixture.surface,
    pattern: fixture.pattern,
    question: fixture.question,
    retrievalPlan: retrievalPlans[id] ?? ['Retrieve tenant context, corpus patterns, and evidence before answering.'],
    output: fixture.output,
  };
}

export function getAgentOutputFewShotExamples(agent: OutputDisciplineAgent): AgentOutputFewShotExample[] {
  return selectedFixtureIds[agent].map(fewShotFromFixture);
}

export const AGENT_OUTPUT_FEW_SHOT_EXAMPLES: AgentOutputFewShotExample[] = Object.keys(selectedFixtureIds)
  .flatMap((agent) => getAgentOutputFewShotExamples(agent as OutputDisciplineAgent));
