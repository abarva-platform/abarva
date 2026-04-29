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
  tenantId: 'apex-retail',
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
  tenantId: 'apex-retail',
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
  tenantId: 'apex-retail',
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
  tenantId: 'apex-retail',
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

// ─────────────────────────────────────────────────────────────────────────────
// DEMO FIXTURES — bind the previously-unbound program lifecycle patterns
//
// Each instance below targets one ProgramPatternId that previously had zero
// fixture instances. Evidence citations are tuned so the keyword-matching
// contradiction and failure-mode detectors can fire on realistic Apex Retail
// state. These fixtures back the template-coverage audit at
// /admin/reasoning/coverage and provide demo paths through the COPILOT and
// CC-AI lifecycles, which were dark before.
// ─────────────────────────────────────────────────────────────────────────────

// ── DEMO · APX-COPILOT-2026 · M365 Copilot Productivity Rollout ──────────────
// Pattern PAT-PRG-COPILOT-001. Programme is mid-pilot at P4 Build with
// oversharing baseline still open, vendor time-saved claim contested, and
// adoption skewing to a heavy-user long tail.

export const APX_COPILOT_2026_INSTANCE: ProgramInstance = {
  id: 'APX-COPILOT-2026',
  displayId: 'DEMO-APX-COPILOT-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'M365 Copilot Productivity Rollout',

  patternId: 'PAT-PRG-COPILOT-001',
  patternVersion: '1.0.0',

  currentPhase: 4,
  phases: buildPhaseStates(4, {
    0: {
      gateStatus: 'approved',
      gateEvidence: ['Sponsor charter · cohort-by-cohort scope locked · Nov 2025'],
      enteredAt: '2025-11-04',
      exitedAt: '2025-12-02',
    },
    1: {
      gateStatus: 'approved',
      gateEvidence: [
        'Oversharing audit baseline · Jan 2026',
        'Time-spent baseline per cohort · Jan 2026',
      ],
      enteredAt: '2025-12-03',
      exitedAt: '2026-01-30',
    },
    2: {
      gateStatus: 'approved',
      gateEvidence: ['Sensitivity / DLP posture assessment · Feb 2026'],
      enteredAt: '2026-02-02',
      exitedAt: '2026-02-27',
    },
    3: {
      gateStatus: 'approved',
      gateEvidence: ['Pilot plan (180 users) and locked success criteria · Mar 2026'],
      enteredAt: '2026-03-02',
      exitedAt: '2026-03-27',
    },
    4: { gateStatus: 'open', enteredAt: '2026-03-30' },
  }),

  deliverables: [
    {
      id: 'cplt-d-001',
      label: 'Sponsor Charter',
      phaseId: 0,
      status: 'complete',
      completedAt: '2025-11-25',
    },
    {
      id: 'cplt-d-002',
      label: 'Oversharing Audit',
      phaseId: 1,
      status: 'complete',
      completedAt: '2026-01-12',
    },
    {
      id: 'cplt-d-003',
      label: 'Time-Spent Baseline',
      phaseId: 1,
      status: 'complete',
      completedAt: '2026-01-22',
    },
    {
      id: 'cplt-d-004',
      label: 'Sensitivity & DLP Posture Assessment',
      phaseId: 2,
      status: 'complete',
      completedAt: '2026-02-19',
    },
    {
      id: 'cplt-d-005',
      label: 'Use-Case Backlog (Scored)',
      phaseId: 2,
      status: 'complete',
      completedAt: '2026-02-25',
    },
    {
      id: 'cplt-d-006',
      label: 'Pilot Plan & Cohort Definition',
      phaseId: 3,
      status: 'complete',
      completedAt: '2026-03-22',
    },
    {
      id: 'cplt-d-007',
      label: 'Pilot Results Report',
      phaseId: 4,
      status: 'in-progress',
      owner: 'Change Lead',
      dueDate: '2026-05-12',
    },
    {
      id: 'cplt-d-008',
      label: 'Sensitivity Incident Review',
      phaseId: 4,
      status: 'in-progress',
      owner: 'Information Protection',
      dueDate: '2026-05-08',
    },
  ],

  evidence: [
    // CON-PRG-CPLT-001: permissions posture vs copilot surface (oversharing keywords)
    {
      id: 'cplt-ev-001',
      citation:
        'Oversharing audit · widespread anonymous link sharing, broken inheritance, broad permissions on confidential libraries detected across SharePoint and OneDrive · Jan 12 2026',
      phaseId: 1,
      uploadedAt: '2026-01-12',
      uploadedBy: 'Information Protection',
      kind: 'assessment',
    },
    // CON-PRG-CPLT-002: vendor time-saved claim vs cohort reality
    {
      id: 'cplt-ev-002',
      citation:
        'Vendor productivity claim 40% time saved per task not corroborated by pilot measurement; minutes per task uplift 9% in Sales cohort, 12% in Legal cohort · Apr 18 2026',
      phaseId: 4,
      uploadedAt: '2026-04-18',
      uploadedBy: 'Change Lead',
      kind: 'assessment',
    },
    // CON-PRG-CPLT-003: sensitivity labelling coverage vs output inheritance
    {
      id: 'cplt-ev-003',
      citation:
        'Sensitivity label inheritance gap — copilot-generated artefact observed without inherited DLP MIP label exposing confidential material in Teams · Apr 9 2026',
      phaseId: 4,
      uploadedAt: '2026-04-09',
      uploadedBy: 'Information Protection',
      kind: 'demo',
    },
    // CON-PRG-CPLT-004: adoption breadth vs heavy-user skew
    {
      id: 'cplt-ev-004',
      citation:
        'Adoption telemetry distribution shows weekly active use long tail — 78% of activity from 18% of users; per-cohort aggregate adoption healthy but distribution heavy-user skewed · Apr 21 2026',
      phaseId: 4,
      uploadedAt: '2026-04-21',
      uploadedBy: 'Adoption Analytics',
      kind: 'assessment',
    },
    // FM-PRG-CPLT-001: oversharing amplified by copilot
    {
      id: 'cplt-ev-005',
      citation:
        'Latent permission sprawl exposed by copilot semantic search producing governance incidents within weeks of activation; sponsor and CISO trust in programme eroding · Apr 14 2026',
      phaseId: 4,
      uploadedAt: '2026-04-14',
      uploadedBy: 'CISO Office',
      kind: 'document',
    },
    // FM-PRG-CPLT-004: licence push without use-case backlog
    {
      id: 'cplt-ev-006',
      citation:
        'Licences deployed but use-case backlog unscored in some cohorts; users encounter tool with no curated examples adoption stalls programme becomes licence spend story · Apr 20 2026',
      phaseId: 4,
      uploadedAt: '2026-04-20',
      uploadedBy: 'Change Lead',
      kind: 'document',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-005', name: 'Helena Ortiz', title: 'Chief People Officer' },

  flags: [
    {
      id: 'cplt-flag-001',
      kind: 'risk',
      description:
        'Oversharing baseline remediation lagging pilot — sensitivity / DLP incident review pending before activation.',
      raisedBy: 'Sentinel',
      raisedAt: '2026-04-14',
      status: 'open',
    },
  ],

  createdAt: '2025-11-04',
  lastModifiedAt: '2026-04-21',
  estimatedValueUsd: 1650000,
};

// ── DEMO · APX-CCAI-2026 · Contact Center AI Programme ───────────────────────
// Pattern PAT-PRG-CC-AI-001. Programme is at P5 Activate with containment
// climbing but CSAT eroding, vendor benchmark claim contested, hallucination
// incidents in pilot transcripts, and handoff context loss observed.

export const APX_CCAI_2026_INSTANCE: ProgramInstance = {
  id: 'APX-CCAI-2026',
  displayId: 'DEMO-APX-CCAI-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Apex Retail Contact Center AI',

  patternId: 'PAT-PRG-CC-AI-001',
  patternVersion: '1.0.0',

  currentPhase: 5,
  phases: buildPhaseStates(5, {
    0: {
      gateStatus: 'approved',
      gateEvidence: ['Sponsor charter — voice + chat scope · Aug 2025'],
      enteredAt: '2025-08-01',
      exitedAt: '2025-08-29',
    },
    1: {
      gateStatus: 'approved',
      gateEvidence: ['Intent-volume baseline · Sep 2025', 'Containment baseline measured'],
      enteredAt: '2025-09-01',
      exitedAt: '2025-10-30',
    },
    2: {
      gateStatus: 'approved',
      gateEvidence: ['Architecture decision — deflection-first · Nov 2025'],
      enteredAt: '2025-11-03',
      exitedAt: '2025-12-12',
    },
    3: {
      gateStatus: 'approved',
      gateEvidence: ['Handoff design rehearsal · Jan 2026', 'KB plan locked'],
      enteredAt: '2025-12-15',
      exitedAt: '2026-02-13',
    },
    4: {
      gateStatus: 'approved',
      gateEvidence: ['Pilot results · Mar 2026', 'Hallucination review adjudicated'],
      enteredAt: '2026-02-16',
      exitedAt: '2026-03-30',
    },
    5: { gateStatus: 'open', enteredAt: '2026-03-31' },
  }),

  deliverables: [
    {
      id: 'ccai-d-001',
      label: 'Architecture Decision Record',
      phaseId: 2,
      status: 'complete',
      completedAt: '2025-12-05',
    },
    {
      id: 'ccai-d-002',
      label: 'Handoff Design & Rehearsal',
      phaseId: 3,
      status: 'complete',
      completedAt: '2026-01-22',
    },
    {
      id: 'ccai-d-003',
      label: 'Pilot Results Report',
      phaseId: 4,
      status: 'complete',
      completedAt: '2026-03-25',
    },
    {
      id: 'ccai-d-004',
      label: 'Knowledge-Base Maintenance Plan',
      phaseId: 5,
      status: 'in-progress',
      owner: 'KB Owner',
      dueDate: '2026-05-20',
    },
    {
      id: 'ccai-d-005',
      label: 'Rollout Plan (cohort sequence)',
      phaseId: 5,
      status: 'in-progress',
      owner: 'Programme Lead',
      dueDate: '2026-05-15',
    },
    {
      id: 'ccai-d-006',
      label: 'Operate Dashboard (containment + CSAT)',
      phaseId: 5,
      status: 'not-started',
    },
  ],

  evidence: [
    // CON-PRG-CCAI-001: containment gain vs CSAT decline
    {
      id: 'ccai-ev-001',
      citation:
        'Pilot containment rose to 41% but CSAT dropped 4 points and NPS dropped 5 points for the affected intent set — deflection satisfaction trade-off · Mar 22 2026',
      phaseId: 4,
      uploadedAt: '2026-03-22',
      uploadedBy: 'CX Analytics',
      kind: 'assessment',
    },
    // CON-PRG-CCAI-002: vendor containment claim vs pilot reality
    {
      id: 'ccai-ev-002',
      citation:
        'Vendor benchmark containment claim 70% deflection on shipping intents but measured pilot containment 28% on same intent set — benchmark mismatch flagged · Mar 24 2026',
      phaseId: 4,
      uploadedAt: '2026-03-24',
      uploadedBy: 'Programme Analytics',
      kind: 'assessment',
    },
    // CON-PRG-CCAI-003: hallucination incidents vs confidence telemetry
    {
      id: 'ccai-ev-003',
      citation:
        'Pilot transcript review identified hallucination incidents — bot reported high confidence on responses subsequently identified as fabricated incorrect product policy advice · Mar 26 2026',
      phaseId: 4,
      uploadedAt: '2026-03-26',
      uploadedBy: 'Quality Lead',
      kind: 'demo',
    },
    // CON-PRG-CCAI-004: handoff design vs customer experience
    {
      id: 'ccai-ev-004',
      citation:
        'Handoff transcripts show context loss generic queue routing and conversation restart despite design specification preserving context — handoff transfer implementation gap · Apr 4 2026',
      phaseId: 5,
      uploadedAt: '2026-04-04',
      uploadedBy: 'Quality Lead',
      kind: 'demo',
    },
    // FM-PRG-CCAI-001: containment without quality
    {
      id: 'ccai-ev-005',
      citation:
        'Containment rate climbs while CSAT erodes — customers deflected from agents but contact again escalate externally; programme-level contact volume drops while customer-experience metrics decline · Apr 12 2026',
      phaseId: 5,
      uploadedAt: '2026-04-12',
      uploadedBy: 'CX Analytics',
      kind: 'document',
    },
    // FM-PRG-CCAI-003: knowledge-base decay (containment-by-cohort signal)
    {
      id: 'ccai-ev-006',
      citation:
        'Knowledge base maintenance plan owner not yet named — bot performs at pilot level for few months then degrades as products policies pricing change but underlying knowledge base not maintained; containment falls hallucinations rise · Apr 18 2026',
      phaseId: 5,
      uploadedAt: '2026-04-18',
      uploadedBy: 'Programme Lead',
      kind: 'document',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-006', name: 'Damian Ellis', title: 'VP Customer Service' },

  flags: [
    {
      id: 'ccai-flag-001',
      kind: 'risk',
      description:
        'Containment-CSAT trade-off + hallucination incidents — broad activation gated on KB ownership and dashboard configuration.',
      raisedBy: 'Sentinel',
      raisedAt: '2026-04-04',
      status: 'open',
    },
  ],

  createdAt: '2025-08-01',
  lastModifiedAt: '2026-04-18',
  estimatedValueUsd: 2750000,
};

// ── Aggregate export ──────────────────────────────────────────────────────────

/** All active Apex Retail program instances. Flagship (CDP) first. */
export const APEX_RETAIL_PROGRAM_INSTANCES: ProgramInstance[] = [
  APX_CDP_2026_INSTANCE,
  APX_LPM_2026_INSTANCE,
  APX_SAP_2026_INSTANCE,
  APX_DFV2_INSTANCE,
  APX_COPILOT_2026_INSTANCE,
  APX_CCAI_2026_INSTANCE,
];
