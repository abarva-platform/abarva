// src/lib/source/source-event-instances.ts
//
// Typed SourceEventInstance seed data for the AMS Vendor Consolidation 2026 event.
// Binds the existing AMS display-layer fixture to PAT-SRC-AMS-001, enabling
// gate evaluation, contradiction detection, and synthesis context building.
//
// Data pulled from:
//   - shell-source-fixture.ts (AMS_SOURCE_EVENT)
//   - ams-outsourcing-2026-view.ts (vendor storyline, AMS_OUTSOURCING_2026_EVENT_ID)
//   - ams-bafo-view.ts (BAFO round, selection committee, invited vendors)
//
// The display layer (SourcingEventDetail) is UNCHANGED — this is additive only.

import type { SourceEventInstance } from '@/lib/source/source-event-instance';

export const AMS_VENDOR_CONSOLIDATION_2026_INSTANCE: SourceEventInstance = {
  // ── Identity ───────────────────────────────────────────────────────────────
  id: 'apex-retail-ams-outsourcing-2026',
  displayId: 'SRC-AMS-2026',
  tenantSlug: 'apex-retail',
  name: 'AMS Vendor Consolidation 2026',

  // ── Pattern binding ────────────────────────────────────────────────────────
  patternId: 'PAT-SRC-AMS-001',
  patternVersion: '1.0',

  // ── Lifecycle state ────────────────────────────────────────────────────────
  currentStage: 'BAFO',
  stageHistory: [
    {
      stageId: 'Plan',
      enteredAt: '2025-11-01',
      exitedAt: '2025-11-28',
      advancedBy: 'priya.mehta',
      gateApprovalRef: 'GATE-APPROVAL-PLAN-001',
    },
    {
      stageId: 'RFI',
      enteredAt: '2025-12-01',
      exitedAt: '2026-01-15',
      advancedBy: 'marcus.chen',
      gateApprovalRef: 'GATE-APPROVAL-RFI-001',
    },
    {
      stageId: 'Shortlist',
      enteredAt: '2026-01-20',
      exitedAt: '2026-02-10',
      advancedBy: 'marcus.chen',
      gateApprovalRef: 'GATE-APPROVAL-SHL-001',
    },
    {
      stageId: 'RFP',
      enteredAt: '2026-02-14',
      exitedAt: '2026-03-07',
      advancedBy: 'priya.mehta',
      gateApprovalRef: 'GATE-APPROVAL-RFP-001',
    },
    {
      stageId: 'Q&A',
      enteredAt: '2026-03-10',
      exitedAt: '2026-03-28',
      advancedBy: 'system',
    },
    {
      stageId: 'Initial-Bid',
      enteredAt: '2026-04-01',
      exitedAt: '2026-04-18',
      advancedBy: 'fiona.wallace',
      gateApprovalRef: 'GATE-APPROVAL-BID-001',
    },
    {
      stageId: 'BAFO',
      enteredAt: '2026-04-28',
      // exitedAt undefined — current stage
      advancedBy: 'priya.mehta',
    },
  ],

  // ── Vendors ────────────────────────────────────────────────────────────────
  // Four vendors from the storyline: Northstar and ArcVault invited to BAFO;
  // BlueMaster and DataPeak excluded.
  vendors: [
    {
      id: 'northstar-managed-services',
      name: 'Northstar Managed Services',
      status: 'invited-bafo',
      invitedToStages: ['RFI', 'Shortlist', 'RFP', 'Initial-Bid', 'BAFO'],
      riskFlags: [
        {
          id: 'RF-NST-001',
          severity: 'high',
          label: 'Pricing opacity on tier-2 application support',
          detail:
            'Tier-2 application support cost is bundled into a platform fee — no itemised breakdown provided.',
          contradictionTemplateId: 'CON-AMS-003',
          status: 'open',
        },
        {
          id: 'RF-NST-002',
          severity: 'medium',
          label: 'SLA scope creep indicators',
          detail:
            'SLA definitions in Section 4.2 are broader than the Apex Retail reference scope — may expand managed footprint post-award.',
          contradictionTemplateId: 'CON-AMS-002',
          status: 'open',
        },
      ],
      differentiators: [
        'Strong AMS track record in retail verticals',
        'Dedicated run-team model with named staffing',
        'Pre-negotiated SLA framework aligned to Apex Retail ops cadence',
      ],
      pricingBand: 'medium',
    },
    {
      id: 'arcvault-managed',
      name: 'ArcVault Managed',
      status: 'invited-bafo',
      invitedToStages: ['RFI', 'Shortlist', 'RFP', 'Initial-Bid', 'BAFO'],
      riskFlags: [
        {
          id: 'RF-ARC-001',
          severity: 'high',
          label: 'Governance framework incomplete',
          detail:
            'Steering committee and escalation paths are not defined in the proposal — creates oversight gap in Year 1.',
          contradictionTemplateId: 'CON-AMS-002',
          status: 'open',
        },
      ],
      differentiators: [
        'Hybrid onshore/nearshore model — resilience without full offshore dependency',
        'Application rationalization advisory included in base scope',
        'Proven CDP/SAP integration AMS experience (2 named references)',
      ],
      pricingBand: 'medium',
    },
    {
      id: 'bluemaster-operations',
      name: 'BlueMaster Operations',
      status: 'declined',
      invitedToStages: ['RFI', 'Shortlist', 'RFP', 'Initial-Bid'],
      riskFlags: [
        {
          id: 'RF-BLU-001',
          severity: 'critical',
          label: 'Transition plan quality gap',
          detail:
            'Transition plan is 6 pages vs industry expectation of 25–40. Critical knowledge transfer milestones absent.',
          contradictionTemplateId: 'CON-AMS-005',
          status: 'acknowledged',
        },
      ],
      differentiators: [
        'Lowest total-cost profile across 40+ application estate',
        'Automated L1/L2 resolution — documented 62% auto-resolution rate',
        'Offshore-dominant delivery model',
      ],
      pricingBand: 'low',
    },
    {
      id: 'datapeak-services',
      name: 'DataPeak Services',
      status: 'declined',
      invitedToStages: ['RFI', 'Shortlist', 'RFP', 'Initial-Bid'],
      riskFlags: [
        {
          id: 'RF-DPK-001',
          severity: 'medium',
          label: 'CDP integration timeline risk',
          detail:
            "DataPeak's standard onboarding cadence is 16 weeks — conflicts with CDP program Q3 milestone.",
          contradictionTemplateId: 'CON-AMS-001',
          status: 'acknowledged',
        },
      ],
      differentiators: [
        'Deep analytics and data platform AMS capability',
        'Embedded Sentinel-like pattern alerting in managed service toolchain',
        'Strong reference from comparable retail client (2023–present)',
      ],
      pricingBand: 'high',
    },
  ],

  // ── Vendor responses ───────────────────────────────────────────────────────
  // RFI: 4 responses received (satisfies GATE-AMS-RFI-01)
  // Initial-Bid: 4 responses received
  // BAFO: 2 invited, responses pending (deadline May 15 2026)
  responses: [
    // RFI responses
    {
      id: 'RESP-RFI-NST',
      vendorId: 'northstar-managed-services',
      stageId: 'RFI',
      receivedAt: '2026-01-10',
      status: 'accepted',
      claims: [
        'Retail vertical AMS experience spanning 12 enterprise clients',
        'Named run-team staffing model included in base scope',
        'SLA framework pre-aligned to Apex Retail ops cadence',
      ],
    },
    {
      id: 'RESP-RFI-ARC',
      vendorId: 'arcvault-managed',
      stageId: 'RFI',
      receivedAt: '2026-01-11',
      status: 'accepted',
      claims: [
        'Hybrid onshore/nearshore delivery model',
        'CDP/SAP integration AMS experience — 2 named references',
        'Application rationalization advisory in base scope',
      ],
    },
    {
      id: 'RESP-RFI-BLU',
      vendorId: 'bluemaster-operations',
      stageId: 'RFI',
      receivedAt: '2026-01-12',
      status: 'accepted',
      claims: [
        '62% automated L1/L2 resolution rate documented',
        'Below-market pricing across 40+ application estate',
        'Offshore-dominant delivery model',
      ],
    },
    {
      id: 'RESP-RFI-DPK',
      vendorId: 'datapeak-services',
      stageId: 'RFI',
      receivedAt: '2026-01-14',
      status: 'accepted',
      claims: [
        'Deep analytics and data platform AMS capability',
        'Comparable retail client reference (2023–present)',
        'Premium pricing — analytics-first AMS scope',
      ],
    },
    // Initial-Bid responses
    {
      id: 'RESP-BID-NST',
      vendorId: 'northstar-managed-services',
      stageId: 'Initial-Bid',
      receivedAt: '2026-04-07',
      status: 'under-review',
      claims: [
        'Mid-range pricing — tier-2 support bundled in platform fee',
        'SLA definitions in Section 4.2 broader than reference scope',
        'Dedicated run-team staffing confirmed by service tower',
      ],
    },
    {
      id: 'RESP-BID-ARC',
      vendorId: 'arcvault-managed',
      stageId: 'Initial-Bid',
      receivedAt: '2026-04-08',
      status: 'under-review',
      claims: [
        'Mid-range pricing with application rationalization advisory included',
        'Nearshore capacity available for CDP Q3 workstream',
        'Governance framework absent — escalation paths not defined',
      ],
    },
    {
      id: 'RESP-BID-BLU',
      vendorId: 'bluemaster-operations',
      stageId: 'Initial-Bid',
      receivedAt: '2026-04-09',
      status: 'declined',
      claims: [
        'Below-market pricing confirmed',
        'Transition plan 6 pages — industry expectation 25–40 pages',
        'KT milestones absent from transition plan',
      ],
    },
    {
      id: 'RESP-BID-DPK',
      vendorId: 'datapeak-services',
      stageId: 'Initial-Bid',
      receivedAt: '2026-04-10',
      status: 'declined',
      claims: [
        'Premium pricing band — analytics-first scope',
        '16-week standard onboarding cadence — CDP Q3 milestone conflict',
        'Strong reference from comparable retail client',
      ],
    },
  ],

  // ── Artifacts ──────────────────────────────────────────────────────────────
  artifacts: [
    // Plan artifacts
    {
      id: 'ART-AMS-PLAN-01-inst',
      label: 'RFP Project Charter',
      stageId: 'Plan',
      expectedArtifactId: 'ART-AMS-PLAN-01',
      status: 'locked',
      createdAt: '2025-11-20',
    },
    {
      id: 'ART-AMS-PLAN-02-inst',
      label: 'Requirements Gathering Workbook',
      stageId: 'Plan',
      expectedArtifactId: 'ART-AMS-PLAN-02',
      status: 'locked',
      createdAt: '2025-11-25',
    },
    {
      id: 'ART-AMS-PLAN-03-inst',
      label: 'Evaluation Criteria Matrix',
      stageId: 'Plan',
      expectedArtifactId: 'ART-AMS-PLAN-03',
      status: 'locked',
      createdAt: '2025-11-26',
    },
    // RFI artifacts
    {
      id: 'ART-AMS-RFI-01-inst',
      label: 'RFI Document (Issued)',
      stageId: 'RFI',
      expectedArtifactId: 'ART-AMS-RFI-01',
      status: 'locked',
      createdAt: '2025-12-05',
    },
    {
      id: 'ART-AMS-RFI-02-inst',
      label: 'Vendor RFI Responses',
      stageId: 'RFI',
      expectedArtifactId: 'ART-AMS-RFI-02',
      status: 'locked',
      createdAt: '2026-01-14',
    },
    // Shortlist artifacts
    {
      id: 'ART-AMS-SHL-01-inst',
      label: 'Vendor Shortlist with Rationale',
      stageId: 'Shortlist',
      expectedArtifactId: 'ART-AMS-SHL-01',
      status: 'locked',
      createdAt: '2026-02-05',
    },
    {
      id: 'ART-AMS-SHL-02-inst',
      label: 'NDA Tracking Log',
      stageId: 'Shortlist',
      expectedArtifactId: 'ART-AMS-SHL-02',
      status: 'locked',
      createdAt: '2026-02-08',
    },
    {
      id: 'ART-AMS-SHL-03-inst',
      label: 'Shortlist Approval Record',
      stageId: 'Shortlist',
      expectedArtifactId: 'ART-AMS-SHL-03',
      status: 'locked',
      createdAt: '2026-02-10',
    },
    // RFP artifacts
    {
      id: 'ART-AMS-RFP-01-inst',
      label: 'RFP Document (Formal)',
      stageId: 'RFP',
      expectedArtifactId: 'ART-AMS-RFP-01',
      status: 'locked',
      createdAt: '2026-02-18',
    },
    {
      id: 'ART-AMS-RFP-02-inst',
      label: 'Vendor Response Template',
      stageId: 'RFP',
      expectedArtifactId: 'ART-AMS-RFP-02',
      status: 'locked',
      createdAt: '2026-02-18',
    },
    {
      id: 'ART-AMS-RFP-03-inst',
      label: 'Q&A Tracking Log',
      stageId: 'RFP',
      expectedArtifactId: 'ART-AMS-RFP-03',
      status: 'locked',
      createdAt: '2026-03-05',
    },
    // Q&A artifacts
    {
      id: 'ART-AMS-QA-01-inst',
      label: 'Q&A Session Log',
      stageId: 'Q&A',
      expectedArtifactId: 'ART-AMS-QA-01',
      status: 'locked',
      createdAt: '2026-03-20',
    },
    {
      id: 'ART-AMS-QA-02-inst',
      label: 'Clarification Amendment Document',
      stageId: 'Q&A',
      expectedArtifactId: 'ART-AMS-QA-02',
      status: 'locked',
      createdAt: '2026-03-28',
    },
    // Initial-Bid artifacts
    {
      id: 'ART-AMS-BID-01-inst',
      label: 'Vendor Proposals',
      stageId: 'Initial-Bid',
      expectedArtifactId: 'ART-AMS-BID-01',
      status: 'locked',
      createdAt: '2026-04-10',
    },
    {
      id: 'ART-AMS-BID-02-inst',
      label: 'Initial Scoring Matrix',
      stageId: 'Initial-Bid',
      expectedArtifactId: 'ART-AMS-BID-02',
      status: 'approved',
      createdAt: '2026-04-16',
    },
    {
      id: 'ART-AMS-BID-03-inst',
      label: 'Financial Model Inputs',
      stageId: 'Initial-Bid',
      expectedArtifactId: 'ART-AMS-BID-03',
      status: 'approved',
      createdAt: '2026-04-17',
    },
    // BAFO artifacts (in progress)
    {
      id: 'ART-AMS-BAFO-01-inst',
      label: 'BAFO Invitation Letter',
      stageId: 'BAFO',
      expectedArtifactId: 'ART-AMS-BAFO-01',
      status: 'locked',
      createdAt: '2026-04-28',
    },
    // BAFO-02 (BAFO Responses) not yet received — intentionally omitted
    // BAFO-03 (TCO Worksheet) in draft
    {
      id: 'ART-AMS-BAFO-03-inst',
      label: 'Normalized 3-Year TCO Worksheet',
      stageId: 'BAFO',
      expectedArtifactId: 'ART-AMS-BAFO-03',
      status: 'draft',
      createdAt: '2026-04-28',
    },
    // BAFO-04 (Security Attestation Checklist) in draft — Vendor B SOC-2 gap open
    {
      id: 'ART-AMS-BAFO-04-inst',
      label: 'Security Attestation Checklist',
      stageId: 'BAFO',
      expectedArtifactId: 'ART-AMS-BAFO-04',
      status: 'draft',
      createdAt: '2026-04-28',
    },
  ],

  // ── Evidence ───────────────────────────────────────────────────────────────
  evidence: [
    // RFI response count — satisfies GATE-AMS-RFI-01 (min 4)
    {
      id: 'EV-001',
      kind: 'measurement',
      field: 'rfi-vendor-response-count',
      value: '4',
      source: 'RFI tracking register',
      recordedAt: '2026-01-14',
    },
    // Initial-Bid response count
    {
      id: 'EV-002',
      kind: 'measurement',
      field: 'initial-bid-vendor-response-count',
      value: '4',
      source: 'Initial-Bid evaluation log',
      recordedAt: '2026-04-10',
    },
    // BAFO: 2 vendors invited, responses pending
    {
      id: 'EV-003',
      kind: 'measurement',
      field: 'bafo-invited-vendor-count',
      value: '2',
      source: 'BAFO invitation log',
      recordedAt: '2026-04-28',
    },
    // ArcVault SOC-2 attestation — current, verified
    {
      id: 'EV-004',
      kind: 'attestation',
      field: 'arcvault-soc2-attestation-status',
      value: 'current',
      source: 'ArcVault SOC 2 Type II report — attestation date 2025-12-01',
      recordedAt: '2026-04-15',
    },
    // Vendor B (BlueMaster) SOC-2 gap — not a BAFO finalist but flagged
    // for completeness; the open risk is about Vendor B (BlueMaster) noted in
    // agent context — re-mapped: the fixture refers to "Vendor B SOC-2 gap"
    // which in the storyline is BlueMaster's security posture question.
    // Per shell-source-fixture riskFlag: 'Vendor B · SOC-2 attestation gap'
    {
      id: 'EV-005',
      kind: 'flag',
      field: 'bluemaster-soc2-attestation-status',
      value: 'gap-open',
      source: 'Security review — BlueMaster SOC 2 Type II not provided',
      recordedAt: '2026-04-15',
      contradictionRef: 'CON-AMS-003',
    },
    // Northstar SOC-2 — current
    {
      id: 'EV-006',
      kind: 'attestation',
      field: 'northstar-soc2-attestation-status',
      value: 'current',
      source: 'Northstar SOC 2 Type II report — attestation date 2026-01-15',
      recordedAt: '2026-04-15',
    },
    // BlueMaster transition plan quality gap — supports contradiction detection
    {
      id: 'EV-007',
      kind: 'flag',
      field: 'bluemaster-transition-plan-page-count',
      value: '6',
      source: 'Initial-Bid proposal review — BlueMaster transition plan',
      recordedAt: '2026-04-09',
      contradictionRef: 'CON-AMS-005',
    },
    // DataPeak onboarding cadence — timeline conflict evidence
    {
      id: 'EV-008',
      kind: 'claim',
      field: 'datapeak-onboarding-cadence-weeks',
      value: '16',
      source: 'DataPeak Initial-Bid proposal Section 3.4',
      recordedAt: '2026-04-10',
      contradictionRef: 'CON-AMS-001',
    },
    // BAFO responses received count (at time of seeding — 0, awaiting deadline)
    {
      id: 'EV-009',
      kind: 'measurement',
      field: 'bafo-responses-received-count',
      value: '0',
      source: 'BAFO response tracker — as of 2026-04-28',
      recordedAt: '2026-04-28',
    },
  ],

  // ── Cross-instance links ───────────────────────────────────────────────────
  linkedPrograms: [
    {
      programId: 'APX-CDP-2026',
      programName: 'Apex Retail CDP Activation',
      linkType: 'unblocks',
      description:
        'AMS award unblocks APX-CDP-2026 P3 Design gate — CDP data layer scope depends on AMS vendor finalization',
      blockedAtStage: 'P3 Design',
    },
  ],
  linkedSourceEvents: [],

  // ── Governance ─────────────────────────────────────────────────────────────
  sponsor: {
    id: 'priya.mehta',
    name: 'Priya Mehta',
    title: 'CIO',
  },
  flags: [
    {
      id: 'GOV-001',
      kind: 'risk',
      description:
        'Vendor B (BlueMaster) SOC-2 Type II attestation not submitted — gap noted but vendor is not a BAFO finalist. Monitor for future engagement.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-15',
      status: 'open',
    },
    {
      id: 'GOV-002',
      kind: 'note',
      description:
        'BAFO response deadline May 15 2026. Selection committee presentation scheduled May 22 2026. Award recommendation to CIO by May 30 2026.',
      raisedBy: 'marcus.chen',
      raisedAt: '2026-04-28',
      status: 'open',
    },
  ],

  // ── Metadata ───────────────────────────────────────────────────────────────
  createdAt: '2025-11-01',
  lastModifiedAt: '2026-04-28',
  valueAtStakeUsd: 8400000,
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMO FIXTURES — bind the previously-unbound lifecycle patterns
//
// Each instance below targets a single SourceEventPatternId that previously
// had zero fixture instances. The evidence maps are deliberately tuned so
// that each pattern's contradiction templates and failure modes have at
// least 2-3 keyword overlaps with at least one evidence-map key/value pair
// — that is the threshold the keyword-matching detectors use to fire.
//
// These fixtures exist so the template-coverage audit at
// /admin/reasoning/coverage shows non-zero coverage on the lifecycle
// patterns that were previously dark, and so demo paths through
// non-AMS sourcing flows have at least one realistic Apex Retail event
// to traverse. Real production data will eventually displace them.
// ─────────────────────────────────────────────────────────────────────────────

// ── DEMO · PAT-SRC-RFP-001 — Standard RFP Lifecycle ──────────────────────────
// Apex Retail competitive RFP for next-generation in-store POS hardware refresh.
// Evidence map intentionally surfaces (a) post-Q&A scope freeze breach, (b)
// criteria-weight adjustment, and (c) sole-respondent compliance — covering
// 3 contradiction templates and 3 failure modes.

export const APEX_RETAIL_RFP_STORE_POS_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-rfp-store-pos-2026',
  displayId: 'DEMO-SRC-RFP-2026',
  tenantSlug: 'apex-retail',
  name: 'In-Store POS Hardware RFP 2026',

  patternId: 'PAT-SRC-RFP-001',
  patternVersion: '1.0',

  currentStage: 'Evaluation',
  stageHistory: [
    { stageId: 'Intake', enteredAt: '2026-01-08', exitedAt: '2026-01-22', advancedBy: 'priya.mehta' },
    { stageId: 'Requirements', enteredAt: '2026-01-25', exitedAt: '2026-02-15', advancedBy: 'marcus.chen' },
    { stageId: 'Market-Engagement', enteredAt: '2026-02-18', exitedAt: '2026-03-04', advancedBy: 'marcus.chen' },
    { stageId: 'RFP-Issue', enteredAt: '2026-03-09', exitedAt: '2026-03-25', advancedBy: 'priya.mehta' },
    { stageId: 'Q&A', enteredAt: '2026-03-26', exitedAt: '2026-04-09', advancedBy: 'system' },
    { stageId: 'Evaluation', enteredAt: '2026-04-12', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'helix-retail-systems',
      name: 'Helix Retail Systems',
      status: 'shortlisted',
      invitedToStages: ['Market-Engagement', 'RFP-Issue', 'Q&A', 'Evaluation'],
      riskFlags: [],
      differentiators: ['Large retail POS install base', 'In-store managed services included'],
      pricingBand: 'medium',
    },
    {
      id: 'meridian-pos-co',
      name: 'Meridian POS Co',
      status: 'shortlisted',
      invitedToStages: ['Market-Engagement', 'RFP-Issue', 'Q&A', 'Evaluation'],
      riskFlags: [],
      differentiators: ['Cloud-native POS stack', 'Shorter implementation timeline'],
      pricingBand: 'low',
    },
  ],

  responses: [
    {
      id: 'RESP-RFP-HLX',
      vendorId: 'helix-retail-systems',
      stageId: 'Evaluation',
      receivedAt: '2026-04-08',
      status: 'under-review',
      claims: [
        'Aggressive delivery timeline 30% shorter than benchmark',
        'Bundled managed services',
      ],
    },
  ],

  artifacts: [
    {
      id: 'ART-RFP-REQ-02-inst',
      label: 'Evaluation Criteria Matrix',
      stageId: 'Requirements',
      expectedArtifactId: 'ART-RFP-REQ-02',
      status: 'approved',
      createdAt: '2026-02-10',
    },
    {
      id: 'ART-RFP-RFP-01-inst',
      label: 'RFP Document',
      stageId: 'RFP-Issue',
      expectedArtifactId: 'ART-RFP-RFP-01',
      status: 'locked',
      createdAt: '2026-03-12',
    },
    {
      id: 'ART-RFP-EVAL-01-inst',
      label: 'Scoring Matrix (draft)',
      stageId: 'Evaluation',
      expectedArtifactId: 'ART-RFP-EVAL-01',
      status: 'draft',
      createdAt: '2026-04-20',
    },
  ],

  evidence: [
    // CON-RFP-001: scope statement vs contract — vendor proposal items "out-of-scope" in contract draft
    {
      id: 'EV-RFP-001',
      kind: 'flag',
      field: 'rfp-contract-scope-delta',
      value:
        'Two material items appear out-of-scope in contract service schedule that vendor RFP scope response described as in-scope: in-store firmware updates, peripheral break-fix coverage. Scope-delta analysis pending.',
      source: 'Legal review of draft service schedule',
      recordedAt: '2026-04-22',
      contradictionRef: 'CON-RFP-001',
    },
    // CON-RFP-002: delivery timeline vs market benchmark
    {
      id: 'EV-RFP-002',
      kind: 'measurement',
      field: 'helix-proposed-delivery-timeline-weeks',
      value:
        'Vendor proposed implementation timeline 30% shorter than market benchmark for comparable scope; resource-loaded plan absent.',
      source: 'Helix proposal Section 5.2',
      recordedAt: '2026-04-08',
      contradictionRef: 'CON-RFP-002',
    },
    // CON-RFP-003: price competitiveness vs TCO
    {
      id: 'EV-RFP-003',
      kind: 'measurement',
      field: 'meridian-year1-price-vs-tco',
      value:
        'Meridian lowest year-1 pricing but normalized 3-year TCO 18% above next alternative — multi-year economics diverge from headline rate.',
      source: 'Procurement TCO model — draft',
      recordedAt: '2026-04-23',
      contradictionRef: 'CON-RFP-003',
    },
    // FM-RFP-001: criteria weight manipulation (post-issue weight adjustment)
    {
      id: 'EV-RFP-004',
      kind: 'flag',
      field: 'evaluation-criteria-weight-adjustment',
      value:
        'Evaluation criteria weights adjusted after proposals received — pre-determined vendor scoring exposure; legal governance defensibility undermined.',
      source: 'Audit log — criteria matrix v1.3',
      recordedAt: '2026-04-18',
    },
    // FM-RFP-002: scope freeze failure
    {
      id: 'EV-RFP-005',
      kind: 'flag',
      field: 'post-qa-scope-change',
      value:
        'Scope change introduced after Q&A close — proposals non-comparable, vendor challenges grounds created.',
      source: 'Procurement governance log',
      recordedAt: '2026-04-15',
    },
    // FM-RFP-003: sole-respondent evaluation
    {
      id: 'EV-RFP-006',
      kind: 'measurement',
      field: 'compliant-proposal-count',
      value:
        'Only one vendor submitted compliant proposal — competitive tension benchmarking eliminated; proceeding to selection without escalation.',
      source: 'RFP response register',
      recordedAt: '2026-04-09',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-RFP-001',
      kind: 'risk',
      description:
        'Sole compliant proposal received; weight adjustment documented after issue. CPO escalation pending.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-18',
      status: 'open',
    },
  ],

  createdAt: '2026-01-08',
  lastModifiedAt: '2026-04-23',
  valueAtStakeUsd: 3200000,
};

// ── DEMO · PAT-SRC-SOLE-001 — Sole-Source / Direct Award Lifecycle ────────────
// Apex Retail sole-source extension to Aurelius Group for a niche legacy ERP
// support engagement. Evidence map fires the lock-in vs market-alternative
// contradiction, the benchmark gap vs best-available claim, regulatory basis
// drift, and several failure modes.

export const APEX_RETAIL_SOLE_SOURCE_ERP_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-sole-source-erp-2026',
  displayId: 'DEMO-SRC-SOLE-2026',
  tenantSlug: 'apex-retail',
  name: 'Aurelius Legacy ERP Support — Sole-Source Award',

  patternId: 'PAT-SRC-SOLE-001',
  patternVersion: '1.0',

  currentStage: 'Approve',
  stageHistory: [
    { stageId: 'Justify', enteredAt: '2026-02-02', exitedAt: '2026-02-20', advancedBy: 'priya.mehta' },
    { stageId: 'Single-Vendor-DD', enteredAt: '2026-02-23', exitedAt: '2026-03-18', advancedBy: 'marcus.chen' },
    { stageId: 'Negotiate', enteredAt: '2026-03-20', exitedAt: '2026-04-15', advancedBy: 'fiona.wallace' },
    { stageId: 'Approve', enteredAt: '2026-04-16', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'aurelius-group',
      name: 'Aurelius Group',
      status: 'selected',
      invitedToStages: ['Justify', 'Single-Vendor-DD', 'Negotiate', 'Approve'],
      riskFlags: [
        {
          id: 'RF-AUR-001',
          severity: 'high',
          label: 'Pricing materially above benchmark median',
          detail: 'Negotiated pricing 18% above external benchmark median across role categories.',
          status: 'open',
        },
      ],
      differentiators: [
        'Holds proprietary integration IP for legacy ERP custom modules',
        'Incumbent for 7 years — deep relationship continuity',
      ],
      pricingBand: 'high',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-SOLE-JUS-01-inst',
      label: 'Sole-Source Justification Memo',
      stageId: 'Justify',
      expectedArtifactId: 'ART-SOLE-JUS-01',
      status: 'locked',
      createdAt: '2026-02-15',
    },
    {
      id: 'ART-SOLE-JUS-02-inst',
      label: 'Market-Alternative Survey',
      stageId: 'Justify',
      expectedArtifactId: 'ART-SOLE-JUS-02',
      status: 'locked',
      createdAt: '2026-02-18',
    },
    {
      id: 'ART-SOLE-NEG-01-inst',
      label: 'External Pricing Benchmark File',
      stageId: 'Negotiate',
      expectedArtifactId: 'ART-SOLE-NEG-01',
      status: 'approved',
      createdAt: '2026-03-25',
    },
  ],

  evidence: [
    // CON-SOLE-001: vendor lock-in claim vs market alternative
    {
      id: 'EV-SOLE-001',
      kind: 'flag',
      field: 'sole-source-justification-claims',
      value:
        'Justification asserts "only vendor" with unique capability and proprietary technology, but market-alternative survey lists two candidate vendors that were not formally disqualified.',
      source: 'Justification memo v2 + market survey',
      recordedAt: '2026-02-20',
      contradictionRef: 'CON-SOLE-001',
    },
    // CON-SOLE-002: pricing benchmark gap vs best-available claim
    {
      id: 'EV-SOLE-002',
      kind: 'measurement',
      field: 'aurelius-pricing-benchmark-variance',
      value:
        'Negotiated pricing 18% above external benchmark median while position paper asserts market-competitive best-available pricing. Variance unaddressed.',
      source: 'External pricing benchmark file',
      recordedAt: '2026-04-02',
      contradictionRef: 'CON-SOLE-002',
    },
    // CON-SOLE-003: regulatory basis vs commercial convenience
    {
      id: 'EV-SOLE-003',
      kind: 'flag',
      field: 'regulatory-basis-vs-commercial-driver',
      value:
        'Justification cites IP exclusivity regulatory exception but underlying commercial driver is incumbent existing relationship and legacy investment continuity.',
      source: 'Legal review notes',
      recordedAt: '2026-03-04',
      contradictionRef: 'CON-SOLE-003',
    },
    // CON-SOLE-004: single-reference account vs independence standard
    {
      id: 'EV-SOLE-004',
      kind: 'flag',
      field: 'reference-call-independence',
      value:
        'All reference calls drawn from vendor nominated list with material dependency on Aurelius parent organisation — coached references provide false assurance.',
      source: 'Reference notes register',
      recordedAt: '2026-03-12',
      contradictionRef: 'CON-SOLE-004',
    },
    // FM-SOLE-001: justification drift to convenience
    {
      id: 'EV-SOLE-005',
      kind: 'flag',
      field: 'justification-rationale-drift',
      value:
        'Justification document drifted during negotiation and approval to operational convenience and sponsor preference; approver signed justification no longer matching original regulatory basis.',
      source: 'Document version history',
      recordedAt: '2026-04-12',
    },
    // FM-SOLE-002: benchmark-after-pricing anchoring
    {
      id: 'EV-SOLE-006',
      kind: 'flag',
      field: 'benchmark-vs-pricing-timing',
      value:
        'External pricing benchmark assembled after vendor pricing was on the table; team unconsciously calibrated benchmark to validate offered price rather than challenge.',
      source: 'Benchmark file metadata',
      recordedAt: '2026-04-01',
    },
    // FM-SOLE-004: conflict of interest disclosure gap
    {
      id: 'EV-SOLE-007',
      kind: 'flag',
      field: 'conflict-interest-disclosure-status',
      value:
        'Sourcing team operates without formal conflict-of-interest declarations; undisclosed relationship surfaced post-award materially damaging without competitive tension.',
      source: 'Internal audit follow-up',
      recordedAt: '2026-04-14',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-SOLE-001',
      kind: 'blocker',
      description: 'Pricing variance >15% over benchmark — CPO approval pack incomplete.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-14',
      status: 'open',
    },
  ],

  createdAt: '2026-02-02',
  lastModifiedAt: '2026-04-16',
  valueAtStakeUsd: 1450000,
};

// ── DEMO · PAT-SRC-FRAMEWORK-001 — Framework Call-Off Lifecycle ───────────────
// Apex Retail mini-tender for security analyst contractors via the Atlantis
// MSA framework. Evidence surfaces scope-stretch, criteria-innovation,
// selective invitation, and rate-card breach.

export const APEX_RETAIL_FRAMEWORK_CALLOFF_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-framework-callout-2026',
  displayId: 'DEMO-SRC-FRAME-2026',
  tenantSlug: 'apex-retail',
  name: 'Atlantis MSA Framework Call-Off — Security Analysts',

  patternId: 'PAT-SRC-FRAMEWORK-001',
  patternVersion: '1.0',

  currentStage: 'Evaluation',
  stageHistory: [
    { stageId: 'Eligibility-Check', enteredAt: '2026-03-01', exitedAt: '2026-03-12', advancedBy: 'marcus.chen' },
    { stageId: 'Mini-Tender', enteredAt: '2026-03-15', exitedAt: '2026-04-09', advancedBy: 'fiona.wallace' },
    { stageId: 'Evaluation', enteredAt: '2026-04-12', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'cipher-talent',
      name: 'Cipher Talent Group',
      status: 'shortlisted',
      invitedToStages: ['Mini-Tender', 'Evaluation'],
      riskFlags: [],
      differentiators: ['Prior good performance with Apex SOC team'],
      pricingBand: 'high',
    },
    {
      id: 'sentinel-people',
      name: 'Sentinel People Co',
      status: 'shortlisted',
      invitedToStages: ['Mini-Tender', 'Evaluation'],
      riskFlags: [],
      differentiators: ['Geographic coverage in EMEA hubs'],
      pricingBand: 'medium',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-FRAME-EL-01-inst',
      label: 'Framework Validity Confirmation',
      stageId: 'Eligibility-Check',
      expectedArtifactId: 'ART-FRAME-EL-01',
      status: 'locked',
      createdAt: '2026-03-04',
    },
    {
      id: 'ART-FRAME-MT-01-inst',
      label: 'Lot-Eligible Supplier List',
      stageId: 'Mini-Tender',
      expectedArtifactId: 'ART-FRAME-MT-01',
      status: 'approved',
      createdAt: '2026-03-16',
    },
  ],

  evidence: [
    // CON-FRAME-001: scope stretch vs framework boundary
    {
      id: 'EV-FRAME-001',
      kind: 'flag',
      field: 'requirement-scope-vs-framework-scope',
      value:
        'Requirement description includes additional elements extending to incident-response retainers that fall outside framework declared scope, but call-off proceeds under the framework.',
      source: 'Scope-match memo + framework agreement Schedule 2',
      recordedAt: '2026-03-10',
      contradictionRef: 'CON-FRAME-001',
    },
    // CON-FRAME-002: evaluation criteria vs framework-permitted set
    {
      id: 'EV-FRAME-002',
      kind: 'flag',
      field: 'mini-tender-criteria-vs-permitted-set',
      value:
        'Mini-tender evaluation criteria include categories not part of original framework procurement evaluation, creating challenge exposure from framework suppliers who would have bid differently.',
      source: 'Mini-tender invitation document v3',
      recordedAt: '2026-03-18',
      contradictionRef: 'CON-FRAME-002',
    },
    // CON-FRAME-003: selective invitation vs lot-eligibility
    {
      id: 'EV-FRAME-003',
      kind: 'flag',
      field: 'invitation-list-vs-lot-eligibility',
      value:
        'Mini-tender invitee list selected from preferred suppliers based on prior performance; lot-eligible suppliers excluded without objective shortlisting basis.',
      source: 'Procurement governance log',
      recordedAt: '2026-03-15',
      contradictionRef: 'CON-FRAME-003',
    },
    // CON-FRAME-004: call-off pricing vs rate card
    {
      id: 'EV-FRAME-004',
      kind: 'measurement',
      field: 'calloff-pricing-vs-rate-card',
      value:
        'Cipher Talent call-off contract pricing exceeds framework rate card for senior analyst role categories; supplier insists on pricing above rate card.',
      source: 'Negotiation positions log',
      recordedAt: '2026-04-10',
      contradictionRef: 'CON-FRAME-004',
    },
    // FM-FRAME-002: scope-stretch award
    {
      id: 'EV-FRAME-005',
      kind: 'flag',
      field: 'scope-stretch-schedule-pressure',
      value:
        'Requirement scope broader than framework declared scope; team proceeds because alternative competitive procurement would miss timeline.',
      source: 'Sourcing lead memo',
      recordedAt: '2026-03-08',
    },
    // FM-FRAME-003: selective invitation without objective basis
    {
      id: 'EV-FRAME-006',
      kind: 'flag',
      field: 'mini-tender-invitation-basis',
      value:
        'Mini-tender run with subset of lot-eligible suppliers based on prior relationships and sponsor preference rather than objective lot-eligibility basis; award vulnerable to challenge from excluded suppliers.',
      source: 'Mini-tender governance review',
      recordedAt: '2026-03-20',
    },
    // FM-FRAME-004: material deviation in call-off terms
    {
      id: 'EV-FRAME-007',
      kind: 'flag',
      field: 'calloff-terms-deviation',
      value:
        'Call-off contract negotiations introduce pricing scope and term provisions that deviate materially from framework agreement; deviation not surfaced to framework owner.',
      source: 'Contract redline log',
      recordedAt: '2026-04-11',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'marcus.chen', name: 'Marcus Chen', title: 'Head of SOC' },
  flags: [
    {
      id: 'GOV-FRAME-001',
      kind: 'risk',
      description: 'Material deviations from framework agreement detected; framework-owner approval pending.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-11',
      status: 'open',
    },
  ],

  createdAt: '2026-03-01',
  lastModifiedAt: '2026-04-12',
  valueAtStakeUsd: 720000,
};

// ── DEMO · PAT-SRC-RENEWAL-001 — Contract Renewal / Re-Tender Lifecycle ───────
// Apex Retail IAM/SSO platform renewal vs re-tender decision (Centaurus Identity).
// Evidence surfaces stated-vs-actual performance, pricing-vs-market-test,
// escalator gap, and exit-readiness erosion.

export const APEX_RETAIL_RENEWAL_IAM_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-renewal-iam-2026',
  displayId: 'DEMO-SRC-REN-2026',
  tenantSlug: 'apex-retail',
  name: 'Centaurus Identity Platform Renewal Decision',

  patternId: 'PAT-SRC-RENEWAL-001',
  patternVersion: '1.0',

  currentStage: 'Negotiate-Terms',
  stageHistory: [
    { stageId: 'Performance-Review', enteredAt: '2026-01-12', exitedAt: '2026-02-22', advancedBy: 'fiona.wallace' },
    { stageId: 'Market-Test', enteredAt: '2026-02-23', exitedAt: '2026-04-02', advancedBy: 'marcus.chen' },
    { stageId: 'Negotiate-Terms', enteredAt: '2026-04-06', advancedBy: 'priya.mehta' },
  ],

  vendors: [
    {
      id: 'centaurus-identity',
      name: 'Centaurus Identity',
      status: 'active',
      invitedToStages: ['Negotiate-Terms'],
      riskFlags: [
        {
          id: 'RF-CEN-001',
          severity: 'high',
          label: 'Renewal pricing materially above market test',
          detail: 'Renewal pricing >12% above median of market test reference points.',
          status: 'open',
        },
      ],
      differentiators: ['Incumbent for 5 years', 'Deep custom claim mappings'],
      pricingBand: 'high',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-REN-PR-01-inst',
      label: 'Performance Review Report',
      stageId: 'Performance-Review',
      expectedArtifactId: 'ART-REN-PR-01',
      status: 'approved',
      createdAt: '2026-02-18',
    },
    {
      id: 'ART-REN-MT-01-inst',
      label: 'Market Test Reference Pack',
      stageId: 'Market-Test',
      expectedArtifactId: 'ART-REN-MT-01',
      status: 'approved',
      createdAt: '2026-03-30',
    },
  ],

  evidence: [
    // CON-REN-001: stated performance vs incident history
    {
      id: 'EV-REN-001',
      kind: 'flag',
      field: 'performance-summary-vs-incident-history',
      value:
        'Performance summary asserts strong performance and no material issues, but incident history shows 3 SLA breaches and 2 contract-credit invocations in prior 12 months not surfaced in summary.',
      source: 'Incident register Q1-Q4',
      recordedAt: '2026-02-15',
      contradictionRef: 'CON-REN-001',
    },
    // CON-REN-002: renewal pricing vs market test
    {
      id: 'EV-REN-002',
      kind: 'measurement',
      field: 'renewal-pricing-vs-market-test',
      value:
        'Negotiated renewal pricing 14% above median of market test evidence on normalised basis while negotiation summary states fair value competitive renewal below market.',
      source: 'Market test reference pack + redlines',
      recordedAt: '2026-04-09',
      contradictionRef: 'CON-REN-002',
    },
    // CON-REN-003: escalator cap vs external index
    {
      id: 'EV-REN-003',
      kind: 'measurement',
      field: 'escalator-cap-vs-cpi-index',
      value:
        'Escalator cap described as CPI-tied index-tied but actual cap calculation materially divergent from named index over plausible scenarios; escalator floor high enough that index linkage is illusory decoration.',
      source: 'Stress-test of escalator clause',
      recordedAt: '2026-04-08',
      contradictionRef: 'CON-REN-003',
    },
    // CON-REN-004: exit-readiness vs renewal term length
    {
      id: 'EV-REN-004',
      kind: 'flag',
      field: 'exit-readiness-vs-term-length',
      value:
        'Renewal term length increases significantly while exit-readiness obligations weakened — renewal increasing lock-in rather than reducing it.',
      source: 'Redlines comparison vs prior contract',
      recordedAt: '2026-04-11',
      contradictionRef: 'CON-REN-004',
    },
    // FM-REN-001: default-to-renewal without re-test (drift mitigation pattern matches keywords)
    {
      id: 'EV-REN-005',
      kind: 'flag',
      field: 'cumulative-pricing-drift-cycles',
      value:
        'Cumulative pricing drift across multiple renewal cycles material — pricing renegotiated against incumbent positions losing disciplining effect of comparison.',
      source: 'Multi-cycle pricing tracker',
      recordedAt: '2026-03-28',
    },
    // FM-REN-003: escalator erosion
    {
      id: 'EV-REN-006',
      kind: 'measurement',
      field: 'escalator-cap-cycle-comparison',
      value:
        'Pricing escalator caps weakened across successive renewals; cap floor risen, index basis shifted; cumulative effect significant pricing drift above relevant cost-driver index.',
      source: 'Escalator history register',
      recordedAt: '2026-04-08',
    },
    // FM-REN-004: exit-readiness erosion
    {
      id: 'EV-REN-007',
      kind: 'flag',
      field: 'exit-readiness-obligations-trend',
      value:
        'Exit-readiness obligations weakened in renewal negotiations because not high-priority for either party at moment of renewal; cumulative effect across renewals exit becomes increasingly difficult.',
      source: 'Exit-readiness schedule comparison',
      recordedAt: '2026-04-11',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-REN-001',
      kind: 'risk',
      description: 'Performance-summary divergence from incident history; market-test variance >12% — re-tender path under consideration.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-11',
      status: 'open',
    },
  ],

  createdAt: '2026-01-12',
  lastModifiedAt: '2026-04-12',
  valueAtStakeUsd: 2150000,
};

// ── DEMO · PAT-SRC-DECOM-001 — Vendor Decommission / Exit Lifecycle ───────────
// Apex Retail decommission of Helios Legacy ERP vendor following re-tender
// award. Evidence surfaces transition-plan coverage gap, data-return spec
// gap, cutover-vs-stabilisation contradiction, and exit-assistance demand.

export const APEX_RETAIL_DECOM_LEGACY_ERP_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-decom-legacy-erp-2026',
  displayId: 'DEMO-SRC-DEC-2026',
  tenantSlug: 'apex-retail',
  name: 'Helios Legacy ERP Vendor Decommission',

  patternId: 'PAT-SRC-DECOM-001',
  patternVersion: '1.0',

  currentStage: 'Service-Cutover',
  stageHistory: [
    { stageId: 'Notify', enteredAt: '2026-01-15', exitedAt: '2026-02-04', advancedBy: 'priya.mehta' },
    { stageId: 'Transition-Plan', enteredAt: '2026-02-05', exitedAt: '2026-03-02', advancedBy: 'marcus.chen' },
    { stageId: 'Knowledge-Transfer', enteredAt: '2026-03-03', exitedAt: '2026-04-15', advancedBy: 'fiona.wallace' },
    { stageId: 'Service-Cutover', enteredAt: '2026-04-18', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'helios-erp',
      name: 'Helios ERP Services (outgoing)',
      status: 'active',
      invitedToStages: [],
      riskFlags: [
        {
          id: 'RF-HEL-001',
          severity: 'high',
          label: 'KT under-resourced with junior outgoing-vendor staff',
          detail: 'Senior named resources redeployed to next engagement; KT executed by junior staff.',
          status: 'open',
        },
      ],
      differentiators: [],
      pricingBand: null,
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-DEC-NO-01-inst',
      label: 'Termination Notice',
      stageId: 'Notify',
      expectedArtifactId: 'ART-DEC-NO-01',
      status: 'locked',
      createdAt: '2026-01-25',
    },
  ],

  evidence: [
    // CON-DEC-001: KT plan coverage vs service inventory
    {
      id: 'EV-DEC-001',
      kind: 'flag',
      field: 'transition-plan-vs-service-inventory',
      value:
        'Joint transition plan covers fewer service elements than documented service inventory — key services primary scope addressed but inventory contains material elements not addressed.',
      source: 'Service inventory cross-check',
      recordedAt: '2026-02-28',
      contradictionRef: 'CON-DEC-001',
    },
    // CON-DEC-002: data return certification vs data privacy compliance
    {
      id: 'EV-DEC-002',
      kind: 'flag',
      field: 'data-return-certification-completeness',
      value:
        'Data return certification omits destruction methodology residual copy handling and sub-processor data handling specifics where applicable data-privacy regime requires those specifics.',
      source: 'Privacy office review',
      recordedAt: '2026-04-20',
      contradictionRef: 'CON-DEC-002',
    },
    // CON-DEC-003: cutover acceptance vs stabilisation evidence
    {
      id: 'EV-DEC-003',
      kind: 'flag',
      field: 'cutover-acceptance-vs-stabilisation',
      value:
        'Cutover declared successful complete despite material incidents observed during stabilisation window — stabilisation report records 3 severity-2 incidents.',
      source: 'Cutover acceptance memo + stabilisation report',
      recordedAt: '2026-04-22',
      contradictionRef: 'CON-DEC-003',
    },
    // CON-DEC-004: exit-assistance hours vs forecast demand
    {
      id: 'EV-DEC-004',
      kind: 'measurement',
      field: 'exit-assistance-pool-vs-demand',
      value:
        'Forecast exit-assistance demand based on KT scope integration count and incident history exceeds contracted hour pool — forecast 145% of contracted pool.',
      source: 'Exit-assistance utilisation forecast',
      recordedAt: '2026-04-21',
      contradictionRef: 'CON-DEC-004',
    },
    // FM-DEC-001: knowledge loss
    {
      id: 'EV-DEC-005',
      kind: 'flag',
      field: 'kt-resourcing-quality',
      value:
        'KT rushed under-resourced executed by junior outgoing-vendor resources without sufficient depth; service quality issues likely months after cutover when domain knowledge gaps surface as incidents incoming party cannot resolve alone.',
      source: 'KT staffing review',
      recordedAt: '2026-04-12',
    },
    // FM-DEC-002: data orphaning
    {
      id: 'EV-DEC-006',
      kind: 'flag',
      field: 'customer-data-orphan-status',
      value:
        'Customer data remains in outgoing-vendor systems after cutover; data return scope incomplete formats unagreed sub-processor data handling not addressed creating regulatory exposure intellectual property risk.',
      source: 'Data return review',
      recordedAt: '2026-04-22',
    },
    // FM-DEC-004: cutover roll-back path untested
    {
      id: 'EV-DEC-007',
      kind: 'flag',
      field: 'cutover-rollback-readiness',
      value:
        'Cutover plan includes roll-back option in name but roll-back path not tested; dependencies already shifted to incoming party making roll-back impractical.',
      source: 'Cutover rehearsal log',
      recordedAt: '2026-04-17',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-DEC-001',
      kind: 'blocker',
      description: 'Transition plan coverage gaps + stabilisation incidents — cutover acceptance under review.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-22',
      status: 'open',
    },
  ],

  createdAt: '2026-01-15',
  lastModifiedAt: '2026-04-22',
  valueAtStakeUsd: 1900000,
};

// ── DEMO · PAT-SRC-EMERGENCY-001 — Emergency / Crisis Sourcing Lifecycle ──────
// Apex Retail emergency sourcing of payment-fraud detection capability after a
// regulator-imposed remediation deadline. Evidence surfaces foreseen-vs-genuine
// trigger, backfill commitment vs execution, DD compression vs substitution,
// and contract-term-vs-emergency-horizon contradiction.

export const APEX_RETAIL_EMERGENCY_PAYMENT_2026_INSTANCE: SourceEventInstance = {
  id: 'apex-retail-emergency-payment-2026',
  displayId: 'DEMO-SRC-EMR-2026',
  tenantSlug: 'apex-retail',
  name: 'Payment Fraud Detection — Emergency Sourcing',

  patternId: 'PAT-SRC-EMERGENCY-001',
  patternVersion: '1.0',

  currentStage: 'Backfill-Governance',
  stageHistory: [
    { stageId: 'Trigger-Confirm', enteredAt: '2026-03-20', exitedAt: '2026-03-22', advancedBy: 'priya.mehta' },
    { stageId: 'Rapid-DD', enteredAt: '2026-03-23', exitedAt: '2026-03-29', advancedBy: 'marcus.chen' },
    { stageId: 'Award', enteredAt: '2026-03-30', exitedAt: '2026-04-02', advancedBy: 'priya.mehta' },
    { stageId: 'Backfill-Governance', enteredAt: '2026-04-03', advancedBy: 'fiona.wallace' },
  ],

  vendors: [
    {
      id: 'argos-fraud-detect',
      name: 'Argos Fraud Detect',
      status: 'selected',
      invitedToStages: ['Rapid-DD', 'Award'],
      riskFlags: [
        {
          id: 'RF-ARG-001',
          severity: 'high',
          label: 'DD checks incomplete at award',
          detail: 'Independent reference and security baseline confirmation skipped under schedule pressure.',
          status: 'open',
        },
      ],
      differentiators: ['Rapid deployment offering', 'Pre-built payment-rail integrations'],
      pricingBand: 'high',
    },
  ],

  responses: [],

  artifacts: [
    {
      id: 'ART-EMR-TR-01-inst',
      label: 'Emergency Trigger Memo',
      stageId: 'Trigger-Confirm',
      expectedArtifactId: 'ART-EMR-TR-01',
      status: 'locked',
      createdAt: '2026-03-21',
    },
  ],

  evidence: [
    // CON-EMR-001: emergency trigger vs schedule pressure (foreseeable need)
    {
      id: 'EV-EMR-001',
      kind: 'flag',
      field: 'trigger-vs-scheduling-history',
      value:
        'Emergency trigger described as urgent critical immediate need sudden event but underlying scheduling history shows requirement was foreseeable for 60+ days without standard procurement initiation; planning evidence shows earlier awareness in steering minutes.',
      source: 'Steering committee minutes Jan-Feb',
      recordedAt: '2026-03-22',
      contradictionRef: 'CON-EMR-001',
    },
    // CON-EMR-002: backfill commitment vs backfill execution
    {
      id: 'EV-EMR-002',
      kind: 'flag',
      field: 'backfill-commitment-execution-status',
      value:
        'Backfill governance commitment documented at trigger but backfill not completed within committed window — principal mechanism by which emergency framing becomes permanent procurement-discipline bypass.',
      source: 'Backfill tracker',
      recordedAt: '2026-04-25',
      contradictionRef: 'CON-EMR-002',
    },
    // CON-EMR-003: compressed DD vs substitution
    {
      id: 'EV-EMR-003',
      kind: 'flag',
      field: 'rapid-dd-pack-completeness',
      value:
        'Rapid-DD pack omits independent reference check and security baseline confirmation — two of four non-negotiable checks missing from DD pack; financial-health and capability validation present but reference and security artifacts absent.',
      source: 'DD pack inventory',
      recordedAt: '2026-03-29',
      contradictionRef: 'CON-EMR-003',
    },
    // CON-EMR-004: emergency horizon vs contract term
    {
      id: 'EV-EMR-004',
      kind: 'measurement',
      field: 'contract-term-vs-emergency-horizon',
      value:
        'Negotiated contract term length 18 months materially exceeds stated emergency horizon of 60 days — 18-month contract under emergency authority is sole-source contract executed without sole-source governance.',
      source: 'Contract term sheet',
      recordedAt: '2026-04-01',
      contradictionRef: 'CON-EMR-004',
    },
    // FM-EMR-001: emergency framing without genuine trigger
    {
      id: 'EV-EMR-005',
      kind: 'flag',
      field: 'trigger-framing-validity',
      value:
        'Team frames foreseen-but-not-actioned requirement as emergency to bypass standard procurement disciplines; framing procedurally invalid even where underlying need genuine because emergency authority reserved for sudden triggers.',
      source: 'Procurement governance review',
      recordedAt: '2026-03-22',
    },
    // FM-EMR-002: backfill governance never executes
    {
      id: 'EV-EMR-006',
      kind: 'flag',
      field: 'backfill-execution-priority',
      value:
        'Emergency authority granted with backfill commitment but backfill never executed because emergency has passed and team redeployed to other priorities — bypass becomes permanent.',
      source: 'Backfill tracker — overdue items',
      recordedAt: '2026-04-25',
    },
    // FM-EMR-003: DD substitution under time pressure
    {
      id: 'EV-EMR-007',
      kind: 'flag',
      field: 'dd-substitution-pattern',
      value:
        'Rapid-DD became substitution rather than compression — independent reference and security check omitted entirely under schedule pressure replaced with vendor self-attestation and sponsor assurance.',
      source: 'Audit walkthrough',
      recordedAt: '2026-03-29',
    },
    // FM-EMR-004: emergency contract becomes permanent
    {
      id: 'EV-EMR-008',
      kind: 'flag',
      field: 'transition-out-clause-status',
      value:
        'Short-form emergency contract renewed extended without re-procurement under standard governance once emergency contained — emergency framing locks in vendor permanently; transition-out clause absent.',
      source: 'Contract management notes',
      recordedAt: '2026-04-25',
    },
  ],

  linkedPrograms: [],
  linkedSourceEvents: [],

  sponsor: { id: 'priya.mehta', name: 'Priya Mehta', title: 'CIO' },
  flags: [
    {
      id: 'GOV-EMR-001',
      kind: 'blocker',
      description: 'Backfill window expired without completion; CPO escalation triggered.',
      raisedBy: 'sentinel-system',
      raisedAt: '2026-04-25',
      status: 'open',
    },
  ],

  createdAt: '2026-03-20',
  lastModifiedAt: '2026-04-25',
  valueAtStakeUsd: 870000,
};

/**
 * All typed SourceEventInstances for the Apex Retail tenant.
 * The AMS instance is the canonical demo. The DEMO-* instances below bind
 * each previously-unbound source-event lifecycle pattern.
 */
export const SOURCE_EVENT_INSTANCES: SourceEventInstance[] = [
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
  APEX_RETAIL_RFP_STORE_POS_2026_INSTANCE,
  APEX_RETAIL_SOLE_SOURCE_ERP_2026_INSTANCE,
  APEX_RETAIL_FRAMEWORK_CALLOFF_2026_INSTANCE,
  APEX_RETAIL_RENEWAL_IAM_2026_INSTANCE,
  APEX_RETAIL_DECOM_LEGACY_ERP_2026_INSTANCE,
  APEX_RETAIL_EMERGENCY_PAYMENT_2026_INSTANCE,
];
