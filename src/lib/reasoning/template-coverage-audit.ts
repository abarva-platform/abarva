// src/lib/reasoning/template-coverage-audit.ts
//
// Pure template-coverage audit for the reasoning layer.
//
// The contradiction- and failure-mode-detectors are pure keyword matchers
// (≥2 keyword overlap between the template's `detectionHint` / `description`
// and the instance evidence map). That means a template only fires when the
// fixture evidence map happens to mention at least two non-stop-words from
// the template prose.
//
// This module enumerates every template across every lifecycle pattern,
// runs the matching detector against every fixture instance bound to that
// pattern, and reports which templates have at least one instance that
// produces a detection. It is the diagnostic that makes "the keyword match
// is sparse" a measurable, observable property instead of a hunch.
//
// Determinism: same inputs → same outputs. No network, no LLM, no clock
// reads, no randomness. Safe to call from server components and tests.

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import {
  SOURCE_EVENT_INSTANCES,
} from '@/lib/source/source-event-instances';
import {
  buildEvidenceMap,
  type SourceEventInstance,
} from '@/lib/source/source-event-instance';
import {
  APEX_RETAIL_PROGRAM_INSTANCES,
} from '@/lib/programs/program-instances';
import {
  buildProgramEvidenceMap,
  type ProgramInstance,
} from '@/lib/programs/program-instance';
import { createContradictionDetector } from './contradiction-detector';
import { createFailureModeDetector } from './failure-mode-detector';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Per-template coverage row. One row per (pattern × template) pair. */
export interface TemplateCoverageRow {
  patternId: string;
  patternLabel: string;
  templateId: string;
  label: string;
  /** Instance ids where the detector produced a detection for this template. */
  firedOnInstances: string[];
  /** Total instances bound to the pattern that were evaluated. */
  totalInstancesTested: number;
  /** 'covered' = at least one instance produced a detection. */
  coverage: 'covered' | 'uncovered';
}

export type TemplateCoverageReport = TemplateCoverageRow[];

export interface CoverageSummary {
  totalTemplates: number;
  coveredTemplates: number;
  /** coveredTemplates / totalTemplates — 0 when there are no templates. */
  coverageRatio: number;
}

export interface FullCoverageAudit {
  contradictions: TemplateCoverageReport;
  failureModes: TemplateCoverageReport;
  summary: {
    contradictions: CoverageSummary;
    failureModes: CoverageSummary;
    /**
     * Coverage restricted to templates whose pattern has at least one fixture
     * instance bound to it. The full report includes patterns with no bound
     * instances (those templates can never fire), which deflates the global
     * ratio. The bound-only view is the actionable signal for "are the
     * detectors actually picking up signal on the data we ship?".
     */
    contradictionsBound: CoverageSummary;
    failureModesBound: CoverageSummary;
    /** Totals across both categories (full set, including unbound patterns). */
    totalTemplates: number;
    coveredTemplates: number;
    coverageRatio: number;
  };
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

const ALL_PATTERNS: LifecyclePatternSeed[] = [
  ...SOURCE_LIFECYCLE_PATTERNS,
  ...PROGRAM_LIFECYCLE_PATTERNS,
];

/** Index of source instances by pattern id for O(1) lookup. */
function indexSourceInstancesByPattern(): Map<string, SourceEventInstance[]> {
  const map = new Map<string, SourceEventInstance[]>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const list = map.get(inst.patternId) ?? [];
    list.push(inst);
    map.set(inst.patternId, list);
  }
  return map;
}

/** Index of program instances by pattern id for O(1) lookup. */
function indexProgramInstancesByPattern(): Map<string, ProgramInstance[]> {
  const map = new Map<string, ProgramInstance[]>();
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const list = map.get(inst.patternId) ?? [];
    list.push(inst);
    map.set(inst.patternId, list);
  }
  return map;
}

/**
 * Returns all instances bound to a pattern as { id, evidenceMap } pairs,
 * spanning both source-event and program fixture corpora. Source patterns
 * never collide with program patterns (different ID prefixes), so this is
 * a one-or-the-other lookup in practice but the union is fine and future-proof.
 */
function instancesForPattern(
  patternId: string,
  srcIndex: Map<string, SourceEventInstance[]>,
  prgIndex: Map<string, ProgramInstance[]>,
): Array<{ id: string; evidenceMap: Record<string, unknown> }> {
  const out: Array<{ id: string; evidenceMap: Record<string, unknown> }> = [];

  for (const inst of srcIndex.get(patternId) ?? []) {
    out.push({ id: inst.id, evidenceMap: buildEvidenceMap(inst) });
  }
  for (const inst of prgIndex.get(patternId) ?? []) {
    out.push({ id: inst.id, evidenceMap: buildProgramEvidenceMap(inst) });
  }

  return out;
}

function summarize(rows: TemplateCoverageReport): CoverageSummary {
  const totalTemplates = rows.length;
  const coveredTemplates = rows.filter((r) => r.coverage === 'covered').length;
  const coverageRatio = totalTemplates === 0 ? 0 : coveredTemplates / totalTemplates;
  return { totalTemplates, coveredTemplates, coverageRatio };
}

/** Filter a report down to templates whose pattern has ≥1 bound instance. */
function filterBound(rows: TemplateCoverageReport): TemplateCoverageReport {
  return rows.filter((r) => r.totalInstancesTested > 0);
}

// ─── Audits ───────────────────────────────────────────────────────────────────

/**
 * Audit which contradiction templates fire on at least one bound instance.
 *
 * For each pattern × contradiction-template, runs `LifecycleContradictionDetector`
 * against every instance bound to the pattern. If any instance produces a
 * detection for that template id, the row is marked `covered`.
 *
 * Pure: deterministic over the static fixture set. Safe to call repeatedly.
 */
export function auditContradictionTemplateCoverage(): TemplateCoverageReport {
  const srcIndex = indexSourceInstancesByPattern();
  const prgIndex = indexProgramInstancesByPattern();
  const out: TemplateCoverageReport = [];

  for (const pattern of ALL_PATTERNS) {
    const instances = instancesForPattern(pattern.patternId, srcIndex, prgIndex);
    const detector = createContradictionDetector(pattern);

    for (const template of pattern.contradictionTemplates) {
      const firedOnInstances: string[] = [];

      for (const inst of instances) {
        const detections = detector.detect(inst.evidenceMap);
        if (detections.some((d) => d.templateId === template.id)) {
          firedOnInstances.push(inst.id);
        }
      }

      out.push({
        patternId: pattern.patternId,
        patternLabel: pattern.title,
        templateId: template.id,
        label: template.label,
        firedOnInstances,
        totalInstancesTested: instances.length,
        coverage: firedOnInstances.length > 0 ? 'covered' : 'uncovered',
      });
    }
  }

  return out;
}

/**
 * Audit which failure modes fire on at least one bound instance.
 *
 * Mirrors `auditContradictionTemplateCoverage` but uses the failure-mode
 * detector and reports against `pattern.failureModes`.
 */
export function auditFailureModeCoverage(): TemplateCoverageReport {
  const srcIndex = indexSourceInstancesByPattern();
  const prgIndex = indexProgramInstancesByPattern();
  const out: TemplateCoverageReport = [];

  for (const pattern of ALL_PATTERNS) {
    const instances = instancesForPattern(pattern.patternId, srcIndex, prgIndex);
    const detector = createFailureModeDetector(pattern);

    for (const failureMode of pattern.failureModes) {
      const firedOnInstances: string[] = [];

      for (const inst of instances) {
        const detections = detector.detect(inst.evidenceMap);
        if (detections.some((d) => d.failureModeId === failureMode.id)) {
          firedOnInstances.push(inst.id);
        }
      }

      out.push({
        patternId: pattern.patternId,
        patternLabel: pattern.title,
        templateId: failureMode.id,
        label: failureMode.label,
        firedOnInstances,
        totalInstancesTested: instances.length,
        coverage: firedOnInstances.length > 0 ? 'covered' : 'uncovered',
      });
    }
  }

  return out;
}

/**
 * Run both audits and return rolled-up summary stats.
 * Used by the admin coverage page and the coverage tests.
 */
export function auditAll(): FullCoverageAudit {
  const contradictions = auditContradictionTemplateCoverage();
  const failureModes = auditFailureModeCoverage();

  const cSum = summarize(contradictions);
  const fSum = summarize(failureModes);
  const cSumBound = summarize(filterBound(contradictions));
  const fSumBound = summarize(filterBound(failureModes));
  const totalTemplates = cSum.totalTemplates + fSum.totalTemplates;
  const coveredTemplates = cSum.coveredTemplates + fSum.coveredTemplates;
  const coverageRatio = totalTemplates === 0 ? 0 : coveredTemplates / totalTemplates;

  return {
    contradictions,
    failureModes,
    summary: {
      contradictions: cSum,
      failureModes: fSum,
      contradictionsBound: cSumBound,
      failureModesBound: fSumBound,
      totalTemplates,
      coveredTemplates,
      coverageRatio,
    },
  };
}

// ─── Convenience: group rows by pattern ───────────────────────────────────────

export interface PatternCoverageGroup {
  patternId: string;
  patternLabel: string;
  rows: TemplateCoverageReport;
  /** Number of fixture instances bound to this pattern. */
  instanceCount: number;
}

/**
 * Group a coverage report by pattern id, preserving the pattern declaration
 * order of `ALL_PATTERNS`. Used by the admin coverage view to render one
 * sub-table per pattern.
 */
export function groupByPattern(report: TemplateCoverageReport): PatternCoverageGroup[] {
  const byPatternId = new Map<string, TemplateCoverageReport>();
  for (const row of report) {
    const list = byPatternId.get(row.patternId) ?? [];
    list.push(row);
    byPatternId.set(row.patternId, list);
  }

  const out: PatternCoverageGroup[] = [];
  for (const pattern of ALL_PATTERNS) {
    const rows = byPatternId.get(pattern.patternId);
    if (!rows || rows.length === 0) continue;
    out.push({
      patternId: pattern.patternId,
      patternLabel: pattern.title,
      rows,
      instanceCount: rows[0]?.totalInstancesTested ?? 0,
    });
  }
  return out;
}
