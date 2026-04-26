// PROG12 · Nexus Workshop Canvas integration tests.
//
// Type/source-only tests, NO jsdom, NO React rendering. Asserts the
// deterministic shape of the view-model and that the component source
// honours the design canon (no teal accents).

import * as fs from 'fs';
import * as path from 'path';
import {
  buildNexusWorkshopCanvasView,
  SME_ROLES,
  type SmeRole,
} from '../../../lib/programs/nexus-workshop-canvas-view';
import { NexusWorkshopCanvas } from '../../../components/programs/NexusWorkshopCanvas';

const repoRoot = path.resolve(__dirname, '../../../../');
const componentSource = fs.readFileSync(
  path.join(repoRoot, 'src/components/programs/NexusWorkshopCanvas.tsx'),
  'utf8',
);

const VALID_READINESS = ['ready', 'partial', 'blocked'] as const;
const SME_ROLE_SET: ReadonlySet<SmeRole> = new Set(SME_ROLES);

describe('buildNexusWorkshopCanvasView', () => {
  it('returns at least 4 agenda items', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.agenda.length).toBeGreaterThanOrEqual(4);
  });

  it('returns at most 6 agenda items', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.agenda.length).toBeLessThanOrEqual(6);
  });

  it('returns at least 4 attendees', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.attendees.length).toBeGreaterThanOrEqual(4);
  });

  it('returns at least 2 tensions', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.tensions.length).toBeGreaterThanOrEqual(2);
  });

  it('returns at least 2 decisions needed', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.decisionsNeeded.length).toBeGreaterThanOrEqual(2);
  });

  it('returns at least 3 evidence-to-capture items', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.evidenceToCapture.length).toBeGreaterThanOrEqual(3);
  });

  it('returns at least 2 expected outputs', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.expectedOutputs.length).toBeGreaterThanOrEqual(2);
  });

  it('readinessState is one of ready / partial / blocked', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(VALID_READINESS).toContain(view.readinessState);
  });

  it('every attendee has a role in the SmeRole enum', () => {
    const view = buildNexusWorkshopCanvasView();
    for (const row of view.attendees) {
      expect(SME_ROLE_SET.has(row.role)).toBe(true);
    }
  });

  it('proposedUpdatesPlaceholder is a non-empty string', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(typeof view.proposedUpdatesPlaceholder).toBe('string');
    expect(view.proposedUpdatesPlaceholder.length).toBeGreaterThan(0);
  });

  it('caveat contains the word "deterministic"', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.caveat.toLowerCase()).toContain('deterministic');
  });

  it('caveat communicates that no live notes are wired', () => {
    const view = buildNexusWorkshopCanvasView();
    const lower = view.caveat.toLowerCase();
    const matchesNoLive =
      lower.includes('no live notes') ||
      lower.includes('no live') ||
      lower.includes('not wired');
    expect(matchesNoLive).toBe(true);
  });

  it('generatedAt equals 2026-04-26', () => {
    const view = buildNexusWorkshopCanvasView();
    expect(view.generatedAt).toBe('2026-04-26');
  });
});

describe('NexusWorkshopCanvas component', () => {
  it('exports as a function', () => {
    expect(typeof NexusWorkshopCanvas).toBe('function');
  });

  it('component source contains no teal accents (#14B8A6 / #0E9F8C)', () => {
    expect(componentSource).not.toContain('#14B8A6');
    expect(componentSource).not.toContain('#0E9F8C');
    expect(componentSource.toLowerCase()).not.toContain('#14b8a6');
    expect(componentSource.toLowerCase()).not.toContain('#0e9f8c');
  });
});
