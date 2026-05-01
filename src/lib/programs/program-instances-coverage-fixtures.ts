// src/lib/programs/program-instances-coverage-fixtures.ts
//
// Additional ProgramInstance fixtures to push template-coverage audit above 90%.
//
// Targeted patterns and their currently-uncovered templates:
//
//   PAT-PRG-CDP-001  — CON-002 (activation/audience/segment), CON-003 (consent/GDPR),
//                      CON-004 (timeline/go-live/data quality), FM-001 (tooling/adoption),
//                      FM-004 (source-event/decoupling/vendor/selection)
//
//   PAT-PRG-AI-CODING-001 — all 4 CONs + all 4 FMs (previously zero fixture coverage)
//
//   PAT-PRG-LOYALTY-001   — all 4 CONs + FM-001, FM-002, FM-004 (previously zero fixture)
//
//   PAT-PRG-DATA-FAB-001  — CON-002 (data quality/remediation), CON-004 (compute cost/FinOps),
//                           FM-001 (infrastructure/use-cases), FM-002 (data quality/build),
//                           FM-004 (FinOps/compute/storage/finance)
//
// Evidence citations are keyword-matched by the detector (≥2 non-stop-word overlap
// with the template's detectionHint / description).  Each citation below is
// annotated with the template it intends to fire.

import type { ProgramInstance, ProgramPhaseState } from './program-instance';

// ─── Phase builder (mirrors program-instances.ts) ────────────────────────────

function buildPhaseStates(
  currentPhase: number,
  overrides?: Partial<Record<number, Partial<ProgramPhaseState>>>,
): ProgramPhaseState[] {
  const PHASE_LABELS = ['Originate', 'Discovery', 'Synthesis', 'Design', 'Execution Roadmap', 'Approval & Mobilization', 'Tower Handoff'];
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

// =============================================================================
// APX-CDP-COVERAGE-2026 · CDP Programme — coverage fixture instance
// Pattern PAT-PRG-CDP-001
//
// A second CDP instance that deliberately surfaces the four uncovered templates:
//   CON-002: activation backlog vs capacity (activation/audience/segment/channel rate)
//   CON-003: pilot consent vs production GDPR posture (consent/opt-in/GDPR/sandbox)
//   CON-004: implementation timeline vs data quality readiness (timeline/go-live/data readiness)
//   FM-001: tooling delivered without adoption (tooling/adoption/legacy)
//   FM-004: source-event decoupling — build ahead of vendor selection (vendor/selection/design/contingent)
// =============================================================================

export const APX_CDP_COVERAGE_2026_INSTANCE: ProgramInstance = {
  id: 'APX-CDP-COVERAGE-2026',
  displayId: 'DEMO-APX-CDP-COV-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'CDP Activation — Coverage Fixture',

  patternId: 'PAT-PRG-CDP-001',
  patternVersion: '1.0.0',

  currentPhase: 3,
  phases: buildPhaseStates(3, {
    0: {
      gateStatus: 'approved',
      gateEvidence: ['Business case signed — value hypothesis · Jan 2026'],
      enteredAt: '2026-01-05',
      exitedAt: '2026-01-31',
    },
    1: {
      gateStatus: 'approved',
      gateEvidence: ['Discovery report — fragmentation baseline across 6 source systems'],
      enteredAt: '2026-02-01',
      exitedAt: '2026-03-14',
    },
    2: {
      gateStatus: 'approved',
      gateEvidence: ['Synthesis gate package — architecture approved · Apr 2026'],
      enteredAt: '2026-03-17',
      exitedAt: '2026-04-18',
    },
    3: { gateStatus: 'open', enteredAt: '2026-04-21' },
  }),

  deliverables: [
    { id: 'cdp-cov-d-001', label: 'Business Case', phaseId: 0, status: 'complete', completedAt: '2026-01-25' },
    { id: 'cdp-cov-d-002', label: 'Fragmentation Baseline', phaseId: 1, status: 'complete', completedAt: '2026-03-10' },
    { id: 'cdp-cov-d-003', label: 'Architecture Options Assessment', phaseId: 2, status: 'complete', completedAt: '2026-04-14' },
    { id: 'cdp-cov-d-004', label: 'Use-Case Activation Backlog', phaseId: 3, status: 'in-progress', owner: 'Marketing Ops', dueDate: '2026-05-20' },
    { id: 'cdp-cov-d-005', label: 'Consent Uplift Plan', phaseId: 3, status: 'not-started' },
    { id: 'cdp-cov-d-006', label: 'Data Readiness Assessment', phaseId: 3, status: 'in-progress', owner: 'Data Engineering' },
    { id: 'cdp-cov-d-007', label: 'Execution Roadmap Gate Package', phaseId: 3, status: 'not-started' },
  ],

  evidence: [
    // CON-PRG-CDP-002: activation backlog vs segment/audience/channel rate capacity
    {
      id: 'cdp-cov-ev-001',
      citation:
        'Marketing use-case backlog contains 47 planned activation segments requiring daily audience refresh at channel rate limits — activation runtime capacity assessment shows platform supports 12 segment refreshes per day before rate limit breach; backlog exceeds activation capacity by 4×',
      phaseId: 3,
      uploadedAt: '2026-04-24',
      uploadedBy: 'Marketing Ops',
      kind: 'assessment',
    },
    // CON-PRG-CDP-003: pilot consent vs production GDPR posture
    {
      id: 'cdp-cov-ev-002',
      citation:
        'Pilot operating on internal audience sandbox cohort without production consent posture documented; Activate plan does not include GDPR opt-in uplift path for production customer population — consent regime assumed for pilot incompatible with production privacy posture',
      phaseId: 3,
      uploadedAt: '2026-04-25',
      uploadedBy: 'Privacy Office',
      kind: 'assessment',
    },
    // CON-PRG-CDP-004: vendor timeline vs data quality / data readiness
    {
      id: 'cdp-cov-ev-003',
      citation:
        'Vendor implementation timeline and go-live schedule assumes data quality and data readiness thresholds already met; Discovery baseline shows 3 source systems below quality threshold for identifier completeness — timeline does not include data readiness remediation track',
      phaseId: 3,
      uploadedAt: '2026-04-26',
      uploadedBy: 'Solutions Team',
      kind: 'document',
    },
    // FM-PRG-CDP-001: tooling without adoption — marketing continuing on legacy tools
    {
      id: 'cdp-cov-ev-004',
      citation:
        'Marketing and digital teams continue operating from legacy campaign tools despite CDP tooling technically delivered at P2 Synthesis — adoption of new capability treated as follow-on initiative not programme requirement; value realisation flat-lined due to low adoption',
      phaseId: 3,
      uploadedAt: '2026-04-27',
      uploadedBy: 'Programme Lead',
      kind: 'document',
    },
    // FM-PRG-CDP-004: source-event decoupling — design entered ahead of vendor selection
    {
      id: 'cdp-cov-ev-005',
      citation:
        'Programme entered Design phase (P3) before AMS vendor selection completed — design contingent on vendor assumptions that may not hold at award; CDP programme decoupled from sourcing event; design contingent on assumptions about vendor integration model that source-event selection has not confirmed',
      phaseId: 3,
      uploadedAt: '2026-04-27',
      uploadedBy: 'Architecture Lead',
      kind: 'document',
    },
  ],

  linkedSourceEvents: [
    {
      sourceEventId: 'SRC-AMS-2026',
      sourceEventName: 'AMS Vendor Consolidation 2026',
      linkType: 'depends-on',
      description: 'AMS vendor selection determines integration architecture; CDP P3 → P4 gate is blocked',
      blockedAtPhase: 3,
    },
  ],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-cdp-cov', name: 'Sarah Chen', title: 'Chief Digital Officer' },

  flags: [
    {
      id: 'cdp-cov-flag-001',
      kind: 'risk',
      description: 'Activation backlog exceeds runtime capacity; consent uplift plan missing; data readiness gap.',
      raisedBy: 'Sentinel',
      raisedAt: '2026-04-26',
      status: 'open',
    },
  ],

  createdAt: '2026-01-05',
  lastModifiedAt: '2026-04-27',
  estimatedValueUsd: 3800000,
};

// =============================================================================
// APX-AICOD-2026 · AI Coding Assistant Rollout — Apex Engineering
// Pattern PAT-PRG-AI-CODING-001
//
// All 4 CONs and all 4 FMs are uncovered. Evidence covers:
//   CON-001: vendor productivity claim (30-55% uplift) vs measured pilot uplift below 15%
//   CON-002: vendor verbal training-data commitment vs DPA anonymised/aggregated telemetry
//   CON-003: PR throughput uplift vs defect-density / reviewer-rejection / revert trend
//   CON-004: rollout pace vs support backlog / licence-management capacity
//   FM-001: tool sprawl — teams adopting different assistants without sponsor authority
//   FM-002: productivity claim in business case without measurement baseline
//   FM-003: IP leakage through context windows / repository configuration
//   FM-004: quality regression discovered late in pilot — defect-density masked by throughput
// =============================================================================

export const APX_AICOD_2026_INSTANCE: ProgramInstance = {
  id: 'APX-AICOD-2026',
  displayId: 'DEMO-APX-AICOD-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Apex Engineering AI Coding Assistant Rollout',

  patternId: 'PAT-PRG-AI-CODING-001',
  patternVersion: '1.0.0',

  currentPhase: 4,
  phases: buildPhaseStates(4, {
    0: {
      gateStatus: 'approved',
      gateEvidence: ['CTO sponsorship charter — vendor-decision authority · Oct 2025'],
      enteredAt: '2025-10-06',
      exitedAt: '2025-10-31',
    },
    1: {
      gateStatus: 'approved',
      gateEvidence: [
        'Developer productivity baseline measured — PR-cycle time, defect density, time-on-task · Nov 2025',
        'Repository inventory and IP exposure posture documented',
      ],
      enteredAt: '2025-11-03',
      exitedAt: '2025-12-19',
    },
    2: {
      gateStatus: 'approved',
      gateEvidence: ['Vendor selection — GitHub Copilot · Jan 2026', 'Security posture aligned'],
      enteredAt: '2026-01-05',
      exitedAt: '2026-02-06',
    },
    3: {
      gateStatus: 'approved',
      gateEvidence: ['Pilot plan — 120 engineers, 8 weeks · Feb 2026', 'Success criteria locked'],
      enteredAt: '2026-02-09',
      exitedAt: '2026-03-07',
    },
    4: { gateStatus: 'open', enteredAt: '2026-03-10' },
  }),

  deliverables: [
    { id: 'aicod-d-001', label: 'CTO Sponsorship Charter', phaseId: 0, status: 'complete', completedAt: '2025-10-24' },
    { id: 'aicod-d-002', label: 'Developer Productivity Baseline', phaseId: 1, status: 'complete', completedAt: '2025-12-10' },
    { id: 'aicod-d-003', label: 'Repository & IP Posture Inventory', phaseId: 1, status: 'complete', completedAt: '2025-12-18' },
    { id: 'aicod-d-004', label: 'IDE & Repository Configuration Plan', phaseId: 3, status: 'complete', completedAt: '2026-03-04' },
    { id: 'aicod-d-005', label: 'Pilot Results Report', phaseId: 4, status: 'in-progress', owner: 'Engineering Lead', dueDate: '2026-05-15' },
    { id: 'aicod-d-006', label: 'DPA Addendum Review', phaseId: 4, status: 'in-progress', owner: 'Legal', dueDate: '2026-05-08' },
    { id: 'aicod-d-007', label: 'Rollout Plan', phaseId: 4, status: 'not-started' },
  ],

  evidence: [
    // CON-PRG-AICOD-001: vendor productivity claim vs measured pilot uplift
    {
      id: 'aicod-ev-001',
      citation:
        'Vendor productivity claim states 40% developer velocity uplift based on internal GitHub study; pilot measurement after 6 weeks shows PR throughput uplift 11% and time-on-task reduction 8% — measured pilot uplift below 15% threshold; vendor claim not corroborated by pilot measurement',
      phaseId: 4,
      uploadedAt: '2026-04-18',
      uploadedBy: 'Engineering Lead',
      kind: 'assessment',
    },
    // CON-PRG-AICOD-002: vendor training data claim vs DPA anonymised/aggregated telemetry
    {
      id: 'aicod-ev-002',
      citation:
        'Vendor stated verbally during procurement that customer code is not used for model training; contract DPA review reveals training data clause permits use of aggregated anonymised feedback signals and telemetry for model improvement — verbal commitment not reflected in contractual language',
      phaseId: 4,
      uploadedAt: '2026-04-20',
      uploadedBy: 'Legal',
      kind: 'document',
    },
    // CON-PRG-AICOD-003: PR throughput uplift vs defect-density / reviewer-rejection / revert
    {
      id: 'aicod-ev-003',
      citation:
        'Pilot PR throughput shows uplift; however defect-density trend up 14% and reviewer-rejection rate for AI-assisted PRs 22% above baseline; post-merge revert frequency elevated — productivity uplift accompanied by measurable quality regression',
      phaseId: 4,
      uploadedAt: '2026-04-22',
      uploadedBy: 'Quality Engineering',
      kind: 'assessment',
    },
    // CON-PRG-AICOD-004: rollout pace vs support backlog / licence capacity
    {
      id: 'aicod-ev-004',
      citation:
        'Rollout plan schedules onboarding 80 engineers per week across 6 cohorts; licence procurement and support backlog capacity assessed at 30 engineers per week — rollout pace exceeds support model capacity; licence-management process cannot absorb planned onboarding cadence',
      phaseId: 4,
      uploadedAt: '2026-04-24',
      uploadedBy: 'Programme Manager',
      kind: 'document',
    },
    // FM-PRG-AICOD-001: tool sprawl — teams without sponsor authority adopting different assistants
    {
      id: 'aicod-ev-005',
      citation:
        'Without CTO sponsor authority enforced, 3 engineering teams adopted different AI coding assistants based on personal preference — tool sprawl across vendor boundaries defeating rationalisation case; unsanctioned usage exposing IP across multiple vendors without security review',
      phaseId: 4,
      uploadedAt: '2026-04-15',
      uploadedBy: 'CISO Office',
      kind: 'document',
    },
    // FM-PRG-AICOD-002: productivity claim in business case without measurement — baseline absent
    {
      id: 'aicod-ev-006',
      citation:
        'Business case productivity claim based on vendor-cited productivity benchmark; baseline developer productivity metrics not measured pre-rollout in some cohorts — productivity baseline absent for those cohorts making measured uplift comparison impossible at portfolio review',
      phaseId: 1,
      uploadedAt: '2025-12-08',
      uploadedBy: 'Programme Lead',
      kind: 'document',
    },
    // FM-PRG-AICOD-003: IP leakage through context windows / repository configuration
    {
      id: 'aicod-ev-007',
      citation:
        'Repository-level allow/deny configuration not applied in 2 pilot cohorts; sensitive proprietary code sent into vendor context windows without IDE configuration restricting sensitive repository access; IP leakage through context window exposure not authorised by security review',
      phaseId: 4,
      uploadedAt: '2026-04-09',
      uploadedBy: 'Security Engineering',
      kind: 'document',
    },
    // FM-PRG-AICOD-004: quality regression discovered late — defect-density masked by throughput
    {
      id: 'aicod-ev-008',
      citation:
        'Defect-density rise masked by PR throughput uplift during pilot; quality regression not tracked during pilot; reviewer capacity overwhelmed after broad rollout when defect-density and reviewer-rejection rate became visible; rollback operationally costly at that stage',
      phaseId: 4,
      uploadedAt: '2026-04-26',
      uploadedBy: 'Engineering Lead',
      kind: 'assessment',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-aicod', name: 'Raj Kapoor', title: 'CTO' },

  flags: [
    {
      id: 'aicod-flag-001',
      kind: 'risk',
      description: 'Measured uplift below vendor claim; DPA training-data clause mismatch; defect-density rise; rollout pace exceeds support capacity.',
      raisedBy: 'Sentinel',
      raisedAt: '2026-04-22',
      status: 'open',
    },
  ],

  createdAt: '2025-10-06',
  lastModifiedAt: '2026-04-26',
  estimatedValueUsd: 780000,
};

// =============================================================================
// APX-LOYALTY-2026 · Apex Retail Loyalty Programme Launch
// Pattern PAT-PRG-LOYALTY-001
//
// All 4 CONs and FM-001, FM-002, FM-004 are uncovered. Evidence covers:
//   CON-001: headline revenue lift positive but contribution margin flat/negative
//   CON-002: vendor member-value claim (18%) not corroborated by pilot cohort results
//   CON-003: breakage rate assumed vs observed redemption — accrued liability surprise
//   CON-004: pilot same-store vs network mix — lift signal may not generalise
//   FM-001: discount distribution without behaviour change (RFM/retention)
//   FM-002: liability surprise — breakage assumption vs redemption accrual balance-sheet
//   FM-004: no operating team — mechanics/member-experience drift post-activation
// =============================================================================

export const APX_LOYALTY_2026_INSTANCE: ProgramInstance = {
  id: 'APX-LOYALTY-2026',
  displayId: 'DEMO-APX-LOYALTY-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Apex Retail Loyalty Programme Launch',

  patternId: 'PAT-PRG-LOYALTY-001',
  patternVersion: '1.0.0',

  currentPhase: 4,
  phases: buildPhaseStates(4, {
    0: {
      gateStatus: 'approved',
      gateEvidence: ['Business case — behaviour-change value hypothesis · Dec 2025'],
      enteredAt: '2025-12-01',
      exitedAt: '2025-12-31',
    },
    1: {
      gateStatus: 'approved',
      gateEvidence: [
        'Customer behaviour baseline — RFM segments, churn rate, NPS · Feb 2026',
        'Unit-economics baseline — per-segment margin',
      ],
      enteredAt: '2026-01-05',
      exitedAt: '2026-02-28',
    },
    2: {
      gateStatus: 'approved',
      gateEvidence: ['Earn/burn mechanics design — within margin envelope · Mar 2026', 'Liability accounting memo signed by finance'],
      enteredAt: '2026-03-02',
      exitedAt: '2026-04-04',
    },
    3: {
      gateStatus: 'approved',
      gateEvidence: ['Pilot plan — 15 flagship stores with control cohort · Apr 2026', 'Success criteria locked'],
      enteredAt: '2026-04-07',
      exitedAt: '2026-04-18',
    },
    4: { gateStatus: 'open', enteredAt: '2026-04-21' },
  }),

  deliverables: [
    { id: 'loy-d-001', label: 'Business Case', phaseId: 0, status: 'complete', completedAt: '2025-12-20' },
    { id: 'loy-d-002', label: 'RFM & Customer Behaviour Baseline', phaseId: 1, status: 'complete', completedAt: '2026-02-18' },
    { id: 'loy-d-003', label: 'Unit-Economics & Liability Accounting Memo', phaseId: 2, status: 'complete', completedAt: '2026-03-28' },
    { id: 'loy-d-004', label: 'Earn/Burn Mechanics Design', phaseId: 2, status: 'complete', completedAt: '2026-04-02' },
    { id: 'loy-d-005', label: 'Pilot Cohort & Control Cohort Plan', phaseId: 3, status: 'complete', completedAt: '2026-04-17' },
    { id: 'loy-d-006', label: 'Pilot Results Report', phaseId: 4, status: 'in-progress', owner: 'CX Analytics', dueDate: '2026-05-28' },
    { id: 'loy-d-007', label: 'Operating Team RACI', phaseId: 4, status: 'not-started' },
    { id: 'loy-d-008', label: 'Member Experience Dashboard', phaseId: 4, status: 'not-started' },
  ],

  evidence: [
    // CON-PRG-LOY-001: headline revenue lift vs contribution margin
    {
      id: 'loy-ev-001',
      citation:
        'Pilot revenue lift positive at 7% incremental uplift over control; contribution margin lift flat at zero when earn-rate cost, redemption cost, and platform fees netted — revenue uplift not translating to margin improvement; headline lift obscures margin impact',
      phaseId: 4,
      uploadedAt: '2026-04-26',
      uploadedBy: 'Finance',
      kind: 'assessment',
    },
    // CON-PRG-LOY-002: vendor member-value claim vs measured cohort lift / annual spend
    {
      id: 'loy-ev-002',
      citation:
        'Vendor benchmark cites 18% member value uplift in annual spend for comparable retail loyalty programmes; pilot cohort results show member spend lift 4% versus control — vendor member-value claim not corroborated by measured annual spend lift in pilot cohort',
      phaseId: 4,
      uploadedAt: '2026-04-27',
      uploadedBy: 'CX Analytics',
      kind: 'assessment',
    },
    // CON-PRG-LOY-003: breakage assumption vs observed redemption / liability accrual
    {
      id: 'loy-ev-003',
      citation:
        'Finance liability accounting memo assumed breakage rate of 22% to model deferred-revenue accrual; observed redemption rate in pilot 38% — breakage assumption materially lower than redemption behaviour; accrued liability growing faster than forecast producing balance-sheet variance',
      phaseId: 4,
      uploadedAt: '2026-04-25',
      uploadedBy: 'Finance',
      kind: 'document',
    },
    // CON-PRG-LOY-004: pilot same-store vs network mix — comparable/control cohort generalisation
    {
      id: 'loy-ev-004',
      citation:
        'Pilot conducted in 15 flagship urban stores; network contains 180 stores with significant satellite and rural mix; control cohort not comparable to broader network composition — same-store pilot lift signal unlikely to generalise to full network mix; comparable control cohort design gap',
      phaseId: 4,
      uploadedAt: '2026-04-24',
      uploadedBy: 'Programme Lead',
      kind: 'document',
    },
    // FM-PRG-LOY-001: discount distribution without behaviour change — RFM/retention not moving
    {
      id: 'loy-ev-005',
      citation:
        'Programme generating revenue lift through redemption discounts but customer behaviour (RFM segments, retention rate) unchanged versus control — discount distribution driving transactions without behaviour change; margin compressing without loyalty value case evidence',
      phaseId: 4,
      uploadedAt: '2026-04-26',
      uploadedBy: 'CX Analytics',
      kind: 'assessment',
    },
    // FM-PRG-LOY-002: liability surprise — breakage/redemption accrual balance-sheet
    {
      id: 'loy-ev-006',
      citation:
        'Breakage rate assumed in liability accrual model higher than observed redemption behaviour; as programme scales accrued liability outpacing forecast — deferred-revenue balance-sheet event not anticipated by finance; liability surprise material at current redemption trajectory',
      phaseId: 4,
      uploadedAt: '2026-04-25',
      uploadedBy: 'Finance',
      kind: 'document',
    },
    // FM-PRG-LOY-004: no operating team — programme manager, mechanics, member-experience
    {
      id: 'loy-ev-007',
      citation:
        'Programme delivered as build-and-launch project without standing operating team; programme manager, finance liaison, and marketing-ops owner not named before activation; member experience and mechanics management unowned post-activation; operating team gap creates member-experience drift risk',
      phaseId: 4,
      uploadedAt: '2026-04-28',
      uploadedBy: 'CPO Office',
      kind: 'document',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-loy', name: 'Marcus Webb', title: 'VP Customer Experience' },

  flags: [
    {
      id: 'loy-flag-001',
      kind: 'risk',
      description: 'Revenue lift not margin-positive; vendor member-value claim unsubstantiated; breakage liability variance; operating team not named.',
      raisedBy: 'Sentinel',
      raisedAt: '2026-04-26',
      status: 'open',
    },
  ],

  createdAt: '2025-12-01',
  lastModifiedAt: '2026-04-28',
  estimatedValueUsd: 5200000,
};

// =============================================================================
// APX-DFAB-COVERAGE-2026 · Data Fabric Programme — coverage fixture instance
// Pattern PAT-PRG-DATA-FAB-001
//
// A second DATA-FAB instance targeting uncovered templates:
//   CON-002: vendor data-fabric claim vs source-system data quality / remediation
//   CON-004: build cost vs pilot compute/storage FinOps / operating cost
//   FM-001: infrastructure build without named consuming use-cases
//   FM-002: data quality discovered during build — not baselined at P1
//   FM-004: FinOps surprise — compute/storage costs exceed forecast at activation
// =============================================================================

export const APX_DFAB_COVERAGE_2026_INSTANCE: ProgramInstance = {
  id: 'APX-DFAB-COVERAGE-2026',
  displayId: 'DEMO-APX-DFAB-COV-2026',
  tenantSlug: 'apex-retail',
  tenantId: 'apex-retail',
  name: 'Data Fabric v2 — Coverage Fixture',

  patternId: 'PAT-PRG-DATA-FAB-001',
  patternVersion: '1.0.0',

  currentPhase: 4,
  phases: buildPhaseStates(4, {
    0: {
      gateStatus: 'approved',
      gateEvidence: ['Business case — consuming use-cases named · Nov 2025'],
      enteredAt: '2025-11-03',
      exitedAt: '2025-11-28',
    },
    1: {
      gateStatus: 'approved',
      gateEvidence: ['Data-quality baseline — source systems assessed · Jan 2026'],
      enteredAt: '2025-12-01',
      exitedAt: '2026-01-30',
    },
    2: {
      gateStatus: 'approved',
      gateEvidence: ['Architecture decision — lakehouse pattern · Feb 2026'],
      enteredAt: '2026-02-02',
      exitedAt: '2026-03-06',
    },
    3: {
      gateStatus: 'approved',
      gateEvidence: ['Pilot scope — Demand Forecasting v2 end-to-end · Mar 2026'],
      enteredAt: '2026-03-09',
      exitedAt: '2026-04-04',
    },
    4: { gateStatus: 'open', enteredAt: '2026-04-07' },
  }),

  deliverables: [
    { id: 'dfab-cov-d-001', label: 'Business Case with Consuming Use-Cases', phaseId: 0, status: 'complete', completedAt: '2025-11-22' },
    { id: 'dfab-cov-d-002', label: 'Data-Quality Baseline', phaseId: 1, status: 'complete', completedAt: '2026-01-25' },
    { id: 'dfab-cov-d-003', label: 'Architecture Decision Record', phaseId: 2, status: 'complete', completedAt: '2026-02-28' },
    { id: 'dfab-cov-d-004', label: 'Pilot Results Report', phaseId: 4, status: 'in-progress', owner: 'Data Engineering', dueDate: '2026-05-20' },
    { id: 'dfab-cov-d-005', label: 'FinOps Dashboard', phaseId: 4, status: 'not-started' },
  ],

  evidence: [
    // CON-PRG-DFAB-002: vendor data-fabric claim vs source-system data quality / remediation
    {
      id: 'dfab-cov-ev-001',
      citation:
        'Vendor claims out-of-the-box integration and data quality remediation for source systems; measured source-system data-quality baseline shows domain-specific data quality issues requiring remediation that vendor tooling cannot provide out-of-the-box — data quality gaps need domain-side remediation beyond vendor scope',
      phaseId: 4,
      uploadedAt: '2026-04-12',
      uploadedBy: 'Data Engineering',
      kind: 'assessment',
    },
    // CON-PRG-DFAB-004: build cost forecast vs pilot compute/storage FinOps / operating cost
    {
      id: 'dfab-cov-ev-002',
      citation:
        'Pilot compute cost and storage cost extrapolated to full-domain scope materially exceeds operating cost forecast in business case; FinOps analysis shows pilot-phase compute cost 2.4× higher than forecast; operating cost envelope in business case insufficient at observed consumption rate',
      phaseId: 4,
      uploadedAt: '2026-04-18',
      uploadedBy: 'FinOps Lead',
      kind: 'assessment',
    },
    // FM-PRG-DFAB-001: infrastructure without named consuming use-cases
    {
      id: 'dfab-cov-ev-003',
      citation:
        'Fabric built to generic capability target rather than consuming use-cases; build completes on time but consumption sparse — consuming use-cases not named at origination for two of three platform domains; infrastructure without use-cases producing weak value case at portfolio review',
      phaseId: 4,
      uploadedAt: '2026-04-20',
      uploadedBy: 'Programme Lead',
      kind: 'document',
    },
    // FM-PRG-DFAB-002: data quality discovered during build — source-system issues not baselined at P1
    {
      id: 'dfab-cov-ev-004',
      citation:
        'Source-system data quality issues encountered during build that should have been baselined at P1 Discovery; data quality baseline incomplete at gate — scope creep during build to include remediation; consuming use-case delivered on weakly-validated data; build timeline slipped due to data quality discovery',
      phaseId: 4,
      uploadedAt: '2026-04-16',
      uploadedBy: 'Data Engineering',
      kind: 'document',
    },
    // FM-PRG-DFAB-004: FinOps surprise — compute/storage scaling at activation
    {
      id: 'dfab-cov-ev-005',
      citation:
        'Compute and storage costs scaling non-linearly with consumption; FinOps telemetry absent at activation; finance organisation surprised by operating cost trajectory 6 months post-activation; per-use-case compute cost telemetry not instrumented; FinOps surprise material relative to business case operating cost forecast',
      phaseId: 4,
      uploadedAt: '2026-04-22',
      uploadedBy: 'FinOps Lead',
      kind: 'document',
    },
  ],

  linkedSourceEvents: [],
  linkedPrograms: [],

  sponsor: { id: 'sponsor-dfab-cov', name: 'James Okonkwo', title: 'VP Supply Chain' },

  flags: [
    {
      id: 'dfab-cov-flag-001',
      kind: 'risk',
      description: 'Data quality gaps found in build; FinOps costs tracking above forecast; vendor remediation claim not deliverable.',
      raisedBy: 'Sentinel',
      raisedAt: '2026-04-18',
      status: 'open',
    },
  ],

  createdAt: '2025-11-03',
  lastModifiedAt: '2026-04-22',
  estimatedValueUsd: 2600000,
};
