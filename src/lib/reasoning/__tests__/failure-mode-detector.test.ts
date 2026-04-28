/**
 * Failure mode detector tests — REASON-19
 *
 * Deterministic: no network, no LLM calls, no randomness.
 * Same inputs always produce the same outputs.
 *
 * Mirrors the contradiction-detector test surface so the two detectors stay
 * easy to reason about side-by-side. Uses PAT_SRC_AMS_001 as the canonical
 * fixture — it has 6 failure modes with rich descriptions that provide
 * reliable keyword signal. Uses AMS_VENDOR_CONSOLIDATION_2026_INSTANCE via
 * buildEvidenceMap for the AMS-instance end-to-end check.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import {
  createFailureModeDetector,
  detectFailureModes,
  LifecycleFailureModeDetector,
} from '@/lib/reasoning/failure-mode-detector';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';

// ─── Fixture helpers ───────────────────────────────────────────────────────────

/**
 * Evidence map with multiple keywords from FM-AMS-002 (Scope Creep Post-Award):
 * description references "scope", "vendor", "onboard", "services", "team",
 * "infrastructure", "contracted", "year-1", "costs", "disputes". Hitting four
 * of these guarantees the mode fires (≥2 match threshold) and lets us assert
 * confidence scaling.
 */
const RICH_FM_AMS_002_EVIDENCE: Record<string, unknown> = {
  'vendor-scope-onboard-status': 'expanding',
  'contracted-services-baseline': 'partial',
  'team-onboard-progress': 'in-flight',
  'infrastructure-onboarding-plan': 'pending',
};

/**
 * Sparse evidence — only one keyword from any failure mode description.
 */
const SPARSE_EVIDENCE: Record<string, unknown> = {
  'vendor-name': 'Northstar',
};

// ─── 1. Empty / sparse evidence → no detections ──────────────────────────────

describe('detect — empty evidence map', () => {
  let detector: LifecycleFailureModeDetector;

  beforeEach(() => {
    detector = createFailureModeDetector(PAT_SRC_AMS_001);
  });

  it('returns an empty array when evidence map is empty', () => {
    expect(detector.detect({})).toEqual([]);
  });

  it('PAT_SRC_AMS_001 has 6 failure modes to evaluate', () => {
    // Validates fixture integrity — keeps the rest of the suite anchored.
    expect(PAT_SRC_AMS_001.failureModes).toHaveLength(6);
  });
});

describe('detect — sparse evidence (single keyword match)', () => {
  let detector: LifecycleFailureModeDetector;

  beforeEach(() => {
    detector = createFailureModeDetector(PAT_SRC_AMS_001);
  });

  it('returns no detections when only 1 keyword matches', () => {
    const results = detector.detect(SPARSE_EVIDENCE);
    expect(results).toHaveLength(0);
  });

  it('returns no detections when evidence has no relevant keywords', () => {
    const results = detector.detect({
      'budget-approved': true,
      'sponsor-sign-off-date': '2026-03-01',
    });
    expect(results).toHaveLength(0);
  });
});

// ─── 2. Rich evidence → failure mode fires ───────────────────────────────────

describe('detect — rich evidence (≥2 keyword matches)', () => {
  let detector: LifecycleFailureModeDetector;

  beforeEach(() => {
    detector = createFailureModeDetector(PAT_SRC_AMS_001);
  });

  it('fires at least one failure mode when evidence contains 4 relevant keywords', () => {
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    expect(results.length).toBeGreaterThan(0);
  });

  it('each fired detection has confidence in [0.3, 0.9]', () => {
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    for (const r of results) {
      expect(r.confidence).toBeGreaterThanOrEqual(0.3);
      expect(r.confidence).toBeLessThanOrEqual(0.9);
    }
  });

  it('each fired detection has a non-empty label', () => {
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    for (const r of results) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it('each fired detection carries through stages and mitigations from the pattern', () => {
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    for (const r of results) {
      // The pattern's failure modes always declare ≥1 stage and ≥1 mitigation.
      expect(r.stages.length).toBeGreaterThan(0);
      expect(r.mitigations.length).toBeGreaterThan(0);
    }
  });

  it('detected failureModeId matches an id in the pattern', () => {
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    const validIds = new Set(PAT_SRC_AMS_001.failureModes.map((f) => f.id));
    for (const r of results) {
      expect(validIds.has(r.failureModeId)).toBe(true);
      expect(r.id).toBe(r.failureModeId);
    }
  });

  it('matchedKeywords and detectedFromKeys are non-empty when a mode fires', () => {
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    for (const r of results) {
      expect(r.matchedKeywords.length).toBeGreaterThan(0);
      expect(r.detectedFromKeys.length).toBeGreaterThan(0);
    }
  });
});

// ─── 3. Confidence scales with match count (capped at 0.9) ───────────────────

describe('confidence scaling', () => {
  let detector: LifecycleFailureModeDetector;

  beforeEach(() => {
    detector = createFailureModeDetector(PAT_SRC_AMS_001);
  });

  it('confidence increases monotonically with more keyword matches', () => {
    // Two evidence maps for the same failure mode (FM-AMS-002 — Scope Creep):
    // - fewer matches → lower or equal confidence.
    // - more matches  → higher or equal confidence (saturation cap notwithstanding).
    const fewer: Record<string, unknown> = {
      'vendor-scope-update': 'expanding',
      'contracted-services-line': 'partial',
    };
    const more: Record<string, unknown> = {
      'vendor-scope-onboard-status': 'expanding',
      'contracted-services-baseline': 'partial',
      'team-onboard-progress': 'in-flight',
      'infrastructure-onboarding-plan': 'pending',
      'year-1-costs-additions': 'flagged',
      'disputes-change-control': 'open',
    };
    const fewerResults = detector.detect(fewer);
    const moreResults = detector.detect(more);

    for (const moreResult of moreResults) {
      const fewerResult = fewerResults.find(
        (r) => r.failureModeId === moreResult.failureModeId,
      );
      if (fewerResult) {
        expect(moreResult.confidence).toBeGreaterThanOrEqual(fewerResult.confidence);
      }
    }
  });

  it('confidence never exceeds 0.9 even with saturated keyword evidence', () => {
    // Saturate with keys that hit many failure mode descriptions. The cap at
    // 0.9 is part of the contract — same as the contradiction detector.
    const saturated: Record<string, unknown> = {
      'vendor-scope-onboard-services-team': 'expanding',
      'infrastructure-contracted-year-1-costs': 'inflated',
      'disputes-change-control-baseline-onboarding': 'open',
      'attestation-security-soc-pen-test-vendor': 'overdue',
      'reference-calls-finalists-bafo-shortcut': 'incomplete',
      'tco-normalization-bafo-letter-window': 'compressed',
      'kt-plan-knowledge-transfer-resourced-named': 'gap',
      'tooling-proprietary-monitoring-portability-exit': 'unknown',
    };
    const results = detector.detect(saturated);
    for (const r of results) {
      expect(r.confidence).toBeLessThanOrEqual(0.9);
    }
  });
});

// ─── 4. Stage filtering ──────────────────────────────────────────────────────

describe('detectForStage', () => {
  let detector: LifecycleFailureModeDetector;

  beforeEach(() => {
    detector = createFailureModeDetector(PAT_SRC_AMS_001);
  });

  it('returns a subset of detect() results', () => {
    const all = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    const forStage = detector.detectForStage('Onboard', RICH_FM_AMS_002_EVIDENCE);
    expect(forStage.length).toBeLessThanOrEqual(all.length);
  });

  it('all returned detections list the stage in their stages array', () => {
    const forStage = detector.detectForStage('Onboard', RICH_FM_AMS_002_EVIDENCE);
    for (const r of forStage) {
      expect(r.stages).toContain('Onboard');
    }
  });

  it('returns empty array when no fired detection matches the stage', () => {
    // 'Plan' is not in the AMS failureModes' stages arrays.
    const forStage = detector.detectForStage('Plan', RICH_FM_AMS_002_EVIDENCE);
    expect(forStage).toHaveLength(0);
  });

  it('preserves the same id+confidence pairs as detect() for matching stages', () => {
    const all = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    const forStage = detector.detectForStage('Onboard', RICH_FM_AMS_002_EVIDENCE);
    for (const r of forStage) {
      const matching = all.find((a) => a.failureModeId === r.failureModeId);
      expect(matching).toBeDefined();
      expect(matching?.confidence).toBe(r.confidence);
    }
  });
});

// ─── 5. AMS instance end-to-end ──────────────────────────────────────────────

describe('AMS instance failure mode detection', () => {
  it('detect(buildEvidenceMap(AMS_INSTANCE)) fires at least one failure mode', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const detector = createFailureModeDetector(PAT_SRC_AMS_001);
    const results = detector.detect(evidenceMap);
    expect(results.length).toBeGreaterThan(0);
  });

  it('convenience detectFailureModes() returns the same results as instance method', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const instanceResults = createFailureModeDetector(PAT_SRC_AMS_001).detect(evidenceMap);
    const convenienceResults = detectFailureModes(PAT_SRC_AMS_001, evidenceMap);
    expect(convenienceResults.map((r) => r.failureModeId)).toEqual(
      instanceResults.map((r) => r.failureModeId),
    );
  });

  it('every detection on the AMS instance has stages + mitigations populated', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const results = detectFailureModes(PAT_SRC_AMS_001, evidenceMap);
    for (const r of results) {
      expect(r.stages.length).toBeGreaterThan(0);
      expect(r.mitigations.length).toBeGreaterThan(0);
    }
  });
});

// ─── 6. Determinism ──────────────────────────────────────────────────────────

describe('determinism', () => {
  it('same input → same output array (order stable across invocations)', () => {
    const detector = createFailureModeDetector(PAT_SRC_AMS_001);
    const a = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    const b = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    const c = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    expect(a).toEqual(b);
    expect(b).toEqual(c);
  });

  it('output order matches the pattern.failureModes declaration order', () => {
    const detector = createFailureModeDetector(PAT_SRC_AMS_001);
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    const declarationOrder = PAT_SRC_AMS_001.failureModes.map((f) => f.id);
    const resultOrder = results.map((r) => r.failureModeId);

    // Result order is a subsequence of the declaration order.
    let cursor = 0;
    for (const id of resultOrder) {
      const idx = declarationOrder.indexOf(id, cursor);
      expect(idx).toBeGreaterThanOrEqual(cursor);
      cursor = idx + 1;
    }
  });

  it('matchedKeywords array is sorted (stable across invocations)', () => {
    const detector = createFailureModeDetector(PAT_SRC_AMS_001);
    const results = detector.detect(RICH_FM_AMS_002_EVIDENCE);
    for (const r of results) {
      const sorted = [...r.matchedKeywords].sort();
      expect(r.matchedKeywords).toEqual(sorted);
    }
  });
});
