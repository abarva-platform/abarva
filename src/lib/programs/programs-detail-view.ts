// programs-detail-view.ts — PROG-D
//
// Builds the ProgramDetailView for a single program from the Apex fixture.
// Deterministic: no Date.now(), no random, no model calls.
//
// Phase model: the fixture uses 0–6 (Originate through Operate).
// The ProgramJourneyRail displays phases 1–6 (Discovery through Operate).
// Phase 0 (Originate) is treated as a completed pre-condition and not shown
// in the navigator.

import {
  APEX_PROGRAMS_FIXTURE,
  PHASE_LABEL_MAP,
  buildPhaseSlots,
} from './programs-fixture';
import type {
  ProgramAgentRailItem,
  ProgramDetailView,
  ProgramPhaseId,
  ProgramPhasePanel,
  ProgramPhaseSlot,
  ProgramWorkbenchContent,
} from './programs-types';

// ─── Agent definitions ───────────────────────────────────────────────────────
// Four canonical agents; job text is scoped to the phase state.

function buildAgentRail(
  currentPhase: ProgramPhaseId,
  viewingPhase: ProgramPhaseId,
): ProgramAgentRailItem[] {
  const isActive = (targetPhase: ProgramPhaseId) => viewingPhase === targetPhase;
  const isCurrentOrPast = (targetPhase: ProgramPhaseId) =>
    targetPhase <= currentPhase;

  // Nexus — always present as orchestrator
  const nexus: ProgramAgentRailItem = {
    initials: 'Nx',
    name: 'Nexus',
    job: viewingPhase === currentPhase
      ? `Orchestrating P${viewingPhase} · ${PHASE_LABEL_MAP[viewingPhase as ProgramPhaseId]}`
      : viewingPhase < currentPhase
      ? `Completed P${viewingPhase} orchestration`
      : `Waiting for P${currentPhase} completion`,
    state: viewingPhase === currentPhase ? 'active' : 'advisory',
  };

  // Sentinel — evidence and risk monitoring
  const sentinel: ProgramAgentRailItem = {
    initials: 'Sn',
    name: 'Sentinel',
    job: isActive(currentPhase)
      ? 'Monitoring evidence + risk signals'
      : isCurrentOrPast(viewingPhase)
      ? 'Evidence archived for this phase'
      : 'Awaiting phase activation',
    state: viewingPhase === currentPhase ? 'active' : viewingPhase < currentPhase ? 'on_call' : 'idle',
  };

  // Atlas — impact and value tracking
  const atlas: ProgramAgentRailItem = {
    initials: 'At',
    name: 'Atlas',
    job: viewingPhase >= 4
      ? 'Tracking value realization metrics'
      : isCurrentOrPast(viewingPhase)
      ? 'Tracking baseline inputs'
      : 'Impact model not yet active',
    state: viewingPhase >= 4 ? 'active' : viewingPhase < currentPhase ? 'on_call' : 'idle',
  };

  // Steward — gate readiness and compliance
  const steward: ProgramAgentRailItem = {
    initials: 'St',
    name: 'Steward',
    job: viewingPhase === currentPhase
      ? `Assessing gate readiness for P${viewingPhase + 1} entry`
      : viewingPhase < currentPhase
      ? 'Gate passed — archived'
      : 'Gate criteria not yet active',
    state: viewingPhase === currentPhase ? 'on_call' : viewingPhase < currentPhase ? 'advisory' : 'idle',
  };

  return [nexus, sentinel, atlas, steward];
}

// ─── APX-SAP-2026 specific workbench (P1 Discovery · Active) ─────────────────

const APX_SAP_2026_P1_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P1 Discovery · Active',
  prose:
    'Discovery phase is tracking well — 6 interviews scheduled across store operations and HR. Data access requests for the Point-of-Sale and scheduling systems are pending IT approval. The value hypothesis is strong but needs validation from field supervisors before Synthesis entry.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Complete store ops interviews',
      detail: 'Weeks of Mar 18–29 · 4 interviews confirmed',
    },
    {
      letter: 'B',
      text: 'Resolve IT data access requests',
      detail: 'POS + scheduling systems · IT ticket ITS-2291',
    },
    {
      letter: 'C',
      text: 'Draft value hypothesis',
      detail: 'Needs field supervisor input before Synthesis gate',
    },
  ],
};

// ─── APX-CC-2026 specific workbench (P4 Build · Active — 68% Complete) ───────

const APX_CC_2026_P4_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P4 Build · Active — 68% Complete',
  prose:
    'Build is on track. The NLP intent classifier is deployed to staging with 94% accuracy. CRM integration is passing all smoke tests. The remaining 32% covers IVR routing rules and the operator dashboard. Activate gate target is May 15.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Complete IVR routing rules',
      detail: 'Remaining build artifact — 2 sprints remaining',
    },
    {
      letter: 'B',
      text: 'Ship operator dashboard MVP',
      detail: 'Required for Activate gate — UX review Apr 30',
    },
    {
      letter: 'C',
      text: 'Schedule Activate gate review',
      detail: 'Sponsor + IT sign-off · target May 15',
    },
  ],
};

// ─── APX-CC-2026 specific workbench (P5 Activate — locked/pending from P4 Build) ──

const APX_CC_2026_P5_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P5 Activate · Activation Pending',
  prose: 'P5 Activate is locked until Build gate clears. IVR migration and dashboard delivery are the remaining Build blockers. Once cleared, the Activate phase opens a 4-week launch runway with phased contact center rollout and early churn monitoring.',
  actionsLabel: 'Unlock path',
  actions: [
    { letter: 'A', text: 'Complete IVR migration', detail: 'Last Build blocker — 3 sprints remaining' },
    { letter: 'B', text: 'Deliver supervisor dashboard', detail: 'Final build deliverable — UX review pending' },
    { letter: 'C', text: 'Preview Activate launch plan', detail: 'Phased rollout: 200 agents in Week 1' },
  ],
};

// ─── APX-DFV2-2025 specific workbench (P6 Operate — steady state, live) ──────

const APX_DFV2_P6_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P6 Operate · Steady State',
  prose: 'Demand Forecasting v2 has been live since November 2025. Forecast accuracy is at 87% — 5pp above the 82% target. Inventory waste reduction is running $1.4M/yr against a $1.2M projection. Atlas is monitoring weekly model drift and seasonal retraining cycles.',
  actionsLabel: 'Atlas monitors',
  actions: [
    { letter: 'A', text: 'Review outcome actuals', detail: '$1.4M/yr savings vs $1.2M projection — 17% ahead' },
    { letter: 'B', text: 'Check model drift report', detail: 'Q2 retraining cycle due in 3 weeks' },
    { letter: 'C', text: 'View full outcome report', detail: 'Tower value lens · APX-DFV2 deep-dive' },
  ],
};

// ─── APX-LPM-2026 specific workbench (P2 Synthesis · Active) ─────────────────

const APX_LPM_2026_P2_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P2 Synthesis · Solution Options Under Review',
  prose:
    'Synthesis is progressing well. Sentinel has reviewed three loyalty platform modernization options: (1) Greenfield rebuild on the existing Snowflake data lake, (2) Vendor-managed SaaS loyalty engine with API integration, (3) Composable approach leveraging the in-flight CDP (APX-CDP-2026) as the identity backbone. Options 2 and 3 have conflicting cost models that Nexus is reconciling against the program budget. Design gate target is mid-May 2026.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Reconcile cost model conflict',
      detail: 'Option 2 vs 3 · SaaS vs CDP-composable cost delta',
    },
    {
      letter: 'B',
      text: 'Request CDP dependency review',
      detail: 'APX-CDP-2026 identity graph readiness for LPM',
    },
    {
      letter: 'C',
      text: 'Schedule Design gate review',
      detail: 'Target: week of May 12 · sponsor + IT architect',
    },
  ],
};

// ─── Generic P5 Activate workbench — intentional locked/preview copy ─────────
// Shown when viewing P5 for any program that doesn't have a flagship override.
// Covers both: a program at P4 peeking ahead, and a program at P1–P3 seeing P5.

const GENERIC_P5_ACTIVATE_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P5 Activate · Preview',
  prose:
    'Activate is the controlled rollout phase. When Build gate clears, the program enters a structured launch runway — typically 3–6 weeks covering phased rollout, change management, and early signal capture. Atlas begins tracking value realization metrics here. No action is required until P4 Build gate approval.',
  actionsLabel: 'Preview path',
  actions: [
    {
      letter: 'A',
      text: 'Clear Build gate first',
      detail: 'Activate unlocks automatically when all P4 gate criteria are met',
    },
    {
      letter: 'B',
      text: 'Preview Activate criteria',
      detail: 'Phased rollout plan, change management sign-off, early signal baseline',
    },
    {
      letter: 'C',
      text: 'Prepare launch readiness',
      detail: 'Stakeholder comms, training plan, and rollback criteria',
    },
  ],
};

// ─── Generic P6 Operate workbench — intentional locked/preview copy ───────────
// Shown when viewing P6 for any program that doesn't have a flagship override.

const GENERIC_P6_OPERATE_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P6 Operate · Preview',
  prose:
    'Operate is the steady-state phase. When a program reaches Operate, Atlas tracks ongoing value realization, model performance (if applicable), and quarterly review cycles. Sentinel monitors for drift and risk signals. This phase has no defined end-gate — it continues until program retirement or material scope change.',
  actionsLabel: 'Preview path',
  actions: [
    {
      letter: 'A',
      text: 'Complete Activate phase first',
      detail: 'Operate unlocks when Activate gate is approved and live signal is stable',
    },
    {
      letter: 'B',
      text: 'Preview value metrics plan',
      detail: 'Atlas will track forecast accuracy, cost savings, or adoption KPIs',
    },
    {
      letter: 'C',
      text: 'See operating model template',
      detail: 'Quarterly review cadence, drift thresholds, and escalation criteria',
    },
  ],
};

// ─── APX-CDP-2026 P3 Design · post-gate-approval view ────────────────────────

const APX_CDP_2026_P3_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P3 Design · Architecture Sprint Active',
  prose:
    'Design gate approved. The CDP architecture sprint is underway — Nexus is orchestrating the data layer design, identity graph schema, and vendor integration contracts. The AMS Vendor Consolidation decision (Stage 7 BAFO) has locked Vendor C as the managed CDP layer, reducing in-house build scope. Sentinel is validating Unified Loyalty Intelligence (T3-H03) as the pattern reference for the personalization layer.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Review architecture blueprint',
      detail: 'CDP data layer + identity graph schema — draft ready for sponsor review',
    },
    {
      letter: 'B',
      text: 'Lock vendor integration contract',
      detail: 'Vendor C scope confirmed — finalize API contract and SLA',
    },
    {
      letter: 'C',
      text: 'Brief on T3-H03 Loyalty pattern',
      detail: 'Sentinel validated Unified Loyalty Intelligence — apply to personalization layer',
      href: '/intelligence/t3-h03',
    },
  ],
};

// ─── APX-CDP-2026 specific workbench (demo flagship) ─────────────────────────
// P2 Synthesis · Design gate pending · Workshop 5 incomplete · 36% evidence
// Linked source: AMS Vendor Consolidation 2026 · Stage 7 BAFO

const APX_CDP_2026_P2_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P2 Synthesis · Design Gate Pending',
  prose:
    'Workshop 5 is incomplete — value hypothesis evidence is missing and privacy boundary confirmation has not been logged. Evidence coverage sits at 36%. The Design gate (P2 → P3) is held by Steward pending these three items. Linked source event AMS Vendor Consolidation 2026 is at Stage 7 BAFO — vendor data architecture decisions here will affect CDP scope.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Complete Workshop 5',
      detail: 'Log value hypothesis evidence · confirm privacy boundary',
    },
    {
      letter: 'B',
      text: 'Review AMS Vendor BAFO',
      detail: 'Stage 7 decisions constrain CDP data layer — align now',
    },
    {
      letter: 'C',
      text: 'Request Design gate review',
      detail: 'Notify Steward once Workshop 5 items are resolved',
    },
  ],
};

// ─── Workbench content by phase state ────────────────────────────────────────

function buildWorkbenchContent(
  programName: string,
  currentPhase: ProgramPhaseId,
  viewingPhase: ProgramPhaseId,
  viewingPhaseLabel: string,
  viewingPhaseState: ProgramPhaseSlot['state'],
  programId?: string,
): ProgramWorkbenchContent {
  // Demo program overrides — specific phase workbench content
  if (programId === 'apx-sap-2026' && viewingPhase === 1 && viewingPhaseState === 'current') {
    return APX_SAP_2026_P1_WORKBENCH;
  }
  if (programId === 'apx-cc-2026' && viewingPhase === 4 && viewingPhaseState === 'current') {
    return APX_CC_2026_P4_WORKBENCH;
  }
  if (programId === 'apx-cc-2026' && viewingPhase === 5) {
    return APX_CC_2026_P5_WORKBENCH;
  }
  if (programId === 'apx-dfv2-2025' && viewingPhase === 6 && viewingPhaseState === 'current') {
    return APX_DFV2_P6_WORKBENCH;
  }
  // APX-LPM-2026 P2 Synthesis — solution options under review
  if (programId === 'apx-lpm-2026' && viewingPhase === 2 && viewingPhaseState === 'current') {
    return APX_LPM_2026_P2_WORKBENCH;
  }
  // Generic P5 Activate preview — for any program without a flagship P5 override.
  // APX-CC-2026 has its own P5 workbench and is already handled above.
  if (viewingPhase === 5 && viewingPhaseState !== 'current') {
    return GENERIC_P5_ACTIVATE_WORKBENCH;
  }
  // Generic P6 Operate preview — for any program without a flagship P6 override.
  // APX-DFV2-2025 has its own P6 workbench and is already handled above.
  if (viewingPhase === 6 && viewingPhaseState !== 'current') {
    return GENERIC_P6_OPERATE_WORKBENCH;
  }
  // Demo flagship override — P2 Synthesis active view
  if (programId === 'apx-cdp-2026' && viewingPhase === 2 && viewingPhaseState === 'current') {
    return APX_CDP_2026_P2_WORKBENCH;
  }
  // Demo flagship override — P3 Design active view (post gate-approval)
  if (programId === 'apx-cdp-2026' && viewingPhase === 3 && viewingPhaseState === 'current') {
    return APX_CDP_2026_P3_WORKBENCH;
  }
  switch (viewingPhaseState) {
    case 'done':
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Complete`,
        prose: `This phase was successfully completed. All required deliverables were produced and the phase gate was cleared. You're reviewing archived outputs from P${viewingPhase} — ${viewingPhaseLabel}.`,
        actionsLabel: 'Review actions',
        actions: [
          { letter: 'A', text: 'View deliverables', detail: 'Browse artifacts produced in this phase' },
          { letter: 'B', text: 'Review gate record', detail: 'Approval chain and gate criteria met' },
          { letter: 'C', text: 'Open evidence log', detail: 'Supporting evidence captured here' },
        ],
      };
    case 'current':
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Active`,
        prose: `You're in P${viewingPhase} — ${viewingPhaseLabel}. Nexus is orchestrating active workstreams. Review next actions below and clear open blockers to advance toward the gate.`,
        actionsLabel: 'Next actions',
        actions: [
          { letter: 'A', text: 'Open workshop', detail: 'Resume active modules for this phase' },
          { letter: 'B', text: 'Review gate criteria', detail: 'Check what\'s needed to advance' },
          { letter: 'C', text: 'Brief sponsor', detail: 'Share current status and blockers' },
        ],
      };
    case 'pending': {
      const prevPhase = (viewingPhase - 1) as ProgramPhaseId;
      const prevLabel = PHASE_LABEL_MAP[prevPhase] ?? '';
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Pending gate`,
        prose: `P${viewingPhase} entry requires clearing the P${prevPhase} ${prevLabel} gate. Review the gate criteria and resolve any outstanding items to unlock this phase.`,
        actionsLabel: 'Gate actions',
        actions: [
          { letter: 'A', text: 'Review gate criteria', detail: `Check P${prevPhase} gate requirements` },
          { letter: 'B', text: 'Resolve blockers', detail: 'Address open items blocking gate approval' },
          { letter: 'C', text: 'Request gate review', detail: 'Notify sponsor to approve phase advance' },
        ],
      };
    }
    case 'locked':
      return {
        title: `P${viewingPhase} ${viewingPhaseLabel} · Locked`,
        prose: `Complete P${currentPhase} — ${PHASE_LABEL_MAP[currentPhase]} to unlock this phase. Phases must be completed sequentially.`,
        actionsLabel: 'Unlock path',
        actions: [
          { letter: 'A', text: `Return to P${currentPhase}`, detail: `Resume active phase: ${PHASE_LABEL_MAP[currentPhase]}` },
          { letter: 'B', text: 'View prerequisites', detail: 'See what must be completed first' },
          { letter: 'C', text: 'Preview phase brief', detail: 'Read what this phase will cover' },
        ],
      };
  }
}

// ─── Phase panel by phase state ───────────────────────────────────────────────

function buildPhasePanel(
  viewingPhase: ProgramPhaseId,
  viewingPhaseLabel: string,
  viewingPhaseState: ProgramPhaseSlot['state'],
  currentPhase: ProgramPhaseId,
  programId?: string,
): ProgramPhasePanel {
  // APX-SAP-2026 P1 gate criteria
  if (programId === 'apx-sap-2026' && viewingPhase === 1 && viewingPhaseState === 'current') {
    return {
      summary:
        'P1 Discovery is validating the SAP finance modernization seed against current-state evidence. Nexus has stakeholder alignment logged, but interviews, data-access confirmation, value hypothesis detail, and sponsor review still need to close before Synthesis can make a credible options call.',
      gateCriteria: [
        { criterion: 'Discovery interviews completed (4 of 6)', met: false },
        { criterion: 'Value hypothesis drafted', met: false },
        { criterion: 'Data access confirmed for all source systems', met: false },
        { criterion: 'Stakeholder alignment documented', met: true },
        { criterion: 'Discovery brief reviewed by sponsor', met: false },
      ],
    };
  }
  // APX-CC-2026 P4 gate criteria
  if (programId === 'apx-cc-2026' && viewingPhase === 4 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'NLP intent classifier deployed to staging', met: true },
        { criterion: 'CRM integration smoke tests passing', met: true },
        { criterion: 'IVR routing rules complete', met: false },
        { criterion: 'Operator dashboard MVP complete', met: false },
        { criterion: 'Load test passing at 2× peak traffic', met: false },
        { criterion: 'Sponsor sign-off on Activate criteria', met: false },
      ],
    };
  }
  // APX-CC-2026 P5 gate — locked/pending view from P4 Build perspective
  if (programId === 'apx-cc-2026' && viewingPhase === 5) {
    return {
      gateCriteria: [
        { criterion: 'IVR migration complete', met: false },
        { criterion: 'Supervisor dashboard delivered', met: false },
        { criterion: 'Load test passed (500 concurrent)', met: false },
        { criterion: 'Sponsor sign-off on Build gate', met: false },
      ],
      blockerNote: 'P5 Activate entry requires clearing the Build gate (P4). Two blockers remain: IVR migration and dashboard delivery.',
    };
  }
  // APX-DFV2-2025 P6 gate — steady state operating view
  if (programId === 'apx-dfv2-2025' && viewingPhase === 6) {
    return {
      deliverables: [
        { label: 'Weekly demand forecast run', status: 'done' as const },
        { label: 'Q1 outcome report published', status: 'done' as const },
        { label: 'Q2 seasonal retraining', status: 'pending' as const },
        { label: 'Model drift monitoring (Atlas)', status: 'done' as const },
      ],
    };
  }
  // APX-LPM-2026 P2 Synthesis gate — three-option decision criteria
  if (programId === 'apx-lpm-2026' && viewingPhase === 2 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'Three solution options fully documented', met: true },
        { criterion: 'Cost model conflict resolved (Option 2 vs 3)', met: false },
        { criterion: 'CDP dependency assessment complete (APX-CDP-2026)', met: false },
        { criterion: 'Business case draft reviewed by sponsor', met: false },
        { criterion: 'Design gate review scheduled', met: false },
      ],
      evidenceItems: [
        {
          id: 'lpm-ev-1',
          citation: 'Sentinel pattern review · Apr 24 2026',
          source: 'Sentinel / T2-L04',
          excerpt: 'Composable loyalty architecture (Option 3) is a validated pattern — three retail case studies available. Dependency on CDP identity graph maturity is the primary risk.',
          confidence: 'high' as const,
          provenanceNote: 'Deterministic intelligence citation · /intelligence/t2-l04',
        },
        {
          id: 'lpm-ev-2',
          citation: 'Cost model analysis · Apr 26 2026',
          source: 'Nexus / Budget Review',
          excerpt: 'Option 2 (SaaS) projects $820K/yr licensing cost. Option 3 (CDP-composable) projects $340K/yr marginal cost but carries CDP readiness risk. Delta is $480K/yr — conflict unresolved.',
          confidence: 'medium' as const,
          hasContradiction: true,
          provenanceNote: 'Deterministic cost model · pre-synthesis baseline',
        },
      ],
    };
  }
  // Generic P5 Activate phase panel — intentional locked/pending copy
  // APX-CC-2026 P5 is handled above; this covers all other programs.
  if (viewingPhase === 5 && viewingPhaseState !== 'current') {
    return {
      blockerNote:
        'P5 Activate entry requires P4 Build gate approval. The gate criteria are managed in the active Build phase.',
      gateCriteria: [
        { criterion: 'P4 Build gate formally approved', met: false },
        { criterion: 'Activate launch plan reviewed by sponsor', met: false },
        { criterion: 'Change management plan filed', met: false },
        { criterion: 'Rollback criteria documented', met: false },
      ],
    };
  }
  // Generic P6 Operate phase panel — intentional locked/pending copy
  // APX-DFV2-2025 P6 is handled above; this covers all other programs.
  if (viewingPhase === 6 && viewingPhaseState !== 'current') {
    return {
      blockerNote:
        'P6 Operate entry requires P5 Activate gate approval. Programs enter Operate once live signal is stable and value baseline is confirmed.',
      gateCriteria: [
        { criterion: 'P5 Activate gate formally approved', met: false },
        { criterion: 'Live signal stable for 2+ weeks', met: false },
        { criterion: 'Value baseline confirmed by Atlas', met: false },
        { criterion: 'Operating runbook filed', met: false },
      ],
    };
  }
  // APX-CDP-2026 P2 gate — real blockers surfaced from demo anchor
  if (programId === 'apx-cdp-2026' && viewingPhase === 2 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'Workshop 5 completed', met: false },
        { criterion: 'Value hypothesis evidence logged', met: false },
        { criterion: 'Privacy boundary confirmed', met: false },
        { criterion: 'AMS vendor architecture alignment noted', met: true },
        { criterion: 'Sponsor sign-off on Synthesis findings', met: false },
      ],
      evidenceItems: [
        {
          id: 'ev-1',
          citation: 'Workshop 4 output · Apr 14 2026',
          source: 'Priya Sharma / Workshop',
          excerpt: 'CDP identity stitching is technically feasible with the existing Snowflake schema — 3-week implementation estimate confirmed by engineering lead.',
          confidence: 'high' as const,
          provenanceNote: 'Deterministic workshop record · discovery archive',
        },
        {
          id: 'ev-2',
          citation: 'Vendor RFP response · Apr 18 2026',
          source: 'Vendor B / AMS BAFO',
          excerpt: 'Vendor B proposes a managed CDP layer that overlaps with the planned in-house implementation. Scope conflict unresolved.',
          confidence: 'medium' as const,
          hasContradiction: true,
          provenanceNote: 'Deterministic source import · BAFO response',
        },
        {
          id: 'ev-3',
          citation: 'Stakeholder interview · Apr 20 2026',
          source: 'Marcus Webb / Discovery',
          excerpt: 'Privacy team confirmed that loyalty data can be included in the identity graph subject to a documented boundary policy — this policy is not yet written.',
          confidence: 'medium' as const,
          provenanceNote: 'Deterministic interview note · sponsor packet',
        },
        {
          id: 'ev-4',
          citation: 'AI usage audit · Apr 22 2026',
          source: 'Atlas / Automated',
          excerpt: 'Evidence coverage for this phase is at 36% against a 70% target for gate readiness. 3 key items are outstanding.',
          confidence: 'high' as const,
          provenanceNote: 'Deterministic audit snapshot · pre-gate baseline',
        },
      ],
    };
  }
  // APX-CDP-2026 P3 gate — Design phase active deliverables + Build gate criteria
  if (programId === 'apx-cdp-2026' && viewingPhase === 3 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'Architecture blueprint reviewed by sponsor', met: true },
        { criterion: 'Data model approved by engineering lead', met: true },
        { criterion: 'Vendor integration contract signed (Vendor C)', met: false },
        { criterion: 'Privacy architecture signed off by Steward', met: false },
        { criterion: 'Build brief scoped and sponsor-approved', met: false },
      ],
      evidenceItems: [
        {
          id: 'ev-p3-1',
          citation: 'Gate approval record · Apr 27 2026',
          source: 'Steward / Gate Review',
          excerpt: 'Design gate (P2 → P3) approved. Workshop 5 findings accepted; privacy boundary policy filed. AMS BAFO outcome locked Vendor C.',
          confidence: 'high' as const,
          provenanceNote: 'Deterministic gate record · approval ledger',
        },
        {
          id: 'ev-p3-2',
          citation: 'AMS Vendor Consolidation · BAFO Award · Apr 27 2026',
          source: 'Source Event / APX-AMS-2026',
          excerpt: 'Vendor C selected as managed CDP layer provider. Reduces in-house build scope by ~40%. Integration contract in final review.',
          confidence: 'high' as const,
          provenanceNote: 'Deterministic source link · apex-retail-ams-outsourcing-2026',
        },
        {
          id: 'ev-p3-3',
          citation: 'Intelligence pattern validation · Apr 27 2026',
          source: 'Sentinel / T3-H03',
          excerpt: 'Unified Loyalty Intelligence pattern validated for personalization layer. Sentinel recommends applying T3-H03 reference architecture to identity graph design.',
          confidence: 'high' as const,
          provenanceNote: 'Deterministic intelligence citation · /intelligence/t3-h03',
        },
      ],
    };
  }
  switch (viewingPhaseState) {
    case 'done':
      return {
        summary: `P${viewingPhase} ${viewingPhaseLabel} completed successfully. All deliverables were produced and reviewed.`,
        deliverables: [
          { label: `${viewingPhaseLabel} brief document`, status: 'done' },
          { label: 'Stakeholder sign-off record', status: 'done' },
          { label: 'Phase gate approval', status: 'done' },
          { label: 'Evidence artifacts submitted', status: 'done' },
        ],
      };
    case 'current':
      return {
        gateCriteria: [
          { criterion: 'All required deliverables submitted', met: false },
          { criterion: 'Sponsor sign-off obtained', met: false },
          { criterion: 'Evidence artifacts linked', met: true },
          { criterion: 'No critical risks unresolved', met: true },
          { criterion: 'Workshop modules completed', met: false },
        ],
      };
    case 'pending': {
      const prevPhase = (viewingPhase - 1) as ProgramPhaseId;
      const prevLabel = PHASE_LABEL_MAP[prevPhase] ?? '';
      return {
        blockerNote: `Awaiting P${prevPhase} ${prevLabel} gate approval before P${viewingPhase} can begin.`,
        gateCriteria: [
          { criterion: `P${prevPhase} gate formally approved`, met: false },
          { criterion: 'Phase lead assigned', met: false },
          { criterion: 'Kickoff meeting scheduled', met: false },
        ],
      };
    }
    case 'locked':
      return {
        blockerNote: `Complete P${currentPhase} — ${PHASE_LABEL_MAP[currentPhase]} to unlock P${viewingPhase}.`,
      };
  }
}

// ─── Main builder ─────────────────────────────────────────────────────────────

export function buildProgramDetailView(
  programId: string,
  requestedPhase?: number,
  overrideCurrentPhase?: number,
): ProgramDetailView {
  // Look up program by id; fall back to APX-01 for demo safety
  const program =
    APEX_PROGRAMS_FIXTURE.find((p) => p.id === programId) ??
    APEX_PROGRAMS_FIXTURE[0];

  // If the caller provides an overrideCurrentPhase (e.g. from DB), use it.
  // This ensures the phase rail and workbench content reflect the real current phase,
  // not the fixture's hardcoded phase. Applies to both fixture programs (post-gate-advance)
  // and non-fixture programs (newly created).
  const effectiveCurrentPhase =
    overrideCurrentPhase !== undefined
      ? Math.max(1, Math.min(6, overrideCurrentPhase))
      : program.currentPhase;

  // Rebuild phase slots using the effective current phase, or fall back to the
  // program fixture's slots if no override was given.
  const railPhases =
    overrideCurrentPhase !== undefined
      ? buildPhaseSlots(effectiveCurrentPhase as ProgramPhaseId).filter(
          (slot: ProgramPhaseSlot) => (slot.id as number) >= 1 && (slot.id as number) <= 6,
        )
      : program.phases.filter(
          (slot): slot is ProgramPhaseSlot & { id: 1 | 2 | 3 | 4 | 5 | 6 } =>
            slot.id >= 1 && slot.id <= 6,
        );

  // Resolve viewing phase: default to currentPhase, clamped to 1-6
  const clampedCurrent = Math.max(1, Math.min(6, effectiveCurrentPhase)) as ProgramPhaseId;
  let viewingPhase: ProgramPhaseId;
  if (requestedPhase !== undefined && requestedPhase >= 1 && requestedPhase <= 6) {
    viewingPhase = requestedPhase as ProgramPhaseId;
  } else {
    viewingPhase = clampedCurrent;
  }

  const viewingSlot = railPhases.find((s) => s.id === viewingPhase) ?? railPhases[0];
  const viewingPhaseState = viewingSlot?.state ?? 'locked';
  const viewingPhaseLabel = PHASE_LABEL_MAP[viewingPhase] ?? '';

  return {
    programId: program.id,
    displayId: program.displayId,
    name: program.name,
    tenant: 'Apex Retail Group',
    currentPhase: clampedCurrent,
    viewingPhase,
    phases: railPhases,
    gateStatus: program.gateStatus,
    linkedSourceEvent: program.linkedSourceEvent ?? undefined,
    // Use `programId` (the caller's actual ID) — not `program.id` (which may be the
    // fallback 'apx-cdp-2026'). A new program at P3 should get generic workbench
    // content, not APX-CDP-2026's P3-specific architecture sprint content.
    workbench: buildWorkbenchContent(
      program.name,
      clampedCurrent,
      viewingPhase,
      viewingPhaseLabel,
      viewingPhaseState,
      programId,
    ),
    agentRail: buildAgentRail(clampedCurrent, viewingPhase),
    phasePanel: buildPhasePanel(
      viewingPhase,
      viewingPhaseLabel,
      viewingPhaseState,
      clampedCurrent,
      programId,
    ),
    deterministicSeed: true,
  };
}
