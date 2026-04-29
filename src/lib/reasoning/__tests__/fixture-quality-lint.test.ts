/**
 * Fixture-quality lint tests.
 *
 * `lintFixtures` walks every typed instance fixture and reports drift
 * relative to the lifecycle pattern shape: bogus patternIds, current-stage
 * drift, evidence/artifact/stage references that don't resolve, deliverable
 * phase numbers outside 0–6, and cross-instance link IDs that don't exist.
 *
 * The first assertion is the **green-on-master canary**: against the
 * production fixture corpus the lint must report zero errors. The remaining
 * assertions verify each detection path on synthetic instances so the lint
 * itself can't silently regress.
 *
 * Deterministic: no network, no LLM, no clock reads, no randomness.
 */

import {
  lintFixtures,
  summarizeLintReport,
  type LintInputs,
} from '@/lib/reasoning/fixture-quality-lint';
import {
  SOURCE_EVENT_INSTANCES,
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
} from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES, APX_CDP_2026_INSTANCE } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';

const ALL_PATTERNS = [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];

// ─── 1. Green-on-master canary ───────────────────────────────────────────────

describe('lintFixtures — production corpus', () => {
  it('reports zero errors against the current fixture corpus', () => {
    const report = lintFixtures();
    const errors = report.issues.filter((i) => i.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('totalInstances equals source + program fixture counts', () => {
    const report = lintFixtures();
    expect(report.totalInstances).toBe(
      SOURCE_EVENT_INSTANCES.length + APEX_RETAIL_PROGRAM_INSTANCES.length,
    );
  });

  it('summarizeLintReport partitions issues by severity', () => {
    const report = lintFixtures();
    const summary = summarizeLintReport(report);
    expect(summary.totalInstances).toBe(report.totalInstances);
    expect(summary.errors.length + summary.warnings.length).toBe(report.issues.length);
    expect(summary.errors.every((i) => i.severity === 'error')).toBe(true);
    expect(summary.warnings.every((i) => i.severity === 'warning')).toBe(true);
  });
});

// ─── 2. Determinism ──────────────────────────────────────────────────────────

describe('lintFixtures — determinism', () => {
  it('returns the same report on repeat calls (same input → same output)', () => {
    const a = lintFixtures();
    const b = lintFixtures();
    expect(b).toEqual(a);
  });

  it('issue order is stable — fixture declaration order drives the walk', () => {
    const a = lintFixtures();
    const b = lintFixtures();
    expect(b.issues.map((i) => `${i.severity}:${i.instanceId}:${i.message}`))
      .toEqual(a.issues.map((i) => `${i.severity}:${i.instanceId}:${i.message}`));
  });
});

// ─── 3. Synthetic drift cases ────────────────────────────────────────────────

function cloneSource(): SourceEventInstance {
  return JSON.parse(JSON.stringify(AMS_VENDOR_CONSOLIDATION_2026_INSTANCE));
}

function cloneProgram(): ProgramInstance {
  return JSON.parse(JSON.stringify(APX_CDP_2026_INSTANCE));
}

function lintWithExtras(extras: {
  source?: SourceEventInstance[];
  programs?: ProgramInstance[];
}): ReturnType<typeof lintFixtures> {
  // Restrict the lint corpus to just the synthetic instance(s) we pass in.
  // This isolates the assertion from the production corpus shape and makes
  // the test resilient to future fixture additions.
  const inputs: LintInputs = {
    sourceInstances: extras.source ?? [],
    programInstances: extras.programs ?? [],
    patterns: ALL_PATTERNS,
  };
  return lintFixtures(inputs);
}

describe('lintFixtures — drift detection', () => {
  it('flags an instance with a bogus patternId as error', () => {
    const bad = cloneSource();
    bad.id = 'synthetic-bogus-pattern';
    // Cast through unknown — the constraint is `SourceEventPatternId`, but
    // the lint exists precisely to catch IDs that escape that constraint
    // at fixture-author time.
    (bad as unknown as { patternId: string }).patternId = 'PAT-SRC-DOES-NOT-EXIST';

    const report = lintWithExtras({ source: [bad] });
    const issue = report.issues.find(
      (i) => i.instanceId === 'synthetic-bogus-pattern' && i.severity === 'error',
    );
    expect(issue).toBeDefined();
    expect(issue?.message).toMatch(/patternId/);
    expect(issue?.message).toMatch(/PAT-SRC-DOES-NOT-EXIST/);
  });

  it('flags a source instance whose currentStage is not on the bound pattern as error', () => {
    const bad = cloneSource();
    bad.id = 'synthetic-stage-drift';
    // 'Plan' is a real AMS stage; 'Telepathy' is not.
    bad.currentStage = 'Telepathy';
    // Strip stageHistory so that surface doesn't also trigger; the test is
    // about currentStage drift specifically.
    bad.stageHistory = [];

    const report = lintWithExtras({ source: [bad] });
    const issue = report.issues.find(
      (i) =>
        i.instanceId === 'synthetic-stage-drift' &&
        i.severity === 'error' &&
        /currentStage/.test(i.message),
    );
    expect(issue).toBeDefined();
    expect(issue?.message).toMatch(/Telepathy/);
  });

  it('flags a program instance with currentPhase outside 0–6 as error', () => {
    const bad = cloneProgram();
    bad.id = 'synthetic-bad-phase';
    bad.currentPhase = 99;
    // Trim phases so we focus on currentPhase only — phases entries are
    // exercised by their own test below.
    bad.phases = [];

    const report = lintWithExtras({ programs: [bad] });
    const issue = report.issues.find(
      (i) =>
        i.instanceId === 'synthetic-bad-phase' &&
        i.severity === 'error' &&
        /currentPhase/.test(i.message),
    );
    expect(issue).toBeDefined();
    expect(issue?.message).toMatch(/0–6/);
  });

  it('flags a program deliverable with phaseId outside 0–6 as error', () => {
    const bad = cloneProgram();
    bad.id = 'synthetic-bad-deliverable';
    // Append a deliverable with an invalid phase.
    bad.deliverables = [
      ...bad.deliverables,
      {
        id: 'bad-deliverable',
        label: 'Bogus deliverable',
        phaseId: 7,
        status: 'not-started',
      },
    ];

    const report = lintWithExtras({ programs: [bad] });
    const issue = report.issues.find(
      (i) =>
        i.instanceId === 'synthetic-bad-deliverable' &&
        i.severity === 'error' &&
        /deliverable/.test(i.message),
    );
    expect(issue).toBeDefined();
    expect(issue?.message).toMatch(/bad-deliverable/);
    expect(issue?.message).toMatch(/0–6/);
  });

  it('flags a source instance with an unresolvable linkedSourceEvents id as warning', () => {
    const bad = cloneSource();
    bad.id = 'synthetic-bad-link';
    bad.linkedSourceEvents = [
      {
        sourceEventId: 'SRC-DOES-NOT-EXIST-EVER',
        sourceEventName: 'Bogus link',
        linkType: 'depends-on',
        description: 'synthetic',
      },
    ];

    const report = lintWithExtras({ source: [bad] });
    const issue = report.issues.find(
      (i) =>
        i.instanceId === 'synthetic-bad-link' &&
        i.severity === 'warning' &&
        /linkedSourceEvents/.test(i.message),
    );
    expect(issue).toBeDefined();
    expect(issue?.message).toMatch(/SRC-DOES-NOT-EXIST-EVER/);
    // Cross-instance drift is a warning, never an error.
    const errors = report.issues.filter((i) => i.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('accepts cross-instance links by either id or displayId — mirrors cross-instance reasoner', () => {
    const bad = cloneSource();
    bad.id = 'synthetic-display-link';
    // Reference the canonical AMS instance by its displayId, not its id.
    bad.linkedSourceEvents = [
      {
        sourceEventId: AMS_VENDOR_CONSOLIDATION_2026_INSTANCE.displayId,
        sourceEventName: 'AMS by displayId',
        linkType: 'feeds',
        description: 'synthetic',
      },
    ];

    const report = lintWithExtras({
      source: [AMS_VENDOR_CONSOLIDATION_2026_INSTANCE, bad],
    });
    const linkIssues = report.issues.filter(
      (i) => i.instanceId === 'synthetic-display-link' && /linkedSourceEvents/.test(i.message),
    );
    expect(linkIssues).toEqual([]);
  });

  it('flags a stageHistory transition referencing an unknown stageId as error', () => {
    const bad = cloneSource();
    bad.id = 'synthetic-history-drift';
    bad.stageHistory = [
      {
        stageId: 'NotAStage',
        enteredAt: '2026-01-01',
        exitedAt: '2026-01-02',
        advancedBy: 'system',
      },
    ];

    const report = lintWithExtras({ source: [bad] });
    const issue = report.issues.find(
      (i) =>
        i.instanceId === 'synthetic-history-drift' &&
        i.severity === 'error' &&
        /stageHistory/.test(i.message),
    );
    expect(issue).toBeDefined();
    expect(issue?.message).toMatch(/NotAStage/);
  });
});
