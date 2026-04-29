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
  it('at least 30% of contradiction templates on bound patterns are covered', () => {
    // Bound = templates whose pattern has ≥1 fixture instance. The unbound
    // patterns (no fixtures yet) drag the global ratio down by definition;
    // the bound ratio is the actionable signal.
    const { contradictionsBound } = auditAll().summary;
    expect(contradictionsBound.totalTemplates).toBeGreaterThan(0);
    expect(contradictionsBound.coverageRatio).toBeGreaterThanOrEqual(0.3);
  });

  it('at least 30% of failure-mode templates on bound patterns are covered', () => {
    const { failureModesBound } = auditAll().summary;
    expect(failureModesBound.totalTemplates).toBeGreaterThan(0);
    expect(failureModesBound.coverageRatio).toBeGreaterThanOrEqual(0.3);
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

// ─── 4. Unbound patterns are reported but always uncovered ────────────────────

describe('unbound patterns — no instances, all rows uncovered', () => {
  it('every row whose pattern has no fixture instance is marked uncovered', () => {
    const rows = [
      ...auditContradictionTemplateCoverage(),
      ...auditFailureModeCoverage(),
    ];
    const unbound = rows.filter((r) => r.totalInstancesTested === 0);
    expect(unbound.length).toBeGreaterThan(0); // sanity: spec says ≥8 patterns lack fixtures
    for (const row of unbound) {
      expect(row.coverage).toBe('uncovered');
      expect(row.firedOnInstances).toEqual([]);
    }
  });

  it('PAT-SRC-RFP-001 has no instance bound and is fully uncovered', () => {
    const rows = auditContradictionTemplateCoverage().filter(
      (r) => r.patternId === 'PAT-SRC-RFP-001',
    );
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.totalInstancesTested).toBe(0);
      expect(row.coverage).toBe('uncovered');
    }
  });
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
