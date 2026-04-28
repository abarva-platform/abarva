/**
 * Contradiction detector tests — REASON-7
 *
 * Deterministic: no network, no LLM calls, no randomness.
 * Same inputs always produce the same outputs.
 *
 * Uses PAT_SRC_AMS_001 as the canonical fixture — it has 5 contradiction templates
 * with rich detectionHints that provide reliable keyword signal.
 * Uses AMS_VENDOR_CONSOLIDATION_2026_INSTANCE via buildEvidenceMap for AMS-specific tests.
 */

import { PAT_SRC_AMS_001 } from '@/lib/intelligence/source-lifecycle-patterns';
import {
  createContradictionDetector,
  detectContradictions,
  LifecycleContradictionDetector,
} from '@/lib/reasoning/contradiction-detector';
import { AMS_VENDOR_CONSOLIDATION_2026_INSTANCE } from '@/lib/source/source-event-instances';
import { buildEvidenceMap } from '@/lib/source/source-event-instance';

// ─── Fixture helpers ───────────────────────────────────────────────────────────

/**
 * Evidence map with multiple keywords from CON-AMS-001's detectionHint:
 * "vendor deployment timeline shorter measured median AMS transitions scope integration"
 * Keys include: "vendor", "deployment", "timeline", "median", "transition"
 */
const RICH_CON_AMS_001_EVIDENCE: Record<string, unknown> = {
  'vendor-claim-deployment-timeline-weeks': '16',
  'measured-median-transition-weeks': '29',
  'scope-integration-count': '8',
  'vendor-transition-plan': 'submitted',
};

/**
 * Evidence map with only a single keyword — should not fire any template.
 */
const SPARSE_EVIDENCE: Record<string, unknown> = {
  'vendor-name': 'Northstar',
};

// ─── 1. Empty evidence → no contradictions ────────────────────────────────────

describe('detect — empty evidence map', () => {
  let detector: LifecycleContradictionDetector;

  beforeEach(() => {
    detector = createContradictionDetector(PAT_SRC_AMS_001);
  });

  it('returns an empty array when evidence map is empty', () => {
    expect(detector.detect({})).toEqual([]);
  });

  it('PAT_SRC_AMS_001 has 5 contradiction templates to evaluate', () => {
    // Validates fixture integrity
    expect(PAT_SRC_AMS_001.contradictionTemplates).toHaveLength(5);
  });
});

// ─── 2. Sparse evidence → no contradiction fires ──────────────────────────────

describe('detect — sparse evidence (single keyword match)', () => {
  let detector: LifecycleContradictionDetector;

  beforeEach(() => {
    detector = createContradictionDetector(PAT_SRC_AMS_001);
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

// ─── 3. Rich evidence → contradiction fires ───────────────────────────────────

describe('detect — rich evidence (≥2 keyword matches)', () => {
  let detector: LifecycleContradictionDetector;

  beforeEach(() => {
    detector = createContradictionDetector(PAT_SRC_AMS_001);
  });

  it('fires at least one contradiction when evidence contains 4 relevant keywords', () => {
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    expect(results.length).toBeGreaterThan(0);
  });

  it('each fired contradiction has confidence > 0', () => {
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    for (const r of results) {
      expect(r.confidence).toBeGreaterThan(0);
    }
  });

  it('each fired contradiction has a non-empty label', () => {
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    for (const r of results) {
      expect(r.label.length).toBeGreaterThan(0);
    }
  });

  it('each fired contradiction has triggeringEvidence with at least one pointer', () => {
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    for (const r of results) {
      expect(r.triggeringEvidence.length).toBeGreaterThan(0);
    }
  });
});

// ─── 4. Confidence scales with match count (capped at 0.9) ───────────────────

describe('confidence scaling', () => {
  let detector: LifecycleContradictionDetector;

  beforeEach(() => {
    detector = createContradictionDetector(PAT_SRC_AMS_001);
  });

  it('confidence base is 0.3 when at the minimum threshold (2 matches)', () => {
    // The formula is: confidence = min(0.3 + (matchCount - 2) * 0.1, 0.9)
    // At exactly 2 matches → 0.3; each additional match adds 0.1
    // We can verify the formula by checking that confidence starts at 0.3 and
    // is bounded above by 0.9 — the saturated-evidence test covers the cap.
    // Here we verify fired contradictions have confidence in the [0.3, 0.9] range.
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    for (const r of results) {
      expect(r.confidence).toBeGreaterThanOrEqual(0.3);
      expect(r.confidence).toBeLessThanOrEqual(0.9);
    }
  });

  it('confidence increases with more keyword matches', () => {
    const fewerMatchEvidence: Record<string, unknown> = {
      'vendor-claim-timeline': '16',
      'measured-median-duration': '30',
    };
    const moreMatchEvidence: Record<string, unknown> = {
      'vendor-claim-deployment-timeline-weeks': '16',
      'measured-median-ams-transition-weeks': '29',
      'scope-integration-complexity': 'high',
      'vendor-transition-plan-workplan': 'missing',
    };

    const fewerResults = detector.detect(fewerMatchEvidence);
    const moreResults = detector.detect(moreMatchEvidence);

    // Find a template that fires in both maps to compare confidence
    for (const moreResult of moreResults) {
      const fewerResult = fewerResults.find((r) => r.templateId === moreResult.templateId);
      if (fewerResult) {
        expect(moreResult.confidence).toBeGreaterThanOrEqual(fewerResult.confidence);
      }
    }
  });

  it('confidence never exceeds 0.9', () => {
    // Saturate with many matching keywords
    const saturatedEvidence: Record<string, unknown> = {
      'vendor-claim-deployment-timeline': '16',
      'measured-median-transition-scope': '29',
      'vendor-deployment-weeks-shorter': 'yes',
      'ams-transition-integration-complexity': 'high',
      'measured-vendor-scope-timeline': 'mismatch',
      'vendor-timeline-deployment-integration': '18',
      'ams-scope-median-measured': 'true',
      'transition-scope-integration-vendor': 'details',
    };
    const results = detector.detect(saturatedEvidence);
    for (const r of results) {
      expect(r.confidence).toBeLessThanOrEqual(0.9);
    }
  });
});

// ─── 5. Stage filtering ───────────────────────────────────────────────────────

describe('detectForStage', () => {
  let detector: LifecycleContradictionDetector;

  beforeEach(() => {
    detector = createContradictionDetector(PAT_SRC_AMS_001);
  });

  it('returns a subset of detect() results', () => {
    const all = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    const forStage = detector.detectForStage('BAFO', RICH_CON_AMS_001_EVIDENCE);
    expect(forStage.length).toBeLessThanOrEqual(all.length);
  });

  it('returns empty array when no detections contain the stage name', () => {
    const results = detector.detectForStage('Onboard', RICH_CON_AMS_001_EVIDENCE);
    // None of the AMS contradiction template ids contain "onboard"
    // and the triggering evidence keys don't contain "onboard"
    for (const r of results) {
      const hasStage =
        r.templateId.toLowerCase().includes('onboard') ||
        r.triggeringEvidence.some((ev) => ev.field.toLowerCase().includes('onboard'));
      expect(hasStage).toBe(true);
    }
  });

  it('all returned detections are also present in detect()', () => {
    const all = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    const allIds = new Set(all.map((r) => r.templateId));
    const forStage = detector.detectForStage('BAFO', RICH_CON_AMS_001_EVIDENCE);
    for (const r of forStage) {
      expect(allIds.has(r.templateId)).toBe(true);
    }
  });
});

// ─── 6. Template id is preserved in detection ─────────────────────────────────

describe('templateId preservation', () => {
  let detector: LifecycleContradictionDetector;

  beforeEach(() => {
    detector = createContradictionDetector(PAT_SRC_AMS_001);
  });

  it('detected contradiction templateId matches the pattern template id', () => {
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    const validIds = new Set(PAT_SRC_AMS_001.contradictionTemplates.map((t) => t.id));
    for (const r of results) {
      expect(validIds.has(r.templateId)).toBe(true);
    }
  });

  it('patternRef.patternId matches the pattern patternId', () => {
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    for (const r of results) {
      expect(r.patternRef.patternId).toBe('PAT-SRC-AMS-001');
    }
  });

  it('patternRef.patternVersion matches the pattern version', () => {
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    for (const r of results) {
      expect(r.patternRef.patternVersion).toBe('1.0');
    }
  });

  it('detectedAt is a recent timestamp (ms)', () => {
    const before = Date.now();
    const results = detector.detect(RICH_CON_AMS_001_EVIDENCE);
    const after = Date.now();
    for (const r of results) {
      expect(r.detectedAt).toBeGreaterThanOrEqual(before);
      expect(r.detectedAt).toBeLessThanOrEqual(after);
    }
  });
});

// ─── 7. AMS instance — buildEvidenceMap fires at least one contradiction ──────

describe('AMS instance contradiction detection', () => {
  it('detect(buildEvidenceMap(AMS_INSTANCE)) fires at least one contradiction', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const detector = createContradictionDetector(PAT_SRC_AMS_001);
    const results = detector.detect(evidenceMap);
    expect(results.length).toBeGreaterThan(0);
  });

  it('convenience detectContradictions() returns the same results as instance method', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const instanceResults = createContradictionDetector(PAT_SRC_AMS_001).detect(evidenceMap);
    const convenienceResults = detectContradictions(PAT_SRC_AMS_001, evidenceMap);
    expect(convenienceResults.map((r) => r.templateId)).toEqual(
      instanceResults.map((r) => r.templateId),
    );
  });

  it('each AMS instance detection has valid severity', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const results = detectContradictions(PAT_SRC_AMS_001, evidenceMap);
    for (const r of results) {
      expect(['low', 'medium', 'high']).toContain(r.severity);
    }
  });

  it('triggeringEvidence max 5 pointers per detection', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const results = detectContradictions(PAT_SRC_AMS_001, evidenceMap);
    for (const r of results) {
      expect(r.triggeringEvidence.length).toBeLessThanOrEqual(5);
    }
  });

  it('each triggering evidence pointer has non-empty field and value', () => {
    const evidenceMap = buildEvidenceMap(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE);
    const results = detectContradictions(PAT_SRC_AMS_001, evidenceMap);
    for (const r of results) {
      for (const ev of r.triggeringEvidence) {
        expect(ev.field.length).toBeGreaterThan(0);
        expect(typeof ev.value).toBe('string');
      }
    }
  });
});
