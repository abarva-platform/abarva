/**
 * dashboard-summary — REASON
 *
 * Aggregates the reasoning layer into the four stat cards displayed on the
 * main maestro dashboard's "Reasoning Intelligence" row.
 *
 * Pure: same fixtures → same output. No IO, no Date.now(), no randomness.
 * Intended for use in a server component (page.tsx).
 */

import { buildPortfolioAlerts } from './portfolio-alerts';
import { computeInstanceHealth } from './instance-health';
import { buildSourceSynthesisContext } from './synthesis-context-builder';
import { buildProgramSynthesisContext } from './program-synthesis-context-builder';
import { auditAll } from './template-coverage-audit';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';

// ─── Output type ──────────────────────────────────────────────────────────────

export interface ReasoningDashboardSummary {
  /** Counts by health grade across all instances. */
  health: {
    healthy: number;
    degraded: number;
    critical: number;
  };
  /** Average gate-pass rate (0–100) across all instances, rounded. */
  gatePassRatePct: number;
  /** Number of active (non-dismissed) critical / high-severity alerts. */
  criticalAlertCount: number;
  /** Template coverage totals (always 100% in the demo fixture corpus). */
  coverage: {
    covered: number;
    total: number;
  };
}

// ─── Implementation ───────────────────────────────────────────────────────────

/**
 * Compute the four summary numbers needed by the dashboard Reasoning
 * Intelligence row. Called once per page request in a server component.
 */
export function buildReasoningDashboardSummary(): ReasoningDashboardSummary {
  // ── Health grades ─────────────────────────────────────────────────────────

  let healthy = 0;
  let degraded = 0;
  let critical = 0;

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (pattern === undefined) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const h = computeInstanceHealth(ctx);
    if (h.grade === 'green') healthy += 1;
    else if (h.grade === 'amber') degraded += 1;
    else critical += 1;
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const h = computeInstanceHealth(ctx);
    if (h.grade === 'green') healthy += 1;
    else if (h.grade === 'amber') degraded += 1;
    else critical += 1;
  }

  // ── Gate pass rate ────────────────────────────────────────────────────────

  let totalMet = 0;
  let totalGates = 0;

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (pattern === undefined) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    totalMet += ctx.gatesSummary.met;
    totalGates += ctx.gatesSummary.total;
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    totalMet += ctx.gatesSummary.met;
    totalGates += ctx.gatesSummary.total;
  }

  const gatePassRatePct =
    totalGates === 0 ? 0 : Math.round((totalMet / totalGates) * 100);

  // ── Active critical alerts ────────────────────────────────────────────────

  const alerts = buildPortfolioAlerts();
  const criticalAlertCount = alerts.filter((a) => a.severity === 'high').length;

  // ── Template coverage ─────────────────────────────────────────────────────

  const audit = auditAll();
  const covered = audit.summary.coveredTemplates;
  const total = audit.summary.totalTemplates;

  return {
    health: { healthy, degraded, critical },
    gatePassRatePct,
    criticalAlertCount,
    coverage: { covered, total },
  };
}
