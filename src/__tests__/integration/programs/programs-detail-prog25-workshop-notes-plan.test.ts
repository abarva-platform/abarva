// PROG25 · Workshop notes to actions/deliverables plan.
//
// Verifies structural invariants added in PROG25:
//   1. ProgramDetailPage wires workshop notes plan view + panel
//   2. Workshop panel exposes known/missing/blocked/next action lanes
//   3. Honest deterministic-vs-live caveat is explicit
//   4. workshop-notes-action-plan-view is deterministic and pure

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildWorkshopNotesActionPlanView } from '@/lib/programs/workshop-notes-action-plan-view';
import type { ProgramDetailView } from '@/lib/programs/programs-types';

const DETAIL_PATH = join(
  process.cwd(),
  'src/components/programs/ProgramDetailPage.tsx',
);
const PANEL_PATH = join(
  process.cwd(),
  'src/components/programs/WorkshopNotesActionPlanPanel.tsx',
);
const LIB_PATH = join(
  process.cwd(),
  'src/lib/programs/workshop-notes-action-plan-view.ts',
);

const detailSrc = readFileSync(DETAIL_PATH, 'utf8');
const panelSrc = readFileSync(PANEL_PATH, 'utf8');
const libSrc = readFileSync(LIB_PATH, 'utf8');

describe('PROG25 · ProgramDetailPage wiring', () => {
  it('imports buildWorkshopNotesActionPlanView', () => {
    expect(detailSrc).toContain("from '@/lib/programs/workshop-notes-action-plan-view'");
  });

  it('imports WorkshopNotesActionPlanPanel', () => {
    expect(detailSrc).toContain("from '@/components/programs/WorkshopNotesActionPlanPanel'");
  });

  it('derives workshopNotesPlanView from view', () => {
    expect(detailSrc).toContain('buildWorkshopNotesActionPlanView(view)');
  });

  it('renders WorkshopNotesActionPlanPanel in workshop section', () => {
    expect(detailSrc).toContain('<WorkshopNotesActionPlanPanel view={workshopNotesPlanView} />');
    const workshopSection = detailSrc.indexOf('data-testid="program-section-workshop"');
    const planPanel = detailSrc.indexOf('WorkshopNotesActionPlanPanel view={workshopNotesPlanView}');
    expect(workshopSection).toBeGreaterThan(0);
    expect(planPanel).toBeGreaterThan(workshopSection);
  });
});

describe('PROG25 · WorkshopNotesActionPlanPanel lanes', () => {
  it('has panel testid', () => {
    expect(panelSrc).toContain('data-testid="workshop-notes-plan-panel"');
  });

  it('has known/missing/blocked lane testids', () => {
    expect(panelSrc).toContain('workshop-notes-plan-known');
    expect(panelSrc).toContain('workshop-notes-plan-missing');
    expect(panelSrc).toContain('workshop-notes-plan-blocked');
  });

  it('has next action lane testid', () => {
    expect(panelSrc).toContain('data-testid="workshop-notes-plan-next-action"');
  });

  it('has disclaimer testid + honest-disclaimer attribute', () => {
    expect(panelSrc).toContain('data-testid="workshop-notes-plan-disclaimer"');
    expect(panelSrc).toContain('data-honest-disclaimer="workshop-notes-plan"');
  });
});

describe('PROG25 · workshop-notes-action-plan-view source audit', () => {
  it('exports buildWorkshopNotesActionPlanView', () => {
    expect(libSrc).toContain('export function buildWorkshopNotesActionPlanView');
  });

  it('exports WorkshopNotesActionPlanView interface', () => {
    expect(libSrc).toContain('export interface WorkshopNotesActionPlanView');
  });

  it('contains no runtime impurity', () => {
    expect(libSrc).not.toMatch(/Date\.now/);
    expect(libSrc).not.toMatch(/Math\.random/);
    expect(libSrc).not.toMatch(/fetch\(/);
  });

  it('contains deterministic-vs-live caveat', () => {
    expect(libSrc).toContain('Deterministic seed');
    expect(libSrc).toContain('Live notes ingestion');
  });
});

const baseView: ProgramDetailView = {
  programId: 'apx-cdp-2026',
  displayId: 'APX-CDP-2026',
  name: 'Apex CDP',
  tenant: 'Apex Retail',
  currentPhase: 3,
  viewingPhase: 3,
  phases: [{ id: 3, label: 'Design', state: 'current' }],
  gateStatus: 'pending',
  workbench: {
    title: 'Nexus workshop brief',
    prose: 'Seed prose',
    actionsLabel: 'Actions',
    actions: [{ letter: 'A', text: 'Prepare gate evidence', detail: 'Collect missing proof.' }],
  },
  agentRail: [],
  phasePanel: {
    gateCriteria: [
      { criterion: 'Decision log attached', met: true },
      { criterion: 'Sponsor sign-off captured', met: false },
    ],
    deliverables: [
      { label: 'Architecture draft', status: 'done' },
      { label: 'Risk annex', status: 'pending' },
      { label: 'Compliance evidence map', status: 'blocked' },
    ],
    blockerNote: 'Security dependency unresolved',
  },
  deterministicSeed: true,
};

describe('PROG25 · workshop-notes-action-plan-view runtime contract', () => {
  it('returns a deterministic non-null plan', () => {
    const plan = buildWorkshopNotesActionPlanView(baseView);
    expect(plan).not.toBeNull();
    expect(plan.deterministicSeed).toBe(true);
  });

  it('always contains known/missing/blocked lanes', () => {
    const plan = buildWorkshopNotesActionPlanView(baseView);
    expect(plan.known.length).toBeGreaterThan(0);
    expect(plan.missing.length).toBeGreaterThan(0);
    expect(plan.blocked.length).toBeGreaterThan(0);
  });

  it('contains nextAction and deliverableNextAction', () => {
    const plan = buildWorkshopNotesActionPlanView(baseView);
    expect(plan.nextAction.trim().length).toBeGreaterThan(0);
    expect(plan.deliverableNextAction.trim().length).toBeGreaterThan(0);
  });

  it('honestDisclaimer names deferred live capabilities', () => {
    const plan = buildWorkshopNotesActionPlanView(baseView);
    expect(plan.honestDisclaimer).toContain('Deterministic seed');
    expect(plan.honestDisclaimer).toContain('deferred');
  });

  it('is deterministic across calls', () => {
    const a = buildWorkshopNotesActionPlanView(baseView);
    const b = buildWorkshopNotesActionPlanView(baseView);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
