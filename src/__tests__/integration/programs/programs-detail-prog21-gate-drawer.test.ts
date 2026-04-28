// PROG21 · Gate + approval interaction drawer.
//
// Verifies the structural invariants added in PROG21:
//   1. ProgramDetailPage imports buildGateApprovalDrawerView
//   2. Gate section has drawer trigger button testid
//   3. GateApprovalDrawer has required testids + honest disclaimer
//   4. gate-approval-drawer-view lib is deterministic and contract-correct
//   5. buildGateApprovalDrawerView view model contract

import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildGateApprovalDrawerView } from '@/lib/programs/gate-approval-drawer-view';
import type { ProgramDetailView } from '@/lib/programs/programs-types';

const DETAIL_PATH = join(
  process.cwd(),
  'src/components/programs/ProgramDetailPage.tsx',
);
const DRAWER_LIB_PATH = join(
  process.cwd(),
  'src/lib/programs/gate-approval-drawer-view.ts',
);

const detailSrc = readFileSync(DETAIL_PATH, 'utf8');
const drawerLibSrc = readFileSync(DRAWER_LIB_PATH, 'utf8');

// ─── ProgramDetailPage · imports ─────────────────────────────────────────────

describe('PROG21 · ProgramDetailPage · gate drawer imports', () => {
  it('imports buildGateApprovalDrawerView from gate-approval-drawer-view', () => {
    expect(detailSrc).toContain("from '@/lib/programs/gate-approval-drawer-view'");
  });

  it('imports GateApprovalDrawerView type', () => {
    expect(detailSrc).toContain('GateApprovalDrawerView');
  });

  it('derives gateApprovalDrawerView from view (deterministic)', () => {
    expect(detailSrc).toContain('buildGateApprovalDrawerView(view)');
  });
});

// ─── ProgramDetailPage · Gate section trigger ─────────────────────────────────

describe('PROG21 · ProgramDetailPage · gate drawer trigger', () => {
  it('has data-testid="gate-approval-drawer-trigger" in Gate section', () => {
    expect(detailSrc).toContain('data-testid="gate-approval-drawer-trigger"');
  });

  it('trigger is gated on gateApprovalDrawerView truthy check', () => {
    expect(detailSrc).toContain('gateApprovalDrawerView && (');
  });

  it('trigger button opens the drawer on click', () => {
    expect(detailSrc).toContain('setShowGateApprovalDrawer(true)');
  });
});

// ─── ProgramDetailPage · drawer component testids ─────────────────────────────

describe('PROG21 · ProgramDetailPage · GateApprovalDrawer testids', () => {
  it('has data-testid="gate-approval-drawer"', () => {
    expect(detailSrc).toContain('data-testid="gate-approval-drawer"');
  });

  it('has data-testid="gate-approval-posture-badge"', () => {
    expect(detailSrc).toContain('data-testid="gate-approval-posture-badge"');
  });

  it('has data-testid="gate-approval-criteria-list"', () => {
    expect(detailSrc).toContain('data-testid="gate-approval-criteria-list"');
  });

  it('has data-testid="gate-approval-waiver-caveat"', () => {
    expect(detailSrc).toContain('data-testid="gate-approval-waiver-caveat"');
  });

  it('has data-testid="gate-approval-drawer-disclaimer"', () => {
    expect(detailSrc).toContain('data-testid="gate-approval-drawer-disclaimer"');
  });

  it('has data-honest-disclaimer="gate-approval"', () => {
    expect(detailSrc).toContain('data-honest-disclaimer="gate-approval"');
  });

  it('honest disclaimer mentions Deterministic seed', () => {
    expect(detailSrc).toContain('Deterministic seed');
  });
});

// ─── gate-approval-drawer-view · source audit ─────────────────────────────────

describe('PROG21 · gate-approval-drawer-view · source audit', () => {
  it('buildGateApprovalDrawerView is exported', () => {
    expect(drawerLibSrc).toContain('export function buildGateApprovalDrawerView');
  });

  it('module contains no runtime impurity', () => {
    expect(drawerLibSrc).not.toMatch(/Date\.now/);
    expect(drawerLibSrc).not.toMatch(/Math\.random/);
    expect(drawerLibSrc).not.toMatch(/fetch\(/);
  });

  it('deterministicSeed: true literal present', () => {
    expect(drawerLibSrc).toContain('deterministicSeed: true');
  });

  it('exports GateApprovalDrawerView type', () => {
    expect(drawerLibSrc).toContain('export interface GateApprovalDrawerView');
  });

  it('exports GateCriterionStatus type', () => {
    expect(drawerLibSrc).toContain('export type GateCriterionStatus');
  });

  it('exports GateApprovalPosture type', () => {
    expect(drawerLibSrc).toContain('export type GateApprovalPosture');
  });
});

// ─── gate-approval-drawer-view · runtime contract ────────────────────────────

// Minimal fixture view with gate pending + criteria
const pendingView: ProgramDetailView = {
  programId: 'apx-cdp-2026',
  displayId: 'APX-CDP-2026',
  name: 'Apex CDP',
  tenant: 'Apex Retail',
  currentPhase: 3,
  viewingPhase: 3,
  phases: [],
  gateStatus: 'pending',
  workbench: { title: '', prose: '', actionsLabel: '', actions: [] },
  agentRail: [],
  phasePanel: {
    gateCriteria: [
      { criterion: 'Commercial case approved', met: true },
      { criterion: 'Technical architecture reviewed', met: false },
      { criterion: 'Data governance sign-off', met: true },
    ],
    evidenceItems: [
      {
        id: 'e1',
        citation: 'Workshop 4 output · Apr 14 2026',
        source: 'Priya Sharma',
        excerpt: 'Commercial case reviewed and approved by Steward.',
        confidence: 'high',
      },
    ],
  },
  deterministicSeed: true,
};

const openView: ProgramDetailView = {
  ...pendingView,
  gateStatus: 'open',
};

const noCriteriaView: ProgramDetailView = {
  ...pendingView,
  phasePanel: {},
};

describe('PROG21 · gate-approval-drawer-view · runtime contract', () => {
  it('returns non-null for pending gate with criteria', () => {
    const v = buildGateApprovalDrawerView(pendingView);
    expect(v).not.toBeNull();
  });

  it('returns null when gateStatus is not pending', () => {
    const v = buildGateApprovalDrawerView(openView);
    expect(v).toBeNull();
  });

  it('returns null when no gateCriteria', () => {
    const v = buildGateApprovalDrawerView(noCriteriaView);
    expect(v).toBeNull();
  });

  it('deterministicSeed is true literal', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.deterministicSeed).toBe(true);
  });

  it('fromPhase and toPhase are correct', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.fromPhase).toBe(3);
    expect(v.toPhase).toBe(4);
  });

  it('transitionLabel is non-empty', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.transitionLabel.length).toBeGreaterThan(0);
    expect(v.transitionLabel).toContain('P3');
    expect(v.transitionLabel).toContain('P4');
  });

  it('criteriaRows length matches input', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.criteriaRows.length).toBe(3);
  });

  it('met criteria have status "known"', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    const metRows = v.criteriaRows.filter((r) => r.met);
    metRows.forEach((r) => expect(r.status).toBe('known'));
  });

  it('unmet criteria have status "missing" or "blocked"', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    const unmetRows = v.criteriaRows.filter((r) => !r.met);
    unmetRows.forEach((r) => {
      expect(['missing', 'blocked']).toContain(r.status);
    });
  });

  it('metCount and totalCount are correct', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.metCount).toBe(2);
    expect(v.totalCount).toBe(3);
  });

  it('gateSummary is non-empty', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.gateSummary.trim().length).toBeGreaterThan(0);
  });

  it('approvalPosture is a known value', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(['ready', 'requires_override', 'blocked', 'waiver_needed']).toContain(v.approvalPosture);
  });

  it('postureLabel is non-empty', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.postureLabel.trim().length).toBeGreaterThan(0);
  });

  it('waiverCaveat is non-empty and mentions Steward', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.waiverCaveat.trim().length).toBeGreaterThan(0);
    expect(v.waiverCaveat).toContain('Steward');
  });

  it('honestDisclaimer mentions Deterministic seed', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    expect(v.honestDisclaimer).toContain('Deterministic seed');
  });

  it('is deterministic across calls', () => {
    const a = buildGateApprovalDrawerView(pendingView);
    const b = buildGateApprovalDrawerView(pendingView);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('nextAction is non-empty for every criterion row', () => {
    const v = buildGateApprovalDrawerView(pendingView)!;
    v.criteriaRows.forEach((r) => {
      expect(r.nextAction.trim().length).toBeGreaterThan(0);
    });
  });
});
