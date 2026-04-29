/**
 * Reasoning-layer CLI snapshot.
 *
 * Aggregates the rich pure helpers in `src/lib/reasoning` into a single
 * terminal-readable report. The web routes already surface this material in
 * pieces (audit, weekly digest, fixture lint, pattern usage, risk register,
 * portfolio alerts); this script is the ops-friendly equivalent — "what is
 * the state of the reasoning layer right now?" answered in one `npm run`.
 *
 * Pure: no network, no DB. Reads only the in-process fixture corpus and the
 * synthesis-context builders.
 *
 * Run with:
 *   npm run reasoning:report
 *   # or
 *   npx tsx scripts/reasoning-report.ts
 */

import {
  lintFixtures,
  summarizeLintReport,
} from '@/lib/reasoning/fixture-quality-lint';
import { auditAll } from '@/lib/reasoning/template-coverage-audit';
import { computePatternUsage } from '@/lib/reasoning/pattern-usage-analytics';
import { buildPortfolioRiskRegister } from '@/lib/reasoning/risk-register';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import {
  formatFixtureLintLine,
  formatCoverageLine,
  formatPatternUsageLine,
  formatHealthLine,
  formatRiskLine,
  type InstanceHealthEntry,
} from '@/lib/reasoning/cli-report-formatters';

const TOP_PATTERNS = 5;
const TOP_RISKS = 10;

function detectTerminalWidth(): number {
  const fromStream = process.stdout?.columns;
  if (typeof fromStream === 'number' && fromStream > 0) return fromStream;
  return 100;
}

/**
 * Wrap a single line of text to `width` characters along whitespace boundaries.
 * Long unbroken tokens are emitted intact (they may exceed width). Used only
 * for risk descriptions — coverage / counts are short by construction.
 */
function wrapLine(text: string, width: number, indent = '   '): string[] {
  if (text.length <= width) return [text];
  const usable = Math.max(20, width - indent.length);
  const words = text.split(/\s+/);
  const out: string[] = [];
  let buf = '';
  for (const word of words) {
    if (buf.length === 0) {
      buf = word;
      continue;
    }
    if (buf.length + 1 + word.length <= width) {
      buf = `${buf} ${word}`;
    } else if (buf.length + 1 + word.length <= usable + indent.length) {
      buf = `${buf} ${word}`;
    } else {
      out.push(buf);
      buf = `${indent}${word}`;
    }
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

function buildHealthEntries(): InstanceHealthEntry[] {
  const out: InstanceHealthEntry[] = [];

  for (const sourceEvent of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === sourceEvent.patternId,
    );
    if (!pattern) continue;
    try {
      const ctx = buildSourceSynthesisContext(sourceEvent, pattern);
      out.push({
        instanceId: sourceEvent.displayId ?? sourceEvent.id,
        health: computeInstanceHealth(ctx),
      });
    } catch {
      // Defensive — skip malformed fixtures rather than failing the whole report.
    }
  }

  for (const program of APEX_RETAIL_PROGRAM_INSTANCES) {
    try {
      const ctx = buildProgramSynthesisContext(program);
      out.push({
        instanceId: program.displayId ?? program.id,
        health: computeInstanceHealth(ctx),
      });
    } catch {
      // Defensive — see above.
    }
  }

  // Sort sickest-first: red, then amber, then green; within each grade,
  // ascending score (lowest at top).
  const gradeRank = { red: 0, amber: 1, green: 2 } as const;
  out.sort((a, b) => {
    const g = gradeRank[a.health.grade] - gradeRank[b.health.grade];
    if (g !== 0) return g;
    if (a.health.score !== b.health.score) return a.health.score - b.health.score;
    return a.instanceId.localeCompare(b.instanceId);
  });
  return out;
}

function maxIdWidth(ids: ReadonlyArray<string>, fallback = 20): number {
  let max = fallback;
  for (const id of ids) {
    if (id.length > max) max = id.length;
  }
  return max;
}

function main(): void {
  const width = detectTerminalWidth();
  const lines: string[] = [];
  const push = (line = '') => lines.push(line);

  push('== AbarVa Reasoning Layer · Snapshot ==');
  push(`Generated: ${new Date().toISOString()}`);
  push();

  // [Fixture lint]
  const lintReport = lintFixtures();
  const lintSummary = summarizeLintReport(lintReport);
  push('[Fixture lint]');
  push(`  ${formatFixtureLintLine(lintSummary)}`);
  push(`  ${lintReport.totalInstances} fixtures linted`);
  push();

  // [Template coverage]
  const coverage = auditAll();
  push('[Template coverage]');
  push(
    `  ${formatCoverageLine(
      'Contradictions',
      coverage.summary.contradictionsBound,
      coverage.summary.contradictions,
    )}`,
  );
  push(
    `  ${formatCoverageLine(
      'Failure modes ',
      coverage.summary.failureModesBound,
      coverage.summary.failureModes,
    )}`,
  );
  push();

  // [Pattern usage — top 5]
  const usage = computePatternUsage();
  const topPatterns = usage.rows.slice(0, TOP_PATTERNS);
  push(`[Pattern usage — top ${TOP_PATTERNS}]`);
  if (topPatterns.length === 0) {
    push('  (no patterns registered)');
  } else {
    const idWidth = maxIdWidth(topPatterns.map((r) => r.patternId));
    for (const row of topPatterns) {
      push(`  ${formatPatternUsageLine(row, idWidth)}`);
    }
  }
  push();

  // [Instance health]
  const healthEntries = buildHealthEntries();
  push('[Instance health]');
  if (healthEntries.length === 0) {
    push('  (no instances available)');
  } else {
    const idWidth = maxIdWidth(healthEntries.map((e) => e.instanceId));
    for (const entry of healthEntries) {
      push(`  ${formatHealthLine(entry, idWidth)}`);
    }
  }
  push();

  // [Top portfolio risks]
  const risks = buildPortfolioRiskRegister().slice(0, TOP_RISKS);
  push(`[Top portfolio risks]`);
  if (risks.length === 0) {
    push('  (no active risks)');
  } else {
    const labelMax = Math.max(20, width - 50);
    risks.forEach((risk, i) => {
      const line = `  ${formatRiskLine(i + 1, risk, labelMax)}`;
      const wrapped = wrapLine(line, width);
      for (const w of wrapped) push(w);
    });
  }
  push();

  process.stdout.write(`${lines.join('\n')}\n`);
}

main();
