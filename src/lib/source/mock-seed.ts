import type {
  SourceEvidenceContext,
  SourcePatternSectionContext,
  SourceScorecardSnapshot,
} from './agent-context';
import type {
  SourceAttachment,
  SourceAttachmentSummary,
} from './attachments';
import type {
  AbarvaSourceDashboardData,
  SourceArtifactDetail,
  SourceValueLedgerSnapshot,
  SourcingEventDetail,
  SourcingEventSummary,
} from './types';
import {
  SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS,
  SOURCE_GOLDEN_EVENT_IDS,
  SOURCE_GOLDEN_EVENT_VALUES_USD,
  SOURCE_LIFECYCLE_STATUS_LABELS,
  SOURCE_STAGE_LABELS,
  SOURCE_TOTAL_VALUE_AT_STAKE_USD,
  SOURCE_WAITING_LIFECYCLE_STATUSES,
} from './constants';

const events: SourcingEventDetail[] = [
  {
    id: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    code: 'SRC-001',
    name: 'Data & AI Modernization SI Selection',
    accountName: 'Northstar Holdings',
    leadAgent: 'Nexus',
    archetype: 'Data & AI Modernization',
    rigor: 'enhanced',
    status: 'waiting_on_client',
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS.waiting_on_client,
    priority: 'high',
    currentStageKey: 'scope',
    currentStageLabel: SOURCE_STAGE_LABELS.scope,
    openAlerts: 2,
    owner: 'Client PMO Lead',
    agingDays: 12,
    blocker: 'Application inventory and analytics workload baseline missing.',
    nextAction: 'Upload application/workload inventory',
    isAtRisk: true,
    valueAtStakeUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.dataAiModernization],
    projectedValueUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.dataAiModernization],
    realizedValueUsd: 0,
    nextDecision: 'Confirm whether the scope is narrow enough to start SI strategy design.',
    synopsis:
      'Nexus is structuring a modernization sourcing event that needs the baseline inventory before the strategy can be trusted.',
    problemStatement:
      'The estate is large enough to support a major sourcing event, but the scope is still vulnerable to narrative inflation because the application and analytics baselines are incomplete.',
    stages: [
      {
        key: 'intake',
        label: 'Intake',
        status: 'complete',
        summary: 'Executive sponsor, objective, and sourcing perimeter were accepted.',
        gate: {
          id: 'gate-source-001-intake',
          label: 'Intake accepted',
          status: 'approved',
          ownerRole: 'Transformation Office',
          requiredArtifacts: ['Sourcing Event Brief'],
          blocker: null,
        },
      },
      {
        key: 'scope',
        label: SOURCE_STAGE_LABELS.scope,
        status: 'blocked',
        summary: 'Scope is framed, but missing application inventory and analytics workload data block a credible transition to sourcing strategy.',
        gate: {
          id: 'gate-source-001-scope',
          label: 'Scope ready',
          status: 'blocked',
          ownerRole: 'Client PMO Lead',
          requiredArtifacts: ['Minimum Data Request', 'Scope Document', 'Projected Value Ledger'],
          blocker: 'Application inventory and analytics workload baseline still missing.',
        },
      },
      {
        key: 'sourcing_strategy',
        label: SOURCE_STAGE_LABELS.sourcing_strategy,
        status: 'not_started',
        summary: 'Strategy remains locked until baseline inputs are uploaded and reviewed.',
        gate: {
          id: 'gate-source-001-strategy',
          label: 'Sourcing strategy ready',
          status: 'not_started',
          ownerRole: 'Nexus',
          requiredArtifacts: ['Sourcing strategy options', 'Vendor universe'],
          blocker: null,
        },
      },
      {
        key: 'selection',
        label: SOURCE_STAGE_LABELS.selection,
        status: 'not_started',
        summary: 'Selection is downstream of the strategy and scorecard pack.',
        gate: {
          id: 'gate-source-001-selection',
          label: 'Selection package ready',
          status: 'not_started',
          ownerRole: 'CIO + PMO',
          requiredArtifacts: ['Evaluation Scorecard', 'Recommendation memo'],
          blocker: null,
        },
      },
      {
        key: 'value_realization',
        label: SOURCE_STAGE_LABELS.value_realization,
        status: 'not_started',
        summary: 'Realization begins once the partner is selected and the modernization work is mobilized.',
        gate: {
          id: 'gate-source-001-realization',
          label: 'Value ledger live',
          status: 'not_started',
          ownerRole: 'Value Office',
          requiredArtifacts: ['Measurement plan'],
          blocker: null,
        },
      },
    ],
    alerts: [
      {
        id: 'alert-source-001-risk',
        title: 'Scope is at risk of drifting before strategy design starts',
        detail: 'The event has been waiting 12 days on client inputs and should be treated as at-risk until the baseline is complete.',
        severity: 'critical',
        status: 'open',
      },
      {
        id: 'alert-source-001-ledger',
        title: 'Projected value still rests on directional assumptions',
        detail: 'Line items exist, but evidence depth is uneven until baseline uploads are complete.',
        severity: 'warning',
        status: 'open',
      },
    ],
    artifacts: [
      {
        id: 'artifact-source-001-data-request',
        title: 'Minimum Data Request',
        kind: 'artifact_packet',
        status: 'draft',
        summary: 'Structured input request for application, workload, contract, and delivery baseline.',
        sourceCount: 0,
        updatedAt: '2026-04-24',
      },
      {
        id: 'artifact-source-001-brief',
        title: 'Sourcing Event Brief',
        kind: 'charter',
        status: 'draft',
        summary: 'Executive framing for the modernization sourcing event.',
        sourceCount: 3,
        updatedAt: '2026-04-24',
      },
      {
        id: 'artifact-source-001-ledger',
        title: 'Projected Value Ledger',
        kind: 'value_ledger',
        status: 'draft',
        summary: 'Projected value by workstream with assumption and measurement placeholders.',
        sourceCount: 2,
        updatedAt: '2026-04-24',
      },
    ],
    scorecard: {
      decisionOwner: 'Client PMO Lead',
      reviewCadence: 'Twice weekly until scope gate clears',
      approvalState: 'not_started',
      criteria: [
        {
          id: 'crit-source-001-1',
          label: 'Application inventory complete',
          ownerRole: 'Client PMO Lead',
          required: true,
          status: 'blocked',
          note: 'Inventory upload is the main gating requirement for strategy design.',
        },
        {
          id: 'crit-source-001-2',
          label: 'Workload baseline validated',
          ownerRole: 'Data Platform Lead',
          required: true,
          status: 'draft',
          note: 'Baseline assumptions exist, but no client-backed validation yet.',
        },
      ],
    },
    valueLedger: {
      updatedAt: '2026-04-24',
      projected: [
        {
          id: 'ledger-source-001-1',
          eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
          eventName: 'Data & AI Modernization SI Selection',
          kind: 'projected',
          label: 'Legacy platform migration savings',
          stageKey: 'scope',
          amountUsd: 7_800_000,
          confidence: 'medium',
          evidenceCount: 1,
          note: 'Target-state platform consolidation estimate.',
        },
        {
          id: 'ledger-source-001-2',
          eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
          eventName: 'Data & AI Modernization SI Selection',
          kind: 'projected',
          label: 'Report rationalization productivity',
          stageKey: 'scope',
          amountUsd: 3_200_000,
          confidence: 'low',
          evidenceCount: 0,
          note: 'Depends on analytics workload baseline and duplicate report retirement count.',
        },
        {
          id: 'ledger-source-001-3',
          eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
          eventName: 'Data & AI Modernization SI Selection',
          kind: 'projected',
          label: 'Vendor consolidation savings',
          stageKey: 'scope',
          amountUsd: 4_100_000,
          confidence: 'medium',
          evidenceCount: 1,
          note: 'Current contract inventory and rationalized vendor mix.',
        },
        {
          id: 'ledger-source-001-4',
          eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
          eventName: 'Data & AI Modernization SI Selection',
          kind: 'projected',
          label: 'AI-enabled delivery acceleration',
          stageKey: 'scope',
          amountUsd: 3_400_000,
          confidence: 'low',
          evidenceCount: 0,
          note: 'Acceleration assumption depends on delivery model and backlog shape.',
        },
      ],
      realized: [],
    },
  },
  {
    id: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
    code: 'SRC-002',
    name: 'AMS Consolidation Assessment',
    accountName: 'Northstar Holdings',
    leadAgent: 'Nexus',
    archetype: 'Managed Services / Outsourcing',
    rigor: 'strategic',
    status: 'active',
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS.active,
    priority: 'high',
    currentStageKey: 'sourcing_strategy',
    currentStageLabel: SOURCE_STAGE_LABELS.sourcing_strategy,
    openAlerts: 1,
    owner: 'CIO Office',
    agingDays: 3,
    blocker: null,
    nextAction: 'Confirm vendor shortlist and sourcing model',
    isAtRisk: false,
    valueAtStakeUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.amsConsolidation],
    projectedValueUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.amsConsolidation],
    realizedValueUsd: 0,
    nextDecision: 'Lock the sourcing model before packaging the vendor exercise.',
    synopsis:
      'Nexus has enough baseline coverage to move through sourcing strategy, but the shortlist and model shape still need an executive-quality decision.',
    problemStatement:
      'The consolidation opportunity is large, but the organization needs a clear sourcing model before downstream work becomes expensive to unwind.',
    stages: [
      {
        key: 'intake',
        label: 'Intake',
        status: 'complete',
        summary: 'CIO office sponsored the assessment and declared the retained-organization question in scope.',
        gate: {
          id: 'gate-source-002-intake',
          label: 'Intake accepted',
          status: 'approved',
          ownerRole: 'CIO Office',
          requiredArtifacts: ['Sourcing Event Brief'],
          blocker: null,
        },
      },
      {
        key: 'scope',
        label: SOURCE_STAGE_LABELS.scope,
        status: 'complete',
        summary: 'Service towers, vendor inventory, and run spend were collected.',
        gate: {
          id: 'gate-source-002-scope',
          label: 'Scope ready',
          status: 'approved',
          ownerRole: 'Nexus',
          requiredArtifacts: ['Scope Document', 'Run spend baseline'],
          blocker: null,
        },
      },
      {
        key: 'sourcing_strategy',
        label: SOURCE_STAGE_LABELS.sourcing_strategy,
        status: 'active',
        summary: 'The team is deciding between tower consolidation paths and the vendor shortlist is nearly ready.',
        gate: {
          id: 'gate-source-002-strategy',
          label: 'Sourcing strategy ready',
          status: 'in_review',
          ownerRole: 'CIO Office',
          requiredArtifacts: ['Sourcing strategy note', 'Projected Value Ledger'],
          blocker: null,
        },
      },
      {
        key: 'selection',
        label: SOURCE_STAGE_LABELS.selection,
        status: 'not_started',
        summary: 'Selection will begin once the sourcing model and shortlist are approved.',
        gate: {
          id: 'gate-source-002-selection',
          label: 'Selection package ready',
          status: 'not_started',
          ownerRole: 'Procurement Lead',
          requiredArtifacts: ['Evaluation Scorecard', 'Shortlist recommendation'],
          blocker: null,
        },
      },
      {
        key: 'value_realization',
        label: SOURCE_STAGE_LABELS.value_realization,
        status: 'not_started',
        summary: 'Value tracking starts after partner selection and mobilization.',
        gate: {
          id: 'gate-source-002-realization',
          label: 'Value ledger live',
          status: 'not_started',
          ownerRole: 'Value Office',
          requiredArtifacts: ['Savings realization plan'],
          blocker: null,
        },
      },
    ],
    alerts: [
      {
        id: 'alert-source-002-shortlist',
        title: 'Vendor shortlist should be locked this week',
        detail: 'The event is moving well, but the sourcing model decision should not drift into package assembly.',
        severity: 'info',
        status: 'open',
      },
    ],
    artifacts: [
      {
        id: 'artifact-source-002-brief',
        title: 'Sourcing Event Brief',
        kind: 'charter',
        status: 'draft',
        summary: 'Executive framing and tower coverage for the AMS event.',
        sourceCount: 4,
        updatedAt: '2026-04-24',
      },
      {
        id: 'artifact-source-002-scorecard',
        title: 'Evaluation Scorecard',
        kind: 'scorecard',
        status: 'draft',
        summary: 'Governance panel for future vendor evaluation.',
        sourceCount: 2,
        updatedAt: '2026-04-24',
      },
    ],
    scorecard: {
      decisionOwner: 'CIO Office',
      reviewCadence: 'Weekly',
      approvalState: 'in_review',
      criteria: [
        {
          id: 'crit-source-002-1',
          label: 'Sourcing model agreed',
          ownerRole: 'CIO Office',
          required: true,
          status: 'ready',
          note: 'Decision is close but not yet ratified.',
        },
        {
          id: 'crit-source-002-2',
          label: 'Vendor shortlist confirmed',
          ownerRole: 'Procurement Lead',
          required: true,
          status: 'draft',
          note: 'Awaiting one final review pass.',
        },
      ],
    },
    valueLedger: {
      updatedAt: '2026-04-24',
      projected: [
        {
          id: 'ledger-source-002-1',
          eventId: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
          eventName: 'AMS Consolidation Assessment',
          kind: 'projected',
          label: 'Run-cost consolidation savings',
          stageKey: 'sourcing_strategy',
          amountUsd: 28_000_000,
          confidence: 'medium',
          evidenceCount: 2,
          note: 'Tower rationalization and operating model savings.',
        },
        {
          id: 'ledger-source-002-2',
          eventId: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
          eventName: 'AMS Consolidation Assessment',
          kind: 'projected',
          label: 'Vendor overlap elimination',
          stageKey: 'sourcing_strategy',
          amountUsd: 14_000_000,
          confidence: 'medium',
          evidenceCount: 1,
          note: 'Savings depend on vendor model selection and retained-org design.',
        },
      ],
      realized: [],
    },
  },
  {
    id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    code: 'SRC-003',
    name: 'Digital App Build Partner Selection',
    accountName: 'Northstar Holdings',
    leadAgent: 'Nexus',
    archetype: 'Digital Product Build',
    rigor: 'standard',
    status: 'waiting_on_vendor',
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS.waiting_on_vendor,
    priority: 'medium',
    currentStageKey: 'vendor_responses',
    currentStageLabel: SOURCE_STAGE_LABELS.vendor_responses,
    openAlerts: 1,
    owner: 'Procurement Lead',
    agingDays: 6,
    blocker: 'Two vendors missing pricing templates.',
    nextAction: 'Send vendor response reminder',
    isAtRisk: false,
    valueAtStakeUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild],
    projectedValueUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild],
    realizedValueUsd: 0,
    nextDecision: 'Decide whether to hold the deadline or narrow the field.',
    synopsis:
      'The event is structurally healthy, but vendor response quality is uneven and the pricing template gap should be closed quickly.',
    problemStatement:
      'Selection quality will degrade if pricing templates remain inconsistent across vendors.',
    stages: [
      {
        key: 'intake',
        label: 'Intake',
        status: 'complete',
        summary: 'Product intent, timeline, and delivery constraints were agreed.',
        gate: {
          id: 'gate-source-003-intake',
          label: 'Intake accepted',
          status: 'approved',
          ownerRole: 'Digital Product Sponsor',
          requiredArtifacts: ['Sourcing Event Brief'],
          blocker: null,
        },
      },
      {
        key: 'scope',
        label: SOURCE_STAGE_LABELS.scope,
        status: 'complete',
        summary: 'Delivery scope and operating assumptions were documented.',
        gate: {
          id: 'gate-source-003-scope',
          label: 'Scope ready',
          status: 'approved',
          ownerRole: 'Product Lead',
          requiredArtifacts: ['Scope Document'],
          blocker: null,
        },
      },
      {
        key: 'vendor_responses',
        label: SOURCE_STAGE_LABELS.vendor_responses,
        status: 'blocked',
        summary: 'Responses are in flight, but two vendors still owe full pricing templates.',
        gate: {
          id: 'gate-source-003-responses',
          label: 'Vendor responses normalized',
          status: 'blocked',
          ownerRole: 'Procurement Lead',
          requiredArtifacts: ['RFP/RFI Outline', 'Vendor response pack'],
          blocker: 'Two vendors are missing complete pricing templates.',
        },
      },
      {
        key: 'selection',
        label: SOURCE_STAGE_LABELS.selection,
        status: 'not_started',
        summary: 'Selection begins once vendor responses are comparable.',
        gate: {
          id: 'gate-source-003-selection',
          label: 'Selection package ready',
          status: 'not_started',
          ownerRole: 'Procurement Lead',
          requiredArtifacts: ['Evaluation Scorecard', 'Recommendation'],
          blocker: null,
        },
      },
      {
        key: 'value_realization',
        label: SOURCE_STAGE_LABELS.value_realization,
        status: 'not_started',
        summary: 'Realization starts after the build partner is selected.',
        gate: {
          id: 'gate-source-003-realization',
          label: 'Value ledger live',
          status: 'not_started',
          ownerRole: 'PMO Lead',
          requiredArtifacts: ['Milestone ledger'],
          blocker: null,
        },
      },
    ],
    alerts: [
      {
        id: 'alert-source-003-vendor',
        title: 'Vendor response normalization is slipping',
        detail: 'Pricing template gaps should be resolved before the event drifts into ad hoc vendor comparison.',
        severity: 'warning',
        status: 'open',
      },
    ],
    artifacts: [
      {
        id: 'artifact-source-003-rfp',
        title: 'RFP/RFI Outline',
        kind: 'artifact_packet',
        status: 'draft',
        summary: 'Structured vendor package and response normalization boundary.',
        sourceCount: 1,
        updatedAt: '2026-04-24',
      },
      {
        id: 'artifact-source-003-scorecard',
        title: 'Evaluation Scorecard',
        kind: 'scorecard',
        status: 'draft',
        summary: 'Selection criteria prepared for use once responses are complete.',
        sourceCount: 1,
        updatedAt: '2026-04-24',
      },
    ],
    scorecard: {
      decisionOwner: 'Procurement Lead',
      reviewCadence: 'Every vendor checkpoint',
      approvalState: 'not_started',
      criteria: [
        {
          id: 'crit-source-003-1',
          label: 'Pricing template complete',
          ownerRole: 'Procurement Lead',
          required: true,
          status: 'blocked',
          note: 'Two vendors still owe complete pricing data.',
        },
        {
          id: 'crit-source-003-2',
          label: 'Delivery team model comparable',
          ownerRole: 'Digital Product Lead',
          required: true,
          status: 'draft',
          note: 'Criteria drafted but not yet applied.',
        },
      ],
    },
    valueLedger: {
      updatedAt: '2026-04-24',
      projected: [
        {
          id: 'ledger-source-003-1',
          eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
          eventName: 'Digital App Build Partner Selection',
          kind: 'projected',
          label: 'Delivery acceleration',
          stageKey: 'vendor_responses',
          amountUsd: 1_600_000,
          confidence: 'medium',
          evidenceCount: 1,
          note: 'Projected time-to-release improvement.',
        },
        {
          id: 'ledger-source-003-2',
          eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
          eventName: 'Digital App Build Partner Selection',
          kind: 'projected',
          label: 'Rework avoidance',
          stageKey: 'vendor_responses',
          amountUsd: 1_200_000,
          confidence: 'low',
          evidenceCount: 0,
          note: 'Depends on delivery discipline and scope stability.',
        },
      ],
      realized: [],
    },
  },
];

const artifactDetails: SourceArtifactDetail[] = [
  {
    id: 'artifact-source-001-data-request',
    eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    title: 'Minimum Data Request',
    kind: 'artifact_packet',
    status: 'draft',
    summary: 'Structured input request for application, workload, contract, and delivery baseline.',
    sourceCount: 0,
    updatedAt: '2026-04-24',
    sections: [
      {
        label: 'Required inputs',
        body: 'Application inventory, analytics workload baseline, contract inventory, and current delivery model split.',
      },
      {
        label: 'Why this matters',
        body: 'Without these inputs, the sourcing strategy would overstate scope confidence and understate transition risk.',
      },
    ],
    governanceNotes: [
      'This artifact is still input-dependent.',
      'Do not promote strategy work until the client baseline is complete.',
    ],
    patternLinks: ['source-pack-data-ai-modernization'],
  },
  {
    id: 'artifact-source-001-brief',
    eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    title: 'Sourcing Event Brief',
    kind: 'charter',
    status: 'draft',
    summary: 'Executive framing for the modernization sourcing event.',
    sourceCount: 3,
    updatedAt: '2026-04-24',
    sections: [
      {
        label: 'Event frame',
        body: 'This event is focused on SI selection for the client’s data and AI modernization agenda.',
      },
      {
        label: 'Current boundary',
        body: 'The event can proceed structurally, but scope is not decision-grade until the baseline inventory is uploaded.',
      },
    ],
    governanceNotes: [
      'Use this artifact to align the event frame, not to substitute for the scope document.',
    ],
    patternLinks: ['source-pack-data-ai-modernization'],
  },
  {
    id: 'artifact-source-002-scorecard',
    eventId: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
    title: 'Evaluation Scorecard',
    kind: 'scorecard',
    status: 'draft',
    summary: 'Governance panel for future vendor evaluation.',
    sourceCount: 2,
    updatedAt: '2026-04-24',
    sections: [
      {
        label: 'Scorecard stance',
        body: 'The scorecard is being prepared early so sourcing model decisions are governed before the vendor exercise starts.',
      },
    ],
    governanceNotes: [
      'Do not score vendors yet; this is governance-first in the current slice.',
    ],
    patternLinks: ['source-pack-ams-managed-services'],
  },
  {
    id: 'artifact-source-003-rfp',
    eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    title: 'RFP/RFI Outline',
    kind: 'artifact_packet',
    status: 'draft',
    summary: 'Structured vendor package and response normalization boundary.',
    sourceCount: 1,
    updatedAt: '2026-04-24',
    sections: [
      {
        label: 'Package status',
        body: 'Vendor responses are partially in, but two pricing templates remain incomplete.',
      },
    ],
    governanceNotes: [
      'Do not compare vendors as if responses are normalized until the missing templates arrive.',
    ],
    patternLinks: ['source-pack-digital-product-build'],
  },
];

const dataAiPatternSections: SourcePatternSectionContext[] = [
  {
    id: 'pattern-data-ai-applicability',
    title: 'Applicability',
    kind: 'stageGuidance',
    summary:
      'Use the Data & AI Modernization pattern when the sourcing event is selecting an SI partner for data platform modernization, analytics workload migration, AI enablement, and operating-model transition.',
    confidence: 'medium',
  },
  {
    id: 'pattern-data-ai-detection-signals',
    title: 'Detection signals',
    kind: 'evidence',
    summary:
      'Strong signals include legacy data platform migration, analytics workload baseline needs, data governance uplift, cloud data platform expertise, and AI/GenAI roadmap enablement.',
    confidence: 'medium',
  },
  {
    id: 'pattern-data-ai-required-inputs',
    title: 'Required inputs',
    kind: 'requiredInputs',
    summary:
      'Minimum deterministic inputs are application inventory, analytics workload baseline, data platform inventory, current vendor/contract inventory, migration constraints, governance/security requirements, and operating-model ownership.',
    confidence: 'high',
  },
  {
    id: 'pattern-data-ai-scorecard-rationale',
    title: 'Scorecard rationale',
    kind: 'scorecardDefaults',
    summary:
      'Default scorecard weights emphasize modernization capability, migration delivery method, data/domain expertise, cloud platform expertise, governance quality, commercial model, AI enablement, and change/adoption readiness.',
    confidence: 'medium',
  },
  {
    id: 'pattern-data-ai-common-risks',
    title: 'Common risks',
    kind: 'risks',
    summary:
      'Common risks are incomplete workload baseline, unclear retained responsibilities, underestimated migration complexity, weak data governance, non-comparable commercial assumptions, and AI roadmap claims without operating proof.',
    confidence: 'medium',
  },
  {
    id: 'pattern-data-ai-stage-gate-guidance',
    title: 'Stage gate guidance',
    kind: 'stageGuidance',
    summary:
      'The Scope gate should remain blocked until application inventory and analytics workload baseline are present enough to support sourcing strategy, vendor requirements, and value assumptions.',
    confidence: 'high',
  },
  {
    id: 'pattern-data-ai-value-levers',
    title: 'Value levers',
    kind: 'interventions',
    summary:
      'Typical value levers include platform consolidation, report rationalization, vendor consolidation, migration factory productivity, operating-model simplification, and AI-enabled delivery acceleration.',
    confidence: 'medium',
  },
  {
    id: 'pattern-data-ai-evidence-requirements',
    title: 'Evidence requirements',
    kind: 'evidence',
    summary:
      'Evidence should distinguish seed/pattern guidance from client evidence, and client-specific claims require uploaded inventory, baseline extracts, contract data, artifact references, or cited decision records.',
    confidence: 'high',
  },
];

const dataAiScorecardDefaultWeights: SourceScorecardSnapshot['defaultWeights'] = [
  {
    criterionId: 'scorecard-data-ai-platform-modernization-capability',
    label: 'Data platform modernization capability',
    weight: 20,
    rationale:
      'This is the primary capability axis because the event is selecting a partner to modernize the core data platform, not merely staff a delivery team.',
  },
  {
    criterionId: 'scorecard-data-ai-migration-factory-delivery-approach',
    label: 'Migration factory / delivery approach',
    weight: 15,
    rationale:
      'Migration method and repeatability matter because timeline, risk, and value realization depend on how workloads are sequenced and industrialized.',
  },
  {
    criterionId: 'scorecard-data-ai-domain-data-model-expertise',
    label: 'Domain/data model expertise',
    weight: 15,
    rationale:
      'Domain and data-model fluency reduce translation risk between business meaning, source systems, data products, and reporting outcomes.',
  },
  {
    criterionId: 'scorecard-data-ai-cloud-platform-expertise',
    label: 'Cloud platform expertise',
    weight: 15,
    rationale:
      'Cloud platform expertise is material because architecture, migration tooling, security posture, and operating model differ significantly by platform.',
  },
  {
    criterionId: 'scorecard-data-ai-governance-security-quality',
    label: 'Governance/security/quality',
    weight: 10,
    rationale:
      'Governance, security, and quality are mandatory controls, but the default keeps them balanced against delivery and platform modernization capability.',
  },
  {
    criterionId: 'scorecard-data-ai-commercial-model',
    label: 'Commercial model',
    weight: 10,
    rationale:
      'Commercials matter, but the default avoids allowing price to overpower delivery risk before scope and assumptions are comparable.',
  },
  {
    criterionId: 'scorecard-data-ai-genai-roadmap',
    label: 'AI/GenAI enablement roadmap',
    weight: 10,
    rationale:
      'AI enablement is important when it is tied to modernization outcomes, reusable assets, and operating adoption rather than generic innovation claims.',
  },
  {
    criterionId: 'scorecard-data-ai-change-adoption-operating-model',
    label: 'Change/adoption and operating model',
    weight: 5,
    rationale:
      'The default weight is lower because the sourcing event is capability-led, but it must increase if adoption risk or retained organization change becomes a primary blocker.',
  },
];

const dataAiPatternEvidence: SourceEvidenceContext[] = [
  {
    id: 'seed-evidence-data-ai-scorecard-rationale',
    label: 'Seed pattern evidence: Data & AI scorecard rationale',
    sourceType: 'patternPack',
    sourceId: SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS.dataAiModernization,
    confidence: 'medium',
    excerpt:
      'Pattern-level seed guidance: default weights emphasize modernization capability, migration approach, data/domain expertise, platform expertise, governance, commercial model, AI enablement, and adoption.',
  },
  {
    id: 'seed-evidence-data-ai-required-inputs',
    label: 'Seed pattern evidence: Data & AI required inputs',
    sourceType: 'patternPack',
    sourceId: SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS.dataAiModernization,
    confidence: 'high',
    excerpt:
      'Pattern-level seed guidance: application inventory and analytics workload baseline are minimum required inputs before strategy and RFP readiness can be trusted.',
  },
  {
    id: 'seed-evidence-data-ai-risks',
    label: 'Seed pattern evidence: Data & AI sourcing risks',
    sourceType: 'patternPack',
    sourceId: SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS.dataAiModernization,
    confidence: 'medium',
    excerpt:
      'Pattern-level seed guidance: incomplete baselines, retained responsibility gaps, weak governance, and non-comparable assumptions are common sourcing failure modes.',
  },
  {
    id: 'seed-evidence-data-ai-value-levers',
    label: 'Seed pattern evidence: Data & AI value levers',
    sourceType: 'patternPack',
    sourceId: SOURCE_DEFAULT_SCORECARD_ARCHETYPE_IDS.dataAiModernization,
    confidence: 'medium',
    excerpt:
      'Pattern-level seed guidance: common value levers include platform consolidation, report rationalization, vendor consolidation, migration factory productivity, and AI-enabled delivery acceleration.',
  },
];

const sourcePortfolioEvidence: SourceEvidenceContext[] = [
  {
    id: 'seed-evidence-source-portfolio-value',
    label: 'Seed event-state evidence: Source portfolio value at stake',
    sourceType: 'eventState',
    sourceId: 'source-dashboard-seed',
    confidence: 'medium',
    excerpt:
      'Seed dashboard context includes three sourcing events with deterministic value-at-stake fields. This is seed context only, not client evidence.',
  },
  {
    id: 'seed-evidence-source-portfolio-attention',
    label: 'Seed event-state evidence: Source portfolio attention items',
    sourceType: 'eventState',
    sourceId: 'source-dashboard-seed',
    confidence: 'medium',
    excerpt:
      'Seed dashboard context includes attention items for blocked scope, AMS sourcing model decision, and vendor response normalization.',
  },
];

const digitalVendorResponsePlaceholderSummary: SourceAttachmentSummary = {
  attachmentId: 'attachment-source-003-vendor-response-placeholder',
  purpose: 'vendorResponse',
  summary:
    'Seed placeholder only: no actual uploaded vendor response exists. Nexus may acknowledge that a vendor-response summary was requested, but must not summarize vendor facts until a real parsed file is available.',
  keyFields: {
    placeholder: true,
    clientEvidence: false,
    usableForVendorComparison: false,
  },
  missingSections: [
    'Actual vendor response file',
    'Parsed scope response',
    'Parsed commercial response',
    'Attachment citations',
  ],
  extractionConfidence: 'low',
  citations: [],
};

const digitalVendorResponsePlaceholderAttachment: SourceAttachment = {
  id: digitalVendorResponsePlaceholderSummary.attachmentId,
  fileName: 'vendor-response-placeholder-no-client-file.txt',
  fileType: 'txt',
  purpose: 'vendorResponse',
  uploadedBy: 'source-seed',
  uploadTime: '2026-04-24T00:00:00.000Z',
  association: {
    eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    stageKey: 'vendor_responses',
    artifactId: 'artifact-source-003-rfp',
    artifactKind: 'artifact_packet',
  },
  parsedStatus: 'lowConfidence',
  summary: digitalVendorResponsePlaceholderSummary,
  extractedEntities: [],
  relatedArtifacts: ['artifact-source-003-rfp'],
  evidenceReferences: [],
  confidence: 'low',
  parsingErrors: [
    {
      code: 'lowConfidence',
      message: 'Seed placeholder only; no real vendor response has been uploaded or parsed.',
      recoverable: true,
    },
  ],
  securityStatus: 'needsReview',
};

export function listSourceEventSeed(): SourcingEventSummary[] {
  return events.map((event) => ({
    id: event.id,
    code: event.code,
    name: event.name,
    accountName: event.accountName,
    leadAgent: event.leadAgent,
    archetype: event.archetype,
    rigor: event.rigor,
    status: event.status,
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS[event.status],
    priority: event.priority,
    currentStageKey: event.currentStageKey,
    currentStageLabel: SOURCE_STAGE_LABELS[event.currentStageKey],
    openAlerts: event.openAlerts,
    owner: event.owner,
    agingDays: event.agingDays,
    blocker: event.blocker,
    nextAction: event.nextAction,
    isAtRisk: event.isAtRisk,
    valueAtStakeUsd: event.valueAtStakeUsd,
    projectedValueUsd: event.projectedValueUsd,
    realizedValueUsd: event.realizedValueUsd,
    nextDecision: event.nextDecision,
  }));
}

export function getSourceEventSeed(eventId: string): SourcingEventDetail | null {
  return events.find((event) => event.id === eventId) ?? null;
}

export function getSourceArtifactSeed(eventId: string, artifactId: string): SourceArtifactDetail | null {
  return artifactDetails.find((artifact) => artifact.eventId === eventId && artifact.id === artifactId) ?? null;
}

export function getSourceValueSeed(): SourceValueLedgerSnapshot {
  return {
    updatedAt: '2026-04-24',
    projected: events.flatMap((event) => event.valueLedger.projected),
    realized: events.flatMap((event) => event.valueLedger.realized),
  };
}

export function getSourcePatternSectionsSeed(event: SourcingEventDetail): SourcePatternSectionContext[] {
  if (event.id === SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) {
    return dataAiPatternSections;
  }
  return [];
}

export function getSourceScorecardDefaultWeightsSeed(
  event: SourcingEventDetail,
): SourceScorecardSnapshot['defaultWeights'] {
  if (event.id === SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) {
    return dataAiScorecardDefaultWeights;
  }
  return [];
}

export function getSourceEvidenceSeed(event: SourcingEventDetail): SourceEvidenceContext[] {
  if (event.id === SOURCE_GOLDEN_EVENT_IDS.dataAiModernization) {
    return dataAiPatternEvidence;
  }
  return [];
}

export function getSourcePortfolioEvidenceSeed(): SourceEvidenceContext[] {
  return sourcePortfolioEvidence;
}

export function getSourceAttachmentSeed(
  event: SourcingEventDetail,
  selectedAttachmentIds: string[],
): SourceAttachment[] {
  if (
    event.id === SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild
    && selectedAttachmentIds.includes(digitalVendorResponsePlaceholderAttachment.id)
  ) {
    return [digitalVendorResponsePlaceholderAttachment];
  }
  return [];
}

export function getSourceAttachmentSummarySeed(
  attachments: SourceAttachment[],
): SourceAttachmentSummary[] {
  return attachments.flatMap((attachment) => (attachment.summary ? [attachment.summary] : []));
}

export function getSourceDashboardSeed(): AbarvaSourceDashboardData {
  const summaries = listSourceEventSeed();
  return {
    description:
      'Nexus structures sourcing events into one operating surface so the team can see what is moving, what is stalled, and what action should happen next.',
    nexusSummary:
      'Three live sourcing events are in motion. One is at risk because the client baseline is late, one is moving well through strategy, and one is waiting on vendor response normalization.',
    metrics: {
      activeEvents: summaries.length,
      waitingEvents: summaries.filter((event) => SOURCE_WAITING_LIFECYCLE_STATUSES.includes(event.status)).length,
      atRiskEvents: summaries.filter((event) => event.isAtRisk).length,
      decisionsNeeded: 2,
      valueAtStakeUsd: SOURCE_TOTAL_VALUE_AT_STAKE_USD,
    },
    attentionItems: [
      {
        id: 'attention-source-001',
        eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
        title: 'Unblock scope before strategy work drifts',
        detail: 'Application inventory and analytics workload data are still missing after 12 days.',
        severity: 'critical',
        owner: 'Client PMO Lead',
        actionLabel: 'Upload application/workload inventory',
      },
      {
        id: 'attention-source-002',
        eventId: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
        title: 'Lock the AMS sourcing model this week',
        detail: 'The event is healthy, but the shortlist and sourcing model should be confirmed before packaging work expands.',
        severity: 'info',
        owner: 'CIO Office',
        actionLabel: 'Confirm vendor shortlist and sourcing model',
      },
      {
        id: 'attention-source-003',
        eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
        title: 'Normalize vendor responses before evaluation starts',
        detail: 'Two vendors still owe pricing templates, which makes the response set non-comparable.',
        severity: 'warning',
        owner: 'Procurement Lead',
        actionLabel: 'Send vendor response reminder',
      },
    ],
    events: summaries,
  };
}
