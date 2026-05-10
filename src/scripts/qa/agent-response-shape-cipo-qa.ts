import { shapeAgentResponseForSurface } from '@/lib/agent/response-shape';

type AgentSurface = '/strategic-moves/new' | '/tower' | '/intelligence' | '/source' | '/setup';

interface PromptCase {
  id: string;
  surface: AgentSurface;
  personaLens: string;
  prompt: string;
  rawAnswer: string;
  mustInclude: ReadonlyArray<string>;
  mustExclude?: ReadonlyArray<string>;
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
    id: 'atlas-option-comparison-table',
    surface: '/tower',
    personaLens: 'Retail CIPO: chooses between competing AI investments with explicit tradeoffs',
    prompt:
      'Compare demand forecasting, markdown optimization, and assortment optimization as the next Apex merchandising AI bet.',
    rawAnswer:
      'Markdown optimization is the better second Move, but compare the options carefully. Demand Forecasting — Strength: directly attacks MAPE and stockouts. Weakness: already active in P0. Fit: deepen current program. Markdown Optimization — Strength: targets sell-through and margin leakage. Weakness: needs SKU margin data. Fit: originate next. Assortment Optimization — Strength: connects buying to customer relevance. Weakness: needs assortment review data. Fit: later wave.',
    mustInclude: ['| Option | Strength | Weakness | Fit |', '| Markdown Optimization |'],
  },
  {
    id: 'sentinel-stat-and-stack',
    surface: '/intelligence',
    personaLens: 'Retail CIPO: wants the data signal before approving a recommendation',
    prompt:
      'What does the Apex merchandising data say?',
    rawAnswer:
      'The data says merchandising value is concentrated in forecast quality. MAPE is 28.4% against a 20% target. Inventory turns fell from 4.2x to 3.6x. Markdown rate is 12.8% against an 11% target. Source basis: Apex tenant KPI snapshot and merchandising system inventory.',
    mustInclude: ['· Inventory turns', '· Markdown rate', 'Source:'],
  },
  {
    id: 'source-sequential-steps',
    surface: '/source',
    personaLens: 'Retail CIPO: asks for the implementation path, not a generic recommendation',
    prompt:
      'Walk me through how we should structure a merchandising AI pilot from sourcing to mobilization.',
    rawAnswer:
      'The path is a three-step operating-model shift. 1. Baseline. Confirm KPI owner, current value, target, and source system. 2. Design. Map planner decisions, model suggestions, and human override points. 3. Mobilize. Run one category pilot and review exception handling weekly. The outcome is a governed merchandising workflow, not a science project.',
    mustInclude: ['1. Baseline.', '2. Design.', '3. Mobilize.'],
    mustExclude: ['- Evidence:'],
  },
  {
    id: 'nexus-brief-narrative',
    surface: '/strategic-moves/new',
    personaLens: 'Retail CIPO: asks for background before deciding whether to originate a Move',
    prompt:
      'What happened in merchandising that makes this a strategic move now?',
    rawAnswer:
      'Apex got here through several small merchandising decisions compounding over two seasons. Forecast overrides became normal because planners did not trust category-level signals.\n\nThat made allocation look like the problem, even though the root issue was weak demand sensing. The next conversation should separate model quality from process adherence.',
    mustInclude: ['\n\n'],
    mustExclude: ['- Evidence:', '| Option |'],
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
  for (const excluded of testCase.mustExclude ?? []) {
    if (shaped.includes(excluded)) failures.push(`unexpected ${excluded}`);
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
