/**
 * CLI report formatters — pure helpers that turn the structured outputs of the
 * reasoning-layer reporting helpers (fixture lint, template-coverage audit,
 * pattern usage, instance health, portfolio risks) into terminal-readable
 * lines.
 *
 * Pure: same inputs → same outputs. No I/O, no clock reads, no randomness.
 * Used by `scripts/reasoning-report.ts`; the script shells the layout, these
 * helpers do the per-row formatting so they can be unit-tested directly.
 *
 * The CLI palette is intentionally plain ASCII — the AbarVa design system
 * does not apply to a terminal.
 */

import type { FixtureLintSummary } from './fixture-quality-lint';
import type { CoverageSummary } from './template-coverage-audit';
import type { PatternUsageRow } from './pattern-usage-analytics';
import type { InstanceHealth } from './instance-health';
import type { RiskItem } from './risk-register';

// ─── Fixture lint ────────────────────────────────────────────────────────────

/**
 * One-line summary: "<E> errors, <W> warnings — corpus clean | needs attention".
 * `total` is the total fixture count for context (referenced as a suffix).
 */
export function formatFixtureLintLine(summary: FixtureLintSummary): string {
  const errors = summary.errors.length;
  const warnings = summary.warnings.length;
  const verdict =
    errors === 0 && warnings === 0
      ? 'corpus clean'
      : errors === 0
        ? 'warnings only'
        : 'needs attention';
  const errorsLabel = errors === 1 ? 'error' : 'errors';
  const warningsLabel = warnings === 1 ? 'warning' : 'warnings';
  return `${errors} ${errorsLabel}, ${warnings} ${warningsLabel} — ${verdict}`;
}

// ─── Template coverage ───────────────────────────────────────────────────────

/** Render a percentage rounded to the nearest whole percent (e.g. "75%"). */
function pct(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return '0%';
  return `${Math.round(ratio * 100)}%`;
}

/**
 * Coverage line, e.g.:
 *   "Contradictions: 75% (24/32) bound, 38% (24/64) overall"
 *
 * `bound` is the templates whose pattern has at least one fixture instance;
 * `overall` is the full template set (some patterns ship without fixtures).
 */
export function formatCoverageLine(
  label: string,
  bound: CoverageSummary,
  overall: CoverageSummary,
): string {
  const boundPart = `${pct(bound.coverageRatio)} (${bound.coveredTemplates}/${bound.totalTemplates}) bound`;
  const overallPart = `${pct(overall.coverageRatio)} (${overall.coveredTemplates}/${overall.totalTemplates}) overall`;
  return `${label}: ${boundPart}, ${overallPart}`;
}

// ─── Pattern usage ───────────────────────────────────────────────────────────

/**
 * Pattern usage line, e.g.:
 *   "PAT-SRC-AMS-001  · 12 instances · 8 events"
 *
 * Pads the patternId to a stable width so the `·` separators line up across
 * a small leaderboard.
 */
export function formatPatternUsageLine(row: PatternUsageRow, idWidth = 20): string {
  const id = row.patternId.padEnd(idWidth, ' ');
  const instances = `${row.instanceCount} ${row.instanceCount === 1 ? 'instance' : 'instances'}`;
  const events = `${row.totalEvents} ${row.totalEvents === 1 ? 'event' : 'events'}`;
  return `${id} · ${instances} · ${events}`;
}

// ─── Instance health ─────────────────────────────────────────────────────────

export interface InstanceHealthEntry {
  instanceId: string;
  health: InstanceHealth;
}

/**
 * Health line, e.g.:
 *   "APX-CDP-2026  · amber  · 65"
 *
 * Pads the id and the grade so columns align without a full table renderer.
 */
export function formatHealthLine(
  entry: InstanceHealthEntry,
  idWidth = 20,
): string {
  const id = entry.instanceId.padEnd(idWidth, ' ');
  const grade = entry.health.grade.padEnd(5, ' ');
  return `${id} · ${grade} · ${entry.health.score}`;
}

// ─── Portfolio risks ─────────────────────────────────────────────────────────

/**
 * Truncate a string to `max` characters, appending `…` if it was clipped.
 * Pure — used by the risk line to keep the description from wrapping the
 * whole table.
 */
export function truncate(text: string, max: number): string {
  if (max <= 1) return text.length > 0 ? '…' : '';
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

/**
 * Risk line, e.g.:
 *   "1. high  · contradiction · APX-CDP-2026 · Vendor lock-in concern…"
 */
export function formatRiskLine(
  index: number,
  risk: RiskItem,
  labelMax = 60,
): string {
  const sev = risk.severity.padEnd(6, ' ');
  const kind = risk.kind.padEnd(13, ' ');
  const label = truncate(risk.label, labelMax);
  return `${index}. ${sev} · ${kind} · ${risk.instanceLabel} · ${label}`;
}
