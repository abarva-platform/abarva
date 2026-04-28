// CORR — Canonical Apex Retail fixture data aligned to the shell wave demo anchor.
// Deterministic: no Date.now(), no random, no model calls.
//
// Demo anchor (pages.yaml §demo-data-baseline — updated Apr 27 2026):
//   Tenant:           Apex Retail Group · Locked
//   Flagship program: APX-CDP-2026 · Apex Retail CDP Activation
//   Current phase:    P3 Design · Design gate (P2 → P3) cleared Apr 27 2026
//   Active work:      Architecture sprint · Vendor C contract in final review
//   Evidence coverage: 100% (gate cleared)
//   Linked source:    AMS Vendor Consolidation 2026 · Stage 7 BAFO · linkedProgramCode APX-CDP-2026

import type {
  ProgramPhaseId,
  ProgramPhaseSlot,
  ProgramRow,
} from './programs-types';

// ─── Phase label map (7-phase: P0–P6) ───────────────────────────────────────

export const PHASE_LABEL_MAP: Record<ProgramPhaseId, string> = {
  0: 'Originate',
  1: 'Discovery',
  2: 'Synthesis',
  3: 'Design',
  4: 'Build',
  5: 'Activate',
  6: 'Operate',
};

// ─── Helper to build the 7-slot phase array for a given program ─────────────

export function buildPhaseSlots(
  currentPhase: ProgramPhaseId,
  gateOverrides?: Partial<Record<ProgramPhaseId, ProgramPhaseSlot['gateStatus']>>,
): ProgramPhaseSlot[] {
  const slots: ProgramPhaseSlot[] = [];
  for (let i = 0; i <= 6; i++) {
    const id = i as ProgramPhaseId;
    let state: ProgramPhaseSlot['state'];
    if (id < currentPhase) state = 'done';
    else if (id === currentPhase) state = 'current';
    else if (id === currentPhase + 1) state = 'pending';
    else state = 'locked';

    const slot: ProgramPhaseSlot = {
      id,
      label: PHASE_LABEL_MAP[id],
      state,
    };
    if (gateOverrides?.[id] !== undefined) {
      slot.gateStatus = gateOverrides[id];
    }
    slots.push(slot);
  }
  return slots;
}

// ─── Apex Retail fixture programs ───────────────────────────────────────────

// APX-CDP-2026 · Apex Retail CDP Activation  ← FLAGSHIP
// P3 Design · Design gate cleared Apr 27 · Architecture sprint active
// Vendor C selected as managed CDP layer · AMS BAFO award unblocked
// Linked source: AMS Vendor Consolidation 2026 · Stage 7 BAFO
const apxCdp2026: ProgramRow = {
  id: 'apx-cdp-2026',
  displayId: 'APX-CDP-2026',
  name: 'Apex Retail CDP Activation',
  currentPhase: 3,
  phases: buildPhaseSlots(3, { 4: 'pending' }),
  gateStatus: 'open',
  lastActiveLabel: '2h ago',
  nexusNote: 'P3 Design · Architecture sprint active · Vendor C contract in final review',
  actionLabel: 'Continue',
  isIdle: false,
  linkedSourceEvent: 'SRC-AMS-2026 · AMS Vendor Consolidation 2026 · Stage 7 BAFO',
};

// APX-CC-2026 · Contact Center AI Transformation
// P4 Build · on track for Activate gate
const apxCc2026: ProgramRow = {
  id: 'apx-cc-2026',
  displayId: 'APX-CC-2026',
  name: 'Contact Center AI Transformation',
  currentPhase: 4,
  phases: buildPhaseSlots(4, { 4: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '4h ago',
  nexusNote: 'Build artifacts 68% complete — on track for Activate gate',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-SAP-2026 · Store Associate Productivity AI
// P1 Discovery · evidence backlog growing
const apxSap2026: ProgramRow = {
  id: 'apx-sap-2026',
  displayId: 'APX-SAP-2026',
  name: 'Store Associate Productivity AI',
  currentPhase: 1,
  phases: buildPhaseSlots(1, { 1: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '5h ago',
  nexusNote: 'Discovery interviews scheduled — data access requests pending IT',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-LPM-2026 · Loyalty Platform Modernization
// P3 Design · active
const apxLpm2026: ProgramRow = {
  id: 'apx-lpm-2026',
  displayId: 'APX-LPM-2026',
  name: 'Loyalty Platform Modernization',
  currentPhase: 3,
  phases: buildPhaseSlots(3, { 3: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '1d ago',
  nexusNote: 'Design phase — solution options under Sentinel review',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-MRC-2025 · Markdown Revenue Capture
// P3 Design · idle 9 days — sponsor engagement stalled
const apxMrc2025: ProgramRow = {
  id: 'apx-mrc-2025',
  displayId: 'APX-MRC-2025',
  name: 'Markdown Revenue Capture',
  currentPhase: 3,
  phases: buildPhaseSlots(3),
  gateStatus: 'na',
  lastActiveLabel: '9d ago',
  nexusNote: 'No activity in 9 days — sponsor re-engagement recommended',
  actionLabel: 'Resume',
  isIdle: true,
};

// APX-DFV2-2025 · Demand Forecasting AI v2
// P6 Operate · steady state · Atlas monitoring
const apxDfv2: ProgramRow = {
  id: 'apx-dfv2-2025',
  displayId: 'APX-DFV2-2025',
  name: 'Demand Forecasting AI v2',
  currentPhase: 6,
  phases: buildPhaseSlots(6),
  gateStatus: 'idle',
  lastActiveLabel: 'Mar 28',
  nexusNote: 'Operating in steady state — Atlas outcome tracking active',
  actionLabel: 'Review',
  isIdle: true,
};

// ─── Exported fixture array ──────────────────────────────────────────────────
// Flagship first so APEX_PROGRAMS_FIXTURE[0] always resolves to APX-CDP-2026.

export const APEX_PROGRAMS_FIXTURE: ProgramRow[] = [
  apxCdp2026,   // flagship — P2 Synthesis · gate pending
  apxCc2026,    // P4 Build · active
  apxSap2026,   // P1 Discovery · active
  apxLpm2026,   // P3 Design · active
  apxMrc2025,   // P3 Design · idle
  apxDfv2,      // P6 Operate · steady state
];
