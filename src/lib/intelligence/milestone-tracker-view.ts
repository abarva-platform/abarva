// INT8 · Milestone Tracker view-model.
//
// Pure deterministic helper — returns per-programme upcoming milestone
// schedules for the four Apex Retail AI programmes, including milestone
// status, blockers, and Sentinel notes.
//
// Milestone target dates are expressed as relative engagement-period
// labels (e.g. 'Week 3 May', 'End of May', 'Early June') — never as
// wall-clock Date objects — to keep the view fully deterministic.
//
// No model calls, no fetch, no Date.now / Math.random / new Date,
// no live data. Same input → identical output.
//
// This module does NOT import:
//   - src/lib/source/**
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**
//   - src/lib/agent/**
//   - src/lib/auth/**
//   - supabase/**
//   - src/lib/programs/mock.ts

// ─────────────────────────────────────────────────────────────────────────────
// Public types
// ─────────────────────────────────────────────────────────────────────────────

export type MilestoneType = 'gate' | 'review' | 'decision' | 'delivery';

export type MilestoneStatus = 'on_track' | 'at_risk' | 'overdue' | 'blocked';

export interface ProgrammeMilestone {
  milestoneId: string;
  milestoneName: string;
  milestoneType: MilestoneType;
  /** Relative engagement-period label — deterministic, never wall-clock */
  targetPeriod: string;
  status: MilestoneStatus;
  /** Non-null when status is 'blocked' or 'at_risk' */
  blockerSummary: string | null;
  sentinelNote: string;
}

export interface ProgrammeMilestoneSchedule {
  programmeId: string;
  programmeCode: string;
  programmeName: string;
  milestones: ProgrammeMilestone[];
}

export interface MilestoneTrackerMetrics {
  totalMilestones: number;
  blockedCount: number;
  atRiskCount: number;
  onTrackCount: number;
  /** Programmes with at least one blocked milestone */
  programmesWithBlockers: number;
}

export interface MilestoneTrackerView {
  programmes: ProgrammeMilestoneSchedule[];
  metrics: MilestoneTrackerMetrics;
  atlasSummary: string;
  deterministicSeed: true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed data — Apex Retail four AI programmes
// ─────────────────────────────────────────────────────────────────────────────

const MILESTONE_DATA: ReadonlyArray<ProgrammeMilestoneSchedule> = [
  {
    programmeId: 'APX-AMS-2026',
    programmeCode: 'APX-AMS',
    programmeName: 'Contact Center AI — Advanced Model Suite',
    milestones: [
      {
        milestoneId: 'M-AMS-001',
        milestoneName: 'Architecture Sign-off Gate',
        milestoneType: 'gate',
        targetPeriod: 'Week 3 May',
        status: 'blocked',
        blockerSummary: 'CON-AMS-001 escalated contradiction blocks gate; resolution required first',
        sentinelNote:
          'Gate cannot proceed until escalated model SLA contradiction is resolved or formally risk-accepted by programme sponsor',
      },
      {
        milestoneId: 'M-AMS-002',
        milestoneName: 'Vendor C Contract Execution',
        milestoneType: 'decision',
        targetPeriod: 'Week 4 May',
        status: 'at_risk',
        blockerSummary: 'Architecture gate blocking upstream; contract execution timing is contingent',
        sentinelNote:
          'Contract execution date slips for each week Architecture Sign-off is delayed; currently tracking 2-week drift from original plan',
      },
      {
        milestoneId: 'M-AMS-003',
        milestoneName: 'Technical POC Completion',
        milestoneType: 'delivery',
        targetPeriod: 'End of May',
        status: 'at_risk',
        blockerSummary: 'POC scope is under review due to SLA contradiction affecting model serving requirements',
        sentinelNote:
          'POC scope partially defined; call volume elasticity evidence gap means model selection assumptions may need revision post-gate',
      },
      {
        milestoneId: 'M-AMS-004',
        milestoneName: 'P3 Design Gate',
        milestoneType: 'gate',
        targetPeriod: 'Mid June',
        status: 'blocked',
        blockerSummary: 'P3 Design cannot open until Architecture Sign-off is clear',
        sentinelNote:
          'Earliest P3 Design start is contingent on M-AMS-001 clearing; currently 3-4 weeks behind target pace',
      },
    ],
  },
  {
    programmeId: 'APX-CDP-2026',
    programmeCode: 'APX-CDP',
    programmeName: 'Customer Data Platform',
    milestones: [
      {
        milestoneId: 'M-CDP-001',
        milestoneName: 'Data Architecture Approval',
        milestoneType: 'gate',
        targetPeriod: 'Week 2 May',
        status: 'blocked',
        blockerSummary: 'CON-CDP-001 data residency contradiction and GDPR review gap block approval',
        sentinelNote:
          'Two blocking items: contradiction on data residency requirements and incomplete GDPR cross-border transfer review; both must resolve before approval',
      },
      {
        milestoneId: 'M-CDP-002',
        milestoneName: 'GDPR Privacy Impact Review Sign-off',
        milestoneType: 'review',
        targetPeriod: 'End of May',
        status: 'at_risk',
        blockerSummary: 'Review is 3 weeks behind schedule; cross-border transfer gap identified',
        sentinelNote:
          'Client legal team confirmed cross-border transfer documentation gap; revised review timeline targets end of May — must complete before architecture gate can clear',
      },
      {
        milestoneId: 'M-CDP-003',
        milestoneName: 'Source System Connectivity Confirmation',
        milestoneType: 'delivery',
        targetPeriod: 'Week 3 May',
        status: 'at_risk',
        blockerSummary: '4 of 7 source systems remain unconfirmed; client IT integration team responsible',
        sentinelNote:
          'Connectivity for systems 4-7 unconfirmed; responsible party identified as Client IT integration lead; follow-up action required before architecture approval',
      },
      {
        milestoneId: 'M-CDP-004',
        milestoneName: 'P3 Design Phase Start',
        milestoneType: 'gate',
        targetPeriod: 'Early June',
        status: 'blocked',
        blockerSummary: 'Upstream data architecture gate is blocked',
        sentinelNote:
          'P3 Design cannot start until data architecture is approved; earliest projected start is now early June assuming May contradiction resolution',
      },
    ],
  },
  {
    programmeId: 'APX-SA-2026',
    programmeCode: 'APX-SA',
    programmeName: 'Store Associate Productivity',
    milestones: [
      {
        milestoneId: 'M-SA-001',
        milestoneName: 'Second Pilot Store Confirmation',
        milestoneType: 'decision',
        targetPeriod: 'Week 3 May',
        status: 'at_risk',
        blockerSummary: 'Client store operations team has not confirmed Store 2; gate requires minimum 2 stores',
        sentinelNote:
          'Action required from Client store ops lead; confirmation must arrive by week minus-3 to maintain go/no-go gate timeline',
      },
      {
        milestoneId: 'M-SA-002',
        milestoneName: 'Pilot Go/No-Go Gate',
        milestoneType: 'gate',
        targetPeriod: 'Week 4 May',
        status: 'at_risk',
        blockerSummary: 'KPI baseline contradiction unresolved and Store 2 unconfirmed',
        sentinelNote:
          'Gate is at risk from two concurrent open items; if both resolved by week 3, gate can proceed on schedule; risk-accept on KPI contradiction is a viable path',
      },
      {
        milestoneId: 'M-SA-003',
        milestoneName: 'L&D Training Content Sign-off',
        milestoneType: 'review',
        targetPeriod: 'Pilot Week minus-2',
        status: 'on_track',
        blockerSummary: null,
        sentinelNote:
          'L&D review in progress and tracking to schedule; non-blocking for go/no-go gate but required before pilot week start',
      },
      {
        milestoneId: 'M-SA-004',
        milestoneName: 'Pilot Week 1 Start',
        milestoneType: 'delivery',
        targetPeriod: 'Early June',
        status: 'at_risk',
        blockerSummary: 'Contingent on go/no-go gate clearance and Store 2 confirmation',
        sentinelNote:
          'Pilot start date is on track if gate clears on schedule; 1-week buffer built into plan, but additional slip at gate will directly delay pilot start',
      },
    ],
  },
  {
    programmeId: 'APX-DF-2026',
    programmeCode: 'APX-DF',
    programmeName: 'Demand Forecasting',
    milestones: [
      {
        milestoneId: 'M-DF-001',
        milestoneName: 'Model Selection Gate',
        milestoneType: 'gate',
        targetPeriod: 'Week 2 May',
        status: 'on_track',
        blockerSummary: null,
        sentinelNote:
          'Gate path is clear; historical data access confirmed and accuracy baseline established; model selection framework in final review',
      },
      {
        milestoneId: 'M-DF-002',
        milestoneName: 'Model Evaluation Framework Approval',
        milestoneType: 'review',
        targetPeriod: 'Week 3 May',
        status: 'on_track',
        blockerSummary: null,
        sentinelNote:
          'Framework draft in final stakeholder review; non-blocking for model selection gate — can be completed in parallel',
      },
      {
        milestoneId: 'M-DF-003',
        milestoneName: 'Initial Model Training Run',
        milestoneType: 'delivery',
        targetPeriod: 'End of May',
        status: 'on_track',
        blockerSummary: null,
        sentinelNote:
          'Data access confirmed and infrastructure ready; no blockers identified for initial training run',
      },
      {
        milestoneId: 'M-DF-004',
        milestoneName: 'Forecast Accuracy Baseline Comparison',
        milestoneType: 'delivery',
        targetPeriod: 'Week 2 June',
        status: 'on_track',
        blockerSummary: null,
        sentinelNote:
          'Baseline established at MAPE 18.4%; comparison methodology agreed at Oct steering; no blockers',
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the MilestoneTrackerView — fully deterministic, no runtime data.
 */
export function buildMilestoneTrackerView(): MilestoneTrackerView {
  const programmes = [...MILESTONE_DATA];

  let totalMilestones = 0;
  let blockedCount = 0;
  let atRiskCount = 0;
  let onTrackCount = 0;
  let programmesWithBlockers = 0;

  for (const prog of programmes) {
    let hasBlocker = false;
    for (const ms of prog.milestones) {
      totalMilestones++;
      if (ms.status === 'blocked') { blockedCount++;  hasBlocker = true; }
      if (ms.status === 'at_risk') atRiskCount++;
      if (ms.status === 'on_track') onTrackCount++;
    }
    if (hasBlocker) programmesWithBlockers++;
  }

  return {
    programmes,
    metrics: {
      totalMilestones,
      blockedCount,
      atRiskCount,
      onTrackCount,
      programmesWithBlockers,
    },
    atlasSummary:
      'Milestone tracking shows 4 blocked milestones across AMS and CDP, with 7 milestones at risk engagement-wide. ' +
      'Demand Forecasting maintains a fully on-track schedule with no blockers. ' +
      'The most urgent schedule pressure is on AMS Architecture Sign-off and CDP Data Architecture Approval — ' +
      'both are week-3 May targets that will slip without immediate contradiction resolution. ' +
      'Store Associate Productivity has a clear recovery path if Store 2 is confirmed by week 3 May.',
    deterministicSeed: true,
  };
}
