/**
 * Reasoning layer health checks.
 *
 * Pure helpers that exercise the canonical demo fixtures (AMS source instance
 * + APX-CDP program instance) end-to-end through the reasoning runtime so the
 * `/api/reasoning/health` endpoint can answer the question:
 *
 *   "Is the reasoning layer correctly wired right now?"
 *
 * Each check is deterministic, free of network and randomness, and returns a
 * `HealthCheckResult` describing pass/fail plus elapsed wall-clock time. A
 * failing check captures its error message in `detail` rather than throwing —
 * this is a health endpoint, not a critical path.
 *
 * No I/O, no globals mutated. Safe to call from server routes and tests.
 */

import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { APX_CDP_2026_INSTANCE } from '@/lib/programs/program-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { resolveAnyInstance } from '@/lib/reasoning/instance-resolver';
import { findLifecyclePattern, getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';
import { getResolved } from '@/lib/reasoning/contradiction-resolution-state';
import { getEvidenceFor } from '@/lib/reasoning/evidence-ingestion-store';

export type HealthCheckStatus = 'pass' | 'fail';

export interface HealthCheckResult {
  /** Stable name of the check. Used as a UI label and a test anchor. */
  name: string;
  /** Pass/fail outcome. */
  status: HealthCheckStatus;
  /** Wall-clock duration of the check, in ms. */
  elapsedMs: number;
  /** Free-form failure or context detail. Omitted when the check passes. */
  detail?: string;
}

export interface HealthLayersSummary {
  lifecyclePatternCount: number;
  sourceInstanceCount: number;
  programInstanceCount: number;
  telemetryEventCount: number;
  resolvedContradictionCount: number;
  ingestedEvidenceItems: number;
}

export interface HealthReport {
  ok: boolean;
  checks: HealthCheckResult[];
  layers: HealthLayersSummary;
  computedAt: string;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Wraps a synchronous probe in elapsed-ms timing and exception-to-fail
 * conversion. The probe can either return `void` (success implied) or return
 * a string `detail` to attach to a `pass` result.
 */
function runCheck(name: string, probe: () => string | void): HealthCheckResult {
  const started = Date.now();
  try {
    const detail = probe();
    const elapsedMs = Date.now() - started;
    return detail
      ? { name, status: 'pass', elapsedMs, detail }
      : { name, status: 'pass', elapsedMs };
  } catch (err) {
    const elapsedMs = Date.now() - started;
    const message = err instanceof Error ? err.message : String(err);
    return { name, status: 'fail', elapsedMs, detail: message };
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// ── Individual checks ───────────────────────────────────────────────────────

export function checkSourceInstanceResolves(): HealthCheckResult {
  return runCheck('source-instance-resolves', () => {
    const resolved = resolveAnyInstance(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id);
    assert(resolved !== null, 'AMS instance did not resolve via resolveAnyInstance');
    assert(resolved.kind === 'source', `Expected kind=source, got ${resolved.kind}`);
    assert(
      resolved.instance.id === AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id,
      'Resolved AMS instance id mismatch',
    );
  });
}

export function checkProgramInstanceResolves(): HealthCheckResult {
  return runCheck('program-instance-resolves', () => {
    const resolved = resolveAnyInstance(APX_CDP_2026_INSTANCE.id);
    assert(resolved !== null, 'APX-CDP instance did not resolve via resolveAnyInstance');
    assert(resolved.kind === 'program', `Expected kind=program, got ${resolved.kind}`);
    assert(
      resolved.instance.id === APX_CDP_2026_INSTANCE.id,
      'Resolved APX-CDP instance id mismatch',
    );
  });
}

export function checkSourcePatternResolves(): HealthCheckResult {
  return runCheck('source-pattern-resolves', () => {
    const pattern = findLifecyclePattern(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.patternId);
    assert(pattern !== undefined, 'PAT-SRC-AMS-001 not found in lifecycle pattern catalogue');
    assert(
      Array.isArray(pattern.stages) && pattern.stages.length > 0,
      'AMS pattern has no stages',
    );
    assert(
      Array.isArray(pattern.expectedArtifacts),
      'AMS pattern is missing expectedArtifacts (required for synthesis)',
    );
  });
}

export function checkProgramPatternResolves(): HealthCheckResult {
  return runCheck('program-pattern-resolves', () => {
    const pattern = findLifecyclePattern(APX_CDP_2026_INSTANCE.patternId);
    assert(pattern !== undefined, 'PAT-PRG-CDP-001 not found in lifecycle pattern catalogue');
    assert(
      Array.isArray(pattern.stages) && pattern.stages.length > 0,
      'APX-CDP pattern has no stages',
    );
  });
}

export function checkSourceSynthesisContext(): HealthCheckResult {
  return runCheck('source-synthesis-context', () => {
    const pattern = findLifecyclePattern(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.patternId);
    assert(pattern !== undefined, 'AMS pattern unavailable — cannot build synthesis context');
    const ctx = buildSourceSynthesisContext(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE, pattern);
    assert(ctx.instanceType === 'source-event', `instanceType=${ctx.instanceType}`);
    assert(
      ctx.instanceId === AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id,
      'Synthesis context instanceId mismatch',
    );
    assert(ctx.gatesSummary.total > 0, 'Synthesis context has zero gates');
    assert(ctx.citations.length > 0, 'Synthesis context has zero citations');
    assert(typeof ctx.stageGuidance === 'string', 'stageGuidance is not a string');
    return `gates=${ctx.gatesSummary.total} citations=${ctx.citations.length}`;
  });
}

export function checkProgramSynthesisContext(): HealthCheckResult {
  return runCheck('program-synthesis-context', () => {
    const pattern = findLifecyclePattern(APX_CDP_2026_INSTANCE.patternId);
    assert(pattern !== undefined, 'APX-CDP pattern unavailable — cannot build synthesis context');
    const ctx = buildProgramSynthesisContext(APX_CDP_2026_INSTANCE, pattern);
    assert(ctx.instanceType === 'program', `instanceType=${ctx.instanceType}`);
    assert(
      ctx.instanceId === APX_CDP_2026_INSTANCE.id,
      'Synthesis context instanceId mismatch',
    );
    assert(ctx.gatesSummary.total > 0, 'Program synthesis context has zero gates');
    assert(ctx.citations.length > 0, 'Program synthesis context has zero citations');
    return `gates=${ctx.gatesSummary.total} citations=${ctx.citations.length}`;
  });
}

export function checkCascadeWiring(): HealthCheckResult {
  return runCheck('cascade-source-to-program', () => {
    const pattern = findLifecyclePattern(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.patternId);
    assert(pattern !== undefined, 'AMS pattern unavailable');
    const ctx = buildSourceSynthesisContext(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE, pattern);
    assert(
      ctx.cascadeContext.length > 0,
      'AMS cascade context is empty — Source → Program link is broken',
    );
    const cdp = ctx.cascadeContext.find((c) => c.targetInstanceId === APX_CDP_2026_INSTANCE.id);
    assert(cdp !== undefined, 'APX-CDP downstream link missing from AMS cascade');
  });
}

export function checkLifecyclePatternCatalogue(): HealthCheckResult {
  return runCheck('lifecycle-pattern-catalogue', () => {
    const all = getAllLifecyclePatterns();
    assert(all.length > 0, 'Lifecycle pattern catalogue is empty');
    assert(SOURCE_LIFECYCLE_PATTERNS.length > 0, 'No source lifecycle patterns registered');
    assert(PROGRAM_LIFECYCLE_PATTERNS.length > 0, 'No program lifecycle patterns registered');
    return `total=${all.length} source=${SOURCE_LIFECYCLE_PATTERNS.length} program=${PROGRAM_LIFECYCLE_PATTERNS.length}`;
  });
}

// ── Layer summary ───────────────────────────────────────────────────────────

/**
 * Best-effort count of evidence items contributed via the in-memory ingestion
 * store. The store does not expose a global iterator, so we walk the union of
 * known instance ids and sum the per-instance lists.
 */
function countIngestedEvidence(): number {
  let total = 0;
  for (const s of SOURCE_EVENT_INSTANCES) total += getEvidenceFor(s.id).length;
  for (const p of APEX_RETAIL_PROGRAM_INSTANCES) total += getEvidenceFor(p.id).length;
  return total;
}

export function summarizeLayers(): HealthLayersSummary {
  return {
    lifecyclePatternCount: getAllLifecyclePatterns().length,
    sourceInstanceCount: SOURCE_EVENT_INSTANCES.length,
    programInstanceCount: APEX_RETAIL_PROGRAM_INSTANCES.length,
    telemetryEventCount: getRecentSynthesisEvents().length,
    resolvedContradictionCount: getResolved().length,
    ingestedEvidenceItems: countIngestedEvidence(),
  };
}

// ── Top-level runner ────────────────────────────────────────────────────────

/**
 * Run every check in order and assemble a complete `HealthReport`. The
 * `ok` flag is true iff every check passed. Order is stable so the admin
 * dashboard renders a deterministic list.
 */
export function runAllHealthChecks(): HealthReport {
  const checks: HealthCheckResult[] = [
    checkLifecyclePatternCatalogue(),
    checkSourceInstanceResolves(),
    checkProgramInstanceResolves(),
    checkSourcePatternResolves(),
    checkProgramPatternResolves(),
    checkSourceSynthesisContext(),
    checkProgramSynthesisContext(),
    checkCascadeWiring(),
  ];

  const ok = checks.every((c) => c.status === 'pass');

  return {
    ok,
    checks,
    layers: summarizeLayers(),
    computedAt: new Date().toISOString(),
  };
}
