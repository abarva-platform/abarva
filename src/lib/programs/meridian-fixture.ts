// CORR — Canonical Meridian fixture data for thin-tenant phase-filter smoke coverage.
// Deterministic: no Date.now(), no random, no model calls.
//
// Demo anchor:
//   Tenant:   Meridian Analytics
//   Programs: 2 active programs across 2 phases (Synthesis · Discovery)
//   Flagship: MRD-CEI-2026 · Customer Experience Intelligence · P2 Synthesis

import type { ProgramRow } from './programs-types';
import { buildPhaseSlots } from './programs-fixture';

// MRD-CEI-2026 · Customer Experience Intelligence
// P2 Synthesis · active · solution options under Sentinel analysis
const mrdCei2026: ProgramRow = {
  id: 'mrd-cei-2026',
  displayId: 'MRD-CEI-2026',
  name: 'Customer Experience Intelligence',
  currentPhase: 2,
  phases: buildPhaseSlots(2, { 2: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '3h ago',
  nexusNote: 'Synthesis phase — three solution options under Sentinel analysis',
  actionLabel: 'Continue',
  isIdle: false,
};

// MRD-DAM-2026 · Data Architecture Modernization
// P1 Discovery · active · stakeholder interviews in progress
const mrdDam2026: ProgramRow = {
  id: 'mrd-dam-2026',
  displayId: 'MRD-DAM-2026',
  name: 'Data Architecture Modernization',
  currentPhase: 1,
  phases: buildPhaseSlots(1, { 1: 'open' }),
  gateStatus: 'open',
  lastActiveLabel: '1d ago',
  nexusNote: 'Discovery phase — stakeholder interviews in progress',
  actionLabel: 'Continue',
  isIdle: false,
};

// ─── Exported fixture array ──────────────────────────────────────────────────
// Flagship first so MERIDIAN_PROGRAMS_FIXTURE[0] always resolves to MRD-CEI-2026.

export const MERIDIAN_PROGRAMS_FIXTURE: ProgramRow[] = [
  mrdCei2026,  // P2 Synthesis · active
  mrdDam2026,  // P1 Discovery · active
];
