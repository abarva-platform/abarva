import type { DeliverableContentSignal } from '@/lib/deliverables/deliverable-content-signals';
import type { BuildingBlockKey } from './building-blocks';
import type { P3DesignInputsPack } from './types';

export type P3OptionScoreDimension =
  | 'business_value'
  | 'time_to_proof'
  | 'data_platform_readiness'
  | 'change_readiness'
  | 'controls_fit'
  | 'reuse_potential'
  | 'cost_effort_fit'
  | 'risk_fit'
  | 'strategic_fit';

export type P3OptionConfidence = 'high' | 'medium' | 'low';

export interface P3SolutionOption {
  id: string;
  label: string;
  summary: string;
  businessImpact: string;
  requiredBuildingBlocks: BuildingBlockKey[];
  dataPlatformImplications: string;
  humanAiSplit: string;
  controls: string;
  timeToValue: string;
  effort: string;
  risks: string[];
  dependencies: string[];
  reusePotential: string;
  readinessConditions: string[];
  notRecommendedYetReasons: string[];
  scores: Record<P3OptionScoreDimension, number>;
  totalScore: number;
  confidence: P3OptionConfidence;
  recommended: boolean;
  recommendationLabel: string;
  evidenceBasis: string[];
  missingEvidence: string[];
}

export interface P3OptionSet {
  moveId: string;
  source: 'p3_design_inputs_pack';
  useCasePattern: P3UseCasePattern;
  options: P3SolutionOption[];
  recommendedOptionId: string | null;
  recommendationConfidence: P3OptionConfidence;
  missingEvidence: string[];
  evidenceBasis: string[];
  usedGlobalStaticFallback: false;
}

export interface P3OptionEvidenceNeed {
  evidenceSlot: string;
  status: string;
  priority: string;
  whyItMatters?: string;
}

export interface P3OptionReadinessInput {
  coverageScore?: number;
  hardGaps?: string[];
  softGaps?: string[];
}

export interface BuildP3DesignInputsPackInput {
  moveId: string;
  moveName: string;
  archetype?: string | null;
  charter?: unknown;
  linkedEvidence?: Array<{ summary?: string | null; anchor?: string | null }>;
  gateCriteria?: Array<{ label: string; completed: boolean; severity?: string | null }>;
  carriesForwardContent?: DeliverableContentSignal[];
  evidenceNeedPackets?: P3OptionEvidenceNeed[];
  readiness?: P3OptionReadinessInput | null;
}

export interface AssembleP3SolutionOptionsInput {
  moveId: string;
  moveName: string;
  tenantName?: string;
  industryCode?: string | null;
  archetype?: string | null;
  valueAtStake?: string | null;
  designInputs: P3DesignInputsPack;
  readiness?: P3OptionReadinessInput | null;
  evidenceNeedPackets?: P3OptionEvidenceNeed[];
}

export type P3UseCasePattern =
  | 'member_service_agent_assist'
  | 'legal_contract_intake'
  | 'finance_close_and_transparency'
  | 'operations_resilience'
  | 'generic_bounded_solution';

interface OptionBlueprint {
  id: string;
  label: string;
  summary: string;
  businessImpact: string;
  requiredBuildingBlocks: BuildingBlockKey[];
  dataPlatformImplications: string;
  humanAiSplit: string;
  controls: string;
  timeToValue: string;
  effort: string;
  risks: string[];
  dependencies: string[];
  reusePotential: string;
  readinessConditions: string[];
  notRecommendedYetReasons: string[];
  baseScores: Record<P3OptionScoreDimension, number>;
}

const SCORE_DIMENSIONS: P3OptionScoreDimension[] = [
  'business_value',
  'time_to_proof',
  'data_platform_readiness',
  'change_readiness',
  'controls_fit',
  'reuse_potential',
  'cost_effort_fit',
  'risk_fit',
  'strategic_fit',
];

const STATIC_LEGACY_LABELS = [
  'Optimize the current workflow',
  'Phased platform + operating-model shift',
  'Large transformation program',
];

export function buildP3DesignInputsPackFromSignals({
  archetype,
  carriesForwardContent = [],
  charter,
  evidenceNeedPackets = [],
  gateCriteria = [],
  linkedEvidence = [],
  moveId,
  moveName,
  readiness,
}: BuildP3DesignInputsPackInput): P3DesignInputsPack {
  const scaffold = extractCharterScaffold(charter);
  const snippets = groupSignals(carriesForwardContent);
  const missingEvidence = evidenceNeedPackets
    .filter((packet) => !isEvidenceCovered(packet.status))
    .map((packet) => packet.evidenceSlot);
  const openGateCriteria = gateCriteria
    .filter((criterion) => !criterion.completed)
    .map((criterion) => criterion.label);
  const linkedSummaries = linkedEvidence
    .map((item) => item.summary || item.anchor || '')
    .filter(Boolean);

  const problem = scaffold.problem_statement || moveName;
  const scope = scaffold.scope_boundary || '';
  const evidenceFamily = scaffold.evidence_family || '';
  const valueHypothesis = scaffold.value_hypothesis || '';
  const readinessText = scaffold.foundation_readiness || '';
  const sponsor = scaffold.sponsor_candidate || '';

  return {
    moveId,
    businessOutcome: valueHypothesis || problem,
    currentProcessFindings: compact([
      ...pickSignals(snippets, ['process', 'current_state', 'findings']),
      problem,
    ]),
    painPointsAndRootCauses: compact([
      ...pickSignals(snippets, ['root_causes', 'risks', 'decisions']),
      problem,
    ]),
    currentSystems: compact([
      ...pickSignals(snippets, ['systems', 'architecture', 'technology']),
      scope,
    ]),
    currentDataPlatformState: compact([
      ...pickSignals(snippets, ['data', 'platform', 'sources']),
      readinessText,
    ]),
    dataReadiness: compact([
      ...pickSignals(snippets, ['data_quality', 'metrics']),
      readinessText,
      ...(readiness?.hardGaps ?? []).filter(hasDataWord),
      ...missingEvidence.filter(hasDataWord),
    ]),
    organizationChangeReadiness: compact([
      ...pickSignals(snippets, ['owners', 'workstreams', 'change']),
      sponsor,
      ...(readiness?.softGaps ?? []).filter(hasChangeWord),
    ]),
    controlRequirements: compact([
      ...pickSignals(snippets, ['controls', 'decisions']),
      scope,
      ...openGateCriteria.filter(hasControlWord),
    ]),
    humanDecisionBoundaries: compact([
      ...pickSignals(snippets, ['decisions', 'controls']),
      scope,
    ]),
    timeToValueExpectations: compact([
      ...pickSignals(snippets, ['timeline', 'value']),
      valueHypothesis,
    ]),
    budgetFundingPosture: compact([
      ...pickSignals(snippets, ['budget', 'finance', 'funding']),
    ]),
    selectedSolutionBuildingBlocks: inferBuildingBlocks(
      `${moveName} ${archetype ?? ''} ${problem} ${scope} ${evidenceFamily} ${readinessText}`,
    ),
    evidenceBackedConstraints: compact([
      ...linkedSummaries,
      ...openGateCriteria,
      ...missingEvidence.map((item) => `Missing evidence: ${item}`),
    ]),
    unresolvedQuestions: compact([
      ...missingEvidence,
      ...(readiness?.hardGaps ?? []),
      ...(readiness?.softGaps ?? []),
    ]),
    assumptions: compact([
      archetype ? `Archetype: ${archetype}` : '',
      readiness?.coverageScore != null ? `Current-state readiness coverage: ${readiness.coverageScore}` : '',
    ]),
    notReadyConditions: compact([
      ...(readiness?.hardGaps ?? []),
      ...missingEvidence,
    ]),
    currentWorkflowWithPainPoints: compact([
      ...pickSignals(snippets, ['process', 'current_state', 'findings']),
      problem,
    ]),
    requiredFieldContract: compact([scope, evidenceFamily, ...missingEvidence]),
    humanApprovalCheckpoints: compact([
      ...openGateCriteria.filter(hasControlWord),
      scope,
    ]),
    controlBoundaries: compact([
      ...openGateCriteria.filter((item) => hasControlWord(item) || hasPrivacyWord(item)),
      scope,
    ]),
    towerMetricCandidates: compact([
      ...pickSignals(snippets, ['metrics', 'value']),
      valueHypothesis,
    ]),
    openQuestionsForSolutionDesign: compact([
      ...missingEvidence,
      ...(readiness?.hardGaps ?? []),
      ...(readiness?.softGaps ?? []),
    ]),
  };
}

export function assembleP3SolutionOptions({
  archetype,
  designInputs,
  evidenceNeedPackets = [],
  industryCode,
  moveId,
  moveName,
  readiness,
  tenantName,
  valueAtStake,
}: AssembleP3SolutionOptionsInput): P3OptionSet {
  const text = normalizeText(
    [
      tenantName,
      industryCode,
      moveName,
      archetype,
      valueAtStake,
      packText(designInputs),
      evidenceNeedPackets.map((packet) => packet.evidenceSlot).join(' '),
      readiness?.hardGaps?.join(' '),
      readiness?.softGaps?.join(' '),
    ].join(' '),
  );
  const useCasePattern = inferUseCasePattern(text);
  const missingEvidence = unique([
    ...(designInputs.unresolvedQuestions ?? []),
    ...(designInputs.notReadyConditions ?? []),
    ...evidenceNeedPackets
      .filter((packet) => !isEvidenceCovered(packet.status))
      .map((packet) => packet.evidenceSlot),
    ...(readiness?.hardGaps ?? []),
  ]).slice(0, 8);
  const evidenceBasis = unique([
    ...(designInputs.currentProcessFindings ?? []),
    ...(designInputs.painPointsAndRootCauses ?? []),
    ...(designInputs.currentSystems ?? []),
    ...(designInputs.currentDataPlatformState ?? []),
    ...(designInputs.controlRequirements ?? []),
    ...(designInputs.evidenceBackedConstraints ?? []),
    ...designInputs.currentWorkflowWithPainPoints,
  ]).slice(0, 8);
  const context = buildScoringContext(text, readiness, missingEvidence, evidenceBasis);
  const options = optionBlueprintsFor(useCasePattern).map((blueprint) =>
    finalizeOption(blueprint, context, missingEvidence, evidenceBasis),
  );
  const ranked = [...options].sort((a, b) => b.totalScore - a.totalScore);
  const canRecommend = context.evidenceSupported && ranked[0]?.confidence !== 'low';
  const recommendedOptionId = canRecommend ? ranked[0].id : null;
  const finalOptions = options.map((option) => ({
    ...option,
    recommended: option.id === recommendedOptionId,
    recommendationLabel:
      option.id === recommendedOptionId
        ? option.confidence === 'high'
          ? 'aVa recommends'
          : 'Provisional recommendation'
        : option.recommendationLabel,
  }));

  return {
    moveId,
    source: 'p3_design_inputs_pack',
    useCasePattern,
    options: finalOptions,
    recommendedOptionId,
    recommendationConfidence: recommendedOptionId
      ? finalOptions.find((option) => option.id === recommendedOptionId)?.confidence ?? 'low'
      : 'low',
    missingEvidence,
    evidenceBasis,
    usedGlobalStaticFallback: false,
  };
}

function finalizeOption(
  blueprint: OptionBlueprint,
  context: ScoringContext,
  missingEvidence: string[],
  evidenceBasis: string[],
): P3SolutionOption {
  const scores = { ...blueprint.baseScores };
  const ambitious = blueprint.id === 'C' || blueprint.id === 'D';
  const minimumFoundation = blueprint.id === 'B';
  const currentState = blueprint.id === 'A';

  if (context.hasNinetyDayExpectation) {
    adjust(scores, 'time_to_proof', currentState ? 2 : minimumFoundation ? 3 : -2);
    adjust(scores, 'cost_effort_fit', ambitious ? -2 : 1);
  }
  if (context.dataWeak) {
    adjust(scores, 'data_platform_readiness', currentState ? 1 : minimumFoundation ? 0 : -3);
    adjust(scores, 'risk_fit', ambitious ? -2 : 0);
  }
  if (context.controlHeavy) {
    adjust(scores, 'controls_fit', minimumFoundation ? 2 : currentState ? 1 : -2);
    adjust(scores, 'risk_fit', ambitious ? -1 : 1);
  }
  if (context.changeWeak) {
    adjust(scores, 'change_readiness', ambitious ? -2 : minimumFoundation ? 1 : 0);
  }
  if (context.fundingTight) {
    adjust(scores, 'cost_effort_fit', ambitious ? -3 : 1);
    adjust(scores, 'time_to_proof', ambitious ? -1 : 1);
  }

  const optionMissingEvidence = missingEvidence.filter((item) => optionNeedsEvidence(blueprint, item));
  const notRecommendedYetReasons = unique([
    ...blueprint.notRecommendedYetReasons,
    ...(ambitious && context.dataWeak ? ['Data foundation is not proven enough for a broad platform-first path.'] : []),
    ...(ambitious && context.hasNinetyDayExpectation ? ['Time-to-value expectation favors a narrower proof path first.'] : []),
    ...(ambitious && context.controlHeavy ? ['PHI/control boundaries need a human-gated model before wider orchestration.'] : []),
    ...(optionMissingEvidence.length ? optionMissingEvidence.map((item) => `Missing evidence: ${item}`) : []),
  ]).slice(0, 6);

  const totalScore = SCORE_DIMENSIONS.reduce((sum, key) => sum + scores[key], 0);
  const confidence = context.evidenceSupported
    ? optionMissingEvidence.length >= 4
      ? 'medium'
      : 'high'
    : optionMissingEvidence.length >= 2
      ? 'low'
      : 'medium';

  return {
    ...blueprint,
    scores,
    totalScore,
    confidence,
    recommended: false,
    recommendationLabel: '',
    evidenceBasis,
    missingEvidence: optionMissingEvidence,
    notRecommendedYetReasons,
  };
}

interface ScoringContext {
  hasNinetyDayExpectation: boolean;
  dataWeak: boolean;
  controlHeavy: boolean;
  changeWeak: boolean;
  fundingTight: boolean;
  evidenceSupported: boolean;
}

function buildScoringContext(
  text: string,
  readiness: P3OptionReadinessInput | null | undefined,
  missingEvidence: string[],
  evidenceBasis: string[],
): ScoringContext {
  const missingText = normalizeText(missingEvidence.join(' '));
  return {
    hasNinetyDayExpectation:
      /\b(90|ninety|quarter|q[1-4]|fast|quick|near[- ]term|pilot|proof)\b/.test(text),
    dataWeak:
      (readiness?.coverageScore != null && readiness.coverageScore < 70) ||
      /data|platform|source|quality|lineage|semantic|lakehouse|crm|claims|emr|ehr|warehouse/.test(missingText),
    controlHeavy: /phi|privacy|security|audit|compliance|guardrail|human|approval|clinical|legal/.test(text),
    changeWeak: /training|adoption|change|owner|sme|capacity|operating model|workforce/.test(missingText),
    fundingTight: /budget|funding|capacity|cost|run rate|rate card|finance/.test(missingText),
    evidenceSupported: evidenceBasis.length >= 3 || (readiness?.coverageScore ?? 0) >= 50,
  };
}

function optionBlueprintsFor(pattern: P3UseCasePattern): OptionBlueprint[] {
  if (pattern === 'member_service_agent_assist') {
    return [
      {
        id: 'A',
        label: 'Stabilize member-service workflow first',
        summary: 'Tighten routing, knowledge upkeep, scripts, and metric discipline before adding a scaled AI layer.',
        businessImpact: 'Improves consistency and reduces avoidable friction, but leaves larger cross-system navigation limits in place.',
        requiredBuildingBlocks: ['process_redesign', 'knowledge_retrieval_copilot', 'value_tracking_operating_cadence'],
        dataPlatformImplications: 'Uses existing reports and knowledge sources; does not prove the longitudinal data foundation.',
        humanAiSplit: 'Humans continue to decide and execute; AI is limited to knowledge retrieval or drafting support.',
        controls: 'Lowest control burden, but still needs knowledge governance and approval for policy updates.',
        timeToValue: 'Fastest path to a local proof if process owners can act quickly.',
        effort: 'Low to medium effort.',
        risks: ['May optimize around fragmented systems instead of fixing them.', 'Reuse outside member service is limited.'],
        dependencies: ['Operations owner', 'Knowledge owner', 'Baseline service metrics'],
        reusePotential: 'Limited reuse beyond call-center operations.',
        readinessConditions: ['Current process and metric baseline are accepted by operations.'],
        notRecommendedYetReasons: ['Not enough if the core issue is cross-system data fragmentation.'],
        baseScores: scores(6, 9, 7, 8, 8, 4, 8, 8, 5),
      },
      {
        id: 'B',
        label: 'Governed agent-assist layer on current systems',
        summary: 'Add a human-gated agent-assist layer across CRM, claims/auth/benefits, call transcripts, and approved knowledge.',
        businessImpact: 'Balances member experience, agent productivity, control, and time-to-proof while validating the data foundation.',
        requiredBuildingBlocks: [
          'data_readiness',
          'knowledge_retrieval_copilot',
          'ai_assisted_decision_support',
          'human_in_loop_agent',
          'controls_governance_risk',
          'value_tracking_operating_cadence',
        ],
        dataPlatformImplications: 'Requires trusted access patterns, semantic definitions, source freshness checks, and citation lineage for service data.',
        humanAiSplit: 'AI suggests context, intent, next best action, and drafts; agents and supervisors retain accountable decisions.',
        controls: 'Fits PHI, policy, and audit needs through role-based access, citations, human review, and escalation boundaries.',
        timeToValue: 'Best fit when leadership wants a bounded proof before a broader platform program.',
        effort: 'Medium effort.',
        risks: ['Data access delays can slow proof.', 'Knowledge quality and supervisor adoption must be managed.'],
        dependencies: ['CRM and claims/auth/benefits access', 'Knowledge governance', 'PHI controls', 'Agent adoption plan'],
        reusePotential: 'Reusable pattern for prior authorization, utilization management, coding support, and service analytics.',
        readinessConditions: ['Service data sources are accessible enough for cited answers.', 'Human approval boundaries are explicit.'],
        notRecommendedYetReasons: [],
        baseScores: scores(8, 8, 7, 7, 8, 8, 7, 7, 8),
      },
      {
        id: 'C',
        label: 'Broader member-service orchestration platform',
        summary: 'Create a workflow orchestration layer that coordinates member-service journeys across service, claims, authorization, and knowledge work.',
        businessImpact: 'Higher strategic leverage, but it depends on stronger platform, data, integration, and operating-model readiness.',
        requiredBuildingBlocks: [
          'process_redesign',
          'data_readiness',
          'workflow_automation',
          'analytics_intelligence_layer',
          'system_platform_implementation',
          'controls_governance_risk',
        ],
        dataPlatformImplications: 'Needs durable integration, semantic layer, event/interaction history, identity/access model, and workflow telemetry.',
        humanAiSplit: 'AI and automation coordinate tasks; humans approve exceptions, clinical/legal boundaries, and escalations.',
        controls: 'Requires stronger governance for PHI, audit trails, automation policy, and operational fallback.',
        timeToValue: 'Longer path; better after the agent-assist proof validates data and control assumptions.',
        effort: 'High effort.',
        risks: ['Can become a transformation program before evidence is strong enough.', 'Integration scope may swamp value proof.'],
        dependencies: ['Enterprise architecture sponsorship', 'Integration capacity', 'Data platform readiness', 'Change-management capacity'],
        reusePotential: 'High reuse across health-plan and provider service operations.',
        readinessConditions: ['Validated semantic data foundation', 'Architecture owner alignment', 'Workflow integration budget'],
        notRecommendedYetReasons: [],
        baseScores: scores(9, 5, 5, 5, 6, 9, 4, 5, 9),
      },
      {
        id: 'D',
        label: 'Enterprise member-experience platform first',
        summary: 'Lead with a broad enterprise platform before proving the member-service agent-assist path.',
        businessImpact: 'Potentially transformational, but the burden of evidence, funding, change, and controls is highest.',
        requiredBuildingBlocks: [
          'data_readiness',
          'workflow_automation',
          'analytics_intelligence_layer',
          'system_platform_implementation',
          'controls_governance_risk',
          'value_tracking_operating_cadence',
        ],
        dataPlatformImplications: 'Requires enterprise-grade data products, governance, integration, identity, semantic layer, and measurement model up front.',
        humanAiSplit: 'Requires enterprise decision-rights model before AI or automation can safely scale.',
        controls: 'Highest control burden across PHI, audit, access, model governance, and operational risk.',
        timeToValue: 'Slowest path unless the foundation is already proven and funded.',
        effort: 'Very high effort.',
        risks: ['Value proof may lag investment.', 'Too broad for an initial governed Move if P2 evidence is incomplete.'],
        dependencies: ['Enterprise funding', 'Platform roadmap', 'Executive operating model', 'Data governance at scale'],
        reusePotential: 'Very high reuse if readiness is proven.',
        readinessConditions: ['Enterprise data foundation already proven', 'Funding and change capacity committed'],
        notRecommendedYetReasons: ['Usually not the first move unless P2 proves foundation, funding, and operating-model readiness.'],
        baseScores: scores(8, 3, 3, 3, 4, 10, 2, 3, 8),
      },
    ];
  }

  if (pattern === 'legal_contract_intake') {
    return [
      {
        id: 'A',
        label: 'Process-first legal intake cleanup',
        summary: 'Standardize request capture, triage rules, and obligation ownership before deeper automation.',
        businessImpact: 'Reduces avoidable rework and queue ambiguity with the least technology change.',
        requiredBuildingBlocks: ['process_redesign', 'controls_governance_risk', 'value_tracking_operating_cadence'],
        dataPlatformImplications: 'Uses existing contract/request logs and a minimum field contract.',
        humanAiSplit: 'Legal team remains primary; AI is limited to drafting or summarizing after review.',
        controls: 'Attorney approval and privilege boundaries remain intact.',
        timeToValue: 'Fastest option if legal operations owns the workflow.',
        effort: 'Low to medium effort.',
        risks: ['Limited automation leverage.', 'May not solve obligations buried in documents.'],
        dependencies: ['Intake owner', 'Minimum request fields', 'Attorney review model'],
        reusePotential: 'Moderate reuse across legal intake patterns.',
        readinessConditions: ['Request categories and owners are accepted.'],
        notRecommendedYetReasons: ['Insufficient if obligation extraction or CLM integration is the main constraint.'],
        baseScores: scores(6, 9, 7, 7, 9, 5, 8, 8, 5),
      },
      {
        id: 'B',
        label: 'CLM-embedded assisted triage and obligation extraction',
        summary: 'Use the current CLM/intake path with AI-assisted extraction, routing, and attorney-reviewed recommendations.',
        businessImpact: 'Balances speed, legal control, and practical automation without forcing a new enterprise workflow platform first.',
        requiredBuildingBlocks: [
          'data_readiness',
          'ai_assisted_decision_support',
          'workflow_automation',
          'human_in_loop_agent',
          'controls_governance_risk',
        ],
        dataPlatformImplications: 'Needs contract metadata, document access, obligation fields, and audit/citation traceability.',
        humanAiSplit: 'AI extracts and suggests; attorneys approve terms, risk tier, and non-standard handling.',
        controls: 'Privilege, audit trail, and approval matrix are design constraints.',
        timeToValue: 'Good proof path once minimum CLM access and attorney review rules are proven.',
        effort: 'Medium effort.',
        risks: ['Extraction quality must be validated.', 'Approval thresholds may be incomplete.'],
        dependencies: ['CLM access', 'Obligation owner', 'Attorney approval matrix', 'Document lineage'],
        reusePotential: 'Reusable for procurement, vendor contracts, and compliance obligations.',
        readinessConditions: ['System of record and approval thresholds are known.'],
        notRecommendedYetReasons: [],
        baseScores: scores(8, 8, 7, 7, 9, 8, 7, 7, 8),
      },
      {
        id: 'C',
        label: 'Cross-system legal workflow orchestration',
        summary: 'Coordinate legal intake, CLM, vendor/procurement, and obligation management in one governed workflow.',
        businessImpact: 'Higher leverage but depends on cross-system ownership and stronger integration readiness.',
        requiredBuildingBlocks: [
          'process_redesign',
          'workflow_automation',
          'system_platform_implementation',
          'controls_governance_risk',
          'analytics_intelligence_layer',
        ],
        dataPlatformImplications: 'Needs cross-system identifiers, integration patterns, obligation lineage, and reporting model.',
        humanAiSplit: 'Automation routes and coordinates; legal approves risk and non-standard obligations.',
        controls: 'Requires enterprise legal governance, audit, and privilege guardrails.',
        timeToValue: 'Better after embedded triage proves the field contract and controls.',
        effort: 'High effort.',
        risks: ['Cross-functional ownership may be unresolved.', 'Integration can dominate the roadmap.'],
        dependencies: ['Legal, procurement, vendor, and architecture owners', 'Integration funding'],
        reusePotential: 'High reuse across enterprise obligation workflows.',
        readinessConditions: ['Cross-system ownership and data contracts are approved.'],
        notRecommendedYetReasons: [],
        baseScores: scores(8, 5, 5, 5, 7, 9, 4, 5, 8),
      },
      {
        id: 'D',
        label: 'Autonomous legal review platform',
        summary: 'Attempt broad automated legal review before the attorney-controlled evidence path is proven.',
        businessImpact: 'Potentially high, but usually overreaches legal-control evidence in early phases.',
        requiredBuildingBlocks: ['ai_assisted_decision_support', 'system_platform_implementation', 'controls_governance_risk'],
        dataPlatformImplications: 'Requires mature clause library, precedent set, approval evidence, and test corpus.',
        humanAiSplit: 'Would need strict attorney override and blocked autonomous approval.',
        controls: 'Highest legal, privilege, and audit burden.',
        timeToValue: 'Slow unless control evidence is unusually mature.',
        effort: 'Very high effort.',
        risks: ['Can imply autonomous approval where human legal judgment is required.'],
        dependencies: ['Approved precedent corpus', 'Attorney review policy', 'Risk acceptance'],
        reusePotential: 'High only after controls are proven.',
        readinessConditions: ['Evidence-backed legal evaluation and attorney governance are already in place.'],
        notRecommendedYetReasons: ['Not appropriate while attorney approval and privilege boundaries remain open questions.'],
        baseScores: scores(7, 3, 3, 3, 2, 8, 2, 2, 6),
      },
    ];
  }

  if (pattern === 'finance_close_and_transparency') {
    return financeBlueprints();
  }

  if (pattern === 'operations_resilience') {
    return operationsBlueprints();
  }

  return genericBlueprints();
}

function financeBlueprints(): OptionBlueprint[] {
  return [
    genericOption('A', 'Close-process and reconciliation cleanup', 'Improve handoffs, ownership, and close controls before deeper automation.', ['process_redesign', 'value_tracking_operating_cadence'], 6, 9, 7),
    genericOption('B', 'Governed finance data product and reporting layer', 'Create a controlled finance data layer for cost, margin, reconciliation, and executive reporting.', ['data_readiness', 'analytics_intelligence_layer', 'controls_governance_risk'], 8, 7, 8),
    genericOption('C', 'End-to-end financial transparency platform', 'Unify GL, contracts, claims/cost, and planning views into a broader management platform.', ['system_platform_implementation', 'analytics_intelligence_layer', 'workflow_automation'], 9, 5, 9),
    genericOption('D', 'Automated close transformation first', 'Start with broad close automation before the control and data foundation is proven.', ['workflow_automation', 'system_platform_implementation', 'controls_governance_risk'], 7, 3, 7),
  ];
}

function operationsBlueprints(): OptionBlueprint[] {
  return [
    genericOption('A', 'Operational playbook and metric discipline', 'Tighten response workflow, owner handoffs, and operating metrics before platform changes.', ['process_redesign', 'value_tracking_operating_cadence'], 6, 9, 5),
    genericOption('B', 'Governed operational intelligence layer', 'Create a cited intelligence layer over current systems with human-reviewed recommendations.', ['data_readiness', 'knowledge_retrieval_copilot', 'human_in_loop_agent'], 8, 8, 8),
    genericOption('C', 'Workflow orchestration across operations', 'Coordinate cross-functional workflows, alerts, and decisions across systems.', ['workflow_automation', 'system_platform_implementation', 'analytics_intelligence_layer'], 9, 5, 9),
    genericOption('D', 'Enterprise operating platform first', 'Lead with a broad platform program before the narrower operating proof is validated.', ['system_platform_implementation', 'controls_governance_risk'], 8, 3, 8),
  ];
}

function genericBlueprints(): OptionBlueprint[] {
  return [
    genericOption('A', 'Focused current-state improvement path', 'Address the most visible workflow and ownership gaps with minimal platform change.', ['process_redesign', 'value_tracking_operating_cadence'], 6, 8, 5),
    genericOption('B', 'Minimum viable governed solution path', 'Build the smallest governed solution that proves value, data readiness, controls, and adoption.', ['data_readiness', 'human_in_loop_agent', 'controls_governance_risk'], 8, 8, 8),
    genericOption('C', 'Scaled operating-model and platform path', 'Design a broader target state once evidence supports platform, change, and funding readiness.', ['workflow_automation', 'system_platform_implementation', 'analytics_intelligence_layer'], 9, 5, 9),
    genericOption('D', 'Enterprise transformation first path', 'Start with the broadest platform and operating-model change before a narrower proof.', ['system_platform_implementation', 'controls_governance_risk'], 8, 3, 8),
  ];
}

function genericOption(
  id: string,
  label: string,
  summary: string,
  blocks: BuildingBlockKey[],
  businessValue: number,
  timeToProof: number,
  strategicFit: number,
): OptionBlueprint {
  const ambitious = id === 'C' || id === 'D';
  return {
    id,
    label,
    summary,
    businessImpact: ambitious
      ? 'Higher leverage if evidence supports the readiness burden.'
      : 'Creates a bounded proof path while preserving decision control.',
    requiredBuildingBlocks: blocks,
    dataPlatformImplications: ambitious
      ? 'Requires stronger source, semantic, integration, and lineage readiness.'
      : 'Uses the minimum data foundation needed to prove the use case.',
    humanAiSplit: 'AI supports recommendations; accountable owners retain decisions until controls are proven.',
    controls: 'Controls must match the evidence, policy, audit, and approval boundaries carried from P2.',
    timeToValue: ambitious ? 'Longer path unless readiness is already strong.' : 'Designed for earlier proof and learning.',
    effort: ambitious ? 'High effort.' : 'Low to medium effort.',
    risks: ambitious
      ? ['Scope can outpace evidence.', 'Funding and change burden may be too high.']
      : ['May need a follow-on path for reuse and scale.'],
    dependencies: ['Approved P2 findings', 'Evidence-backed constraints', 'Accountable owner decision'],
    reusePotential: ambitious ? 'High reuse if readiness is proven.' : 'Moderate reuse through a repeatable pattern.',
    readinessConditions: ['P2 evidence is accepted and open gaps are explicit.'],
    notRecommendedYetReasons: ambitious ? ['Not recommended yet if data, controls, or change readiness remain unproven.'] : [],
    baseScores: scores(
      businessValue,
      timeToProof,
      ambitious ? 5 : 7,
      ambitious ? 5 : 7,
      ambitious ? 6 : 8,
      strategicFit,
      ambitious ? 4 : 7,
      ambitious ? 5 : 7,
      strategicFit,
    ),
  };
}

function scores(
  businessValue: number,
  timeToProof: number,
  dataPlatformReadiness: number,
  changeReadiness: number,
  controlsFit: number,
  reusePotential: number,
  costEffortFit: number,
  riskFit: number,
  strategicFit: number,
): Record<P3OptionScoreDimension, number> {
  return {
    business_value: businessValue,
    time_to_proof: timeToProof,
    data_platform_readiness: dataPlatformReadiness,
    change_readiness: changeReadiness,
    controls_fit: controlsFit,
    reuse_potential: reusePotential,
    cost_effort_fit: costEffortFit,
    risk_fit: riskFit,
    strategic_fit: strategicFit,
  };
}

function adjust(scoresRecord: Record<P3OptionScoreDimension, number>, key: P3OptionScoreDimension, amount: number) {
  scoresRecord[key] = Math.max(1, Math.min(10, scoresRecord[key] + amount));
}

function inferUseCasePattern(text: string): P3UseCasePattern {
  if (/airline|airport|baggage|bag|disruption|irops|station|recovery|handler|sla/.test(text)) {
    return 'operations_resilience';
  }
  if (/member|call center|contact center|agent assist|agent-assist|claims|benefits|eligibility|prior auth|authorization|crm|pharmacy|emr|ehr|phi/.test(text)) {
    return 'member_service_agent_assist';
  }
  if (/legal|contract|clm|obligation|attorney|clause|privilege/.test(text)) {
    return 'legal_contract_intake';
  }
  if (/finance|close|gl|margin|cost|capitation|payment|reconciliation|reporting/.test(text)) {
    return 'finance_close_and_transparency';
  }
  if (/operations|workflow|resilience|recovery|service|irops|command|routing/.test(text)) {
    return 'operations_resilience';
  }
  return 'generic_bounded_solution';
}

function inferBuildingBlocks(text: string): BuildingBlockKey[] {
  const normalized = normalizeText(text);
  const blocks = new Set<BuildingBlockKey>(['process_redesign', 'value_tracking_operating_cadence']);
  if (/data|claim|crm|emr|ehr|platform|semantic|lakehouse|lineage|quality/.test(normalized)) {
    blocks.add('data_readiness');
  }
  if (/knowledge|policy|search|retrieval/.test(normalized)) {
    blocks.add('knowledge_retrieval_copilot');
  }
  if (/ai|agent|assist|decision|recommend/.test(normalized)) {
    blocks.add('ai_assisted_decision_support');
    blocks.add('human_in_loop_agent');
  }
  if (/workflow|orchestration|automation|route|handoff/.test(normalized)) {
    blocks.add('workflow_automation');
  }
  if (/platform|system|integration|architecture/.test(normalized)) {
    blocks.add('system_platform_implementation');
  }
  if (/control|privacy|phi|security|audit|compliance|approval/.test(normalized)) {
    blocks.add('controls_governance_risk');
  }
  if (/dashboard|analytics|metric|intelligence/.test(normalized)) {
    blocks.add('analytics_intelligence_layer');
  }
  return [...blocks];
}

function optionNeedsEvidence(blueprint: OptionBlueprint, item: string): boolean {
  const text = normalizeText(`${blueprint.label} ${blueprint.summary} ${blueprint.dataPlatformImplications} ${blueprint.controls}`);
  const evidence = normalizeText(item);
  if (!evidence) return false;
  if (/data|platform|source|quality|semantic|lineage|crm|claims|emr|ehr/.test(evidence)) {
    return blueprint.requiredBuildingBlocks.some((block) =>
      ['data_readiness', 'system_platform_implementation', 'analytics_intelligence_layer'].includes(block),
    );
  }
  if (/control|privacy|phi|security|audit|approval|compliance/.test(evidence)) {
    return text.includes('control') || blueprint.requiredBuildingBlocks.includes('controls_governance_risk');
  }
  if (/change|training|owner|capacity|adoption/.test(evidence)) {
    return text.includes('operating') || blueprint.id === 'C' || blueprint.id === 'D';
  }
  return blueprint.id !== 'A';
}

function groupSignals(signals: DeliverableContentSignal[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();
  for (const signal of signals) {
    const key = normalizeText(signal.key || signal.heading || 'signal').replace(/\s+/g, '_');
    const value = signal.snippet?.trim();
    if (!value) continue;
    grouped.set(key, [...grouped.get(key) ?? [], value]);
  }
  return grouped;
}

function pickSignals(grouped: Map<string, string[]>, keys: string[]): string[] {
  const picked: string[] = [];
  for (const [key, values] of grouped) {
    if (keys.some((needle) => key.includes(needle))) {
      picked.push(...values);
    }
  }
  return picked;
}

function extractCharterScaffold(charter: unknown): Record<string, string> {
  if (!charter || typeof charter !== 'object') return {};
  const maybeScaffold = (charter as { scaffold?: unknown }).scaffold;
  if (!maybeScaffold || typeof maybeScaffold !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(maybeScaffold)) {
    if (typeof value === 'string') out[key] = value;
  }
  return out;
}

function packText(pack: P3DesignInputsPack): string {
  return [
    pack.businessOutcome,
    pack.currentProcessFindings,
    pack.painPointsAndRootCauses,
    pack.currentSystems,
    pack.currentDataPlatformState,
    pack.dataReadiness,
    pack.organizationChangeReadiness,
    pack.controlRequirements,
    pack.humanDecisionBoundaries,
    pack.timeToValueExpectations,
    pack.budgetFundingPosture,
    pack.evidenceBackedConstraints,
    pack.unresolvedQuestions,
    pack.assumptions,
    pack.notReadyConditions,
    pack.currentWorkflowWithPainPoints,
    pack.requiredFieldContract,
    pack.humanApprovalCheckpoints,
    pack.controlBoundaries,
    pack.towerMetricCandidates,
    pack.openQuestionsForSolutionDesign,
  ]
    .flat()
    .filter(Boolean)
    .join(' ');
}

function compact(values: Array<string | null | undefined>): string[] {
  return unique(values.map((value) => value?.trim() ?? '').filter(Boolean)).slice(0, 10);
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalizeText(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\w\s%-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isEvidenceCovered(status: string): boolean {
  return status === 'covered' || status === 'waived' || status === 'not_applicable';
}

function hasDataWord(value: string): boolean {
  return /data|platform|source|quality|lineage|semantic|lakehouse|warehouse|crm|claims|emr|ehr/i.test(value);
}

function hasControlWord(value: string): boolean {
  return /control|privacy|security|audit|compliance|approval|guardrail|risk|human/i.test(value);
}

function hasPrivacyWord(value: string): boolean {
  return /phi|privacy|clinical|legal|privilege|restricted/i.test(value);
}

function hasChangeWord(value: string): boolean {
  return /change|training|adoption|owner|sme|capacity|operating model|workforce/i.test(value);
}

export function containsLegacyStaticP3Labels(optionSet: P3OptionSet): boolean {
  const labels = optionSet.options.map((option) => option.label);
  return STATIC_LEGACY_LABELS.every((label) => labels.includes(label));
}
