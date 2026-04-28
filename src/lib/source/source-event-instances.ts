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

/**
 * All typed SourceEventInstances for the Apex Retail tenant.
 * Additional instances (e.g. a future RFP event) are appended here.
 */
export const SOURCE_EVENT_INSTANCES: SourceEventInstance[] = [
  AMS_VENDOR_CONSOLIDATION_2026_INSTANCE,
];
