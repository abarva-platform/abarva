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
  // APX-CDP-2026 at P3 Design (pending gate to P4 Build)
  return buildProgramDetailView('apx-cdp-2026');
}

function ccView() {
  // APX-CC-2026 at P4 Build (pending gate to P5 Activate)
  return buildProgramDetailView('apx-cc-2026');
}

function sapView() {
  // APX-SAP-2026 at P1 Discovery (gate open, not pending)
  return buildProgramDetailView('apx-sap-2026');
}

function dfv2View() {
  // APX-DFV2-2025 at P6 Operate (gateStatus: na — no next gate)
  return buildProgramDetailView('apx-dfv2-2025');
}

// ─── P-SMOKE-CDP: APX-CDP-2026 P3 Design → P4 Build ─────────────────────────

describe('P-SMOKE-CDP · APX-CDP-2026 gate ribbon (P3 Design → P4 Build)', () => {
  const view = cdpView();
  const ribbon = buildGateRibbonView(view);

  it('returns a non-null ribbon for gateStatus pending', () => {
    expect(ribbon).not.toBeNull();
  });

  it('fromPhase is 3 (Design)', () => {
    expect(ribbon!.fromPhase).toBe(3);
  });

  it('toPhase is 4 (Build)', () => {
    expect(ribbon!.toPhase).toBe(4);
  });

  it('fromPhaseLabel is "Design"', () => {
    expect(ribbon!.fromPhaseLabel).toBe('Design');
  });

  it('toPhaseLabel is "Build"', () => {
    expect(ribbon!.toPhaseLabel).toBe('Build');
  });

  it('ribbonLabel is "P3 Design → P4 Build"', () => {
    expect(ribbon!.ribbonLabel).toBe('P3 Design → P4 Build');
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

  // At P3 Design the vendor scope conflict from P2 Synthesis was resolved at gate.
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

  it('modal headline mentions Design and Build', () => {
    const headline = getGateModalHeadline(ribbon!);
    expect(headline).toContain('Design');
    expect(headline).toContain('Build');
    expect(headline).toContain('P3');
    expect(headline).toContain('P4');
  });
});

describe('GW-01 · APX-SAP-2026 P1 phase summary', () => {
  it('renders deterministic Discovery summary copy instead of the empty-state fallback', () => {
    const view = sapView();
    expect(view.viewingPhase).toBe(1);
    expect(view.phasePanel.summary).toContain('P1 Discovery is validating');
    expect(view.phasePanel.summary).toContain('sponsor review still need to close');
  });
});

// ─── APX-CC-2026 gate state is 'open' — ribbon returns null ──────────────────

describe('APX-CC-2026 gate state (gateStatus open — no ribbon)', () => {
  const view = ccView();

  it('APX-CC-2026 gateStatus is "open" (not pending)', () => {
    expect(view.gateStatus).toBe('open');
  });

  it('buildGateRibbonView returns null for open gate', () => {
    expect(buildGateRibbonView(view)).toBeNull();
  });
});

// ─── Synthetic P4→P5 gate (Build → Activate) ─────────────────────────────────
// Uses CC's gate criteria shape with a synthetic gateStatus='pending' override
// to verify the 6-criteria / 2-met ribbon logic independently of fixture state.

describe('Synthetic P4 Build → P5 Activate ribbon (6 criteria, 2 met)', () => {
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
        { criterion: 'Sponsor sign-off on Activate criteria', met: false },
      ],
    },
  };
  const ribbon = buildGateRibbonView(syntheticPending);

  it('returns a non-null ribbon', () => {
    expect(ribbon).not.toBeNull();
  });

  it('fromPhase is 4 (Build)', () => {
    expect(ribbon!.fromPhase).toBe(4);
  });

  it('toPhase is 5 (Activate)', () => {
    expect(ribbon!.toPhase).toBe(5);
  });

  it('ribbonLabel is "P4 Build → P5 Activate"', () => {
    expect(ribbon!.ribbonLabel).toBe('P4 Build → P5 Activate');
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
  it('returns null for gateStatus open (APX-CC-2026)', () => {
    // APX-CC-2026 is at P4 Build with gateStatus 'open'
    expect(buildGateRibbonView(ccView())).toBeNull();
  });

  it('returns null for gateStatus open (APX-SAP-2026)', () => {
    // APX-SAP-2026 is at P1 Discovery with gateStatus 'open'
    expect(buildGateRibbonView(sapView())).toBeNull();
  });

  it('returns null for gateStatus na (APX-DFV2-2025 P6)', () => {
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

  it('returns null for currentPhase 6 (Operate — no next gate)', () => {
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
  it('returns "Discovery" for phase 1', () => {
    expect(getPhaseLabel(1)).toBe('Discovery');
  });

  it('returns "Synthesis" for phase 2', () => {
    expect(getPhaseLabel(2)).toBe('Synthesis');
  });

  it('returns "Design" for phase 3', () => {
    expect(getPhaseLabel(3)).toBe('Design');
  });

  it('returns "Build" for phase 4', () => {
    expect(getPhaseLabel(4)).toBe('Build');
  });

  it('returns "Activate" for phase 5', () => {
    expect(getPhaseLabel(5)).toBe('Activate');
  });

  it('returns "Operate" for phase 6', () => {
    expect(getPhaseLabel(6)).toBe('Operate');
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
