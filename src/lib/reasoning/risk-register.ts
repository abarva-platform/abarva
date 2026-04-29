// src/lib/reasoning/risk-register.ts
//
// REASON — Risk register: joins active contradictions and failure mode
// detections from a SynthesisContext into a single prioritised RiskItem[].
//
// Pure: same inputs → same outputs. No LLM calls, no network, no randomness.
// Both the per-instance and portfolio variants are deterministic.

import type {
  ContradictionDetection,
  FailureModeDetection,
  SynthesisContext,
} from './types';
import { buildSourceSynthesisContext } from './synthesis-context-builder';
import { buildProgramSynthesisContext } from './program-synthesis-context-builder';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';

// ─── Types ─────────────────────────────────────────────────────────────────────

/**
 * A unified risk row that surfaces either a contradiction or a failure mode
 * against a specific instance. Renderable as-is by the RiskRegisterPanel.
 */
export interface RiskItem {
  /** templateId for contradictions, failureModeId for failure modes. */
  id: string;
  /** Discriminator — chooses which detector produced this row. */
  kind: 'contradiction' | 'failure-mode';
  /** Short human-readable label (verbatim from the detection). */
  label: string;
  /**
   * Severity bucket for sorting + dot colour. Failure modes are mapped from
   * confidence: ≥0.7 → high, ≥0.5 → medium, otherwise low.
   */
  severity: 'low' | 'medium' | 'high';
  /** Detection confidence in [0, 1]. */
  confidence: number;
  /** Stable id of the instance the risk attaches to. */
  instanceId: string;
  /** Human-readable label of the instance (display id or name). */
  instanceLabel: string;
  /** Resolution path (contradictions) or first mitigation (failure modes). */
  mitigation: string;
}

// ─── Severity helpers ──────────────────────────────────────────────────────────

const SEVERITY_RANK: Record<RiskItem['severity'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function failureModeSeverity(confidence: number): RiskItem['severity'] {
  if (confidence >= 0.7) return 'high';
  if (confidence >= 0.5) return 'medium';
  return 'low';
}

function contradictionToRisk(
  detection: ContradictionDetection,
  instanceId: string,
  instanceLabel: string,
): RiskItem {
  return {
    id: detection.templateId,
    kind: 'contradiction',
    label: detection.label,
    severity: detection.severity,
    confidence: detection.confidence,
    instanceId,
    instanceLabel,
    mitigation: detection.resolutionPath,
  };
}

function failureModeToRisk(
  detection: FailureModeDetection,
  instanceId: string,
  instanceLabel: string,
): RiskItem {
  return {
    id: detection.failureModeId,
    kind: 'failure-mode',
    label: detection.label,
    severity: failureModeSeverity(detection.confidence),
    confidence: detection.confidence,
    instanceId,
    instanceLabel,
    mitigation: detection.mitigations[0] ?? '',
  };
}

/**
 * Sort: severity high → medium → low, then confidence desc, then id asc
 * (id keeps the result fully deterministic when the first two tie).
 */
function compareRisk(a: RiskItem, b: RiskItem): number {
  const sev = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (sev !== 0) return sev;
  if (a.confidence !== b.confidence) return b.confidence - a.confidence;
  return a.id.localeCompare(b.id);
}

// ─── Per-instance ──────────────────────────────────────────────────────────────

/**
 * Build a deduped, sorted RiskItem[] for a single instance from its
 * SynthesisContext. Joins activeContradictions + failureModes; dedupe key
 * is `${kind}::${id}` so a contradiction and a failure mode can coexist
 * even if they happen to share an id.
 */
export function buildRiskRegisterForInstance(
  context: SynthesisContext,
  instanceLabel: string,
): RiskItem[] {
  const seen = new Set<string>();
  const rows: RiskItem[] = [];

  for (const c of context.activeContradictions) {
    const key = `contradiction::${c.templateId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(contradictionToRisk(c, context.instanceId, instanceLabel));
  }

  for (const f of context.failureModes) {
    const key = `failure-mode::${f.failureModeId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push(failureModeToRisk(f, context.instanceId, instanceLabel));
  }

  rows.sort(compareRisk);
  return rows;
}

// ─── Portfolio ────────────────────────────────────────────────────────────────

function resolveSourcePattern(patternId: string) {
  return SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === patternId);
}

/**
 * Build a portfolio-wide RiskItem[] by unioning the per-instance registers
 * of every Apex Retail program plus every active source event instance.
 *
 * Sort order is global (severity → confidence → id). Dedupe is per-instance,
 * so two different instances exhibiting the same contradiction template each
 * contribute their own row (as expected for a portfolio register).
 */
export function buildPortfolioRiskRegister(): RiskItem[] {
  const all: RiskItem[] = [];

  for (const program of APEX_RETAIL_PROGRAM_INSTANCES) {
    const ctx = buildProgramSynthesisContext(program);
    const label = program.displayId ?? program.name ?? program.id;
    all.push(...buildRiskRegisterForInstance(ctx, label));
  }

  for (const sourceEvent of SOURCE_EVENT_INSTANCES) {
    const pattern = resolveSourcePattern(sourceEvent.patternId);
    if (pattern === undefined) continue;
    const ctx = buildSourceSynthesisContext(sourceEvent, pattern);
    const label = sourceEvent.displayId ?? sourceEvent.name ?? sourceEvent.id;
    all.push(...buildRiskRegisterForInstance(ctx, label));
  }

  all.sort(compareRisk);
  return all;
}
