import fs from 'node:fs';
import path from 'node:path';
import {
  buildSkyHarborCtoReadinessPacket,
  composeSkyHarborCtoAnswer,
  parseDecisionBranch,
} from '../../src/lib/intelligence/skyharbor-cto-readiness';

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, 'proof', 'skyharbor-v6-cto-readiness');

const questions = [
  'What is blocking agentic IROPS from scaling?',
  'What should the CTO fund first for IROPS AI readiness?',
  'Which AI investments should scale, hold, or stop?',
  'What systems does IROPS depend on?',
  'What data must be certified before autonomous recovery decisions?',
  'Which vendors or platforms create the biggest operational dependency?',
  'What is the 90-day CTO action plan?',
  'Is the IROPS AI case board-grade today?',
  'Where is the biggest evidence gap in the IROPS operating model?',
  'What value can we claim today, and what needs Finance signoff?',
  'What controls or model-risk gates block scale?',
  'What would you ask the CIO/CTO to provide next?',
];

function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

function buildPrompt(question: string, packetSummary: unknown): string {
  return [
    'You are aVa, a senior airline CTO advisor.',
    'Answer with a point of view, what it means, why it matters, known evidence, missing assumptions, what would make it board-grade, and decision branches when precision is missing.',
    'Do not invent exact ROI or board-grade value. Classify financial/value claims as loaded fact, calculated, assumption-led, industry context, or client-signoff-required.',
    'Use the SkyHarbor V6 CTO readiness packet below. Keep branch choices in [DECISION_BRANCH] format so the renderer can display buttons without rewriting your answer.',
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
  if (!/Assumption-led or missing/i.test(rendered)) issues.push('missing_assumption_or_gap');
  if (!/What would make it board-grade/i.test(rendered)) issues.push('missing_board_grade_boundary');
  if (branchCount < 4) issues.push('missing_branch_choices');
  if (/\$270M|exact ROI is proven|autonomous scale immediately|SkyHarbor is board-grade/i.test(rawResponse)) issues.push('forbidden_precision_or_board_claim');
  return { passed: issues.length === 0, issues };
}

function main(): void {
  ensureDir(outDir);
  const packet = buildSkyHarborCtoReadinessPacket(repoRoot);
  const packetSummary = {
    packetId: packet.packetId,
    decision: packet.decision,
    counts: {
      systems: packet.systems.length,
      dataAssets: packet.dataAssets.length,
      aiInitiatives: packet.aiInitiatives.length,
      programs: packet.programs.length,
      risksControls: packet.risksControls.length,
      spend: packet.spend.length,
      relationships: packet.relationships.length,
      evidenceSources: packet.evidenceSources.length,
      expertLenses: packet.expertLenses.length,
    },
    missingEvidenceChecklist: packet.missingEvidenceChecklist,
    claimMaturity: packet.claimMaturity,
  };

  fs.writeFileSync(path.join(outDir, '01-decision-packet.json'), `${JSON.stringify(packet, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, '02-claim-maturity-map.json'), `${JSON.stringify(packet.claimMaturity, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, '03-missing-evidence-checklist.json'), `${JSON.stringify(packet.missingEvidenceChecklist, null, 2)}\n`);

  const questionProofs = questions.map((question, index) => {
    const finalPrompt = buildPrompt(question, packetSummary);
    const rawResponse = composeSkyHarborCtoAnswer(question, packet);
    const parsed = parseDecisionBranch(rawResponse);
    const score = scoreQuestion(rawResponse, parsed.visibleText, parsed.branch?.choices.length ?? 0);
    const proof = {
      id: `CTO-${String(index + 1).padStart(3, '0')}`,
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
  fs.writeFileSync(path.join(outDir, '04-question-proof.json'), `${JSON.stringify(questionProofs, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, '05-score-report.json'), `${JSON.stringify(scoreReport, null, 2)}\n`);
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
    '# SkyHarbor V6 CTO Readiness Proof',
    '',
    `Generated: ${scoreReport.generatedAt}`,
    '',
    'This proof validates the focused SkyHarbor V6 IROPS/CTO readiness enrichment and branching answer contract locally. It is not a production deploy and does not claim live Claude/browser proof.',
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
