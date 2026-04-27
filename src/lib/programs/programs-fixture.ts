// PROG-A — Canonical Apex Retail fixture data for the Programs surface.
// Deterministic: no Date.now(), no random, no model calls.
// These 7 programs are the demo anchor for the wave programs redesign.

import type {
  ProgramPhaseId,
  ProgramPhaseSlot,
  ProgramRow,
} from './programs-types';

// ─── Phase label map ────────────────────────────────────────────────────────

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

function buildPhaseSlots(
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

// APX-01: Morrison Owned Brand Margin Recovery
// P2 Synthesis (current), P3 Design gate pending
const apx01: ProgramRow = {
  id: 'apx-01',
  displayId: 'APX-01',
  name: 'Morrison Owned Brand Margin Recovery',
  currentPhase: 2,
  phases: buildPhaseSlots(2, { 3: 'pending' }),
  gateStatus: 'pending',
  lastActiveLabel: '2h ago',
  nexusNote: 'Anchoring the Design gate decision',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-02: Pet Adjacency Bundle Optimization
// P4 Build (current), gate open
const apx02: ProgramRow = {
  id: 'apx-02',
  displayId: 'APX-02',
  name: 'Pet Adjacency Bundle Optimization',
  currentPhase: 4,
  phases: buildPhaseSlots(4, { 4: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '4h ago',
  nexusNote: 'Build artifacts 60% complete — on track for Activate gate',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-03: Loyalty Lift Diagnostic
// P1 Discovery (current), gate open
const apx03: ProgramRow = {
  id: 'apx-03',
  displayId: 'APX-03',
  name: 'Loyalty Lift Diagnostic',
  currentPhase: 1,
  phases: buildPhaseSlots(1, { 1: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '5h ago',
  nexusNote: 'Discovery interviews scheduled — evidence backlog growing',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-04: Markdown Cadence Reset
// P3 Design (current), idle 12d, gate N/A
const apx04: ProgramRow = {
  id: 'apx-04',
  displayId: 'APX-04',
  name: 'Markdown Cadence Reset',
  currentPhase: 3,
  phases: buildPhaseSlots(3),
  gateStatus: 'na',
  lastActiveLabel: '12d ago',
  nexusNote: 'No activity in 12 days — sponsor engagement may need a nudge',
  actionLabel: 'Resume',
  isIdle: true,
};

// APX-05: Store Replenishment Vision
// P5 Activate (current), gate pending
const apx05: ProgramRow = {
  id: 'apx-05',
  displayId: 'APX-05',
  name: 'Store Replenishment Vision',
  currentPhase: 5,
  phases: buildPhaseSlots(5, { 5: 'pending' }),
  gateStatus: 'pending',
  lastActiveLabel: '3h ago',
  nexusNote: 'Activate gate criteria partially met — 2 criteria outstanding',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-06: Customer Lifetime Value Renewal
// P1 Discovery (current), gate open
const apx06: ProgramRow = {
  id: 'apx-06',
  displayId: 'APX-06',
  name: 'Customer Lifetime Value Renewal',
  currentPhase: 1,
  phases: buildPhaseSlots(1, { 1: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '1d ago',
  nexusNote: 'Discovery phase — data access requests pending IT response',
  actionLabel: 'Continue',
  isIdle: false,
};

// APX-07: Demand Forecast v2
// P6 Operate (current), idle 30d+
const apx07: ProgramRow = {
  id: 'apx-07',
  displayId: 'APX-07',
  name: 'Demand Forecast v2',
  currentPhase: 6,
  phases: buildPhaseSlots(6),
  gateStatus: 'idle',
  lastActiveLabel: 'Mar 26',
  nexusNote: 'Operating in steady state — no maestro input required',
  actionLabel: 'Review',
  isIdle: true,
};

// ─── Exported fixture array ──────────────────────────────────────────────────

export const APEX_PROGRAMS_FIXTURE: ProgramRow[] = [
  apx01,
  apx02,
  apx03,
  apx04,
  apx05,
  apx06,
  apx07,
];
