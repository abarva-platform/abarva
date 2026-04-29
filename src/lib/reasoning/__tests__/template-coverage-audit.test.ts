/**
 * Template coverage audit tests.
 *
 * The contradiction- and failure-mode-detectors are pure keyword matchers:
 * a template only fires when its `detectionHint` (or `description`) shares
 * ≥2 non-stop-words with the instance's evidence map. This audit reports
 * which templates fire at least once across the static fixture corpus.
 *
 * These assertions act as a regression net — if a future fixture refactor
 * silently drops keywords from an evidence map, coverage will fall and the
 * test will fail loudly.
 *
 * Deterministic: no network, no LLM, no clock reads, no randomness.
 */

import {
  auditAll,
  auditContradictionTemplateCoverage,
  auditFailureModeCoverage,
  groupByPattern,
} from '@/lib/reasoning/template-coverage-audit';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';

// ─── 1. Audit runs and produces well-formed output ────────────────────────────

describe('auditAll — runs without error', () => {
  it('completes synchronously and returns the expected shape', () => {
    const result = auditAll();
    expect(result).toHaveProperty('contradictions');
    expect(result).toHaveProperty('failureModes');
    expect(result).toHaveProperty('summary');
    expect(Array.isArray(result.contradictions)).toBe(true);
    expect(Array.isArray(result.failureModes)).toBe(true);
  });

  it('is deterministic — same inputs, same outputs', () => {
    const a = auditAll();
    const b = auditAll();
    expect(b.summary.totalTemplates).toBe(a.summary.totalTemplates);
    expect(b.summary.coveredTemplates).toBe(a.summary.coveredTemplates);
    expect(b.contradictions).toEqual(a.contradictions);
    expect(b.failureModes).toEqual(a.failureModes);
  });

  it('row count matches the sum of templates declared on every pattern', () => {
    const expectedContradictions = [
      ...SOURCE_LIFECYCLE_PATTERNS,
      ...PROGRAM_LIFECYCLE_PATTERNS,
    ].reduce((sum, p) => sum + p.contradictionTemplates.length, 0);
    const expectedFailureModes = [
      ...SOURCE_LIFECYCLE_PATTERNS,
      ...PROGRAM_LIFECYCLE_PATTERNS,
    ].reduce((sum, p) => sum + p.failureModes.length, 0);

    const result = auditAll();
    expect(result.contradictions).toHaveLength(expectedContradictions);
    expect(result.failureModes).toHaveLength(expectedFailureModes);
  });
});

// ─── 2. Coverage thresholds ───────────────────────────────────────────────────

describe('coverage thresholds — bound patterns', () => {
  it('every lifecycle pattern has at least one bound fixture instance', () => {
    // After the unbound-pattern fixture authoring (feat/reasoning-unbound-pattern-fixtures)
    // every contradiction-template row should report ≥1 instance tested. If a
    // future fixture refactor drops a pattern's fixture, this canary will fail.
    const rows = auditContradictionTemplateCoverage();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.totalInstancesTested).toBeGreaterThanOrEqual(1);
    }
  });

  it('at least 65% of contradiction templates on bound patterns are covered', () => {
    // Bound = templates whose pattern has ≥1 fixture instance. With every
    // pattern now bound, the bound ratio equals the global ratio. The 65%
    // floor reflects the post-fixture-authoring baseline (currently ~75%);
    // dropping under it indicates a fixture-evidence keyword regression.
    const { contradictionsBound } = auditAll().summary;
    expect(contradictionsBound.totalTemplates).toBeGreaterThan(0);
    expect(contradictionsBound.coverageRatio).toBeGreaterThanOrEqual(0.65);
  });

  it('at least 65% of failure-mode templates on bound patterns are covered', () => {
    const { failureModesBound } = auditAll().summary;
    expect(failureModesBound.totalTemplates).toBeGreaterThan(0);
    expect(failureModesBound.coverageRatio).toBeGreaterThanOrEqual(0.65);
  });

  it('global contradictions+failure-modes coverage ratio at least 65%', () => {
    // Once every pattern is bound, the global and bound ratios converge.
    // Track the combined ratio so the audit page's headline number has a
    // floor.
    const { coverageRatio } = auditAll().summary;
    expect(coverageRatio).toBeGreaterThanOrEqual(0.65);
  });

  it('reveals at least one uncovered template overall — keyword match is sparse', () => {
    // The whole point of this audit is to make sparseness visible.
    // If this ever flips false, we have universal coverage and the audit
    // might be redundant — worth re-evaluating the thresholds.
    const result = auditAll();
    const uncoveredContradictions = result.contradictions.filter(
      (r) => r.coverage === 'uncovered',
    );
    const uncoveredFailureModes = result.failureModes.filter(
      (r) => r.coverage === 'uncovered',
    );
    expect(uncoveredContradictions.length + uncoveredFailureModes.length).toBeGreaterThan(0);
  });
});

// ─── 3. AMS pattern: known-firing canary ──────────────────────────────────────

describe('PAT-SRC-AMS-001 — known-firing canary', () => {
  it('all 5 contradiction templates fire on the AMS instance', () => {
    // PAT_SRC_AMS_001 is the showcase pattern with detectionHints tuned to
    // the AMS_VENDOR_CONSOLIDATION_2026 fixture. Coverage here should be
    // total — if any of these stop firing, a recent fixture or template
    // refactor broke the canonical demo path.
    const rows = auditContradictionTemplateCoverage().filter(
      (r) => r.patternId === 'PAT-SRC-AMS-001',
    );
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row.coverage).toBe('covered');
      expect(row.firedOnInstances).toContain('apex-retail-ams-outsourcing-2026');
    }
  });

  it('all AMS failure modes fire on the AMS instance', () => {
    const rows = auditFailureModeCoverage().filter(
      (r) => r.patternId === 'PAT-SRC-AMS-001',
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.coverage).toBe('covered');
      expect(row.firedOnInstances).toContain('apex-retail-ams-outsourcing-2026');
    }
  });
});

// ─── 4. Newly-bound patterns: each gained ≥1 fixture and ≥1 detection ─────────

describe('newly-bound patterns — fixtures present and produce detections', () => {
  // Each entry below corresponds to a previously-unbound pattern that gained
  // a demo fixture in feat/reasoning-unbound-pattern-fixtures. The fixture
  // instance id is asserted explicitly so that fixture renames are caught,
  // and the row must be `covered` so an evidence-keyword regression fails
  // the canary directly.
  const NEW_FIXTURES: Array<{ patternId: string; instanceId: string }> = [
    { patternId: 'PAT-SRC-RFP-001', instanceId: 'apex-retail-rfp-store-pos-2026' },
    { patternId: 'PAT-SRC-SOLE-001', instanceId: 'apex-retail-sole-source-erp-2026' },
    { patternId: 'PAT-SRC-FRAMEWORK-001', instanceId: 'apex-retail-framework-callout-2026' },
    { patternId: 'PAT-SRC-RENEWAL-001', instanceId: 'apex-retail-renewal-iam-2026' },
    { patternId: 'PAT-SRC-DECOM-001', instanceId: 'apex-retail-decom-legacy-erp-2026' },
    { patternId: 'PAT-SRC-EMERGENCY-001', instanceId: 'apex-retail-emergency-payment-2026' },
    { patternId: 'PAT-PRG-COPILOT-001', instanceId: 'APX-COPILOT-2026' },
    { patternId: 'PAT-PRG-CC-AI-001', instanceId: 'APX-CCAI-2026' },
  ];

  it.each(NEW_FIXTURES)(
    '$patternId has at least one fixture instance ($instanceId)',
    ({ patternId, instanceId }) => {
      const rows = auditContradictionTemplateCoverage().filter(
        (r) => r.patternId === patternId,
      );
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(row.totalInstancesTested).toBeGreaterThanOrEqual(1);
      }
      // The named instance must produce at least one contradiction detection
      // somewhere in the pattern, so that a fixture-rename regression bites.
      const contradictionFires = rows.filter((r) =>
        r.firedOnInstances.includes(instanceId),
      );
      expect(contradictionFires.length).toBeGreaterThan(0);
    },
  );

  it.each(NEW_FIXTURES)(
    '$patternId fixture produces at least one failure-mode detection',
    ({ patternId, instanceId }) => {
      const rows = auditFailureModeCoverage().filter((r) => r.patternId === patternId);
      expect(rows.length).toBeGreaterThan(0);
      const fmFires = rows.filter((r) => r.firedOnInstances.includes(instanceId));
      expect(fmFires.length).toBeGreaterThan(0);
    },
  );
});

// ─── 5. Program patterns: at least one template fires somewhere ──────────────

describe('program patterns — at least one bound program template fires', () => {
  it('at least one program-side contradiction template is covered', () => {
    const programIds = new Set<string>(PROGRAM_LIFECYCLE_PATTERNS.map((p) => p.patternId));
    const programRows = auditContradictionTemplateCoverage().filter((r) =>
      programIds.has(r.patternId),
    );
    const covered = programRows.filter((r) => r.coverage === 'covered');
    expect(covered.length).toBeGreaterThan(0);
  });

  it('at least one program-side failure mode is covered', () => {
    const programIds = new Set<string>(PROGRAM_LIFECYCLE_PATTERNS.map((p) => p.patternId));
    const programRows = auditFailureModeCoverage().filter((r) =>
      programIds.has(r.patternId),
    );
    const covered = programRows.filter((r) => r.coverage === 'covered');
    expect(covered.length).toBeGreaterThan(0);
  });
});

// ─── 6. groupByPattern helper ─────────────────────────────────────────────────

describe('groupByPattern', () => {
  it('returns one group per pattern that has rows, in declaration order', () => {
    const report = auditContradictionTemplateCoverage();
    const groups = groupByPattern(report);

    const expectedOrder = [
      ...SOURCE_LIFECYCLE_PATTERNS,
      ...PROGRAM_LIFECYCLE_PATTERNS,
    ]
      .filter((p) => p.contradictionTemplates.length > 0)
      .map((p) => p.patternId);

    expect(groups.map((g) => g.patternId)).toEqual(expectedOrder);
  });

  it('groups carry the right rows and instance count', () => {
    const report = auditContradictionTemplateCoverage();
    const groups = groupByPattern(report);
    const ams = groups.find((g) => g.patternId === 'PAT-SRC-AMS-001');
    expect(ams).toBeDefined();
    expect(ams!.rows).toHaveLength(5);
    expect(ams!.instanceCount).toBe(1);
  });
});
