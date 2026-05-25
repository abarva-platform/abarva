import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import type { Page } from '@playwright/test';
import type { CrawlPersona } from '../../src/lib/crawl/persona-switcher';

interface Args {
  baseUrl: string;
  tenants: string[];
  task: 'task1';
  turnLimit: number;
  outputRoot: string;
  rescoreExisting: boolean;
}

interface TaskTurn {
  tag: string;
  prompt: string;
}

export type HonestyFlag =
  | 'canned_template_detected'
  | 'template_repetition_detected'
  | 'capture_defect'
  | 'data_unavailable_admission'
  | 'no_prior_context_admission'
  | 'prose_action_mismatch';

export interface Score {
  total?: number | null;
  letter?: string;
  [key: string]: number | string | null | undefined;
}

export interface TranscriptTurn {
  task: number;
  turn: number;
  tag: string;
  surface?: string;
  user?: string;
  prompt?: string;
  answer?: string | null;
  startedAt?: string;
  completedAt?: string;
  latencyMs?: number;
  score?: Score;
  notes?: string[];
}

export interface Transcript {
  tenant: string;
  baseUrl?: string;
  mainSha?: string;
  mainDeployedAt?: string;
  turns: TranscriptTurn[];
}

export interface DetectorFinding {
  flag: HonestyFlag;
  label: string;
  cap: number;
  reason: string;
  evidence: string;
}

export interface DetectorContext {
  transcript: Transcript;
  signatureCounts: Map<string, number>;
}

export interface HonestyDetector {
  flag: HonestyFlag;
  label: string;
  cap: number;
  description: string;
  detect: (turn: TranscriptTurn, context: DetectorContext) => DetectorFinding | null;
}

export interface RescoredTurn {
  turn: TranscriptTurn;
  originalScore: number | null;
  correctedScore: number | null;
  correctedLetter: string;
  flags: DetectorFinding[];
  unscoredReason?: string;
}

export interface ReportTarget {
  tenantLabel: string;
  sourceTranscriptPath: string;
  correctedReportPath: string;
}

export const DETECTOR_REGISTRY: HonestyDetector[] = [
  {
    flag: 'canned_template_detected',
    label: 'Canned template',
    cap: 4,
    description: 'Caps generic fallback templates that follow a fixed Mode/Confidence/Current state/Sourcing implication/Risks scaffold.',
    detect: (turn) => {
      const answer = turn.answer ?? '';
      if (isSourceFallbackTemplate(answer)) {
        return finding(
          'canned_template_detected',
          'Canned template',
          4,
          'Source fallback template used instead of tenant-specific reasoning.',
          firstSentence(answer),
        );
      }
      if (/^To stand up "[^"]+", capture these event-specific gaps\./i.test(answer.trim())) {
        return finding(
          'canned_template_detected',
          'Canned template',
          4,
          'Intake-capture template echoed the prompt instead of performing the requested work.',
          firstSentence(answer),
        );
      }
      return null;
    },
  },
  {
    flag: 'template_repetition_detected',
    label: 'Repeated template',
    cap: 3.5,
    description: 'Caps a response when its template signature appears more than once in the same transcript.',
    detect: (turn, context) => {
      const signature = templateSignature(turn);
      if (!signature) return null;
      const count = context.signatureCounts.get(signature) ?? 0;
      if (count <= 1) return null;
      return finding(
        'template_repetition_detected',
        'Repeated template',
        3.5,
        `Template signature "${signature}" repeated ${count} times in this transcript.`,
        firstSentence(turn.answer ?? ''),
      );
    },
  },
  {
    flag: 'capture_defect',
    label: 'Capture defect',
    cap: 2,
    description: 'Caps raw JSON payload-only answers, UI scrape/crawl residue, pass/fail harness text, and zero-state capture output.',
    detect: (turn) => {
      const answer = (turn.answer ?? '').trim();
      if (!answer) return null;
      if (looksLikeJsonOnly(answer)) {
        return finding('capture_defect', 'Capture defect', 2, 'Raw JSON payload-only response.', excerpt(answer));
      }
      if (/^Control Tower Portfolio Value 0 active Moves 0 Source workflows DAG fallback/i.test(answer)) {
        return finding('capture_defect', 'Capture defect', 1, 'Captured a zero-state Control Tower page rather than answering the continuity prompt.', excerpt(answer));
      }
      if (/^(PASS|FAIL) event code duplicate-prefix check\./i.test(answer)) {
        const cap = /^FAIL/i.test(answer) ? 0.5 : 2;
        return finding('capture_defect', 'Capture defect', cap, 'Harness pass/fail and navigation scrape leaked into the agent answer.', excerpt(answer));
      }
      if (/Event code\/name payload:\s*{/i.test(answer)) {
        return finding('capture_defect', 'Capture defect', 3, 'Action response exposed raw event payload instead of a finished user-facing answer.', excerpt(answer));
      }
      return null;
    },
  },
  {
    flag: 'data_unavailable_admission',
    label: 'Data unavailable',
    cap: 5,
    description: 'Caps explicit admissions that required tenant, report, study, or current-state data is unavailable.',
    detect: (turn) => {
      const answer = turn.answer ?? '';
      const lower = answer.toLowerCase();
      if (/active tenant (?:in my connected data )?is apex retail/i.test(answer)) {
        return finding('data_unavailable_admission', 'Data unavailable', 2, 'Wrong active tenant admission invalidates tenant grounding.', firstSentence(answer));
      }
      if (/no cited current-state finding is available/i.test(answer)) {
        return finding('data_unavailable_admission', 'Data unavailable', 4, 'The answer admits no cited current-state finding is available.', firstSentence(answer));
      }
      if (/\b(i don't|i do not|i can't|i cannot)\b.{0,80}\b(access|have|see|pull|give)\b/i.test(answer) || /not surfacing here|not in your connected|aren't in your connected|outside my lane/i.test(lower)) {
        return finding('data_unavailable_admission', 'Data unavailable', 5, 'The answer explicitly admits required evidence is unavailable.', firstSentence(answer));
      }
      return null;
    },
  },
  {
    flag: 'no_prior_context_admission',
    label: 'No prior context',
    cap: 4,
    description: 'Caps responses that claim the prior turn, move, recommendation, or thread context is missing.',
    detect: (turn) => {
      const answer = turn.answer ?? '';
      if (/no turn one|start of our conversation|prior conversation turn|don't have (?:your )?prior|do not have (?:your )?prior|which move|this move doesn't have a prior turn|haven't made any sequencing recommendations/i.test(answer)) {
        return finding('no_prior_context_admission', 'No prior context', 4, 'The answer admits it cannot see the prior context needed for the prompt.', firstSentence(answer));
      }
      return null;
    },
  },
  {
    flag: 'prose_action_mismatch',
    label: 'Prose/action mismatch',
    cap: 4,
    description: 'Caps claims of created artifacts or action completion when the response is only an ID echo, prompt echo, generic prose, or capture residue.',
    detect: (turn) => {
      const answer = (turn.answer ?? '').trim();
      const tag = turn.tag.toLowerCase();
      if (/^Created Strategic Move [0-9a-f-]+:/i.test(answer) && answer.length < 220) {
        return finding('prose_action_mismatch', 'Prose/action mismatch', 3, 'Created-move claim only echoed an id/name without decision content, evidence, or next state.', excerpt(answer));
      }
      if (/^Created Source event [0-9a-f-]+\./i.test(answer) && /Event code\/name payload:\s*{/i.test(answer)) {
        return finding('prose_action_mismatch', 'Prose/action mismatch', 4, 'Source event creation response mixed an action claim with raw payload instead of a usable event brief.', excerpt(answer));
      }
      if (/(rfi-generation|bafo-simulation|confirm-intake)/.test(tag) && (isSourceFallbackTemplate(answer) || /^To stand up "/i.test(answer) || /duplicate-prefix check/i.test(answer))) {
        return finding('prose_action_mismatch', 'Prose/action mismatch', 4, 'The prompt asked for a concrete action artifact, but the answer returned a fallback/capture template.', excerpt(answer));
      }
      if (/tower-continuity/.test(tag) && /^Control Tower Portfolio Value 0 active Moves/i.test(answer)) {
        return finding('prose_action_mismatch', 'Prose/action mismatch', 1, 'The prompt asked for continuity, but the answer returned a zero-state page capture.', excerpt(answer));
      }
      return null;
    },
  },
];

const CORRECTED_REPORTS: ReportTarget[] = [
  {
    tenantLabel: 'Apex Retail',
    sourceTranscriptPath: 'audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/transcripts/full-transcript.json',
    correctedReportPath: 'audit-artifacts/apex-2task-eval-2026-05-24-17-39-opA/APEX_AGENT_INTELLIGENCE_REPORT.CORRECTED.html',
  },
  {
    tenantLabel: 'Meridian Health',
    sourceTranscriptPath: 'audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/transcripts/full-transcript.json',
    correctedReportPath: 'audit-artifacts/meridian-2task-eval-2026-05-24-17-39-opB/MERIDIAN_AGENT_INTELLIGENCE_REPORT.CORRECTED.html',
  },
];

const TASK1_PROMPTS: Record<string, TaskTurn[]> = {
  apex: [
    {
      tag: 'commerce-cloud-trilemma-cost-rerun',
      prompt:
        "Our ecom mix is 18.5% versus a peer median of 24%. We have Commerce Cloud Optimization, Einstein activation, CDP Migration Phase 2, and the SAP ERP Future Decision all touching the same gap. In five crisp bullets, sequence what gets killed, restructured, accelerated, and delayed. Cite Apex facts and state what evidence would change your view.",
    },
  ],
  meridian: [
    {
      tag: 'ambient-documentation-cost-rerun',
      prompt:
        'We piloted ambient documentation in cardiology and orthopedics; about 40% opted out. The CMIO wants broader rollout, the CFO wants proof, and the CISO wants HIPAA/model-risk guardrails. In five crisp bullets, sequence what gets funded next and what evidence would change your view. Cite Meridian facts.',
    },
  ],
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.rescoreExisting) {
    await writeCorrectedReports();
    return;
  }
  const { chromium } = await import('@playwright/test');
  const {
    createAuditSupabaseClient,
    readTurnCostTrace,
    resolveTenantForCostTrace,
  } = await import('./ai-egress-cost-trace');
  const { createIsolatedPersonaContext } = await import('../../src/lib/crawl/persona-switcher');
  const sb = createAuditSupabaseClient();
  const browser = await chromium.launch({ headless: true });
  try {
    for (const tenantAlias of args.tenants) {
      const persona = await personaForTenant(tenantAlias);
      const tenant = await resolveTenantForCostTrace(sb, tenantAlias);
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outDir = path.join(args.outputRoot, `${tenantAlias}-task1-cost-rerun-${stamp}`);
      await fs.mkdir(path.join(outDir, 'snapshots'), { recursive: true });
      await fs.mkdir(path.join(outDir, 'transcripts'), { recursive: true });
      await fs.mkdir(path.join(outDir, 'cost-trace'), { recursive: true });

      const personaContext = await createIsolatedPersonaContext(browser, persona, {
        baseUrl: args.baseUrl,
        headless: true,
      });
      try {
        await personaContext.page.goto('/intelligence/ask', {
          waitUntil: 'domcontentloaded',
          timeout: 60_000,
        });
        await personaContext.page.screenshot({
          path: path.join(outDir, 'snapshots', 'intelligence-ask-start.png'),
          fullPage: true,
        }).catch(() => undefined);

        const turns = TASK1_PROMPTS[tenantAlias].slice(0, args.turnLimit);
        const transcript = [];
        for (const [index, turn] of turns.entries()) {
          const startedAt = new Date().toISOString();
          const responseText = await askIntelligence(personaContext.page, {
            query: turn.prompt,
            client: tenant.key,
          });
          const completedAt = new Date().toISOString();
          const trace = await readTurnCostTrace({
            sb,
            tenantId: tenant.id,
            startedAt,
            completedAt,
            promptText: turn.prompt,
            responseText,
          });
          const turnRecord = {
            task: 1,
            turn: index + 1,
            tag: turn.tag,
            prompt: turn.prompt,
            answer: responseText,
            startedAt,
            completedAt,
            costTrace: trace,
          };
          transcript.push(turnRecord);
          await fs.writeFile(
            path.join(outDir, 'cost-trace', `task1-turn${index + 1}-${turn.tag}.json`),
            JSON.stringify({ turn: turnRecord, trace }, null, 2),
          );
        }

        const summary = {
          tenant: tenantAlias,
          tenantId: tenant.id,
          generatedAt: new Date().toISOString(),
          turnCount: transcript.length,
          totalAuditRows: transcript.reduce((sum, item) => sum + item.costTrace.rowCount, 0),
          totalCostUsd: roundUsd(transcript.reduce((sum, item) => sum + item.costTrace.totalCostUsd, 0)),
        };
        await fs.writeFile(path.join(outDir, 'transcripts', 'task1-cost-rerun.json'), JSON.stringify(transcript, null, 2));
        await fs.writeFile(path.join(outDir, 'cost-trace', 'summary.json'), JSON.stringify(summary, null, 2));
        console.log(`${tenantAlias}: task1 cost rerun wrote ${summary.totalAuditRows} audit rows, $${summary.totalCostUsd.toFixed(6)} to ${outDir}`);
      } finally {
        await personaContext.context.close().catch(() => undefined);
      }
    }
  } finally {
    await browser.close();
  }
}

async function askIntelligence(page: Page, input: {
  query: string;
  client: string;
}): Promise<string> {
  return page.evaluate(async ({ query, client }) => {
    const response = await fetch('/api/intelligence/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, client }),
    });
    const text = await response.text();
    const chunks = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          return JSON.parse(line) as { type?: string; text?: string; error?: string };
        } catch {
          return { type: 'raw', text: line };
        }
      });
    const answer = chunks
      .filter((chunk) => chunk.type === 'delta' || chunk.type === 'sentinel-stage' || chunk.type === 'raw')
      .map((chunk) => {
        if (chunk.type === 'sentinel-stage') return JSON.stringify(chunk);
        return chunk.text ?? '';
      })
      .join('');
    if (!response.ok) {
      throw new Error(`intelligence_ask_failed_${response.status}: ${answer || text}`);
    }
    return answer || text;
  }, input);
}

async function personaForTenant(alias: string): Promise<CrawlPersona> {
  const { resolveCrawlPersonas } = await import('../../src/lib/crawl/persona-switcher');
  const normalized = alias.toLowerCase();
  const key = normalized === 'apex' ? 'apex-cio' : normalized === 'meridian' ? 'meridian-cdio' : normalized;
  const found = resolveCrawlPersonas(key)[0];
  if (!found) throw new Error(`No crawl persona found for ${alias}`);
  return found;
}

function parseArgs(argv: string[]): Args {
  const value = (name: string, fallback?: string) => {
    const direct = argv.find((item) => item.startsWith(`--${name}=`));
    if (direct) return direct.slice(name.length + 3);
    const idx = argv.indexOf(`--${name}`);
    return idx >= 0 ? argv[idx + 1] : fallback;
  };
  return {
    baseUrl: value('base-url', process.env.ABARVA_AUDIT_BASE_URL ?? 'https://app.abarva.ai')!,
    tenants: value('tenant', 'apex,meridian')!.split(',').map((item) => item.trim()).filter(Boolean),
    task: 'task1',
    turnLimit: Math.max(1, Number(value('turn-limit', '1')) || 1),
    outputRoot: path.resolve(value('output-root', '/Users/anand/Projects/nexus/audit-artifacts')!),
    rescoreExisting: argv.includes('--rescore-existing'),
  };
}

function roundUsd(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

export async function writeCorrectedReports(targets: ReportTarget[] = CORRECTED_REPORTS): Promise<void> {
  for (const target of targets) {
    const transcriptPath = path.resolve(target.sourceTranscriptPath);
    const transcript = JSON.parse(await fs.readFile(transcriptPath, 'utf8')) as Transcript;
    const rescored = rescoreTranscript(transcript);
    const html = renderCorrectedReport(target, transcript, rescored);
    const reportPath = path.resolve(target.correctedReportPath);
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, html, 'utf8');
    const originalAverage = average(rescored.map((item) => item.originalScore));
    const correctedAverage = average(rescored.map((item) => item.correctedScore));
    console.log(
      `${target.tenantLabel}: ${formatScore(originalAverage)} -> ${formatScore(correctedAverage)} (${reportPath})`,
    );
  }
}

export function rescoreTranscript(transcript: Transcript): RescoredTurn[] {
  const signatureCounts = new Map<string, number>();
  for (const turn of transcript.turns) {
    const signature = templateSignature(turn);
    if (signature) signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
  }
  const context: DetectorContext = { transcript, signatureCounts };
  return transcript.turns.map((turn) => rescoreTurn(turn, context));
}

export function rescoreTurn(turn: TranscriptTurn, context: DetectorContext): RescoredTurn {
  const originalScore = numericScore(turn.score?.total);
  const answer = turn.answer;
  if (answer == null || String(answer).trim().length === 0) {
    return {
      turn,
      originalScore,
      correctedScore: null,
      correctedLetter: 'UNSCORED',
      flags: [],
      unscoredReason: 'UNSCORED null turn: missing answer text, so no quality score is defensible.',
    };
  }

  const findings = DETECTOR_REGISTRY
    .map((detector) => detector.detect(turn, context))
    .filter((item): item is DetectorFinding => item !== null);
  const caps = findings.map((item) => item.cap);
  const correctedScore = originalScore == null
    ? null
    : roundHalf(Math.max(0, Math.min(originalScore, ...(caps.length ? caps : [10]))));

  return {
    turn,
    originalScore,
    correctedScore,
    correctedLetter: correctedScore == null ? 'UNSCORED' : letterForScore(correctedScore),
    flags: findings,
  };
}

function renderCorrectedReport(
  target: ReportTarget,
  transcript: Transcript,
  rescored: RescoredTurn[],
): string {
  const originalAverage = average(rescored.map((item) => item.originalScore));
  const correctedAverage = average(rescored.map((item) => item.correctedScore));
  const taskRows = [...new Set(transcript.turns.map((turn) => turn.task))]
    .sort((a, b) => a - b)
    .map((task) => {
      const turns = rescored.filter((item) => item.turn.task === task);
      return `<tr><td>Task ${task}</td><td>${formatScore(average(turns.map((item) => item.originalScore)))}</td><td>${formatScore(average(turns.map((item) => item.correctedScore)))}</td><td>${turns.filter((item) => item.correctedScore == null).length}</td></tr>`;
    })
    .join('\n');
  const flagCounts = countFlags(rescored);
  const generatedAt = new Date().toISOString();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(target.tenantLabel)} Agent Intelligence Report - Corrected</title>
  <style>
    body { font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; color: #151515; background: #fff; }
    h1 { margin: 0 0 6px; font-size: 28px; }
    h2 { margin-top: 28px; border-top: 1px solid #d8d4ca; padding-top: 18px; }
    h3 { margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
    th, td { border: 1px solid #dedacf; padding: 8px; vertical-align: top; text-align: left; font-size: 13px; }
    th { background: #f3f0e9; }
    .muted { color: #625f58; }
    .scoreline { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; margin: 14px 0 18px; }
    .scoreline div { background: #f8f7f4; border: 1px solid #dedacf; padding: 10px; border-radius: 6px; }
    .scoreline strong { display: block; font-size: 22px; margin-top: 4px; }
    .badge { display: inline-block; border-radius: 999px; padding: 2px 7px; margin: 0 4px 4px 0; font-size: 11px; font-weight: 700; background: #efe9dc; border: 1px solid #d6cbb6; color: #3e3421; }
    .badge-critical { background: #f9dddd; border-color: #e6b6b6; color: #7a1717; }
    .badge-warn { background: #fff1cf; border-color: #e2c46f; color: #6a4a00; }
    .row-critical td { background: #fff8f8; }
    .row-warn td { background: #fffdf5; }
    .quote { white-space: pre-wrap; max-width: 720px; }
    code { background: #f3f0e9; padding: 1px 4px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(target.tenantLabel)} Agent Intelligence Report - Corrected</h1>
  <p class="muted">Generated ${escapeHtml(generatedAt)} from <code>${escapeHtml(target.sourceTranscriptPath)}</code>. This corrected scorer is intentionally harsher about honesty failures than the original crawl score.</p>

  <h2>Executive Verdict</h2>
  <div class="scoreline">
    <div><span>Original average</span><strong>${formatScore(originalAverage)}</strong></div>
    <div><span>Corrected average</span><strong>${formatScore(correctedAverage)}</strong></div>
    <div><span>Scored turns</span><strong>${rescored.filter((item) => item.correctedScore != null).length}</strong></div>
    <div><span>UNSCORED null turns</span><strong>${rescored.filter((item) => item.correctedScore == null).length}</strong></div>
  </div>
  <p>The corrected score treats visible product honesty failures as first-order quality defects. Canned fallback prose, repeated templates, raw payload/capture residue, unavailable-data admissions, missing prior-context admissions, and prose-vs-action mismatches cannot receive high demo-quality scores even when the language is polished.</p>

  <h2>Detector Registry</h2>
  <table>
    <thead><tr><th>Flag</th><th>Cap</th><th>What it catches</th><th>Count</th></tr></thead>
    <tbody>
      ${DETECTOR_REGISTRY.map((detector) => `<tr><td><code>${detector.flag}</code></td><td>${detector.cap.toFixed(1)}</td><td>${escapeHtml(detector.description)}</td><td>${flagCounts.get(detector.flag) ?? 0}</td></tr>`).join('\n')}
      <tr><td><code>UNSCORED null turns</code></td><td>n/a</td><td>Missing/empty answer text is excluded from score averages and shown as UNSCORED.</td><td>${rescored.filter((item) => item.correctedScore == null).length}</td></tr>
    </tbody>
  </table>

  <h2>Score Movement</h2>
  <table>
    <thead><tr><th>Slice</th><th>Original</th><th>Corrected</th><th>UNSCORED</th></tr></thead>
    <tbody>${taskRows}</tbody>
  </table>

  <h2>Turn-Level Corrections</h2>
  <table>
    <thead><tr><th>Turn</th><th>Original</th><th>Corrected</th><th>Badges</th><th>Cap / reason</th><th>Answer excerpt</th></tr></thead>
    <tbody>
      ${rescored.map(renderCorrectedTurnRow).join('\n')}
    </tbody>
  </table>
</body>
</html>
`;
}

function renderCorrectedTurnRow(item: RescoredTurn): string {
  const severityClass = item.correctedScore == null || (item.correctedScore <= 2 && item.originalScore !== item.correctedScore)
    ? 'row-critical'
    : item.flags.length
      ? 'row-warn'
      : '';
  const badges = item.correctedScore == null
    ? '<span class="badge badge-critical">UNSCORED null turn</span>'
    : item.flags.map((flag) => renderBadge(flag)).join('') || '<span class="muted">none</span>';
  const reason = item.unscoredReason
    ? escapeHtml(item.unscoredReason)
    : item.flags.map((flag) => `${escapeHtml(flag.flag)} cap ${flag.cap.toFixed(1)}: ${escapeHtml(flag.reason)}`).join('<br />') || '<span class="muted">No honesty cap applied.</span>';
  return `<tr class="${severityClass}">
    <td>T${item.turn.task}.${item.turn.turn}<br /><span class="muted">${escapeHtml(item.turn.tag)}</span></td>
    <td>${formatScore(item.originalScore)}</td>
    <td><strong>${formatScore(item.correctedScore)}</strong><br /><span class="muted">${escapeHtml(item.correctedLetter)}</span></td>
    <td>${badges}</td>
    <td>${reason}</td>
    <td class="quote">${escapeHtml(excerpt(item.turn.answer ?? '', 520))}</td>
  </tr>`;
}

function renderBadge(flag: DetectorFinding): string {
  const critical = flag.cap <= 2 ? ' badge-critical' : ' badge-warn';
  return `<span class="badge${critical}" title="${escapeHtml(flag.reason)}">${escapeHtml(flag.flag)}</span>`;
}

function countFlags(items: RescoredTurn[]): Map<HonestyFlag, number> {
  const counts = new Map<HonestyFlag, number>();
  for (const item of items) {
    for (const flag of item.flags) counts.set(flag.flag, (counts.get(flag.flag) ?? 0) + 1);
  }
  return counts;
}

function finding(flag: HonestyFlag, label: string, cap: number, reason: string, evidence: string): DetectorFinding {
  return { flag, label, cap, reason, evidence };
}

function templateSignature(turn: TranscriptTurn): string | null {
  const answer = turn.answer ?? '';
  if (isSourceFallbackTemplate(answer)) return 'source-fallback-mode-confidence-current-state';
  if (/^To stand up "[^"]+", capture these event-specific gaps\./i.test(answer.trim())) return 'source-intake-capture-gaps';
  return null;
}

function isSourceFallbackTemplate(answer: string): boolean {
  return /^Mode:\s*(event shaping|expert sourcing|cxo guidance)\.\s*Confidence:\s*(low|medium|high)\.\s*Current state:/i.test(answer.trim())
    && /Sourcing implication:/i.test(answer)
    && /Risks\/traps:/i.test(answer);
}

function looksLikeJsonOnly(answer: string): boolean {
  if (!/^[\[{]/.test(answer)) return false;
  try {
    JSON.parse(answer);
    return true;
  } catch {
    return false;
  }
}

function numericScore(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function average(values: Array<number | null>): number | null {
  const scored = values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  if (!scored.length) return null;
  return Math.round((scored.reduce((sum, value) => sum + value, 0) / scored.length) * 100) / 100;
}

function roundHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function formatScore(value: number | null): string {
  return value == null ? 'UNSCORED' : `${value.toFixed(1)}/10`;
}

function letterForScore(value: number): string {
  if (value >= 9) return 'A';
  if (value >= 8) return 'B';
  if (value >= 6.5) return 'C';
  if (value >= 5) return 'D';
  return 'F';
}

function firstSentence(value: string): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  const match = compact.match(/^(.{1,220}?[.!?])(?:\s|$)/);
  return match ? match[1] : excerpt(compact, 220);
}

function excerpt(value: string, max = 220): string {
  const compact = value.replace(/\s+/g, ' ').trim();
  return compact.length <= max ? compact : `${compact.slice(0, max - 3)}...`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
