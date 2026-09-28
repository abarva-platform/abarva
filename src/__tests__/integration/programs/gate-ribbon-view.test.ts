// PRG-STA-GATE-V2 · Gate ribbon view model integration tests.
//
// Pure TypeScript + Jest. No jsdom, no React, no model calls.
// Anchors the P-SMOKE-CDP "2 of 5 criteria met" contract plus
// the APX-CC-2026 P4→P5 gate state.

import {
  buildGateRibbonView,
  getApprovalButtonLabel,
  getGateBadgeLabel,
  getGateModalHeadline,
  getPhaseLabel,
} from '@/lib/programs/gate-ribbon-view';
import { buildProgramDetailView } from '@/lib/programs/programs-detail-view';

// ─── Fixtures ────────────────────────────────────────────────────────────────

function cdpView() {
  // P3 Design Future State, pending gate to P4 Roadmap & Business Case.
  return buildProgramDetailView('apx-cdp-2026');
}

function ccView() {
  // P4 Roadmap & Business Case, pending gate to P5 Mobilize & Handoff.
  return buildProgramDetailView('apx-cc-2026');
}

function sapView() {
  // P1 Charter with an open gate.
  return buildProgramDetailView('apx-sap-2026');
}

function dfv2View() {
  // P6 Tower Track Outcomes has no next gate.
  return buildProgramDetailView('apx-dfv2-2025');
}

// ─── P-SMOKE-CDP: P3 Design Future State → P4 Roadmap & Business Case ────────────────────────

describe('P-SMOKE-CDP · phase gate ribbon (P3 Design Future State → P4 Roadmap & Business Case)', () => {
  const view = cdpView();
  const ribbon = buildGateRibbonView(view);

  it('returns a non-null ribbon for gateStatus pending', () => {
    expect(ribbon).not.toBeNull();
  });

  it('fromPhase is 3 (Design)', () => {
    expect(ribbon!.fromPhase).toBe(3);
  });

  it('toPhase is 4 (Execution Roadmap)', () => {
    expect(ribbon!.toPhase).toBe(4);
  });

  it('fromPhaseLabel is "Design Future State"', () => {
    expect(ribbon!.fromPhaseLabel).toBe('Design Future State');
  });

  it('toPhaseLabel is "Roadmap & Business Case"', () => {
    expect(ribbon!.toPhaseLabel).toBe('Roadmap & Business Case');
  });

  it('ribbonLabel uses the canonical P3 and P4 labels', () => {
    expect(ribbon!.ribbonLabel).toBe('P3 Design Future State → P4 Roadmap & Business Case');
  });

  // ── ANCHOR: P-SMOKE-CDP gate state must stay "2 of 5" ──
  it('totalCriteria is 5', () => {
    expect(ribbon!.totalCriteria).toBe(5);
  });

  it('metCriteria is 2', () => {
    expect(ribbon!.metCriteria).toBe(2);
  });

  it('gateSummary is "2 of 5 criteria met"', () => {
    expect(ribbon!.gateSummary).toBe('2 of 5 criteria met');
  });

  it('isAllMet is false (3 criteria unmet)', () => {
    expect(ribbon!.isAllMet).toBe(false);
  });

  it('unmetCriteria has length 3', () => {
    expect(ribbon!.unmetCriteria).toHaveLength(3);
  });

  it('unmetCriteria includes the vendor contract item', () => {
    expect(ribbon!.unmetCriteria).toContain(
      'Vendor integration contract signed (Vendor C)',
    );
  });

  // At P3 Design Future State the vendor scope conflict from P2 Discover & Diagnose was resolved at gate.
  // The P3 evidence items (gate approval, BAFO award, pattern validation) have no contradictions.
  it('hasContradiction is false (P3 evidence has no contradictions — P2 conflict resolved)', () => {
    expect(ribbon!.hasContradiction).toBe(false);
  });

  it('contradictionCount is 0', () => {
    expect(ribbon!.contradictionCount).toBe(0);
  });

  it('gateStatus is "pending"', () => {
    expect(ribbon!.gateStatus).toBe('pending');
  });

  it('deterministicSeed is true', () => {
    expect(ribbon!.deterministicSeed).toBe(true);
  });

  it('badge label is "2 of 5"', () => {
    expect(getGateBadgeLabel(ribbon!)).toBe('2 of 5');
  });

  it('approval button label is "Approve with override" (unmet items exist)', () => {
    expect(getApprovalButtonLabel(ribbon!)).toBe('Approve with override');
  });

  it('modal headline mentions Design Future State and Roadmap & Business Case', () => {
    const headline = getGateModalHeadline(ribbon!);
    expect(headline).toContain('Design Future State');
    expect(headline).toContain('Roadmap & Business Case');
    expect(headline).toContain('P3');
    expect(headline).toContain('P4');
  });
});

describe('GW-01 · P1 phase summary', () => {
  it('renders deterministic Charter summary copy instead of the empty-state fallback', () => {
    const view = sapView();
    expect(view.viewingPhase).toBe(1);
    expect(view.phasePanel.summary).toContain('P1 Charter is validating');
    expect(view.phasePanel.summary).toContain('sponsor review still need to close');
  });

  it('surfaces P1 deliverables in the phase panel', () => {
    const view = sapView();
    expect(view.phasePanel.deliverables).toEqual([
      { label: 'Origination approval', status: 'done' },
      { label: 'Discovery interview schedule', status: 'pending' },
      { label: 'IT data access request', status: 'blocked' },
      { label: 'Store observations report', status: 'pending' },
      { label: 'Discovery report', status: 'pending' },
    ]);
  });

  it('renders generic current-phase summary copy for newly created P1 programs', () => {
    const view = buildProgramDetailView('new-program-from-db', undefined, 1);
    expect(view.viewingPhase).toBe(1);
    expect(view.phasePanel.summary).toContain('P1 Charter is active');
    expect(view.phasePanel.summary).toContain('clear the next gate');
  });

  it('keeps newly approved P0 programs in Originate instead of clamping them to P1', () => {
    const view = buildProgramDetailView('new-program-from-db', undefined, 0);

    expect(view.currentPhase).toBe(0);
    expect(view.viewingPhase).toBe(0);
    expect(view.phases[0]).toMatchObject({
      id: 0,
      label: 'Originate',
      state: 'current',
    });
    expect(view.phases[1]).toMatchObject({
      id: 1,
      label: 'Charter',
      state: 'pending',
    });
    expect(view.workbench.title).toContain('P0 Originate');
    expect(view.phasePanel.summary).toContain('P0 Originate is active');
  });
});

// ─── APX-CC-2026 gate state is 'open' — ribbon returns null ──────────────────

describe('Open P4 gate state (no ribbon)', () => {
  const view = ccView();

  it('APX-CC-2026 gateStatus is "open" (not pending)', () => {
    expect(view.gateStatus).toBe('open');
  });

  it('buildGateRibbonView returns null for open gate', () => {
    expect(buildGateRibbonView(view)).toBeNull();
  });
});

// ─── Synthetic P4→P5 gate (Roadmap & Business Case → Mobilize & Handoff) ─────
// Uses CC's gate criteria shape with a synthetic gateStatus='pending' override
// to verify the 6-criteria / 2-met ribbon logic independently of fixture state.

describe('Synthetic P4 Roadmap & Business Case → P5 Mobilize & Handoff ribbon (6 criteria, 2 met)', () => {
  const base = ccView();
  const syntheticPending = {
    ...base,
    gateStatus: 'pending' as const,
    currentPhase: 4 as const,
    phasePanel: {
      gateCriteria: [
        { criterion: 'NLP intent classifier deployed to staging', met: true },
        { criterion: 'CRM integration smoke tests passing', met: true },
        { criterion: 'IVR routing rules complete', met: false },
        { criterion: 'Operator dashboard MVP complete', met: false },
        { criterion: 'Load test passing at 2× peak traffic', met: false },
        { criterion: 'Sponsor sign-off on Mobilize & Handoff criteria', met: false },
      ],
    },
  };
  const ribbon = buildGateRibbonView(syntheticPending);

  it('returns a non-null ribbon', () => {
    expect(ribbon).not.toBeNull();
  });

  it('fromPhase is 4 (Roadmap & Business Case)', () => {
    expect(ribbon!.fromPhase).toBe(4);
  });

  it('toPhase is 5 (Mobilize & Handoff)', () => {
    expect(ribbon!.toPhase).toBe(5);
  });

  it('ribbonLabel uses the canonical P4 and P5 labels', () => {
    expect(ribbon!.ribbonLabel).toBe('P4 Roadmap & Business Case → P5 Mobilize & Handoff');
  });

  it('totalCriteria is 6', () => {
    expect(ribbon!.totalCriteria).toBe(6);
  });

  it('metCriteria is 2', () => {
    expect(ribbon!.metCriteria).toBe(2);
  });

  it('gateSummary is "2 of 6 criteria met"', () => {
    expect(ribbon!.gateSummary).toBe('2 of 6 criteria met');
  });

  it('isAllMet is false', () => {
    expect(ribbon!.isAllMet).toBe(false);
  });

  it('unmetCriteria has length 4', () => {
    expect(ribbon!.unmetCriteria).toHaveLength(4);
  });

  it('hasContradiction is false (no evidence items in synthetic view)', () => {
    expect(ribbon!.hasContradiction).toBe(false);
  });
});

// ─── Gates that are not 'pending' return null ─────────────────────────────────

describe('buildGateRibbonView · null cases', () => {
  it('returns null for an open P4 gate', () => {
    expect(buildGateRibbonView(ccView())).toBeNull();
  });

  it('returns null for an open P1 gate', () => {
    expect(buildGateRibbonView(sapView())).toBeNull();
  });

  it('returns null for a phase with no next gate', () => {
    const view = dfv2View();
    expect(buildGateRibbonView(view)).toBeNull();
  });

  it('returns null when no gateCriteria in phasePanel', () => {
    const view = cdpView();
    const noPanel = {
      ...view,
      phasePanel: {},
    };
    expect(buildGateRibbonView(noPanel)).toBeNull();
  });

  it('returns null for currentPhase 6 (Tower Track Outcomes — no next gate)', () => {
    const view = dfv2View();
    const atOperate = {
      ...view,
      currentPhase: 6 as const,
      gateStatus: 'pending' as const,
      phasePanel: {
        gateCriteria: [{ criterion: 'Some criterion', met: true }],
      },
    };
    expect(buildGateRibbonView(atOperate)).toBeNull();
  });
});

// ─── Determinism ──────────────────────────────────────────────────────────────

describe('buildGateRibbonView · determinism', () => {
  it('CDP ribbon is identical across repeated calls', () => {
    const a = buildGateRibbonView(cdpView());
    const b = buildGateRibbonView(cdpView());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('CC ribbon is identical across repeated calls', () => {
    const a = buildGateRibbonView(ccView());
    const b = buildGateRibbonView(ccView());
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});

// ─── All-met gate ─────────────────────────────────────────────────────────────

describe('buildGateRibbonView · all-criteria-met gate', () => {
  it('isAllMet is true when all criteria are met', () => {
    const view = cdpView();
    const allMet = {
      ...view,
      gateStatus: 'pending' as const,
      phasePanel: {
        gateCriteria: [
          { criterion: 'Criterion A', met: true },
          { criterion: 'Criterion B', met: true },
          { criterion: 'Criterion C', met: true },
        ],
      },
    };
    const ribbon = buildGateRibbonView(allMet);
    expect(ribbon).not.toBeNull();
    expect(ribbon!.isAllMet).toBe(true);
    expect(ribbon!.metCriteria).toBe(3);
    expect(ribbon!.unmetCriteria).toHaveLength(0);
  });

  it('approval button label is "Approve gate" when all met', () => {
    const view = cdpView();
    const allMet = {
      ...view,
      gateStatus: 'pending' as const,
      phasePanel: {
        gateCriteria: [
          { criterion: 'Criterion A', met: true },
        ],
      },
    };
    const ribbon = buildGateRibbonView(allMet)!;
    expect(getApprovalButtonLabel(ribbon)).toBe('Approve gate');
  });
});

// ─── getPhaseLabel helper ─────────────────────────────────────────────────────

describe('getPhaseLabel', () => {
  it('returns "Charter" for phase 1', () => {
    expect(getPhaseLabel(1)).toBe('Charter');
  });

  it('returns "Discover & Diagnose" for phase 2', () => {
    expect(getPhaseLabel(2)).toBe('Discover & Diagnose');
  });

  it('returns "Design Future State" for phase 3', () => {
    expect(getPhaseLabel(3)).toBe('Design Future State');
  });

  it('returns "Roadmap & Business Case" for phase 4', () => {
    expect(getPhaseLabel(4)).toBe('Roadmap & Business Case');
  });

  it('returns "Mobilize & Handoff" for phase 5', () => {
    expect(getPhaseLabel(5)).toBe('Mobilize & Handoff');
  });

  it('returns "Tower Track Outcomes" for phase 6', () => {
    expect(getPhaseLabel(6)).toBe('Tower Track Outcomes');
  });

  it('returns a non-empty fallback for an unknown phase', () => {
    expect(getPhaseLabel(99).length).toBeGreaterThan(0);
  });
});

// ─── Module hygiene ───────────────────────────────────────────────────────────

describe('gate-ribbon-view · module hygiene', () => {
  it('module source contains no runtime impurity', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const src = fs.readFileSync(
      path.resolve(
        __dirname,
        '../../../lib/programs/gate-ribbon-view.ts',
      ),
      'utf8',
    );
    expect(src).not.toMatch(/Date\.now/);
    expect(src).not.toMatch(/Math\.random/);
    expect(src).not.toMatch(/new Date\(/);
    expect(src).not.toMatch(/fetch\(/);
  });
});
