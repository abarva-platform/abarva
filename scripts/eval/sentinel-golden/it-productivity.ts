import { classifySentinelIntent, runSentinelReasoning } from '../../../src/lib/agents/sentinel-reasoning';
import { callSentinelModel } from '../../../src/lib/agents/sentinel-reasoning/model';

const QUESTIONS = [
  'As Apex CTO, where should I use AI to improve IT productivity without just buying more tools?',
  'How should we segment the application portfolio by TIME and AI fit?',
  'What is the operating model for developer productivity with Copilot and DORA?',
  'Which AI tooling governance controls matter before broad rollout?',
  'How do we turn application rationalization into sibling Moves?',
  'What should the Wave 0 charter say for an IT productivity program?',
  'Where can AI reduce run spend in AMS and legacy applications?',
  'What roles do we need for an AI platform operating model?',
  'How should we connect DevEx telemetry, DORA, and value tracking?',
  'What Source workflows should sit beside an IT productivity Move?',
];

const EXPECTED_STAGE_COUNT = 6;
const MIN_PASSING = 8;

type EvalCase = {
  question: string;
  pass: boolean;
  reasons: string[];
  stageCount: number;
  minCitations: number;
  proposalCount: number;
};

async function evaluateQuestion(question: string, clientId: string): Promise<EvalCase> {
  const reasons: string[] = [];
  const intent = await classifySentinelIntent({ query: question, clientId, userId: 'sentinel-golden-eval' });
  const stages = [];
  for await (const stage of runSentinelReasoning({ query: question, clientId, userId: 'sentinel-golden-eval' })) {
    stages.push(stage);
  }

  await callSentinelModel({
    clientId,
    userId: 'sentinel-golden-eval',
    workflow: 'sentinel-golden-eval',
    dataClass: 'internal',
    prompt: JSON.stringify({
      rubric: 'Rubric S smoke: six stages, citations, dissent, sibling move CTA.',
      question,
      intent,
      stages: stages.map((stage) => ({
        id: stage.id,
        citationCount: stage.citations.length,
        hasDissent: Boolean(stage.dissent),
        proposals: stage.oneClickAction?.payload.proposals.length ?? 0,
      })),
    }),
    fallbackResponse: JSON.stringify({ pass: true }),
    metadata: { stageCount: stages.length },
  });

  if (intent.intent !== 'it_productivity') reasons.push('intent_not_it_productivity');
  if (stages.length !== EXPECTED_STAGE_COUNT) reasons.push(`stage_count_${stages.length}`);
  const minCitations = stages.reduce((min, stage) => Math.min(min, stage.citations.length), Number.POSITIVE_INFINITY);
  if (minCitations < 3) reasons.push(`min_citations_${minCitations}`);
  const finalStage = stages.find((stage) => stage.id === 'sibling_move_portfolio');
  if (!finalStage?.dissent) reasons.push('missing_dissent');
  const proposalCount = finalStage?.oneClickAction?.payload.proposals.length ?? 0;
  if (proposalCount < 4) reasons.push(`proposal_count_${proposalCount}`);

  return {
    question,
    pass: reasons.length === 0,
    reasons,
    stageCount: stages.length,
    minCitations: Number.isFinite(minCitations) ? minCitations : 0,
    proposalCount,
  };
}

async function main() {
  const clientId = process.env.SENTINEL_GOLDEN_CLIENT_ID ?? 'apexretail';
  const results: EvalCase[] = [];
  for (const question of QUESTIONS) {
    results.push(await evaluateQuestion(question, clientId));
  }

  const passing = results.filter((result) => result.pass).length;
  const summary = {
    pass: passing >= MIN_PASSING,
    passing,
    total: results.length,
    threshold: MIN_PASSING,
    results,
  };

  console.log(JSON.stringify(summary, null, 2));
  if (!summary.pass) process.exitCode = 1;
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
