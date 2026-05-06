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
import type { SourceVendorResponseSeed } from './vendor-response-types';
import type { SourcePricingVendorInput } from './pricing-normalization-types';

const events: SourcingEventDetail[] = [
  {
    id: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    code: 'SRC-001',
    name: 'Data & AI Modernization SI Selection',
    accountName: 'Northstar Holdings',
    leadAgent: 'Sentinel',
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
          ownerRole: 'Sentinel',
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
    dataReadiness: [
      {
        id: 'source-data-001-application-inventory',
        category: 'Application Inventory',
        requirementLevel: 'required',
        readinessState: 'Usable Evidence',
        evidenceUsability: 'usable',
        owner: 'Client PMO Lead',
        sourceSystemOrFile: 'Application inventory workbook',
        lastUpdated: '2026-04-24',
        confidence: 'high',
        workflowImpact: 'Can support Scope framing and RFP application portfolio language.',
        agentRecommendation: 'Nexus can use this as scope evidence, but should still caveat workload sizing.',
        stewardAdminHandoffLabel: 'Admin/Setup evidence record',
      },
      {
        id: 'source-data-001-workload-baseline',
        category: 'Workload Baseline',
        requirementLevel: 'required',
        readinessState: 'Requested',
        evidenceUsability: 'not_available',
        owner: 'Data Platform Lead',
        sourceSystemOrFile: 'Minimum data request',
        lastUpdated: null,
        confidence: 'low',
        workflowImpact: 'Blocks Rich-tier Scope and makes pricing normalization unsafe.',
        agentRecommendation: 'Nexus should request workload volumes before strategy design expands.',
        stewardAdminHandoffLabel: 'Steward to data owner',
      },
      {
        id: 'source-data-001-ticket-history',
        category: 'Ticket History',
        requirementLevel: 'recommended',
        readinessState: 'Missing',
        evidenceUsability: 'not_available',
        owner: 'Service Management Lead',
        sourceSystemOrFile: 'ITSM export',
        lastUpdated: null,
        confidence: 'low',
        workflowImpact: 'Limits support sizing and weakens vendor run-cost comparison.',
        agentRecommendation: 'Nexus should include ticket history in the minimum data request.',
        stewardAdminHandoffLabel: 'Steward to Admin/Setup intake',
      },
      {
        id: 'source-data-001-vendor-spend',
        category: 'Vendor Spend',
        requirementLevel: 'required',
        readinessState: 'Available',
        evidenceUsability: 'available_not_validated',
        owner: 'Procurement Lead',
        sourceSystemOrFile: 'Spend cube extract',
        lastUpdated: '2026-04-23',
        confidence: 'medium',
        workflowImpact: 'Supports directional value framing but should not be treated as validated baseline.',
        agentRecommendation: 'Sentinel should keep spend claims caveated until evidence is validated.',
        stewardAdminHandoffLabel: 'Admin/Setup validation needed',
      },
      {
        id: 'source-data-001-sla-baseline',
        category: 'SLA Baseline',
        requirementLevel: 'recommended',
        readinessState: 'Missing',
        evidenceUsability: 'not_available',
        owner: 'Operations Lead',
        sourceSystemOrFile: 'Service report',
        lastUpdated: null,
        confidence: 'low',
        workflowImpact: 'Prevents confident service-level requirements and transition risk sizing.',
        agentRecommendation: 'Nexus should request current SLA performance before RFP release.',
        stewardAdminHandoffLabel: 'Steward to operations owner',
      },
      {
        id: 'source-data-001-vendor-contracts',
        category: 'Vendor Contracts',
        requirementLevel: 'recommended',
        readinessState: 'Loaded',
        evidenceUsability: 'loaded_not_usable',
        owner: 'Legal / Procurement',
        sourceSystemOrFile: 'Contract repository, parsing pending',
        lastUpdated: '2026-04-22',
        confidence: 'medium',
        workflowImpact: 'Shows contract presence, but exclusions and termination terms are not citeable yet.',
        agentRecommendation: 'Sentinel should not cite contract terms until parsing and validation complete.',
        stewardAdminHandoffLabel: 'Admin/Setup parsing pending',
      },
      {
        id: 'source-data-001-security-compliance',
        category: 'Security / Compliance Requirements',
        requirementLevel: 'required',
        readinessState: 'Low Confidence',
        evidenceUsability: 'low_confidence',
        owner: 'Security Lead',
        sourceSystemOrFile: 'Security requirements notes',
        lastUpdated: '2026-04-24',
        confidence: 'low',
        workflowImpact: 'Security requirements can be outlined, but approval-grade language needs validation.',
        agentRecommendation: 'Steward should route security requirements back for owner confirmation.',
        stewardAdminHandoffLabel: 'Steward to security owner',
      },
      {
        id: 'source-data-001-retained-roles',
        category: 'Retained Roles',
        requirementLevel: 'required',
        readinessState: 'Requested',
        evidenceUsability: 'not_available',
        owner: 'Client PMO Lead',
        sourceSystemOrFile: 'Retained organization worksheet',
        lastUpdated: null,
        confidence: 'low',
        workflowImpact: 'Blocks clear scope split and transition responsibility language.',
        agentRecommendation: 'Nexus should ask the client to confirm retained roles before RFP drafting.',
        stewardAdminHandoffLabel: 'Steward to client owner',
      },
    ],
  },
  {
    id: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
    code: 'SRC-002',
    name: 'AMS Consolidation Assessment',
    accountName: 'Northstar Holdings',
    leadAgent: 'Sentinel',
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
          ownerRole: 'Sentinel',
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
    dataReadiness: [],
  },
  {
    id: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    code: 'SRC-003',
    name: 'Digital App Build Partner Selection',
    accountName: 'Northstar Holdings',
    leadAgent: 'Sentinel',
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
    dataReadiness: [],
  },
  // SRC38 — Apex Retail AMS Outsourcing 2026 demo storyline event
  // This event is the narrative anchor for the 30-minute Prat demo.
  // It links to APX-CDP-2026 via the source-program bridge (LINK1/LINK2).
  {
    id: SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
    code: 'SRC-004',
    name: 'AMS Outsourcing 2026',
    accountName: 'Apex Retail',
    leadAgent: 'Sentinel',
    archetype: 'Managed Services / Outsourcing',
    rigor: 'strategic',
    status: 'active',
    statusLabel: SOURCE_LIFECYCLE_STATUS_LABELS.active,
    priority: 'high',
    currentStageKey: 'orals_bafo',
    currentStageLabel: SOURCE_STAGE_LABELS.orals_bafo,
    openAlerts: 2,
    owner: 'CIO Office',
    agingDays: 8,
    blocker: null,
    nextAction: 'Receive BAFO responses from Northstar and ArcVault by May 15',
    isAtRisk: false,
    valueAtStakeUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026],
    projectedValueUsd: SOURCE_GOLDEN_EVENT_VALUES_USD[SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026],
    realizedValueUsd: 0,
    nextDecision: 'Select preferred AMS partner from BAFO responses by May 30, 2026.',
    synopsis:
      'Apex Retail is consolidating three incumbent AMS providers into a preferred-supplier structure. Nexus has guided the event through scope, strategy, RFP, vendor responses, and evaluation. Two vendors (Northstar Managed Services and ArcVault Managed) have been invited to BAFO. A BAFO round decision is expected by end of May 2026.',
    problemStatement:
      'Apex Retail\'s fragmented AMS landscape — three incumbent providers with overlapping scope — creates delivery risk for the CDP Implementation programme (APX-CDP-2026). A consolidated AMS partner must be selected before the CDP data migration window in Q3 2026.',
    stages: [
      {
        key: 'intake',
        label: 'Intake',
        status: 'complete',
        summary: 'CIO office sponsored the consolidation. Scope perimeter and business case accepted.',
        gate: {
          id: 'gate-src-004-intake',
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
        summary: '40+ application estate scoped. Service towers (infrastructure, applications, data platform) defined.',
        gate: {
          id: 'gate-src-004-scope',
          label: 'Scope ready',
          status: 'approved',
          ownerRole: 'Sentinel',
          requiredArtifacts: ['Scope Document', 'Run spend baseline'],
          blocker: null,
        },
      },
      {
        key: 'sourcing_strategy',
        label: SOURCE_STAGE_LABELS.sourcing_strategy,
        status: 'complete',
        summary: 'Tower consolidation strategy agreed. Single preferred-supplier model selected.',
        gate: {
          id: 'gate-src-004-strategy',
          label: 'Sourcing strategy ready',
          status: 'approved',
          ownerRole: 'CIO Office',
          requiredArtifacts: ['Sourcing strategy note', 'Projected Value Ledger'],
          blocker: null,
        },
      },
      {
        key: 'rfp_rfi_package',
        label: SOURCE_STAGE_LABELS.rfp_rfi_package,
        status: 'complete',
        summary: 'RFP issued to 4 vendors with full pricing template and SLA framework.',
        gate: {
          id: 'gate-src-004-rfp',
          label: 'RFP package issued',
          status: 'approved',
          ownerRole: 'Procurement Lead',
          requiredArtifacts: ['RFP document', 'Pricing template', 'SLA framework'],
          blocker: null,
        },
      },
      {
        key: 'vendor_responses',
        label: SOURCE_STAGE_LABELS.vendor_responses,
        status: 'complete',
        summary: 'All 4 vendor responses received. Pricing normalisation completed. Sentinel pattern signals detected.',
        gate: {
          id: 'gate-src-004-responses',
          label: 'Responses reviewed',
          status: 'approved',
          ownerRole: 'Sentinel',
          requiredArtifacts: ['Vendor response evaluation', 'Pricing comparison'],
          blocker: null,
        },
      },
      {
        key: 'evaluation',
        label: SOURCE_STAGE_LABELS.evaluation,
        status: 'complete',
        summary: 'Evaluation scorecard completed. Northstar and ArcVault advanced to BAFO. BlueMaster and DataPeak excluded.',
        gate: {
          id: 'gate-src-004-evaluation',
          label: 'Evaluation complete',
          status: 'approved',
          ownerRole: 'Selection Committee',
          requiredArtifacts: ['Evaluation scorecard', 'BAFO shortlist recommendation'],
          blocker: null,
        },
      },
      {
        key: 'orals_bafo',
        label: SOURCE_STAGE_LABELS.orals_bafo,
        status: 'active',
        summary: 'BAFO Round 1 in progress. Northstar and ArcVault invited. Responses due May 15, 2026.',
        gate: {
          id: 'gate-src-004-bafo',
          label: 'BAFO complete',
          status: 'in_review',
          ownerRole: 'Selection Committee',
          requiredArtifacts: ['BAFO responses', 'Final pricing comparison', 'Award recommendation'],
          blocker: null,
        },
      },
      {
        key: 'selection',
        label: SOURCE_STAGE_LABELS.selection,
        status: 'not_started',
        summary: 'Selection pending BAFO outcome. Target: award recommendation by May 30, 2026.',
        gate: {
          id: 'gate-src-004-selection',
          label: 'Selection approved',
          status: 'not_started',
          ownerRole: 'CIO Office',
          requiredArtifacts: ['Award recommendation memo', 'Contract heads of terms'],
          blocker: null,
        },
      },
      {
        key: 'contract_mobilization',
        label: SOURCE_STAGE_LABELS.contract_mobilization,
        status: 'not_started',
        summary: 'Contract mobilisation will begin after CIO award approval. Target: operational by Q3 2026.',
        gate: {
          id: 'gate-src-004-mobilization',
          label: 'Mobilisation ready',
          status: 'not_started',
          ownerRole: 'Transformation Office',
          requiredArtifacts: ['Signed contract', 'Mobilisation plan'],
          blocker: null,
        },
      },
      {
        key: 'value_realization',
        label: SOURCE_STAGE_LABELS.value_realization,
        status: 'not_started',
        summary: 'Value tracking starts post-mobilisation. CDP integration timeline is the primary value dependency.',
        gate: {
          id: 'gate-src-004-value',
          label: 'Value ledger live',
          status: 'not_started',
          ownerRole: 'Value Office',
          requiredArtifacts: ['Savings realisation plan'],
          blocker: null,
        },
      },
    ],
    alerts: [
      {
        id: 'alert-src-004-bafo-deadline',
        title: 'BAFO response deadline: May 15, 2026',
        detail: 'Northstar Managed Services and ArcVault Managed responses due in 19 days. Nexus will prompt follow-up if no confirmation received by May 10.',
        severity: 'info',
        status: 'open',
      },
      {
        id: 'alert-src-004-cdp-window',
        title: 'CDP integration timeline at risk if selection slips past June',
        detail: 'Sentinel has detected that the AMS selection timeline and CDP data migration window (Q3 2026) are correlated. A selection delay past end of June compresses the CDP onboarding window below the minimum 8-week threshold.',
        severity: 'warning',
        status: 'open',
      },
    ],
    artifacts: [
      {
        id: 'artifact-src-004-brief',
        title: 'Sourcing Event Brief',
        kind: 'charter',
        status: 'approved',
        summary: 'CIO-sponsored AMS consolidation brief covering 40+ applications, service towers, and preferred-supplier rationale.',
        sourceCount: 6,
        updatedAt: '2026-04-18',
      },
      {
        id: 'artifact-src-004-rfp',
        title: 'RFP Package',
        kind: 'artifact_packet',
        status: 'approved',
        summary: 'Full RFP issued to 4 vendors. Includes pricing template, SLA framework, and evaluation criteria.',
        sourceCount: 4,
        updatedAt: '2026-03-20',
      },
      {
        id: 'artifact-src-004-scorecard',
        title: 'Evaluation Scorecard',
        kind: 'scorecard',
        status: 'approved',
        summary: 'Completed evaluation across 4 vendors. Northstar and ArcVault shortlisted for BAFO.',
        sourceCount: 4,
        updatedAt: '2026-04-24',
      },
    ],
    scorecard: {
      decisionOwner: 'CIO Office',
      reviewCadence: 'Weekly',
      approvalState: 'in_review',
      criteria: [
        {
          id: 'crit-src-004-1',
          label: 'BAFO responses received',
          ownerRole: 'Procurement Lead',
          required: true,
          status: 'draft',
          note: 'Due May 15, 2026.',
        },
        {
          id: 'crit-src-004-2',
          label: 'Final pricing comparison approved',
          ownerRole: 'Sentinel',
          required: true,
          status: 'draft',
          note: 'Requires BAFO responses to complete.',
        },
        {
          id: 'crit-src-004-3',
          label: 'Award recommendation approved',
          ownerRole: 'CIO Office',
          required: true,
          status: 'draft',
          note: 'Target: May 30, 2026.',
        },
      ],
    },
    valueLedger: {
      updatedAt: '2026-04-24',
      projected: [
        {
          id: 'ledger-src-004-1',
          eventId: SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
          eventName: 'AMS Outsourcing 2026',
          kind: 'projected',
          label: 'AMS consolidation run-cost savings',
          stageKey: 'orals_bafo',
          amountUsd: 22_000_000,
          confidence: 'medium',
          evidenceCount: 3,
          note: 'Three-to-one vendor consolidation and platform standardisation savings.',
        },
        {
          id: 'ledger-src-004-2',
          eventId: SOURCE_GOLDEN_EVENT_IDS.apexRetailAmsOutsourcing2026,
          eventName: 'AMS Outsourcing 2026',
          kind: 'projected',
          label: 'CDP delivery risk reduction value',
          stageKey: 'orals_bafo',
          amountUsd: 13_000_000,
          confidence: 'low',
          evidenceCount: 1,
          note: 'Depends on AMS partner selection and CDP integration timeline alignment.',
        },
      ],
      realized: [],
    },
    dataReadiness: [],
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

export interface SourceRfpReadinessSeed {
  eventId: string;
  blockers: string[];
}

const SOURCE_VENDOR_RESPONSE_SEEDS: SourceVendorResponseSeed[] = [
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    responses: [
      {
        vendorId: 'vendor-a',
        vendorName: 'Vertex CloudOps',
        responseStatus: 'submitted',
        receivedAt: '2026-04-22',
        requiredSections: [
          'Executive response',
          'Scope confirmation',
          'Pricing template',
          'Assumptions and exclusions',
          'Transition plan',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
        ],
        submittedSections: [
          'Executive response',
          'Scope confirmation',
          'Pricing template',
          'Assumptions and exclusions',
          'Transition plan',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
        ],
        assumptions: ['Retained roles include 40% shared support for first quarter.', 'Automation savings depend on ticket mix stability.'],
        exclusions: ['Non-core legacy tooling support is excluded.'],
        pricingTemplateStatus: 'complete',
        transitionPlanStatus: 'complete',
        securityResponseStatus: 'complete',
        automationRoadmapStatus: 'complete',
        evidenceStatus: 'Usable Evidence',
        evidenceUsability: 'usable',
        responseRiskLevel: 'medium',
      },
      {
        vendorId: 'vendor-b',
        vendorName: 'Nova Partner Group',
        responseStatus: 'submitted',
        receivedAt: '2026-04-23',
        requiredSections: [
          'Executive response',
          'Scope confirmation',
          'Pricing template',
          'Assumptions and exclusions',
          'Transition plan',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
        ],
        submittedSections: [
          'Executive response',
          'Scope confirmation',
          'Assumptions and exclusions',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
        ],
        assumptions: ['Commercial model assumes fixed run cost uplift in year 1.'],
        exclusions: ['Third-party API usage and change costs are excluded.'],
        pricingTemplateStatus: 'missing',
        transitionPlanStatus: 'incomplete',
        securityResponseStatus: 'incomplete',
        automationRoadmapStatus: 'incomplete',
        evidenceStatus: 'Available',
        evidenceUsability: 'available_not_validated',
        responseRiskLevel: 'high',
      },
      {
        vendorId: 'vendor-c',
        vendorName: 'Aegis Digital',
        responseStatus: 'submitted',
        receivedAt: '2026-04-24',
        requiredSections: [
          'Executive response',
          'Scope confirmation',
          'Pricing template',
          'Assumptions and exclusions',
          'Transition plan',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
        ],
        submittedSections: [
          'Executive response',
          'Scope confirmation',
          'Pricing template',
          'Assumptions and exclusions',
          'Delivery model',
          'SLA response',
          'Security and compliance response',
          'Automation / productivity roadmap',
          'References and evidence',
          'Transition plan',
        ],
        assumptions: ['Vendor assumes retained team provides runbooks in week 2.'],
        exclusions: ['No change-overhead buffer included in pricing.'],
        pricingTemplateStatus: 'complete',
        transitionPlanStatus: 'complete',
        securityResponseStatus: 'complete',
        automationRoadmapStatus: 'complete',
        evidenceStatus: 'Low Confidence',
        evidenceUsability: 'low_confidence',
        responseRiskLevel: 'high',
      },
    ],
  },
];

export function getSourceVendorResponseSeed(eventId: string): SourceVendorResponseSeed {
  const fallback: SourceVendorResponseSeed = { eventId, responses: [] };
  return SOURCE_VENDOR_RESPONSE_SEEDS.find((seed) => seed.eventId === eventId) ?? fallback;
}

export interface SourcePricingSeed {
  eventId: string;
  vendors: SourcePricingVendorInput[];
}

const SOURCE_PRICING_NORMALIZATION_SEEDS: SourcePricingSeed[] = [
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    vendors: [
      {
        vendorId: 'vendor-a',
        vendorName: 'Vertex CloudOps',
        currency: 'USD',
        annualRunCostUsd: 540_000,
        transitionCostUsd: 65_000,
        oneTimeSetupCostUsd: 24_000,
        optionalServicesUsd: 18_000,
        excludedServicesUsd: 22_000,
        changeOrderExposureUsd: 12_000,
        optionals: [
          'Monitoring dashboard access',
          'Knowledge transfer workshops',
          'Retained-team onboarding',
        ],
        exclusions: [
          'Non-core legacy tooling support is excluded.',
          'SLA breach credit exclusions above X%',
        ],
        supportHoursPerWeek: 165,
        applicationCount: 52,
        ticketVolumePerMonth: 1_250,
        automationProductivityAssumptionPercent: 12,
        rateEscalationPercent: 4,
        offshorePercent: 25,
        onshorePercent: 75,
        assumptions: [
          'Vendor assumes current support maturity and retention assumptions remain stable.',
          'Pricing assumes average ticket severity mix matches current baseline.',
        ],
        securityComplianceNotes: [
          'Security responsibilities and audit support included in base pricing.',
        ],
      },
      {
        vendorId: 'vendor-b',
        vendorName: 'Nova Partner Group',
        currency: 'USD',
        annualRunCostUsd: 480_000,
        transitionCostUsd: 0,
        oneTimeSetupCostUsd: 0,
        optionalServicesUsd: 10_000,
        excludedServicesUsd: 34_000,
        changeOrderExposureUsd: 28_000,
        optionals: [
          'Optional reporting add-on',
        ],
        exclusions: [
          'Third-party API usage and change costs are excluded.',
          'Security baseline audits are excluded.',
        ],
        supportHoursPerWeek: 140,
        applicationCount: 48,
        ticketVolumePerMonth: 1_050,
        automationProductivityAssumptionPercent: 4,
        rateEscalationPercent: 8,
        offshorePercent: 15,
        onshorePercent: 85,
        assumptions: [
          'Commercial model assumes current staffing model remains constant.',
        ],
        securityComplianceNotes: [
          'Security exceptions are conditional upon client providing additional scope.',
        ],
      },
      {
        vendorId: 'vendor-c',
        vendorName: 'Aegis Digital',
        currency: 'USD',
        annualRunCostUsd: 460_000,
        transitionCostUsd: 52_000,
        oneTimeSetupCostUsd: 31_000,
        optionalServicesUsd: 26_000,
        excludedServicesUsd: 15_000,
        changeOrderExposureUsd: 20_000,
        optionals: [
          'Automation runbook and AIOps playbooks',
          'SRE-style runbook automation',
        ],
        exclusions: [
          'No change-overhead buffer included in pricing.',
        ],
        supportHoursPerWeek: 150,
        applicationCount: 50,
        ticketVolumePerMonth: 1_100,
        automationProductivityAssumptionPercent: 22,
        rateEscalationPercent: 9,
        offshorePercent: 28,
        onshorePercent: 72,
        assumptions: [
          'Vendor assumes 22% automation gain from service automation over 12 months.',
          'Customer-owned release management retains critical controls.',
        ],
        securityComplianceNotes: [
          'Automation and compliance claims require measurable commitments.',
        ],
      },
    ],
  },
];

export function getSourcePricingNormalizationSeed(eventId: string): SourcePricingSeed {
  const fallback: SourcePricingSeed = { eventId, vendors: [] };
  return SOURCE_PRICING_NORMALIZATION_SEEDS.find((seed) => seed.eventId === eventId) ?? fallback;
}

const SOURCE_RFP_READINESS_SEEDS: SourceRfpReadinessSeed[] = [
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    blockers: [
      'Ticket history is not available for transition-cost profiling.',
      'SLA baseline is missing for service-level commitments.',
    ],
  },
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
    blockers: [
      'Use event-specific RFP sections once scope transition is approved.',
    ],
  },
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    blockers: [
      'Scope and operating model must define who handles platform operations.',
    ],
  },
];

export function getSourceRfpReadinessSeed(eventId: string): SourceRfpReadinessSeed {
  return SOURCE_RFP_READINESS_SEEDS.find((seed) => seed.eventId === eventId) ?? { eventId, blockers: [] };
}

export interface SourceArtifactStatusStripSeedItem {
  artifactName: string;
  status: 'not_started' | 'draft' | 'needs_inputs' | 'in_review' | 'changes_requested' | 'approved' | 'locked';
  ownerAgent: 'Nexus' | 'Sentinel' | 'Atlas' | 'Steward';
  version: string;
  evidenceState: 'missing' | 'partial' | 'seeded';
  approvalState: 'not_started' | 'in_review' | 'approved' | 'changes_requested';
}

export interface SourceArtifactStatusStripSeed {
  eventId: string;
  artifacts: SourceArtifactStatusStripSeedItem[];
}

const DEFAULT_SOURCE_ARTIFACT_STATUS_STRIP_ITEMS: SourceArtifactStatusStripSeedItem[] = [
  {
    artifactName: 'Sourcing Strategy Memo',
    status: 'draft',
    ownerAgent: 'Nexus',
    version: 'v0.3',
    evidenceState: 'partial',
    approvalState: 'in_review',
  },
  {
    artifactName: 'Minimum Data Request',
    status: 'locked',
    ownerAgent: 'Steward',
    version: 'v1.0',
    evidenceState: 'seeded',
    approvalState: 'approved',
  },
  {
    artifactName: 'Scope Document',
    status: 'in_review',
    ownerAgent: 'Nexus',
    version: 'v0.7',
    evidenceState: 'partial',
    approvalState: 'changes_requested',
  },
  {
    artifactName: 'RFP Package',
    status: 'needs_inputs',
    ownerAgent: 'Steward',
    version: 'v0.2',
    evidenceState: 'missing',
    approvalState: 'not_started',
  },
  {
    artifactName: 'Pricing Template',
    status: 'draft',
    ownerAgent: 'Sentinel',
    version: 'v0.4',
    evidenceState: 'partial',
    approvalState: 'in_review',
  },
  {
    artifactName: 'Vendor Response Checklist',
    status: 'draft',
    ownerAgent: 'Sentinel',
    version: 'v0.5',
    evidenceState: 'partial',
    approvalState: 'in_review',
  },
  {
    artifactName: 'BAFO Question Pack',
    status: 'draft',
    ownerAgent: 'Nexus',
    version: 'v0.3',
    evidenceState: 'partial',
    approvalState: 'not_started',
  },
  {
    artifactName: 'Executive Decision Brief',
    status: 'needs_inputs',
    ownerAgent: 'Atlas',
    version: 'v0.1',
    evidenceState: 'missing',
    approvalState: 'not_started',
  },
  {
    artifactName: 'Transition Readiness Checklist',
    status: 'not_started',
    ownerAgent: 'Steward',
    version: 'v0.0',
    evidenceState: 'missing',
    approvalState: 'not_started',
  },
  {
    artifactName: 'Value Ledger Assumptions',
    status: 'draft',
    ownerAgent: 'Atlas',
    version: 'v0.2',
    evidenceState: 'partial',
    approvalState: 'in_review',
  },
];

const SOURCE_ARTIFACT_STATUS_STRIP_SEEDS: SourceArtifactStatusStripSeed[] = [
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.dataAiModernization,
    artifacts: DEFAULT_SOURCE_ARTIFACT_STATUS_STRIP_ITEMS,
  },
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.amsConsolidation,
    artifacts: DEFAULT_SOURCE_ARTIFACT_STATUS_STRIP_ITEMS,
  },
  {
    eventId: SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild,
    artifacts: DEFAULT_SOURCE_ARTIFACT_STATUS_STRIP_ITEMS,
  },
];

export function getSourceArtifactStatusStripSeed(eventId: string): SourceArtifactStatusStripSeed {
  const fallback: SourceArtifactStatusStripSeed = {
    eventId,
    artifacts: DEFAULT_SOURCE_ARTIFACT_STATUS_STRIP_ITEMS,
  };
  return SOURCE_ARTIFACT_STATUS_STRIP_SEEDS.find((seed) => seed.eventId === eventId) ?? fallback;
}
