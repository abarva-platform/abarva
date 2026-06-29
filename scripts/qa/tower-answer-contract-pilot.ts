#!/usr/bin/env npx tsx
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import {
  scoreCioTowerRightAnswerContract,
  type CioTowerRightAnswerContract,
} from '../../src/lib/cio-tower/answer-contract';
import type { CioTowerVisibleAnswerContract } from '../../src/lib/cio-tower/answer';
import { buildTowerQuestionBank, summarizeTowerQuestionBank } from '../../src/lib/tower/tower-question-bank';

interface PilotCase {
  name: string;
  contract: CioTowerRightAnswerContract;
  observed: {
    label: string;
    visibleText: string;
    modelOutput: CioTowerVisibleAnswerContract;
    latencyMs: number;
  };
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outDir = process.env.TOWER_ANSWER_CONTRACT_OUT_DIR
  ?? path.join('/Users/anand/Downloads', `tower-answer-contract-pilot-${timestamp}`);

const bank = buildTowerQuestionBank();
const summary = summarizeTowerQuestionBank(bank);

const contracts: CioTowerRightAnswerContract[] = [
  {
    id: 'skyharbor-total-it-spend',
    tenantKey: 'skyharbor-air',
    question: 'What is my IT spend?',
    route: 'deterministic',
    artifact: 'card',
    expectedMetrics: [
      { measureKey: 'total_it_budget_fy26', label: 'FY26 IT budget', displayValue: '$877.9M' },
    ],
    requiredPhrases: ['SkyHarbor', 'FY26 IT budget'],
    forbiddenPhrases: ['$0', '$3.6B', 'not loaded', 'no committed spend'],
    maximumLatencyMs: 2500,
  },
  {
    id: 'skyharbor-top-it-programs',
    tenantKey: 'skyharbor-air',
    question: 'Give me the list of top 10 IT programs.',
    route: 'deterministic',
    artifact: 'table',
    expectedMetrics: [
      { measureKey: 'initiative_budget_fy26', label: 'FY26 initiative budget', displayValue: '$248.0M' },
    ],
    requiredPhrases: ['SkyHarbor', 'IT programs'],
    forbiddenPhrases: ['$3.6B', '$0', 'not loaded'],
    minimumTableRows: 3,
    maximumLatencyMs: 2500,
  },
  {
    id: 'skyharbor-run-change',
    tenantKey: 'skyharbor-air',
    question: 'Show run versus change split.',
    route: 'deterministic',
    artifact: 'table',
    expectedMetrics: [
      { measureKey: 'run_budget_fy26', label: 'FY26 run budget', displayValue: '$604.0M' },
      { measureKey: 'change_budget_fy26', label: 'FY26 change budget', displayValue: '$273.9M' },
    ],
    requiredPhrases: ['run', 'change'],
    forbiddenPhrases: ['CapEx', 'OpEx not loaded'],
    minimumTableRows: 2,
    maximumLatencyMs: 2500,
  },
  {
    id: 'skyharbor-outside-scope',
    tenantKey: 'skyharbor-air',
    question: 'What is the capital of Spain?',
    route: 'handoff',
    artifact: 'card',
    requiredPhrases: ['not a Tower portfolio question', 'Madrid'],
    mustNotIncludeMetricValues: ['$877.9M', '$248.0M', '$604.0M'],
    maximumLatencyMs: 1500,
  },
];

function visibleAnswer(args: Partial<CioTowerVisibleAnswerContract>): CioTowerVisibleAnswerContract {
  return {
    version: 'cio_tower_visible_answer_v1',
    answer: '',
    tables: [],
    tabs: [],
    followUpQuestion: null,
    ...args,
  };
}

const cases: PilotCase[] = [
  {
    name: 'passes exact IT spend',
    contract: contracts[0],
    observed: {
      label: 'right answer',
      visibleText:
        'SkyHarbor has $877.9M of FY26 IT budget in the Tower contract. The read should stay on the budget envelope and not mix in program-level budget.',
      modelOutput: visibleAnswer({
        answer:
          'SkyHarbor has $877.9M of FY26 IT budget in the Tower contract. The read should stay on the budget envelope and not mix in program-level budget.',
      }),
      latencyMs: 900,
    },
  },
  {
    name: 'fails contradictory dashboard number',
    contract: contracts[0],
    observed: {
      label: 'known bad',
      visibleText:
        'SkyHarbor has $3.6B of FY26 IT budget loaded across 15 portfolio-company rollups.',
      modelOutput: visibleAnswer({
        answer:
          'SkyHarbor has $3.6B of FY26 IT budget loaded across 15 portfolio-company rollups.',
      }),
      latencyMs: 850,
    },
  },
  {
    name: 'passes table-shaped top programs',
    contract: contracts[1],
    observed: {
      label: 'right answer',
      visibleText:
        'SkyHarbor has $248.0M in FY26 IT program budget. The top programs should be shown as a ranked program table.',
      modelOutput: visibleAnswer({
        answer:
          'SkyHarbor has $248.0M in FY26 IT program budget. The top programs should be shown as a ranked program table.',
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
      }),
      latencyMs: 1100,
    },
  },
  {
    name: 'fails missing table despite plausible prose',
    contract: contracts[1],
    observed: {
      label: 'known bad',
      visibleText:
        'Top IT programs at SkyHarbor look healthy overall, and the largest two are crew recovery and IROPS.',
      modelOutput: visibleAnswer({
        answer:
          'Top IT programs at SkyHarbor look healthy overall, and the largest two are crew recovery and IROPS.',
      }),
      latencyMs: 950,
    },
  },
  {
    name: 'passes run/change split',
    contract: contracts[2],
    observed: {
      label: 'right answer',
      visibleText:
        'The FY26 Tower contract separates run and change: $604.0M is run budget and $273.9M is change budget.',
      modelOutput: visibleAnswer({
        answer:
          'The FY26 Tower contract separates run and change: $604.0M is run budget and $273.9M is change budget.',
        tables: [
          {
            id: 'run_change',
            title: 'Run versus change',
            columns: ['Budget type', 'FY26 budget'],
            rows: [
              ['Run', '$604.0M'],
              ['Change', '$273.9M'],
            ],
          },
        ],
      }),
      latencyMs: 1000,
    },
  },
  {
    name: 'fails out-of-scope metric leakage',
    contract: contracts[3],
    observed: {
      label: 'known bad',
      visibleText:
        'Madrid is the capital of Spain. SkyHarbor also has $877.9M of FY26 IT budget.',
      modelOutput: visibleAnswer({
        answer:
          'Madrid is the capital of Spain. SkyHarbor also has $877.9M of FY26 IT budget.',
      }),
      latencyMs: 800,
    },
  },
];

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function writeFile(file: string, body: string): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body);
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildHtml(results: ReturnType<typeof scoreCioTowerRightAnswerContract>[]): string {
  const rows = cases.map((testCase, index) => {
    const score = results[index];
    const failing = score.checks.filter((check) => !check.pass);
    return `
      <section class="case">
        <div class="head">
          <div>
            <p>${escapeHtml(testCase.observed.label)} · ${escapeHtml(testCase.contract.route)} · ${escapeHtml(testCase.contract.artifact)}</p>
            <h2>${escapeHtml(testCase.contract.question)}</h2>
          </div>
          <span class="${score.pass ? 'pass' : 'fail'}">${score.pass ? 'PASS' : 'FAIL'}</span>
        </div>
        <div class="grid">
          <div>
            <h3>Right-answer contract</h3>
            <pre>${escapeHtml(JSON.stringify(testCase.contract, null, 2))}</pre>
          </div>
          <div>
            <h3>Observed visible answer</h3>
            <pre>${escapeHtml(testCase.observed.visibleText)}</pre>
          </div>
          <div>
            <h3>Score</h3>
            <pre>${escapeHtml(JSON.stringify({ pass: score.pass, failingChecks: failing, allChecks: score.checks }, null, 2))}</pre>
          </div>
        </div>
      </section>`;
  }).join('\n');

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Tower right-answer contract pilot</title>
  <style>
    body { margin: 32px; background: #f8f6f1; color: #07142d; font: 14px/1.5 Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    h1 { margin: 0 0 8px; font: 700 42px/1.05 Georgia, serif; }
    h2 { margin: 4px 0 0; font-size: 20px; }
    h3 { color: #607089; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; }
    .summary { max-width: 980px; color: #536276; }
    .case { background: #fff; border: 1px solid #ddd7cc; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 8px 30px rgba(7, 20, 45, .06); }
    .head { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; }
    .head p { margin: 0; color: #087245; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; font-size: 11px; }
    .pass, .fail { border-radius: 999px; padding: 8px 12px; font-weight: 900; font-size: 12px; }
    .pass { color: #07592f; background: #e7f8ed; }
    .fail { color: #8f1f1f; background: #fde8e8; }
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; margin-top: 16px; }
    pre { white-space: pre-wrap; word-break: break-word; background: #101828; color: #f5f7fb; border-radius: 6px; padding: 14px; max-height: 560px; overflow: auto; }
    code { background: #ede7dc; padding: 1px 4px; border-radius: 4px; }
    @media (max-width: 1100px) { .grid { grid-template-columns: 1fr; } }
  </style>
</head>
<body>
  <h1>Tower right-answer contract pilot</h1>
  <p class="summary">
    This pilot validates visible Tower answers against explicit expected facts, forbidden contradictory values, artifact shape, and latency budget. 
    The current generated question bank has <strong>${summary.total.toLocaleString()}</strong> questions, including 
    <strong>${summary.metricQuestionCount.toLocaleString()}</strong> metric questions and 
    <strong>${summary.deterministicQuestionCount.toLocaleString()}</strong> deterministic-route questions. 
    The next production step is to generate one right-answer contract per question from the governed measure packets and read models.
  </p>
  ${rows}
</body>
</html>`;
}

function main(): void {
  ensureDir(outDir);
  const results = cases.map((testCase) => scoreCioTowerRightAnswerContract(testCase.contract, testCase.observed));
  writeFile(path.join(outDir, 'question-bank-summary.json'), JSON.stringify(summary, null, 2));
  writeFile(path.join(outDir, 'pilot-contracts.json'), JSON.stringify(contracts, null, 2));
  writeFile(path.join(outDir, 'pilot-results.json'), JSON.stringify(cases.map((testCase, index) => ({
    name: testCase.name,
    contract: testCase.contract,
    observed: {
      label: testCase.observed.label,
      visibleText: testCase.observed.visibleText,
      latencyMs: testCase.observed.latencyMs,
    },
    score: results[index],
  })), null, 2));
  writeFile(path.join(outDir, 'report.html'), buildHtml(results));

  const passCount = results.filter((result) => result.pass).length;
  console.log(JSON.stringify({
    outDir,
    report: path.join(outDir, 'report.html'),
    questionBank: summary,
    pilotCases: results.length,
    passCount,
    failCount: results.length - passCount,
  }, null, 2));
}

main();
