// programs-detail-view.ts — PROG-D
//
// Builds the ProgramDetailView for a single program from deterministic fixtures.
// Deterministic: no Date.now(), no random, no model calls.
//
// Phase model: the fixture uses 0–6 (Originate through Tower Handoff).
// The ProgramJourneyRail displays phases 1–6 (Discovery through Tower Handoff).
// Phase 0 (Originate) is treated as a completed pre-condition and not shown
// in the navigator.

import {
  APEX_PROGRAMS_FIXTURE,
  PHASE_LABEL_MAP,
  buildPhaseSlots,
} from './programs-fixture';
import { MERIDIAN_PROGRAMS_FIXTURE } from './meridian-fixture';
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

// ─── APX-CC-2026 specific workbench (P4 Execution Roadmap · Active — 68% Complete) ───────

const APX_CC_2026_P4_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P4 Execution Roadmap · Active — 68% Complete',
  prose:
    'Execution roadmap is taking shape. Nexus is packaging workstreams, estimate basis, milestone sequence, dependencies, readiness risks, and success criteria for approval. The remaining 32% covers IVR routing scope, operator dashboard dependency, and mobilization readiness.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Complete IVR routing rules',
      detail: 'Remaining roadmap dependency — 2 sprints estimated',
    },
    {
      letter: 'B',
      text: 'Ship operator dashboard MVP',
      detail: 'Required for Approval & Mobilization gate — UX review Apr 30',
    },
    {
      letter: 'C',
      text: 'Schedule approval/mobilization review',
      detail: 'Sponsor + IT sign-off · target May 15',
    },
  ],
};

// ─── APX-CC-2026 specific workbench (P5 Approval & Mobilization — locked/pending from P4 Roadmap) ──

const APX_CC_2026_P5_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P5 Approval & Mobilization · Pending',
  prose: 'P5 Approval & Mobilization is locked until the execution roadmap gate clears. IVR migration scope and dashboard delivery plan are the remaining roadmap blockers. Once cleared, P5 packages the business case, funding ask, readiness plan, change plan, and sponsor approval.',
  actionsLabel: 'Unlock path',
  actions: [
    { letter: 'A', text: 'Complete IVR migration scope', detail: 'Last roadmap blocker — 3 sprints estimated' },
    { letter: 'B', text: 'Confirm supervisor dashboard plan', detail: 'Final roadmap dependency — UX review pending' },
    { letter: 'C', text: 'Preview approval packet', detail: 'Business case, funding, readiness, and change plan' },
  ],
};

// ─── APX-DFV2-2025 specific workbench (P6 Tower Handoff — monitoring active) ──────

const APX_DFV2_P6_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P6 Tower Handoff · Monitoring Active',
  prose: 'Demand Forecasting v2 has a Tower monitoring contract in place. Forecast accuracy is at 87% — 5pp above the 82% target. Inventory waste reduction is running $1.4M/yr against a $1.2M projection. Tower/Atlas monitor weekly value movement, drift, and escalation thresholds.',
  actionsLabel: 'Tower monitors',
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

// ─── Generic P5 Approval & Mobilization workbench — intentional locked/preview copy ─────────
// Shown when viewing P5 for any program that doesn't have a flagship override.
// Covers both: a program at P4 peeking ahead, and a program at P1–P3 seeing P5.

const GENERIC_P5_ACTIVATE_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P5 Approval & Mobilization · Preview',
  prose:
    'Approval & Mobilization packages the business case, funding ask, stakeholder alignment, readiness, change-management plan, governance model, and launch authority. No execution starts here; AbarVa prepares the approval packet for delivery outside the tool.',
  actionsLabel: 'Preview path',
  actions: [
    {
      letter: 'A',
      text: 'Clear roadmap gate first',
      detail: 'Approval & Mobilization unlocks when all P4 roadmap criteria are met',
    },
    {
      letter: 'B',
      text: 'Preview approval criteria',
      detail: 'Business case, funding, sponsor alignment, readiness, and change sign-off',
    },
    {
      letter: 'C',
      text: 'Prepare mobilization readiness',
      detail: 'Stakeholder comms, training/change plan, governance, and escalation criteria',
    },
  ],
};

// ─── Generic P6 Tower Handoff workbench — intentional locked/preview copy ───────────
// Shown when viewing P6 for any program that doesn't have a flagship override.

const GENERIC_P6_OPERATE_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P6 Tower Handoff · Preview',
  prose:
    'Tower Handoff sets up execution monitoring for work that happens outside Programs. Nexus defines the metrics, milestone cadence, data feeds, owners, escalation thresholds, and benefits tracking contract Tower will use.',
  actionsLabel: 'Preview path',
  actions: [
    {
      letter: 'A',
      text: 'Complete mobilization approval first',
      detail: 'Tower Handoff unlocks when P5 approval and monitoring prerequisites are cleared',
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

// ─── Meridian simulation workbench (P3 Design · Execution Roadmap gate pending) ──────────

const MH_AGENTIC_CARE_DATA_ACCELERATOR_P3_WORKBENCH: ProgramWorkbenchContent = {
  title: 'P3 Design · Simulation Evidence Review',
  prose:
    'The Meridian Agentic Care Data Accelerator is in Design with a live handoff package behind it: strategy minutes, architecture workshop notes, steering decisions, action register, solution inputs, and corpus publication audits. Nexus can safely use the deterministic fixture for navigation today, while Sentinel should still treat the published Pinecone index as not app-wired until live retrieved IDs are captured.',
  actionsLabel: 'Nexus recommends',
  actions: [
    {
      letter: 'A',
      text: 'Review source artifact spine',
      detail: '5 source artifacts · strategy, architecture, steering, actions, solution inputs',
    },
    {
      letter: 'B',
      text: 'Close Design gate evidence gaps',
      detail: 'Control testing, rollback ownership, and PHI retrieval guardrails',
    },
    {
      letter: 'C',
      text: 'Run app-wiring validation pack',
      detail: '6 query prompts · capture returned corpus IDs before claiming app-wired',
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
  // Generic P5 Approval & Mobilization preview — for any program without a flagship P5 override.
  // APX-CC-2026 has its own P5 workbench and is already handled above.
  if (viewingPhase === 5 && viewingPhaseState !== 'current') {
    return GENERIC_P5_ACTIVATE_WORKBENCH;
  }
  // Generic P6 Tower Handoff preview — for any program without a flagship P6 override.
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
  if (
    programId === 'mh-prog-agentic-care-data-accelerator' &&
    viewingPhase === 3 &&
    viewingPhaseState === 'current'
  ) {
    return MH_AGENTIC_CARE_DATA_ACCELERATOR_P3_WORKBENCH;
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
      deliverables: [
        { label: 'Origination approval', status: 'done' },
        { label: 'Discovery interview schedule', status: 'pending' },
        { label: 'IT data access request', status: 'blocked' },
        { label: 'Store observations report', status: 'pending' },
        { label: 'Discovery report', status: 'pending' },
      ],
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
  // APX-CC-2026 P5 gate — locked/pending view from P4 Execution Roadmap perspective
  if (programId === 'apx-cc-2026' && viewingPhase === 5) {
    return {
      gateCriteria: [
        { criterion: 'IVR migration complete', met: false },
        { criterion: 'Supervisor dashboard delivered', met: false },
        { criterion: 'Load test passed (500 concurrent)', met: false },
        { criterion: 'Sponsor sign-off on execution roadmap gate', met: false },
      ],
      blockerNote: 'P5 Approval & Mobilization entry requires clearing the Execution Roadmap gate (P4). Two blockers remain: IVR migration scope and dashboard delivery plan.',
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
  // Generic P5 Approval & Mobilization phase panel — intentional locked/pending copy
  // APX-CC-2026 P5 is handled above; this covers all other programs.
  if (viewingPhase === 5 && viewingPhaseState !== 'current') {
    return {
      blockerNote:
        'P5 Approval & Mobilization entry requires P4 Execution Roadmap gate approval. The gate criteria are managed in the active roadmap phase.',
      gateCriteria: [
        { criterion: 'P4 Execution Roadmap gate formally approved', met: false },
        { criterion: 'Business case reviewed by sponsor', met: false },
        { criterion: 'Change management plan filed', met: false },
        { criterion: 'Mobilization governance and escalation criteria documented', met: false },
      ],
    };
  }
  // Generic P6 Tower Handoff phase panel — intentional locked/pending copy
  // APX-DFV2-2025 P6 is handled above; this covers all other programs.
  if (viewingPhase === 6 && viewingPhaseState !== 'current') {
    return {
      blockerNote:
        'P6 Tower Handoff entry requires P5 Approval & Mobilization gate approval. Programs enter Tower Handoff once monitoring metrics, data feeds, owners, and escalation thresholds are ready.',
      gateCriteria: [
        { criterion: 'P5 Approval & Mobilization gate formally approved', met: false },
        { criterion: 'Tower monitoring metrics defined', met: false },
        { criterion: 'Data-feed owners confirmed', met: false },
        { criterion: 'Escalation thresholds filed', met: false },
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
  // APX-CDP-2026 P3 gate — Design phase active deliverables + Execution Roadmap gate criteria
  if (programId === 'apx-cdp-2026' && viewingPhase === 3 && viewingPhaseState === 'current') {
    return {
      gateCriteria: [
        { criterion: 'Architecture blueprint reviewed by sponsor', met: true },
        { criterion: 'Data model approved by engineering lead', met: true },
        { criterion: 'Vendor integration contract signed (Vendor C)', met: false },
        { criterion: 'Privacy architecture signed off by Steward', met: false },
        { criterion: 'Execution roadmap brief scoped and sponsor-approved', met: false },
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
  // Meridian simulation P3 gate — source-backed but retrieval is not app-wired yet.
  if (
    programId === 'mh-prog-agentic-care-data-accelerator' &&
    viewingPhase === 3 &&
    viewingPhaseState === 'current'
  ) {
    return {
      summary:
        'P3 Design is evidence-backed by the Meridian simulation handoff. The corpus entries are published, but the app must still prove live retrieval against the validation query pack before this can be marked app-wired.',
      gateCriteria: [
        { criterion: 'Strategy/current-state minutes indexed in handoff', met: true },
        { criterion: 'Architecture workshop minutes indexed in handoff', met: true },
        { criterion: 'Steering decision log and action register captured', met: true },
        { criterion: 'PHI retrieval guardrails validated in app query path', met: false },
        { criterion: 'Live corpus IDs captured from app/API smoke test', met: false },
      ],
      evidenceItems: [
        {
          id: 'mh-acda-ev-1',
          citation: 'Strategy and current-state minutes · Apr 2026',
          source: 'Meridian simulation artifact',
          excerpt:
            'Meridian is balancing agentic workflow acceleration with PHI guardrails, legacy warehouse constraints, and business demand for faster care-operations analytics.',
          confidence: 'high' as const,
          provenanceNote:
            'Repo handoff · docs/build/client-context-simulations/meridian-agentic-care-data-accelerator/artifacts/01_strategy_and_current_state_minutes.md',
        },
        {
          id: 'mh-acda-ev-2',
          citation: 'Architecture workshop minutes · Apr 2026',
          source: 'Meridian simulation artifact',
          excerpt:
            'Epic Clarity/Caboodle, the legacy Teradata warehouse, and the Azure Databricks pilot create a dual-run migration path with explicit retrieval-control requirements.',
          confidence: 'high' as const,
          provenanceNote:
            'Repo handoff · docs/build/client-context-simulations/meridian-agentic-care-data-accelerator/artifacts/02_architecture_workshop_minutes.md',
        },
        {
          id: 'mh-acda-ev-3',
          citation: 'Publication audit · Apr 2026',
          source: 'Corpus publication audit',
          excerpt:
            'The simulation wave reports 148 corpus entries and 1026 vectors published, but remains marked published-not-app-wired until retrieval smoke evidence is captured.',
          confidence: 'medium' as const,
          provenanceNote:
            'Repo audit · docs/build/client-context-simulations/meridian-agentic-care-data-accelerator/audits/',
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
        summary:
          `P${viewingPhase} ${viewingPhaseLabel} is active. Nexus is tracking the phase deliverables, sponsor sign-off path, linked evidence, and unresolved risks needed to clear the next gate.`,
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
  const apexProgram = APEX_PROGRAMS_FIXTURE.find((p) => p.id === programId);
  const meridianProgram = MERIDIAN_PROGRAMS_FIXTURE.find((p) => p.id === programId);
  const fixtureMatch =
    apexProgram
      ? {
          program: apexProgram,
          tenant: 'Apex Retail Group',
        }
      : meridianProgram
      ? {
          program: meridianProgram,
          tenant: 'Meridian Health System',
        }
      : null;
  const program = fixtureMatch?.program ?? APEX_PROGRAMS_FIXTURE[0];
  const tenant = fixtureMatch?.tenant ?? 'Apex Retail Group';

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
    tenant,
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
