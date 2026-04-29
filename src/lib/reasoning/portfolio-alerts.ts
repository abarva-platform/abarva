// src/lib/reasoning/portfolio-alerts.ts
//
// REASON — Portfolio alerts: cross-instance feed of the most urgent
// reasoning-layer signals. Surfaces "red"-grade instances, high-severity
// contradictions, high-confidence failure-mode detections, and high-impact
// cascade effects across every active program + source-event instance.
//
// Pure: same fixtures → same alerts. No LLM calls, no IO, no Date.now(),
// no randomness. The output ordering is fully deterministic.

import type {
  CascadeImpact,
  ContradictionDetection,
  FailureModeDetection,
  SynthesisContext,
} from './types';
import { buildSourceSynthesisContext } from './synthesis-context-builder';
import { buildProgramSynthesisContext } from './program-synthesis-context-builder';
import { computeInstanceHealth } from './instance-health';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';

// ─── Types ─────────────────────────────────────────────────────────────────────

/** Confidence threshold above which a failure-mode detection raises an alert. */
export const FAILURE_MODE_ALERT_THRESHOLD = 0.8;

/**
 * A single executive-level alert row aggregated across the portfolio. Each
 * alert traces back to exactly one instance and one underlying signal.
 */
export interface PortfolioAlert {
  /** Stable identifier — `${kind}::${instanceId}::${sourceId}`. */
  id: string;
  /** Severity bucket controls the dot colour and the sort priority. */
  severity: 'high' | 'medium';
  /** Discriminator — which detector / health rule produced this alert. */
  kind: 'contradiction' | 'failure-mode' | 'health' | 'cascade';
  /** Short human-readable headline. */
  label: string;
  /** Stable id of the instance the alert attaches to. */
  instanceId: string;
  /** Display label of the instance (display id or name). */
  instanceLabel: string;
  /**
   * Multi-tenant scope of the underlying instance. Defaults to
   * `'apex-retail'` for the demo fixtures. Reasoning admin views can
   * filter by tenant via this field; tenancy is not enforced yet.
   */
  tenantId: string;
  /** One-sentence detail explaining what the alert means. */
  detail: string;
  /** URL to the relevant detail page for one-click drill-in. */
  link: string;
}

/**
 * Default tenant id used when no tenant scope is propagated yet.
 */
const DEFAULT_ALERT_TENANT_ID = 'apex-retail';

// ─── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<PortfolioAlert['severity'], number> = {
  high: 0,
  medium: 1,
};

/**
 * Sort: severity (high → medium) → instanceId asc → kind asc → id asc.
 * The kind/id tail keeps the order stable when the same instance has
 * multiple alerts of the same severity.
 */
function compareAlerts(a: PortfolioAlert, b: PortfolioAlert): number {
  const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (sev !== 0) return sev;
  const inst = a.instanceId.localeCompare(b.instanceId);
  if (inst !== 0) return inst;
  const kind = a.kind.localeCompare(b.kind);
  if (kind !== 0) return kind;
  return a.id.localeCompare(b.id);
}

// ─── Per-signal builders ───────────────────────────────────────────────────────

function healthAlert(
  context: SynthesisContext,
  instanceLabel: string,
  link: string,
  tenantId: string,
): PortfolioAlert | null {
  const health = computeInstanceHealth(context);
  if (health.grade !== 'red') return null;
  const summary = health.summary || 'Instance is in trouble.';
  return {
    id: `health::${context.instanceId}`,
    severity: 'high',
    kind: 'health',
    label: `Health red (${health.score}/100)`,
    instanceId: context.instanceId,
    instanceLabel,
    tenantId,
    detail: summary,
    link,
  };
}

function contradictionAlert(
  detection: ContradictionDetection,
  instanceId: string,
  instanceLabel: string,
  link: string,
  tenantId: string,
): PortfolioAlert | null {
  if (detection.severity !== 'high') return null;
  return {
    id: `contradiction::${instanceId}::${detection.templateId}`,
    severity: 'high',
    kind: 'contradiction',
    label: detection.label,
    instanceId,
    instanceLabel,
    tenantId,
    detail: detection.resolutionPath || 'High-severity contradiction detected.',
    link,
  };
}

function failureModeAlert(
  detection: FailureModeDetection,
  instanceId: string,
  instanceLabel: string,
  link: string,
  tenantId: string,
): PortfolioAlert | null {
  if (detection.confidence < FAILURE_MODE_ALERT_THRESHOLD) return null;
  const mitigation = detection.mitigations[0] ?? 'Review pattern-authored mitigations.';
  return {
    id: `failure-mode::${instanceId}::${detection.failureModeId}`,
    severity: 'high',
    kind: 'failure-mode',
    label: detection.label,
    instanceId,
    instanceLabel,
    tenantId,
    detail: mitigation,
    link,
  };
}

function cascadeAlert(
  impact: CascadeImpact,
  instanceId: string,
  instanceLabel: string,
  link: string,
  tenantId: string,
): PortfolioAlert | null {
  if (impact.impactSeverity !== 'high') return null;
  const targetLabel = impact.targetInstanceName ?? impact.targetInstanceId;
  return {
    id: `cascade::${instanceId}::${impact.targetInstanceId}::${impact.linkType}`,
    severity: 'high',
    kind: 'cascade',
    label: `Cascade impact → ${targetLabel}`,
    instanceId,
    instanceLabel,
    tenantId,
    detail: impact.impact || `Downstream impact on ${targetLabel}.`,
    link,
  };
}

// ─── Link helpers ─────────────────────────────────────────────────────────────

function programLink(instanceId: string): string {
  return `/tower/programs/${instanceId.toLowerCase()}`;
}

function sourceLink(instanceId: string): string {
  return `/source/events/${instanceId}`;
}

function resolveSourcePattern(patternId: string) {
  return SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === patternId);
}

// ─── Per-instance ─────────────────────────────────────────────────────────────

/**
 * Build the alerts for a single instance from its `SynthesisContext`. Used
 * internally by the portfolio builder; exported so callers and tests can
 * exercise it in isolation against a synthetic context.
 */
export function buildAlertsForInstance(
  context: SynthesisContext,
  instanceLabel: string,
  link: string,
  tenantId: string = DEFAULT_ALERT_TENANT_ID,
): PortfolioAlert[] {
  const alerts: PortfolioAlert[] = [];

  const health = healthAlert(context, instanceLabel, link, tenantId);
  if (health !== null) alerts.push(health);

  for (const c of context.activeContradictions) {
    const a = contradictionAlert(c, context.instanceId, instanceLabel, link, tenantId);
    if (a !== null) alerts.push(a);
  }

  for (const f of context.failureModes) {
    const a = failureModeAlert(f, context.instanceId, instanceLabel, link, tenantId);
    if (a !== null) alerts.push(a);
  }

  for (const c of context.cascadeContext) {
    const a = cascadeAlert(c, context.instanceId, instanceLabel, link, tenantId);
    if (a !== null) alerts.push(a);
  }

  alerts.sort(compareAlerts);
  return alerts;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

/**
 * Build a deterministic portfolio-wide alert feed across every Apex Retail
 * program instance + active source-event instance. Sorted globally:
 * severity (high → medium) → instanceId asc → kind asc → id asc.
 */
export function buildPortfolioAlerts(
  options?: { tenantId?: string },
): PortfolioAlert[] {
  const all: PortfolioAlert[] = [];
  const tenantFilter = options?.tenantId;

  for (const program of APEX_RETAIL_PROGRAM_INSTANCES) {
    if (tenantFilter !== undefined && program.tenantId !== tenantFilter) continue;
    const ctx = buildProgramSynthesisContext(program);
    const label = program.displayId ?? program.name ?? program.id;
    const link = programLink(program.id);
    all.push(...buildAlertsForInstance(ctx, label, link, program.tenantId));
  }

  for (const sourceEvent of SOURCE_EVENT_INSTANCES) {
    if (tenantFilter !== undefined && sourceEvent.tenantId !== tenantFilter) continue;
    const pattern = resolveSourcePattern(sourceEvent.patternId);
    if (pattern === undefined) continue;
    const ctx = buildSourceSynthesisContext(sourceEvent, pattern);
    const label = sourceEvent.displayId ?? sourceEvent.name ?? sourceEvent.id;
    const link = sourceLink(sourceEvent.id);
    all.push(...buildAlertsForInstance(ctx, label, link, sourceEvent.tenantId));
  }

  all.sort(compareAlerts);
  return all;
}
