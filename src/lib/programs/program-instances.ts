// src/lib/programs/program-instances.ts
//
// Typed ProgramInstance records for the 4 active Apex Retail programs.
// These bind display-layer fixture data to program-type pattern IDs, enabling
// gate evaluation and synthesis context building in the reasoning layer.
//
// Data anchor: pages.yaml §demo-data-baseline — Apr 27 2026
// Display rendering is unchanged — this is additive only.

import type { ProgramInstance, ProgramPhaseState } from './program-instance';

// ── Phase builder ────────────────────────────────────────────────────────────

function buildPhaseStates(
  currentPhase: number,
  overrides?: Partial<Record<number, Partial<ProgramPhaseState>>>,
): ProgramPhaseState[] {
  const PHASE_LABELS = ['Originate', 'Discovery', 'Synthesis', 'Design', 'Build', 'Activate', 'Operate'];
  const states: ProgramPhaseState[] = [];

  for (let i = 0; i <= 6; i++) {
    let status: ProgramPhaseState['status'];
    if (i < currentPhase) status = 'done';
    else if (i === currentPhase) status = 'current';
    else if (i === currentPhase + 1) status = 'pending';
    else status = 'locked';

    const base: ProgramPhaseState = {
      phaseId: i,
      phaseLabel: PHASE_LABELS[i],
      status,
      gateStatus: status === 'done' ? 'approved' : status === 'current' ? 'open' : 'na',
      gateEvidence: [],
    };

    states.push({ ...base, ...(overrides?.[i] ?? {}) });
  }

  return states;
}

// ── APX-CDP-2026 · Apex Retail CDP Activation ────────────────────────────────
// P3 Design · Design gate (P2 → P3) cleared Apr 27 2026
// Build gate (P3 → P4) pending: 2 of 5 criteria met
// Linked source: AMS Vendor Consolidation 2026 · Stage 7 BAFO

export const APX_CDP_2026_INSTANCE: ProgramInstance = {
  id: 'APX-CDP-2026',
  displayId: 'APX-CDP-2026',
  tenantSlug: 'apex-retail',
  name: 'Apex Retail CDP Activation',

  patternId: 'PAT-PRG-CDP-001',
  patternVersion: '1.0.0',

  currentPhase: 3,
  phases: buildPhaseStates(3, {
    0: { gateStatus: 'approved', gateEvidence: ['Business case approval · Nov 2025'], enteredAt: '2025-11-01', exitedAt: '2025-11-30' },
    1: { gateStatus: 'approved', gateEvidence: ['Discovery report · Jan 2026', 'Stakeholder interviews complete'], enteredAt: '2025-12-01', exitedAt: '2026-01-31' },
    2: { gateStatus: 'approved', gateEvidence: ['Synthesis gate cleared · Apr 27 2026', 'Architecture options assessment'], enteredAt: '2026-02-01', exitedAt: '2026-04-27' },
    3: { gateStatus: 'pending', enteredAt: '2026-04-27' },
  }),

  deliverables: [
    { id: 'cdp-d-001', label: 'Business Case', phaseId: 0, status: 'complete', completedAt: '2025-11-15' },
    { id: 'cdp-d-002', label: 'Stakeholder Map', phaseId: 1, status: 'complete', completedAt: '2026-01-10' },
    { id: 'cdp-d-003', label: 'Discovery Report', phaseId: 1, status: 'complete', completedAt: '2026-01-28' },
    { id: 'cdp-d-004', label: 'Architecture Options Assessment', phaseId: 2, status: 'complete', completedAt: '2026-04-14' },
    { id: 'cdp-d-005', label: 'Synthesis Gate Package', phaseId: 2, status: 'complete', completedAt: '2026-04-27' },
    { id: 'cdp-d-006', label: 'Solution Architecture Document', phaseId: 3, status: 'in-progress', owner: 'Solutions Team', dueDate: '2026-05-15' },
    { id: 'cdp-d-007', label: 'Vendor C Contract Review', phaseId: 3, status: 'in-progress', owner: 'Procurement', dueDate: '2026-05-10' },
    { id: 'cdp-d-008', label: 'Data Layer Scope (AMS dependency)', phaseId: 3, status: 'blocked', owner: 'Architecture' },
    { id: 'cdp-d-009', label: 'Security Assessment', phaseId: 3, status: 'not-started' },
    { id: 'cdp-d-010', label: 'Build Gate Package', phaseId: 3, status: 'not-started' },
  ],

  evidence: [
    {
      id: 'cdp-ev-001',
      citation: 'Workshop 4 output · Apr 14 2026',
      phaseId: 2,
      uploadedAt: '2026-04-14',
      uploadedBy: 'Priya Sharma',
      kind: 'workshop',
    },
    {
      id: 'cdp-ev-002',
      citation: 'Architecture options assessment · Apr 20 2026',
      phaseId: 2,
      uploadedAt: '2026-04-20',
      uploadedBy: 'Solutions Team',
      kind: 'assessment',
    },
    {
      id: 'cdp-ev-003',
      citation: 'Synthesis gate approval · Apr 27 2026',
      phaseId: 2,
      uploadedAt: '2026-04-27',
      uploadedBy: 'Program Sponsor',
      kind: 'approval',
    },
  ],

  linkedSourceEvents: [
    {
      sourceEventId: 'SRC-AMS-2026',
      sourceEventName: 'AMS Vendor Consolidation 2026',
      linkType: 'depends-on',
      description: 'AMS BAFO award unblocks data layer scope for CDP P3 Design — Vendor C selection determines integration architecture',
      blockedAtPhase: 3,
    },
  ],

  linkedPrograms: [],

  sponsor: { id: 'sponsor-001', name: 'Sarah Chen', title: 'Chief Digital Officer' },

  flags: [
    {
      id: 'cdp-flag-001',
      kind: 'blocker',
      description: 'AMS BAFO award pending — data layer scope for P3 Design blocked until Vendor C contract finalised',
      raisedBy: 'Nexus',
      raisedAt: '2026-04-27',
      status: 'open',
    },
  ],

  createdAt: '2025-11-01',
  lastModifiedAt: '2026-04-27',
  estimatedValueUsd: 4200000,
};

// ── APX-LPM-2026 · Loyalty Platform Modernization ───────────────────────────
// P2 Synthesis · solution options under Sentinel analysis

export const APX_LPM_2026_INSTANCE: ProgramInstance = {
  id: 'APX-LPM-2026',
  displayId: 'APX-LPM-2026',
  tenantSlug: 'apex-retail',
  name: 'Loyalty Platform Modernization',

  patternId: 'PAT-PRG-LOYALTY-001',
  patternVersion: '1.0.0',

  currentPhase: 2,
  phases: buildPhaseStates(2, {
    0: { gateStatus: 'approved', gateEvidence: ['Business case approved · Dec 2025'], enteredAt: '2025-12-01', exitedAt: '2025-12-31' },
    1: { gateStatus: 'approved', gateEvidence: ['Discovery complete · Feb 2026', 'Platform audit report'], enteredAt: '2026-01-01', exitedAt: '2026-02-28' },
    2: { gateStatus: 'open', enteredAt: '2026-03-01' },
  }),

  deliverables: [
    { id: 'lpm-d-001', label: 'Business Case', phaseId: 0, status: 'complete', completedAt: '2025-12-20' },
    { id: 'lpm-d-002', label: 'Platform Audit Report', phaseId: 1, status: 'complete', completedAt: '2026-02-14' },
    { id: 'lpm-d-003', label: 'Discovery Report', phaseId: 1, status: 'complete', completedAt: '2026-02-28' },
    { id: 'lpm-d-004', label: 'Solution Options Analysis', phaseId: 2, status: 'in-progress', owner: 'Sentinel', dueDate: '2026-05-05' },
    { id: 'lpm-d-005', label: 'Vendor Shortlist', phaseId: 2, status: 'in-progress', owner: 'Procurement' },
    { id: 'lpm-d-006', label: 'Synthesis Gate Package', phaseId: 2, status: 'not-started' },
  ],

  evidence: [
    {
      id: 'lpm-ev-001',
      citation: 'Platform audit report · Feb 14 2026',
      phaseId: 1,
      uploadedAt: '2026-02-14',
      uploadedBy: 'IT Architecture',
      kind: 'document',
    },
    {
      id: 'lpm-ev-002',
      citation: 'Discovery workshop outputs · Feb 20 2026',
      phaseId: 1,
      uploadedAt: '2026-02-20',
      uploadedBy: 'Priya Sharma',
      kind: 'workshop',
    },
    {
      id: 'lpm-ev-003',
      citation: 'Sentinel solution options analysis — draft · Apr 27 2026',
      phaseId: 2,
      uploadedAt: '2026-04-27',
      uploadedBy: 'Sentinel',
      kind: 'assessment',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-002', name: 'Marcus Webb', title: 'VP Customer Experience' },

  flags: [],

  createdAt: '2025-12-01',
  lastModifiedAt: '2026-04-27',
  estimatedValueUsd: 1800000,
};

// ── APX-SAP-2026 · Store Associate Productivity AI ───────────────────────────
// P1 Discovery · evidence backlog growing · data access requests pending IT

export const APX_SAP_2026_INSTANCE: ProgramInstance = {
  id: 'APX-SAP-2026',
  displayId: 'APX-SAP-2026',
  tenantSlug: 'apex-retail',
  name: 'Store Associate Productivity AI',

  patternId: 'PAT-PRG-AI-CODING-001',
  patternVersion: '1.0.0',

  currentPhase: 1,
  phases: buildPhaseStates(1, {
    0: { gateStatus: 'approved', gateEvidence: ['Origination approval · Feb 2026'], enteredAt: '2026-02-01', exitedAt: '2026-02-28' },
    1: { gateStatus: 'open', enteredAt: '2026-03-01' },
  }),

  deliverables: [
    { id: 'sap-d-001', label: 'Origination Approval', phaseId: 0, status: 'complete', completedAt: '2026-02-20' },
    { id: 'sap-d-002', label: 'Discovery Interview Schedule', phaseId: 1, status: 'in-progress', owner: 'Program Lead', dueDate: '2026-05-10' },
    { id: 'sap-d-003', label: 'IT Data Access Request', phaseId: 1, status: 'blocked', owner: 'IT Operations' },
    { id: 'sap-d-004', label: 'Store Observations Report', phaseId: 1, status: 'not-started' },
    { id: 'sap-d-005', label: 'Discovery Report', phaseId: 1, status: 'not-started' },
  ],

  evidence: [
    {
      id: 'sap-ev-001',
      citation: 'Program initiation approval · Feb 20 2026',
      phaseId: 0,
      uploadedAt: '2026-02-20',
      uploadedBy: 'Program Sponsor',
      kind: 'approval',
    },
    {
      id: 'sap-ev-002',
      citation: 'Discovery kick-off notes · Mar 10 2026',
      phaseId: 1,
      uploadedAt: '2026-03-10',
      uploadedBy: 'Priya Sharma',
      kind: 'workshop',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-003', name: 'Nkechi Okafor', title: 'VP Store Operations' },

  flags: [
    {
      id: 'sap-flag-001',
      kind: 'risk',
      description: 'IT data access requests outstanding — discovery evidence backlog at risk',
      raisedBy: 'Nexus',
      raisedAt: '2026-04-20',
      status: 'open',
    },
  ],

  createdAt: '2026-02-01',
  lastModifiedAt: '2026-04-23',
  estimatedValueUsd: 950000,
};

// ── APX-DFV2-2025 · Demand Forecasting AI v2 ─────────────────────────────────
// P6 Operate · steady state · Atlas outcome tracking active

export const APX_DFV2_INSTANCE: ProgramInstance = {
  id: 'APX-DFV2-2025',
  displayId: 'APX-DFV2-2025',
  tenantSlug: 'apex-retail',
  name: 'Demand Forecasting AI v2',

  patternId: 'PAT-PRG-DATA-FAB-001',
  patternVersion: '1.0.0',

  currentPhase: 6,
  phases: buildPhaseStates(6, {
    0: { gateStatus: 'approved', gateEvidence: ['Business case approved · Q1 2025'], enteredAt: '2025-01-15', exitedAt: '2025-02-28' },
    1: { gateStatus: 'approved', gateEvidence: ['Discovery complete · Q2 2025'], enteredAt: '2025-03-01', exitedAt: '2025-04-30' },
    2: { gateStatus: 'approved', gateEvidence: ['Synthesis gate cleared · Q2 2025'], enteredAt: '2025-05-01', exitedAt: '2025-06-30' },
    3: { gateStatus: 'approved', gateEvidence: ['Design gate cleared · Q3 2025'], enteredAt: '2025-07-01', exitedAt: '2025-08-31' },
    4: { gateStatus: 'approved', gateEvidence: ['Build complete · Q4 2025'], enteredAt: '2025-09-01', exitedAt: '2025-11-30' },
    5: { gateStatus: 'approved', gateEvidence: ['Activate gate cleared · Dec 2025'], enteredAt: '2025-12-01', exitedAt: '2025-12-31' },
    6: { gateStatus: 'na', enteredAt: '2026-01-01' },
  }),

  deliverables: [
    { id: 'dfv2-d-001', label: 'Model Training Pipeline', phaseId: 4, status: 'complete', completedAt: '2025-10-15' },
    { id: 'dfv2-d-002', label: 'Production Deployment', phaseId: 5, status: 'complete', completedAt: '2025-12-20' },
    { id: 'dfv2-d-003', label: 'Atlas Monitoring Configuration', phaseId: 6, status: 'complete', completedAt: '2026-01-10' },
    { id: 'dfv2-d-004', label: 'Quarterly Outcome Report', phaseId: 6, status: 'in-progress', owner: 'Atlas', dueDate: '2026-06-30' },
  ],

  evidence: [
    {
      id: 'dfv2-ev-001',
      citation: 'Production go-live confirmation · Dec 20 2025',
      phaseId: 5,
      uploadedAt: '2025-12-20',
      uploadedBy: 'Engineering Lead',
      kind: 'approval',
    },
    {
      id: 'dfv2-ev-002',
      citation: 'Atlas Q1 2026 outcome report · Mar 28 2026',
      phaseId: 6,
      uploadedAt: '2026-03-28',
      uploadedBy: 'Atlas',
      kind: 'assessment',
    },
    {
      id: 'dfv2-ev-003',
      citation: 'Forecast accuracy benchmark — 94.2% · Mar 28 2026',
      phaseId: 6,
      uploadedAt: '2026-03-28',
      uploadedBy: 'Atlas',
      kind: 'other',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-004', name: 'James Okonkwo', title: 'VP Supply Chain' },

  flags: [],

  createdAt: '2025-01-15',
  lastModifiedAt: '2026-03-28',
  estimatedValueUsd: 2100000,
};

// ── Aggregate export ──────────────────────────────────────────────────────────

/** All active Apex Retail program instances. Flagship (CDP) first. */
export const APEX_RETAIL_PROGRAM_INSTANCES: ProgramInstance[] = [
  APX_CDP_2026_INSTANCE,
  APX_LPM_2026_INSTANCE,
  APX_SAP_2026_INSTANCE,
  APX_DFV2_INSTANCE,
];
