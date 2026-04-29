/**
 * End-to-end smoke tests for the Layer-3 reasoning chain.
 *
 * These tests are intentionally horizontal: each one walks the full
 * reasoning surface (pattern lookup → evidence map → gate evaluation →
 * contradiction / failure-mode detection → artifact tracking →
 * cross-instance cascade → synthesis context → mission derivation →
 * health) in a single shot. Any breakage anywhere in the chain trips
 * one of these tests, which makes the file a high-leverage canary on
 * top of the existing per-module unit tests.
 *
 * Pure: no network, no LLM calls, no randomness. State stores are
 * reset via `_resetForTests()` between cases that touch them.
 */

import {
  PAT_SRC_AMS_001,
  SOURCE_LIFECYCLE_PATTERNS,
} from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import {
  APX_CDP_2026_INSTANCE,
  APEX_RETAIL_PROGRAM_INSTANCES,
} from '@/lib/programs/program-instances';
import {
  buildEvidenceMap,
  buildEvidenceMapWithIngestions,
} from '@/lib/source/source-event-instance';
import { findLifecyclePattern } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { createGateEvaluator } from '@/lib/reasoning/gate-evaluator';
import { detectContradictions } from '@/lib/reasoning/contradiction-detector';
import { detectFailureModes } from '@/lib/reasoning/failure-mode-detector';
import { trackArtifacts } from '@/lib/reasoning/artifact-tracker';
import { computeCascadeImpacts } from '@/lib/reasoning/cross-instance-reasoner';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { buildTowerSynthesisContext } from '@/lib/reasoning/tower-synthesis-context-builder';
import { deriveMissionsFromInstance } from '@/lib/reasoning/mission-derivation';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildPortfolioRiskRegister } from '@/lib/reasoning/risk-register';
import { buildWeeklyDigest } from '@/lib/reasoning/weekly-digest';
import {
  lintFixtures,
  summarizeLintReport,
} from '@/lib/reasoning/fixture-quality-lint';
import {
  recordSynthesisEvent,
  getRecentSynthesisEvents,
  _resetForTests as resetSynthesisTelemetry,
  type SynthesisTelemetryInput,
} from '@/lib/reasoning/synthesis-telemetry';
import { summarizeTelemetry } from '@/lib/reasoning/synthesis-telemetry-stats';
import { computePatternUsage } from '@/lib/reasoning/pattern-usage-analytics';
import {
  recordCascadeEvent,
  getRecentCascadeEvents,
  _resetForTests as resetCascadeTelemetry,
} from '@/lib/reasoning/cascade-telemetry';
import {
  CASCADE_HOT_EDGE_THRESHOLD,
  computeEdgeHitCounts,
  cascadeEdgeKey,
} from '@/lib/reasoning/cascade-telemetry-overlay';
import {
  setMissionState,
  getRecentMissionStates,
  _resetForTests as resetMissionState,
} from '@/lib/reasoning/mission-state-store';
import {
  addEvidence,
  _resetForTests as resetEvidenceIngestion,
} from '@/lib/reasoning/evidence-ingestion-store';

// ─── Test 1: AMS Source event full chain ─────────────────────────────────────

describe('e2e smoke — AMS Source event full chain', () => {
  it('walks pattern → evidence → gates → detectors → cascade → context → missions → health', () => {
    const instance = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE;

    // 1. Resolve pattern via the lookup helper.
    const pattern = findLifecyclePattern(instance.patternId);
    expect(pattern).toBeDefined();
    expect(pattern!.patternId).toBe('PAT-SRC-AMS-001');

    // 2. Build evidence map.
    const evidenceMap = buildEvidenceMap(instance);
    expect(Object.keys(evidenceMap).length).toBeGreaterThan(0);

    // 3. Run evaluator.evaluateAllStages — assert non-empty.
    const evaluator = createGateEvaluator(pattern!);
    const stageResults = evaluator.evaluateAllStages(
      instance.currentStage,
      evidenceMap,
    );
    expect(stageResults.length).toBeGreaterThan(0);

    // 4. Run contradiction detector — at least one detection on AMS.
    const contradictions = detectContradictions(pattern!, evidenceMap);
    expect(contradictions.length).toBeGreaterThanOrEqual(1);

    // 5. Run failure-mode detector — at least one detection on AMS.
    const failureModes = detectFailureModes(pattern!, evidenceMap);
    expect(failureModes.length).toBeGreaterThanOrEqual(1);

    // 6. Per-stage artifact tracking — non-empty.
    const tracking = trackArtifacts(pattern!, instance);
    expect(Array.isArray(tracking)).toBe(true);
    expect(tracking.length).toBeGreaterThan(0);

    // 7. Cascade impacts — must include AMS → APX-CDP-2026 unblock.
    const impacts = computeCascadeImpacts(instance);
    const cdpImpact = impacts.find(
      (i) =>
        i.sourceInstanceId === instance.id &&
        i.targetInstanceId === 'APX-CDP-2026',
    );
    expect(cdpImpact).toBeDefined();

    // 8. Synthesis context — citations non-empty.
    const ctx = buildSourceSynthesisContext(instance, pattern!);
    expect(ctx.citations.length).toBeGreaterThan(0);

    // 9. Mission derivation — at least one mission for the AMS instance.
    const missions = deriveMissionsFromInstance(instance, pattern!);
    expect(missions.length).toBeGreaterThanOrEqual(1);

    // 10. Health verdict — grade in {green, amber, red}, score in [0, 100].
    const health = computeInstanceHealth(ctx);
    expect(['green', 'amber', 'red']).toContain(health.grade);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
  });
});

// ─── Test 2: APX-CDP-2026 Program full chain ─────────────────────────────────

describe('e2e smoke — APX-CDP-2026 Program full chain', () => {
  it('walks pattern → context → missions → cascade → health', () => {
    const instance = APX_CDP_2026_INSTANCE;

    // 1. Resolve pattern via the lookup helper.
    const pattern = findLifecyclePattern(instance.patternId);
    expect(pattern).toBeDefined();

    // 2. Synthesis context — citations non-empty.
    const ctx = buildProgramSynthesisContext(instance, pattern!);
    expect(ctx.instanceType).toBe('program');
    expect(ctx.citations.length).toBeGreaterThan(0);

    // 3. evaluateAllStages via gate evaluator (program patterns use phase ids).
    const evaluator = createGateEvaluator(pattern!);
    const stageResults = evaluator.evaluateAllStages(
      ctx.currentStage,
      ctx.instanceSnapshot as Record<string, unknown>,
    );
    expect(stageResults.length).toBeGreaterThan(0);

    // 4. Cascade impacts — at least one entry (program ↔ source / program).
    const impacts = computeCascadeImpacts(instance);
    expect(impacts.length).toBeGreaterThan(0);

    // 5. Mission derivation — at least one mission for the program.
    const missions = deriveMissionsFromInstance(instance, pattern!);
    expect(missions.length).toBeGreaterThanOrEqual(1);

    // 6. Health verdict.
    const health = computeInstanceHealth(ctx);
    expect(['green', 'amber', 'red']).toContain(health.grade);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
  });
});

// ─── Test 3: Tower portfolio full chain ──────────────────────────────────────

describe('e2e smoke — Tower portfolio full chain', () => {
  it('builds tower context, portfolio risk register, weekly digest, and lints fixtures clean', () => {
    // 1. Tower synthesis context across the active portfolio.
    const ctx = buildTowerSynthesisContext(
      APEX_RETAIL_PROGRAM_INSTANCES,
      SOURCE_EVENT_INSTANCES,
    );
    expect(ctx.instanceType).toBe('tower');
    expect(ctx.gatesSummary.total).toBeGreaterThan(0);

    // 2. Portfolio risk register.
    const register = buildPortfolioRiskRegister();
    expect(Array.isArray(register)).toBe(true);
    expect(register.length).toBeGreaterThan(0);

    // 3. Weekly digest — anchor with a fixed nowMs for determinism.
    const digest = buildWeeklyDigest(Date.UTC(2026, 3, 28));
    expect(digest).toBeDefined();
    expect(Array.isArray(digest.perInstance)).toBe(true);

    // 4. Fixture-quality audit — zero errors against the live corpus.
    const report = lintFixtures();
    const summary = summarizeLintReport(report);
    expect(summary.errors).toEqual([]);
  });
});

// ─── Test 4: Telemetry round-trip ────────────────────────────────────────────

describe('e2e smoke — synthesis telemetry round-trip', () => {
  beforeEach(() => {
    resetSynthesisTelemetry();
  });

  it('records → reads → summarises → analyses pattern usage', () => {
    const input: SynthesisTelemetryInput = {
      surface: 'source',
      instanceId: AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id,
      patternId: 'PAT-SRC-AMS-001',
      cacheHit: false,
      latencyMs: 213,
      citationCount: 2,
      contradictionCount: 1,
      failureModeCount: 1,
      gateCount: 4,
    };
    const recorded = recordSynthesisEvent(input);
    expect(recorded.id).toBeDefined();

    const events = getRecentSynthesisEvents();
    expect(events.length).toBe(1);
    expect(events[0].id).toBe(recorded.id);

    // Summary stats — total event count must match what we recorded.
    const summary = summarizeTelemetry(events);
    expect(summary.totalEvents).toBe(1);
    expect(summary.bySurface.source.events).toBe(1);

    // Pattern usage — pass deterministic inputs to avoid coupling to wall clock.
    const usage = computePatternUsage({
      synthesisEvents: events,
      cascadeEvents: [],
      now: Date.now(),
    });
    expect(usage.totalPatterns).toBeGreaterThan(0);
    const amsRow = usage.rows.find((r) => r.patternId === 'PAT-SRC-AMS-001');
    expect(amsRow).toBeDefined();
    expect(amsRow!.totalEvents).toBeGreaterThanOrEqual(1);
  });
});

// ─── Test 5: Cascade telemetry round-trip ────────────────────────────────────

describe('e2e smoke — cascade telemetry round-trip', () => {
  beforeEach(() => {
    resetCascadeTelemetry();
  });

  it('records → reads → folds into edge counts → applies hot-edge threshold', () => {
    // Fire one cascade event below the hot-edge threshold.
    recordCascadeEvent({
      sourceInstanceId: 'AMS-VENDOR-2026',
      targetInstanceId: 'APX-CDP-2026',
      linkType: 'unblocks',
      severity: 'high',
      impactSeverity: 'high',
      buildContext: 'source-synthesis',
    });

    const events = getRecentCascadeEvents();
    expect(events.length).toBe(1);

    const counts = computeEdgeHitCounts(events);
    const key = cascadeEdgeKey('AMS-VENDOR-2026', 'APX-CDP-2026', 'unblocks');
    expect(counts.get(key)).toBe(1);

    // Hot-edge threshold logic: a single hit must NOT cross the threshold.
    expect((counts.get(key) ?? 0) >= CASCADE_HOT_EDGE_THRESHOLD).toBe(false);

    // Synthesise enough events to cross the threshold.
    for (let i = 1; i < CASCADE_HOT_EDGE_THRESHOLD; i++) {
      recordCascadeEvent({
        sourceInstanceId: 'AMS-VENDOR-2026',
        targetInstanceId: 'APX-CDP-2026',
        linkType: 'unblocks',
        severity: 'high',
        impactSeverity: 'high',
        buildContext: 'source-synthesis',
      });
    }
    const hotCounts = computeEdgeHitCounts(getRecentCascadeEvents());
    expect((hotCounts.get(key) ?? 0) >= CASCADE_HOT_EDGE_THRESHOLD).toBe(true);
  });
});

// ─── Test 6: Mission state round-trip ────────────────────────────────────────

describe('e2e smoke — mission state round-trip', () => {
  beforeEach(() => {
    resetMissionState();
  });

  it('marks complete with note → reads back via getRecentMissionStates', () => {
    const instanceId = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.id;
    const missionId = `${instanceId}:bafo-pricing-comparison`;

    setMissionState(missionId, 'complete', 'Uploaded comparison sheet');

    const recent = getRecentMissionStates(instanceId, 5);
    expect(recent.length).toBe(1);
    expect(recent[0].id).toBe(missionId);
    expect(recent[0].status).toBe('complete');
    expect(recent[0].note).toBe('Uploaded comparison sheet');
  });
});

// ─── Test 7: Evidence ingestion round-trip ───────────────────────────────────

describe('e2e smoke — evidence ingestion round-trip', () => {
  beforeEach(() => {
    resetEvidenceIngestion();
  });

  it('ingests → buildEvidenceMapWithIngestions surfaces ingestion sentinel', () => {
    const instance = AMS_VENDOR_CONSOLIDATION_2026_INSTANCE;
    const baseline = buildEvidenceMap(instance);
    expect(baseline['evidence-ingested-count']).toBeUndefined();

    addEvidence(instance.id, {
      id: 'e2e-soc2',
      kind: 'attestation',
      field: 'vendor-soc2-attestation',
      value: 'true',
      source: 'e2e-smoke',
      recordedAt: '2026-04-28T00:00:00.000Z',
    });

    const merged = buildEvidenceMapWithIngestions(instance);
    expect(merged['evidence-ingested-count']).toBe(1);
    expect(Array.isArray(merged['evidence-uploaded-since-baseline'])).toBe(true);
    // The merged value should reflect the ingested record's `value` field.
    expect(merged['vendor-soc2-attestation']).toBe('true');
  });
});

// ─── Sanity: source corpus has the patterns we expect to walk ────────────────

describe('e2e smoke — corpus sanity', () => {
  it('all source instances resolve to a known lifecycle pattern', () => {
    const knownIds = new Set([
      ...SOURCE_LIFECYCLE_PATTERNS.map((p) => p.patternId),
      ...PROGRAM_LIFECYCLE_PATTERNS.map((p) => p.patternId),
    ]);
    for (const inst of SOURCE_EVENT_INSTANCES) {
      expect(knownIds.has(inst.patternId)).toBe(true);
    }
    // PAT_SRC_AMS_001 anchor — referenced by name throughout the suite.
    expect(PAT_SRC_AMS_001.patternId).toBe('PAT-SRC-AMS-001');
  });
});
