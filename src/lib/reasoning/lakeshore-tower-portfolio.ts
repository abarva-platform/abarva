import type { ProgramInstance, ProgramPhaseState } from '@/lib/programs/program-instance';
import type { SourceEventInstance } from '@/lib/source/source-event-instance';

function buildPhaseStates(
  currentPhase: number,
  overrides?: Partial<Record<number, Partial<ProgramPhaseState>>>,
): ProgramPhaseState[] {
  const labels = [
    'Originate',
    'Discovery',
    'Synthesis',
    'Design',
    'Execution Roadmap',
    'Approval & Mobilization',
    'Tower Handoff',
  ];

  return labels.map((phaseLabel, phaseId) => {
    let status: ProgramPhaseState['status'];
    if (phaseId < currentPhase) status = 'done';
    else if (phaseId === currentPhase) status = 'current';
    else if (phaseId === currentPhase + 1) status = 'pending';
    else status = 'locked';

    const base: ProgramPhaseState = {
      phaseId,
      phaseLabel,
      status,
      gateStatus: status === 'done' ? 'approved' : status === 'current' ? 'open' : 'na',
      gateEvidence: [],
    };

    return { ...base, ...(overrides?.[phaseId] ?? {}) };
  });
}

export const LSH_KYRIBA_TREASURY_ROLLOUT_2026_INSTANCE: ProgramInstance = {
  id: 'LSH-KYRIBA-2026',
  displayId: 'DIVERSIFIED-KYRIBA-2026',
  tenantSlug: 'lakeshore',
  tenantId: 'lakeshore-holdings',
  name: 'Kyriba global treasury rollout',

  patternId: 'PAT-PRG-DATA-FAB-001',
  patternVersion: '1.0.0',

  currentPhase: 2,
  phases: buildPhaseStates(2, {
    0: {
      gateStatus: 'approved',
      gateEvidence: [
        'CFO sponsor charter approved · Jun 2026',
        'Kyriba value hypothesis logged with projected, tracked, and verified value lanes',
      ],
      enteredAt: '2026-05-20',
      exitedAt: '2026-05-28',
    },
    1: {
      gateStatus: 'approved',
      gateEvidence: [
        'Bank inventory and connectivity matrix loaded',
        'ERP/AP/AR/GL feed-quality scorecard loaded',
        'Entity hierarchy and account hierarchy loaded',
      ],
      enteredAt: '2026-05-29',
      exitedAt: '2026-06-04',
    },
    2: {
      gateStatus: 'open',
      gateEvidence: [
        'Historical cash reconstruction and payment-control UAT evidence still need owner attestation',
      ],
      enteredAt: '2026-06-05',
    },
  }),

  deliverables: [
    { id: 'lsh-kyriba-d-001', label: 'CFO sponsor charter', phaseId: 0, status: 'complete', completedAt: '2026-05-28' },
    { id: 'lsh-kyriba-d-002', label: 'Bank connectivity matrix', phaseId: 1, status: 'complete', completedAt: '2026-06-02' },
    { id: 'lsh-kyriba-d-003', label: 'ERP feed-quality scorecard', phaseId: 1, status: 'complete', completedAt: '2026-06-03' },
    { id: 'lsh-kyriba-d-004', label: 'Entity and account hierarchy registry', phaseId: 1, status: 'complete', completedAt: '2026-06-04' },
    { id: 'lsh-kyriba-d-005', label: 'Historical cash reconstruction workbook', phaseId: 2, status: 'in-progress', owner: 'Treasury data lead', dueDate: '2026-06-14' },
    { id: 'lsh-kyriba-d-006', label: 'Payment-control UAT evidence', phaseId: 2, status: 'blocked', owner: 'Controller', dueDate: '2026-06-18' },
    { id: 'lsh-kyriba-d-007', label: 'Executive readiness packet', phaseId: 2, status: 'in-progress', owner: 'Daniel Whitaker', dueDate: '2026-06-20' },
  ],

  evidence: [
    {
      id: 'lsh-kyriba-ev-001',
      citation: 'Lakeshore bank inventory and connectivity matrix · loaded tenant bundle',
      phaseId: 1,
      uploadedAt: '2026-06-04',
      uploadedBy: 'Steward',
      kind: 'document',
    },
    {
      id: 'lsh-kyriba-ev-002',
      citation: 'ERP, AP, AR, and GL feed quality scorecard · loaded tenant bundle',
      phaseId: 1,
      uploadedAt: '2026-06-04',
      uploadedBy: 'Steward',
      kind: 'assessment',
    },
    {
      id: 'lsh-kyriba-ev-003',
      citation: 'Kyriba rollout failure-mode pattern pack · LSH-TMS-001 through LSH-TMS-012',
      phaseId: 2,
      uploadedAt: '2026-06-05',
      uploadedBy: 'Sentinel',
      kind: 'assessment',
    },
  ],

  linkedSourceEvents: [
    {
      sourceEventId: 'LSH-KYRIBA-TREASURY-2026',
      sourceEventName: 'Kyriba Treasury Rollout Commercial Readiness',
      linkType: 'depends-on',
      description:
        'Source commercial readiness must produce strategy, scope, RFP, response, BAFO, executive-decision, and transition artifacts before Tower treats Kyriba value as decision-grade.',
      blockedAtPhase: 2,
    },
  ],

  linkedPrograms: [],
  sponsor: { id: 'person:lakeshore:daniel-whitaker', name: 'Daniel Whitaker', title: 'CFO / Treasury Sponsor' },
  flags: [
    {
      id: 'lsh-kyriba-flag-001',
      kind: 'blocker',
      description:
        'Tower cannot mark verified realized value until baseline, intervention record, measurement window, and CFO attestation are present.',
      raisedBy: 'Atlas',
      raisedAt: '2026-06-06',
      status: 'open',
    },
  ],

  createdAt: '2026-05-20',
  lastModifiedAt: '2026-06-06',
  estimatedValueUsd: 42000000,
};

export const LSH_KYRIBA_TREASURY_SOURCE_2026_INSTANCE: SourceEventInstance = {
  id: 'LSH-KYRIBA-TREASURY-2026',
  displayId: 'LSH-KYRIBA-TREASURY-2026',
  tenantSlug: 'lakeshore',
  tenantId: 'lakeshore-holdings',
  name: 'Kyriba Treasury Rollout Commercial Readiness',

  patternId: 'PAT-SRC-RFP-001',
  patternVersion: '1.0',
  currentStage: 'BAFO',
  stageHistory: [
    { stageId: 'Strategy', enteredAt: '2026-05-24', exitedAt: '2026-05-29', advancedBy: 'Sentinel Source', gateApprovalRef: 'LSH-SRC-GATE-STRATEGY' },
    { stageId: 'Scope', enteredAt: '2026-05-30', exitedAt: '2026-06-01', advancedBy: 'Daniel Whitaker', gateApprovalRef: 'LSH-SRC-GATE-SCOPE' },
    { stageId: 'RFP', enteredAt: '2026-06-02', exitedAt: '2026-06-04', advancedBy: 'Source owner', gateApprovalRef: 'LSH-SRC-GATE-RFP' },
    { stageId: 'Responses', enteredAt: '2026-06-05', exitedAt: '2026-06-05', advancedBy: 'Source owner' },
    { stageId: 'BAFO', enteredAt: '2026-06-06', advancedBy: 'Source owner' },
  ],

  vendors: [
    {
      id: 'kyriba',
      name: 'Kyriba',
      status: 'invited-bafo',
      invitedToStages: ['Strategy', 'Scope', 'RFP', 'Responses', 'BAFO'],
      riskFlags: [
        {
          id: 'LSH-KYR-RISK-001',
          severity: 'high',
          label: 'Bank connectivity readiness differs by institution',
          detail:
            'H2H, SWIFT, and API readiness vary across Lakeshore relationship banks; rollout confidence depends on critical-bank path proof.',
          status: 'open',
        },
      ],
      differentiators: [
        'Treasury management platform aligned to cash visibility, payments, and bank connectivity',
        'Strong fit for centralized treasury controls across a diversified holding company',
      ],
      pricingBand: 'high',
    },
    {
      id: 'treasury-si-partner',
      name: 'Treasury SI Partner',
      status: 'shortlisted',
      invitedToStages: ['Scope', 'RFP', 'Responses', 'BAFO'],
      riskFlags: [
        {
          id: 'LSH-SI-RISK-001',
          severity: 'medium',
          label: 'SI scope-change governance not yet fully attested',
          detail:
            'Outcome milestones and change-control thresholds need CFO/CIO steering committee approval before mobilization.',
          status: 'open',
        },
      ],
      differentiators: [
        'Implementation governance for bank onboarding, ERP feeds, entity hierarchy, and user adoption',
        'Can coordinate treasury rollout artifacts with Source and Moves evidence gates',
      ],
      pricingBand: 'medium',
    },
  ],

  responses: [
    {
      id: 'LSH-KYR-RFP-001',
      vendorId: 'kyriba',
      stageId: 'RFP',
      receivedAt: '2026-06-04',
      status: 'under-review',
      claims: [
        'Global cash visibility and payment workflow enablement',
        'Bank connectivity implementation requires institution-by-institution readiness',
        'Forecasting value depends on historical cash-position reconstruction',
      ],
    },
    {
      id: 'LSH-SI-RFP-001',
      vendorId: 'treasury-si-partner',
      stageId: 'RFP',
      receivedAt: '2026-06-04',
      status: 'under-review',
      claims: [
        'ERP feed integration and entity hierarchy workstream included',
        'Scope-change governance requires named buyer decision rights',
      ],
    },
  ],

  artifacts: [
    { id: 'lsh-src-art-001', label: 'Strategy memo', stageId: 'Strategy', expectedArtifactId: 'strategy-memo', status: 'approved', createdAt: '2026-05-29' },
    { id: 'lsh-src-art-002', label: 'Scope and readiness pack', stageId: 'Scope', expectedArtifactId: 'scope-pack', status: 'approved', createdAt: '2026-06-01' },
    { id: 'lsh-src-art-003', label: 'RFP package', stageId: 'RFP', expectedArtifactId: 'rfp-package', status: 'approved', createdAt: '2026-06-04' },
    { id: 'lsh-src-art-004', label: 'BAFO comparison worksheet', stageId: 'BAFO', expectedArtifactId: 'bafo-comparison', status: 'draft', createdAt: '2026-06-06' },
    { id: 'lsh-src-art-005', label: 'Executive decision packet', stageId: 'Executive Decision', expectedArtifactId: 'executive-decision-packet', status: 'draft', createdAt: '2026-06-06' },
  ],

  evidence: [
    {
      id: 'lsh-src-ev-001',
      kind: 'document',
      field: 'bank-connectivity-matrix',
      value: 'loaded',
      source: 'Lakeshore loaded tenant bundle',
      recordedAt: '2026-06-04',
    },
    {
      id: 'lsh-src-ev-002',
      kind: 'measurement',
      field: 'projected-value-range',
      value: '$18M-$42M modeled value at stake; verified realized value remains $0 until CFO attestation',
      source: 'Tower value-state proof',
      recordedAt: '2026-06-06',
    },
  ],

  linkedPrograms: [
    {
      programId: 'LSH-KYRIBA-2026',
      programName: 'Kyriba global treasury rollout',
      linkType: 'feeds',
      description:
        'Commercial readiness artifacts feed the Kyriba Move and determine which value can graduate into Tower.',
      blockedAtStage: 'P2 Synthesis',
    },
  ],
  linkedSourceEvents: [],
  sponsor: { id: 'person:lakeshore:daniel-whitaker', name: 'Daniel Whitaker', title: 'CFO / Treasury Sponsor' },
  flags: [
    {
      id: 'lsh-src-flag-001',
      kind: 'blocker',
      description:
        'BAFO and executive-decision artifacts are still draft; Tower may show projected or tracked value, not verified realized savings.',
      raisedBy: 'Sentinel Source',
      raisedAt: '2026-06-06',
      status: 'open',
    },
  ],

  createdAt: '2026-05-24',
  lastModifiedAt: '2026-06-06',
  valueAtStakeUsd: 42000000,
};

export const LAKESHORE_TOWER_PROGRAM_INSTANCES: ProgramInstance[] = [
  LSH_KYRIBA_TREASURY_ROLLOUT_2026_INSTANCE,
];

export const LAKESHORE_TOWER_SOURCE_EVENT_INSTANCES: SourceEventInstance[] = [
  LSH_KYRIBA_TREASURY_SOURCE_2026_INSTANCE,
];
