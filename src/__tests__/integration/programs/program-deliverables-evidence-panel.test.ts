// PROG13 · ProgramDeliverablesEvidencePanel integration tests.
//
// Type-level + source-level checks. No jsdom rendering.

import * as fs from 'fs';
import * as path from 'path';

import {
  buildProgramDeliverablesEvidenceView,
  DELIVERABLE_EVIDENCE_STATES,
  DELIVERABLE_PHASE_IDS,
  DELIVERABLE_VERSION_STATES,
  type DeliverableEvidenceState,
  type DeliverablePhaseId,
  type DeliverableVersionState,
} from '../../../lib/programs/program-deliverables-evidence-view';
import { ProgramDeliverablesEvidencePanel } from '../../../components/programs/ProgramDeliverablesEvidencePanel';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(
    repoRoot,
    'src/components/programs/ProgramDeliverablesEvidencePanel.tsx',
  ),
  'utf8',
);

describe('PROG13 · buildProgramDeliverablesEvidenceView', () => {
  it('returns exactly 6 phase groups', () => {
    const view = buildProgramDeliverablesEvidenceView();
    expect(view.phaseGroups).toHaveLength(6);
  });

  it('includes every canonical phase id', () => {
    const view = buildProgramDeliverablesEvidenceView();
    const ids = view.phaseGroups.map((group) => group.phaseId).sort();
    const expected: DeliverablePhaseId[] = [
      'activate',
      'build',
      'design',
      'discovery',
      'operate',
      'synthesis',
    ];
    expect(ids).toEqual(expected);
  });

  it('orders phase groups 1 through 6', () => {
    const view = buildProgramDeliverablesEvidenceView();
    const orders = view.phaseGroups.map((group) => group.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('reports at least 12 deliverables in total', () => {
    const view = buildProgramDeliverablesEvidenceView();
    expect(view.totalDeliverables).toBeGreaterThanOrEqual(12);
  });

  it('keeps evidence coverage in the [0, 100] range', () => {
    const view = buildProgramDeliverablesEvidenceView();
    expect(view.evidenceCoveragePercent).toBeGreaterThanOrEqual(0);
    expect(view.evidenceCoveragePercent).toBeLessThanOrEqual(100);
  });

  it('marks exactly one deliverable as current', () => {
    const view = buildProgramDeliverablesEvidenceView();
    const currentEntries = view.phaseGroups.flatMap((group) =>
      group.deliverables.filter((entry) => entry.isCurrent),
    );
    expect(currentEntries).toHaveLength(1);
  });

  it('places the current deliverable in the synthesis phase', () => {
    const view = buildProgramDeliverablesEvidenceView();
    const currentEntries = view.phaseGroups.flatMap((group) =>
      group.deliverables
        .filter((entry) => entry.isCurrent)
        .map((entry) => ({ phaseId: group.phaseId, entry })),
    );
    expect(currentEntries).toHaveLength(1);
    expect(currentEntries[0]?.phaseId).toBe('synthesis');
  });

  it('uses only canonical version states on every deliverable', () => {
    const view = buildProgramDeliverablesEvidenceView();
    const allowed = new Set<DeliverableVersionState>(
      DELIVERABLE_VERSION_STATES,
    );
    for (const group of view.phaseGroups) {
      for (const entry of group.deliverables) {
        expect(allowed.has(entry.versionState)).toBe(true);
      }
    }
  });

  it('uses only canonical evidence states on every deliverable', () => {
    const view = buildProgramDeliverablesEvidenceView();
    const allowed = new Set<DeliverableEvidenceState>(
      DELIVERABLE_EVIDENCE_STATES,
    );
    for (const group of view.phaseGroups) {
      for (const entry of group.deliverables) {
        expect(allowed.has(entry.evidenceState)).toBe(true);
      }
    }
  });

  it('keeps draft deliverables out of the evidence:complete bucket', () => {
    const view = buildProgramDeliverablesEvidenceView();
    for (const group of view.phaseGroups) {
      for (const entry of group.deliverables) {
        if (entry.versionState === 'draft') {
          expect(['partial', 'missing']).toContain(entry.evidenceState);
        }
      }
    }
  });

  it('exposes a non-null currentDeliverableId', () => {
    const view = buildProgramDeliverablesEvidenceView();
    expect(view.currentDeliverableId).not.toBeNull();
    expect(typeof view.currentDeliverableId).toBe('string');
  });

  it('caveat names the deterministic-and-seed posture', () => {
    const view = buildProgramDeliverablesEvidenceView();
    expect(view.caveat.toLowerCase()).toContain('deterministic');
  });

  it('caveat disclaims live downloads or actual approval', () => {
    const view = buildProgramDeliverablesEvidenceView();
    const lowered = view.caveat.toLowerCase();
    expect(
      lowered.includes('no live downloads') ||
        lowered.includes('no actual approval') ||
        lowered.includes('no file storage'),
    ).toBe(true);
  });

  it('pins generatedAt to 2026-04-26', () => {
    const view = buildProgramDeliverablesEvidenceView();
    expect(view.generatedAt).toBe('2026-04-26');
  });

  it('exports DELIVERABLE_PHASE_IDS in canonical order for downstream wiring', () => {
    expect(DELIVERABLE_PHASE_IDS).toEqual([
      'discovery',
      'synthesis',
      'design',
      'build',
      'activate',
      'operate',
    ]);
  });
});

describe('PROG13 · ProgramDeliverablesEvidencePanel component', () => {
  it('exports as a function (React component)', () => {
    expect(typeof ProgramDeliverablesEvidencePanel).toBe('function');
  });

  it('source contains no teal hex tokens (#14B8A6 / #0E9F8C)', () => {
    expect(componentSource.toLowerCase()).not.toContain('#14b8a6');
    expect(componentSource.toLowerCase()).not.toContain('#0e9f8c');
  });
});
