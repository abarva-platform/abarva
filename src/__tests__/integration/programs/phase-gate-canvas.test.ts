// PROG11 · Phase Journey + Approval Gate Canvas tests.
//
// Pure type/source coverage of the view-model and the component module.
// No jsdom, no React rendering.

import * as fs from 'fs';
import * as path from 'path';
import { buildPhaseGateCanvasView } from '../../../lib/programs/phase-gate-canvas-view';
import { PhaseGateCanvas } from '../../../components/programs/PhaseGateCanvas';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/PhaseGateCanvas.tsx'),
  'utf8',
);

describe('PROG11 · phase gate canvas view-model', () => {
  it('returns exactly 6 phases', () => {
    const view = buildPhaseGateCanvasView();
    expect(view.phases).toHaveLength(6);
  });

  it('phase IDs include all 6 canonical phases', () => {
    const view = buildPhaseGateCanvasView();
    const ids = view.phases.map((p) => p.phaseId).sort();
    expect(ids).toEqual(
      ['activate', 'build', 'design', 'discovery', 'operate', 'synthesis'].sort(),
    );
  });

  it('phases are ordered 1-6 by `order` field', () => {
    const view = buildPhaseGateCanvasView();
    const orders = view.phases.map((p) => p.order);
    expect(orders).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('currentGate.requirements length is at least 4', () => {
    const view = buildPhaseGateCanvasView();
    expect(view.currentGate.requirements.length).toBeGreaterThanOrEqual(4);
  });

  it('currentGate.requirements length is at most 6', () => {
    const view = buildPhaseGateCanvasView();
    expect(view.currentGate.requirements.length).toBeLessThanOrEqual(6);
  });

  it('currentGate.owner is one of the canonical owners', () => {
    const view = buildPhaseGateCanvasView();
    expect(['nexus', 'sentinel', 'atlas', 'steward']).toContain(view.currentGate.owner);
  });

  it('currentGate.status is one of the canonical statuses', () => {
    const view = buildPhaseGateCanvasView();
    expect(['open', 'pending', 'closed', 'blocked']).toContain(view.currentGate.status);
  });

  it('currentGate.approvalCaveat is non-empty', () => {
    const view = buildPhaseGateCanvasView();
    expect(view.currentGate.approvalCaveat.length).toBeGreaterThan(0);
  });

  it('caveat contains the word "deterministic"', () => {
    const view = buildPhaseGateCanvasView();
    expect(view.caveat).toMatch(/deterministic/);
  });

  it('caveat contains the disclaimer "no actual" (case-insensitive)', () => {
    const view = buildPhaseGateCanvasView();
    expect(view.caveat).toMatch(/no actual/i);
  });

  it('generatedAt is the canonical 2026-04-26 stamp', () => {
    const view = buildPhaseGateCanvasView();
    expect(view.generatedAt).toBe('2026-04-26');
  });
});

describe('PROG11 · phase gate canvas component', () => {
  it('exports PhaseGateCanvas as a function', () => {
    expect(typeof PhaseGateCanvas).toBe('function');
  });

  it('component source does not contain banned teal hex tokens', () => {
    expect(componentSource).not.toMatch(/#14B8A6/i);
    expect(componentSource).not.toMatch(/#0E9F8C/i);
  });

  it('component source contains AbarVa navy accent #1B2B5C', () => {
    expect(componentSource).toMatch(/#1B2B5C/);
  });
});
