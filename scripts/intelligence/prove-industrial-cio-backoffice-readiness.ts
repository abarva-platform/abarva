import fs from 'node:fs';
import path from 'node:path';
import {
  buildIndustrialCioBackofficePacket,
  composeIndustrialCioBackofficeAnswer,
  parseDecisionBranch,
} from '../../src/lib/intelligence/industrial-cio-backoffice-readiness';

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, 'proof', 'industrial-cio-backoffice-readiness');

const questions = [
  'How should Morgan Street stand up the Enterprise Innovation, AI Enablement and Value Office?',
  'Which shared services AI use cases should the CIO fund first?',
  'Should we start with Treasury, Finance, HR, or Legal?',
  'Is Kyriba ready to be the first lighthouse proof?',
  'What would make the finance close automation board-grade?',
  'Can we use planning assumptions for value, or do we need current values?',
  'What current values should the CIO and CFO provide before sizing impact?',
  'How should ServiceNow finance support automation fit into the roadmap?',
  'What is the operating model for the Value Office?',
  'How do we keep this from becoming another AI pilot factory?',
  'What are the top control risks in treasury and finance automation?',
  'What should the first 6 weeks prove?',
  'How should HR and Legal enter the roadmap without overclaiming readiness?',
  'What right-canvas visual should aVa show for this decision?',
  'What should the CIO ask the VP Innovation to do next?',
];

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function buildPrompt(question: string, packetSummary: unknown): string {
  return [
    'You are aVa, a senior CIO transformation advisor for an industrial enterprise.',
    'Answer with a point of view, what it means, why it matters, known evidence, missing assumptions, what would make it board-grade, and decision branches when precision is missing.',
    'Frame the demo around the Morgan Street goal: an Enterprise Innovation, AI Enablement and Value Office that maps work, redesigns processes, governs AI, measures value, and reuses context across Shared Services.',
    'Do not invent exact ROI, headcount reduction, HR/legal readiness, current cycle time, or board-grade value. Classify financial/value claims as loaded fact, assumption-led, industry context, or client-signoff-required.',
    'Use the Industrial V6 back-office readiness packet below. Keep branch choices in [DECISION_BRANCH] format so the renderer can display buttons without rewriting your answer.',
    '',
    `Question: ${question}`,
    '',
    `Packet summary: ${JSON.stringify(packetSummary, null, 2)}`,
  ].join('\n');
}

function scoreQuestion(rawResponse: string, rendered: string, branchCount: number): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  if (!/My point of view/i.test(rendered)) issues.push('missing_point_of_view');
  if (!/What this means/i.test(rendered)) issues.push('missing_what_this_means');
  if (!/Why it matters/i.test(rendered)) issues.push('missing_why_it_matters');
  if (!/Known from loaded evidence/i.test(rendered)) issues.push('missing_loaded_evidence');
  if (!/What is missing before board-grade claims/i.test(rendered)) issues.push('missing_board_grade_boundary');
  if (branchCount < 5) issues.push('missing_branch_choices');
  if (/exact ROI is proven|HR is ready to scale|Legal is ready to scale|headcount reduction/i.test(rawResponse)) {
    issues.push('forbidden_precision_or_scale_claim');
  }
  return { passed: issues.length === 0, issues };
}

function main(): void {
  ensureDir(outDir);
  const packet = buildIndustrialCioBackofficePacket(repoRoot);
  const packetSummary = {
    packetId: packet.packetId,
    decision: packet.decision,
    morganStreetGoal: packet.morganStreetGoal,
    counts: {
      functions: packet.functions.length,
      ownership: packet.ownership.length,
      systems: packet.systems.length,
      dataAssets: packet.dataAssets.length,
      programs: packet.programs.length,
      aiInitiatives: packet.aiInitiatives.length,
      risksControls: packet.risksControls.length,
      spend: packet.spend.length,
      relationships: packet.relationships.length,
      evidenceSources: packet.evidenceSources.length,
      metrics: packet.metrics.length,
      industryPatterns: packet.industryPatterns.length,
      expertLenses: packet.expertLenses.length,
    },
    lighthouseUseCases: packet.lighthouseUseCases,
    missingEvidenceChecklist: packet.missingEvidenceChecklist,
    claimMaturity: packet.claimMaturity,
  };

  fs.writeFileSync(path.join(outDir, '01-decision-packet.json'), `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, '02-claim-maturity-map.json'), `${JSON.stringify(packet.claimMaturity, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, '03-missing-evidence-checklist.json'), `${JSON.stringify(packet.missingEvidenceChecklist, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, '04-lighthouse-use-cases.json'), `${JSON.stringify(packet.lighthouseUseCases, null, 2)}\n`);

  const questionProofs = questions.map((question, index) => {
    const finalPrompt = buildPrompt(question, packetSummary);
    const rawResponse = composeIndustrialCioBackofficeAnswer(question, packet);
    const parsed = parseDecisionBranch(rawResponse);
    const score = scoreQuestion(rawResponse, parsed.visibleText, parsed.branch?.choices.length ?? 0);
    const proof = {
      id: `IND-${String(index + 1).padStart(3, '0')}`,
      question,
      provider: 'deterministic_contract_proof',
      note: 'This proof validates the V6 packet and branch contract locally. It is not a live Claude invocation.',
      finalPrompt,
      rawResponse,
      renderedResponse: parsed.visibleText,
      branchButtons: parsed.branch?.choices ?? [],
      branchRawBlock: parsed.branch?.rawBlock ?? null,
      score,
    };
    const questionDir = path.join(outDir, 'questions', proof.id);
    ensureDir(questionDir);
    fs.writeFileSync(path.join(questionDir, '01-final-prompt.txt'), finalPrompt);
    fs.writeFileSync(path.join(questionDir, '02-raw-response.txt'), rawResponse);
    fs.writeFileSync(path.join(questionDir, '03-rendered-response.txt'), parsed.visibleText);
    fs.writeFileSync(path.join(questionDir, '04-branch-buttons.json'), `${JSON.stringify(proof.branchButtons, null, 2)}\n`);
    fs.writeFileSync(path.join(questionDir, '05-score.json'), `${JSON.stringify(score, null, 2)}\n`);
    return proof;
  });

  const scoreReport = {
    generatedAt: new Date().toISOString(),
    packetSummary,
    questionCount: questionProofs.length,
    passed: questionProofs.filter((proof) => proof.score.passed).length,
    failed: questionProofs.filter((proof) => !proof.score.passed).length,
    questions: questionProofs.map((proof) => ({
      id: proof.id,
      question: proof.question,
      passed: proof.score.passed,
      issues: proof.score.issues,
      branchButtons: proof.branchButtons.map((choice) => choice.label),
    })),
  };
  fs.writeFileSync(path.join(outDir, '05-question-proof.json'), `${JSON.stringify(questionProofs, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, '06-score-report.json'), `${JSON.stringify(scoreReport, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'README.md'), renderReadme(scoreReport));
  console.log(JSON.stringify({ ok: scoreReport.failed === 0, outDir: path.relative(repoRoot, outDir), ...scoreReport }, null, 2));
  if (scoreReport.failed) process.exit(1);
}

function renderReadme(scoreReport: {
  generatedAt: string;
  questionCount: number;
  passed: number;
  failed: number;
  packetSummary: unknown;
  questions: Array<{ id: string; question: string; passed: boolean; issues: string[]; branchButtons: string[] }>;
}): string {
  return `${[
    '# Industrial CIO Back-Office Readiness Proof',
    '',
    `Generated: ${scoreReport.generatedAt}`,
    '',
    'This proof validates the focused Industrial Demo / Morgan Street CIO Shared Services readiness packet and branching answer contract locally. It is not a production deploy and does not claim live Claude/browser proof.',
    '',
    '## Summary',
    '',
    `- Questions: ${scoreReport.questionCount}`,
    `- Passed: ${scoreReport.passed}`,
    `- Failed: ${scoreReport.failed}`,
    '',
    '## Packet Summary',
    '',
    '```json',
    JSON.stringify(scoreReport.packetSummary, null, 2),
    '```',
    '',
    '## Question Results',
    '',
    '| ID | Question | Passed | Branches | Issues |',
    '| --- | --- | --- | --- | --- |',
    ...scoreReport.questions.map((row) => `| ${row.id} | ${row.question} | ${row.passed ? 'yes' : 'no'} | ${row.branchButtons.join('; ')} | ${row.issues.join(', ') || 'None'} |`),
    '',
  ].join('\n')}\n`;
}

main();
