import { shapeAgentResponseForSurface } from '@/lib/agent/response-shape';

type AgentSurface = '/strategic-moves/new' | '/tower' | '/intelligence' | '/source' | '/setup';

interface PromptCase {
  id: string;
  surface: AgentSurface;
  personaLens: string;
  prompt: string;
  rawAnswer: string;
  mustInclude: ReadonlyArray<string>;
}

const PROMPT_CASES: PromptCase[] = [
  {
    id: 'cipo-merchandising-value',
    surface: '/strategic-moves/new',
    personaLens: 'Retail CIPO: product, engineering, data, UX, AI, and measurable merchandising value',
    prompt:
      'For Apex Retail, where is the biggest AI value in merchandising based on our current KPIs, financials, systems, and strategy? If data is missing, be explicit.',
    rawAnswer:
      '**Demand forecasting is the highest-value AI target in merchandising.** Here is the ranking: **1. Demand Forecasting / Inventory Optimization** — Highest confidence - MAPE at 28.4% (target 20%); inventory turns down to 3.6x from 4.2x; stockout rate up to 4.2%; markdown rate at 12.8% (target 11%). The $248M revenue gap and EBITDA margin compression both trace directly to forecast failure. **2. Markdown / Allocation Optimization** — High confidence - sell-through at 62% (target 70%). **Explicitly missing data** that would change ranking: promotion-level forecast accuracy, allocation drift root cause, SKU contribution margins. What do you want to do — deepen the forecasting program, or originate a Markdown Optimization move?',
    mustInclude: ['- Why:', '- Missing:', '- Choose:'],
  },
  {
    id: 'atlas-tower-portfolio-risk',
    surface: '/tower',
    personaLens: 'Retail CIPO: portfolio tradeoffs, gate risk, value realization, and evidence quality',
    prompt:
      'Atlas, which Apex AI initiative is most likely to miss value this quarter and what decision should I make today?',
    rawAnswer:
      '**APX-04 is the highest value-risk item this quarter.** Portfolio KPI evidence shows gate slippage, sponsor ambiguity, unresolved value-baseline ownership, and a dependency on a platform decision that is not yet closed. I recommend pausing new scope until the next gate review validates owner, baseline, and mitigation evidence. Additional observations include funding tension, adoption risk, operating model ambiguity, and data lineage gaps that would otherwise create a long wall of text.',
    mustInclude: ['- Evidence:', '- Next:'],
  },
  {
    id: 'sentinel-retail-ai-patterns',
    surface: '/intelligence',
    personaLens: 'Retail CIPO: asks whether the pattern is specific enough to guide product and AI teams',
    prompt:
      'Sentinel, what retail AI patterns should we use before approving a merchandising agent?',
    rawAnswer:
      '**Use merchandising decisioning patterns before synthesis.** The current evidence points to demand sensing, inventory optimization, markdown governance, human override controls, and SKU-store data quality as the strongest pattern families. I recommend requiring KPI baselines, data lineage, guardrail ownership, and failure-mode mitigation before approval.',
    mustInclude: ['- Evidence:', '- Next:'],
  },
  {
    id: 'source-product-minded-bafo',
    surface: '/source',
    personaLens: 'Retail CIPO: product/platform leader evaluating vendor fit, integration, and run cost',
    prompt:
      'Source, how should I shape BAFO for a retail AI merchandising platform without overbuying shelfware?',
    rawAnswer:
      '**Make BAFO prove integration and adoption, not demo polish.** Require SKU-location history ingestion, POS and allocation integration proof, planner workflow fit, data-quality exception handling, and run-cost transparency. I recommend gating award on a working category pilot and named operating owner.',
    mustInclude: ['- Evidence:', '- Next:'],
  },
  {
    id: 'steward-setup-readiness',
    surface: '/setup',
    personaLens: 'Retail CIPO: wants to know whether the platform can safely ground agent answers in tenant data',
    prompt:
      'Steward, are Apex data connections ready enough for C-level testing?',
    rawAnswer:
      '**Apex setup is usable with gaps.** Connector readiness is sufficient for scripted testing, but full confidence needs tenant mapping, KPI dictionary freshness, data-trust approvals, and evidence upload status verified. I recommend fixing the missing ownership fields first, then rerunning setup readiness.',
    mustInclude: ['- Evidence:', '- Next:'],
  },
];

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function validateCase(testCase: PromptCase) {
  const shaped = shapeAgentResponseForSurface(testCase.surface, testCase.rawAnswer);
  const failures: string[] = [];

  if (/\*\*|__|```/.test(shaped)) failures.push('raw markdown leaked');
  if (wordCount(shaped) > 120) failures.push(`too long: ${wordCount(shaped)} words`);
  if (!shaped.includes('\n')) failures.push('single-block wall of text');
  for (const required of testCase.mustInclude) {
    if (!shaped.includes(required)) failures.push(`missing ${required}`);
  }

  return {
    id: testCase.id,
    surface: testCase.surface,
    personaLens: testCase.personaLens,
    prompt: testCase.prompt,
    wordCount: wordCount(shaped),
    lineCount: shaped.split('\n').length,
    failures,
    shaped,
  };
}

const results = PROMPT_CASES.map(validateCase);
const failed = results.filter((result) => result.failures.length > 0);

for (const result of results) {
  console.log(`\n[${result.failures.length === 0 ? 'PASS' : 'FAIL'}] ${result.id} · ${result.surface}`);
  console.log(`Persona lens: ${result.personaLens}`);
  console.log(`Prompt: ${result.prompt}`);
  console.log(`Shape: ${result.wordCount} words, ${result.lineCount} lines`);
  if (result.failures.length > 0) console.log(`Failures: ${result.failures.join('; ')}`);
  console.log(result.shaped);
}

if (failed.length > 0) {
  console.error(`\n${failed.length} CIPO response-shape case(s) failed.`);
  process.exit(1);
}

console.log(`\nAll ${results.length} CIPO response-shape cases passed.`);
