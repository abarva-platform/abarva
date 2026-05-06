import {
  SOURCE_DEFAULT_VALIDATION_PASS_CRITERIA,
  type SourceAgentValidationFinding,
  type SourceAgentValidationFixture,
  type SourceAgentValidationFixtureExpectedContext,
  type SourceAgentValidationFixtureInput,
  type SourceAgentValidationFixtureResult,
  type SourceAgentValidationFixtureVerdict,
  type SourceAgentValidationScore,
  type SourceAgentValidationSeverity,
  type SourceAgentValidationResult,
  type SourceAgentValidationDimension,
  type SourceVanillaResponseFlag,
} from './agent-validation';
import type {
  SourceAgentContextBundle,
  SourceContextAssemblyFailure,
  SourceContextUsed,
  SourceSurface,
} from './agent-context';
import {
  SOURCE_GOLDEN_EVENT_IDS,
} from './constants';
import {
  buildSourceContextAssemblyResultFromSeed,
  getMissingContextReasons,
  getSourceContextUsed,
} from './context-builder';
import type {
  SourceStageKey,
} from './types';

export const SOURCE_AGENT_VALIDATION_FIXTURE_TENANT = {
  tenantId: 'tenant-northstar',
  tenantKey: 'northstar',
  tenantName: 'Northstar Holdings',
  activeClientId: 'client-northstar',
  activeClientName: 'Northstar Holdings',
} as const;

export const SOURCE_AGENT_VALIDATION_FIXTURE_USER = {
  id: 'user-source-validation',
  email: 'source.validation@example.com',
  name: 'Source Validation Reviewer',
} as const;

const DATA_AI_EVENT_ID = SOURCE_GOLDEN_EVENT_IDS.dataAiModernization;
const DIGITAL_EVENT_ID = SOURCE_GOLDEN_EVENT_IDS.digitalAppBuild;

function sourceFixtureInput(
  prompt: string,
  options: {
    eventId?: string;
    stageKey?: SourceStageKey;
    surface: SourceSurface;
    route?: string;
    selectedAttachmentIds?: string[];
  },
): SourceAgentValidationFixtureInput {
  return {
    tenant: { ...SOURCE_AGENT_VALIDATION_FIXTURE_TENANT },
    user: { ...SOURCE_AGENT_VALIDATION_FIXTURE_USER },
    userRole: 'sourcingLead',
    persona: 'sourcingLead',
    route: options.route ?? (options.eventId ? `/source/events/${options.eventId}` : '/source'),
    surface: options.surface,
    userPrompt: prompt,
    eventId: options.eventId,
    stageKey: options.stageKey,
    selectedAttachmentIds: options.selectedAttachmentIds ?? [],
    priorConversationTurns: [],
  };
}

function expectedContext(
  overrides: Partial<SourceAgentValidationFixtureExpectedContext>,
): SourceAgentValidationFixtureExpectedContext {
  return {
    contextScope: 'event',
    requiresEvent: true,
    requiresStage: false,
    requiresLifecycleStatus: true,
    requiresMissingInputs: false,
    requiresOwner: true,
    requiresDueDateWhenAvailable: true,
    requiresAging: true,
    requiresPattern: true,
    requiresPatternSections: false,
    requiresScorecard: false,
    requiresScorecardDefaultsOrOverrides: false,
    requiresValueLedger: false,
    requiresAttachmentSummary: false,
    requiresArtifactReadiness: false,
    requiresGateCheck: false,
    requiredAllowedActionIds: [],
    ...overrides,
  };
}

function fixture(
  input: Omit<SourceAgentValidationFixture, 'passCriteria'>,
): SourceAgentValidationFixture {
  return {
    ...input,
    passCriteria: SOURCE_DEFAULT_VALIDATION_PASS_CRITERIA,
  };
}

export const SOURCE_AGENT_VALIDATION_FIXTURES: SourceAgentValidationFixture[] = [
  fixture({
    id: 'source-golden-dashboard-attention',
    category: 'portfolioAttention',
    surface: 'dashboard',
    persona: 'sourcingLead',
    prompt: 'What needs my attention?',
    scenario: 'Source dashboard attention review across active sourcing events.',
    contextInput: sourceFixtureInput('What needs my attention?', {
      surface: 'dashboard',
      route: '/source',
    }),
    expectedContext: expectedContext({
      contextScope: 'portfolio',
      requiresEvent: false,
      requiresStage: false,
      requiresLifecycleStatus: false,
      requiresOwner: true,
      requiresAging: false,
      requiresPattern: false,
      requiresValueLedger: true,
      requiredAllowedActionIds: [
        'source-action-review-portfolio',
        'source-action-view-value-ledger',
      ],
    }),
    expectedBehavior: {
      mustMention: [
        'Data & AI Modernization SI Selection',
        'Digital App Build Partner Selection',
        'owner',
        'next action',
        'value at stake',
      ],
      mustUseContext: [
        'portfolio blockers',
        'attention items',
        'allowed actions',
        'value context',
      ],
      mustNotDo: [
        'give generic prioritization advice',
        'ignore named events',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'missingEventContext',
      'missingNextAction',
      'genericConsultantVoice',
    ],
  }),
  fixture({
    id: 'source-golden-dashboard-most-at-risk',
    category: 'portfolioRisk',
    surface: 'dashboard',
    persona: 'cio',
    prompt: 'Which sourcing event is most at risk?',
    scenario: 'CIO asks the dashboard to identify the event requiring intervention.',
    contextInput: sourceFixtureInput('Which sourcing event is most at risk?', {
      surface: 'dashboard',
      route: '/source',
    }),
    expectedContext: expectedContext({
      contextScope: 'portfolio',
      requiresEvent: false,
      requiresStage: false,
      requiresLifecycleStatus: false,
      requiresOwner: true,
      requiresAging: false,
      requiresPattern: false,
      requiresValueLedger: true,
      requiredAllowedActionIds: ['source-action-review-portfolio'],
    }),
    expectedBehavior: {
      mustMention: [
        'event name',
        'lifecycle status',
        'aging',
        'blocker',
        'next action',
      ],
      mustUseContext: [
        'portfolio risk state',
        'waiting state',
        'owner',
        'value at stake',
      ],
      mustNotDo: [
        'list generic sourcing risk categories',
        'omit event-specific blocker',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'missingEventContext',
      'genericSourcingAdvice',
      'missingNextAction',
    ],
  }),
  fixture({
    id: 'source-golden-scope-move-to-rfp',
    category: 'stageGate',
    surface: 'scopeWorkspace',
    persona: 'procurementLeader',
    prompt: 'Can we move to RFP?',
    eventId: DATA_AI_EVENT_ID,
    stageKey: 'scope',
    scenario: 'Procurement checks whether the blocked Scope stage can advance.',
    contextInput: sourceFixtureInput('Can we move to RFP?', {
      eventId: DATA_AI_EVENT_ID,
      stageKey: 'scope',
      surface: 'scopeWorkspace',
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DATA_AI_EVENT_ID,
      expectedEventName: 'Data & AI Modernization SI Selection',
      expectedStageKey: 'scope',
      expectedLifecycleStatus: 'waiting_on_client',
      requiresStage: true,
      requiresMissingInputs: true,
      requiresArtifactReadiness: true,
      requiresGateCheck: true,
      requiresValueLedger: true,
      requiredAllowedActionIds: [
        'source-action-show-missing-inputs',
        'source-action-generate-minimum-data-request',
        'source-action-explain-scope-readiness',
      ],
    }),
    expectedBehavior: {
      mustMention: [
        'Data & AI Modernization SI Selection',
        'Scope',
        'Waiting on Client',
        'Scope ready',
        'missing inputs',
      ],
      mustUseContext: [
        'stage gate',
        'missing inputs',
        'readiness score',
        'allowed actions',
      ],
      mustNotDo: [
        'advance without gate check',
        'generate RFP content',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'missingStageContext',
      'missingGateCheck',
      'genericSourcingAdvice',
    ],
  }),
  fixture({
    id: 'source-golden-scope-missing-data',
    category: 'missingInputs',
    surface: 'scopeWorkspace',
    persona: 'pmoLead',
    prompt: 'What data do we still need?',
    eventId: DATA_AI_EVENT_ID,
    stageKey: 'scope',
    scenario: 'PMO checks the specific missing inputs blocking Scope.',
    contextInput: sourceFixtureInput('What data do we still need?', {
      eventId: DATA_AI_EVENT_ID,
      stageKey: 'scope',
      surface: 'scopeWorkspace',
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DATA_AI_EVENT_ID,
      expectedEventName: 'Data & AI Modernization SI Selection',
      expectedStageKey: 'scope',
      expectedLifecycleStatus: 'waiting_on_client',
      requiresStage: true,
      requiresMissingInputs: true,
      requiresArtifactReadiness: true,
      requiresGateCheck: true,
      requiresValueLedger: true,
      requiredAllowedActionIds: [
        'source-action-show-missing-inputs',
        'source-action-generate-minimum-data-request',
      ],
    }),
    expectedBehavior: {
      mustMention: [
        'Application inventory',
        'analytics workload baseline',
        'Minimum Data Request',
        'Client PMO Lead',
      ],
      mustUseContext: [
        'missing inputs',
        'required artifacts',
        'stage gate',
        'owner',
      ],
      mustNotDo: [
        'give a generic sourcing checklist',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'missingEventContext',
      'missingStageContext',
      'genericSourcingAdvice',
    ],
  }),
  fixture({
    id: 'source-golden-scorecard-commercial-weight',
    category: 'scorecardGovernance',
    surface: 'scorecardGovernance',
    persona: 'procurementLeader',
    prompt: 'Can I change commercial weight to 25%?',
    eventId: DATA_AI_EVENT_ID,
    stageKey: 'scope',
    scenario: 'Procurement asks for a scorecard weight change after deterministic pattern defaults are available.',
    contextInput: sourceFixtureInput('Can I change commercial weight to 25%?', {
      eventId: DATA_AI_EVENT_ID,
      stageKey: 'scope',
      surface: 'scorecardGovernance',
      route: `/source/events/${DATA_AI_EVENT_ID}/scorecard`,
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DATA_AI_EVENT_ID,
      expectedEventName: 'Data & AI Modernization SI Selection',
      expectedStageKey: 'scope',
      expectedLifecycleStatus: 'waiting_on_client',
      requiresStage: true,
      requiresScorecard: true,
      requiresScorecardDefaultsOrOverrides: true,
      requiresGateCheck: true,
      requiredAllowedActionIds: ['source-action-review-scorecard'],
    }),
    expectedBehavior: {
      mustMention: [
        'scorecard',
        'default weight',
        'override rationale',
        'approval',
        'lock state',
      ],
      mustUseContext: [
        'scorecard state',
        'pattern defaults',
        'override history',
      ],
      mustNotDo: [
        'blindly approve the change',
        'ignore scorecard governance',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'scorecardWithoutDefaultsOrOverrides',
      'genericConsultantVoice',
    ],
  }),
  fixture({
    id: 'source-golden-artifact-generate-rfp',
    category: 'artifactReadiness',
    surface: 'artifactDrawer',
    persona: 'sourcingLead',
    prompt: 'Generate the RFP.',
    eventId: DATA_AI_EVENT_ID,
    stageKey: 'scope',
    scenario: 'Sourcing lead asks for RFP generation while Scope is blocked.',
    contextInput: sourceFixtureInput('Generate the RFP.', {
      eventId: DATA_AI_EVENT_ID,
      stageKey: 'scope',
      surface: 'artifactDrawer',
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DATA_AI_EVENT_ID,
      expectedEventName: 'Data & AI Modernization SI Selection',
      expectedStageKey: 'scope',
      expectedLifecycleStatus: 'waiting_on_client',
      requiresStage: true,
      requiresMissingInputs: true,
      requiresArtifactReadiness: true,
      requiresGateCheck: true,
      requiresValueLedger: true,
      requiredAllowedActionIds: [
        'source-action-generate-minimum-data-request',
        'source-action-review-artifacts',
      ],
    }),
    expectedBehavior: {
      mustMention: [
        'missing inputs',
        'artifact readiness',
        'Stub or Outline only',
        'Scope gate',
      ],
      mustUseContext: [
        'required inputs',
        'artifact status',
        'stage gate',
      ],
      mustNotDo: [
        'generate final RFP language',
        'invent vendor, pricing, or scope facts',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'defer',
    genericResponseFailureFlags: [
      'missingGateCheck',
      'genericSourcingAdvice',
      'hallucinatedFact',
    ],
  }),
  fixture({
    id: 'source-golden-attachment-vendor-response-summary',
    category: 'attachmentGrounding',
    surface: 'vendorResponses',
    persona: 'sourcingLead',
    prompt: 'Summarize this vendor response.',
    eventId: DIGITAL_EVENT_ID,
    stageKey: 'vendor_responses',
    scenario: 'Sourcing lead asks for a file-specific summary with only a seeded placeholder attachment, not client evidence.',
    contextInput: sourceFixtureInput('Summarize this vendor response.', {
      eventId: DIGITAL_EVENT_ID,
      stageKey: 'vendor_responses',
      surface: 'vendorResponses',
      selectedAttachmentIds: ['attachment-source-003-vendor-response-placeholder'],
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DIGITAL_EVENT_ID,
      expectedEventName: 'Digital App Build Partner Selection',
      expectedStageKey: 'responses',
      expectedLifecycleStatus: 'waiting_on_vendor',
      requiresStage: true,
      requiresMissingInputs: true,
      requiresAttachmentSummary: true,
      requiresArtifactReadiness: true,
      requiresGateCheck: true,
      requiresValueLedger: true,
      requiredAllowedActionIds: [
        'source-action-show-missing-inputs',
        'source-action-review-artifacts',
      ],
    }),
    expectedBehavior: {
      mustMention: [
        'uploaded file',
        'parsed summary',
        'confidence',
        'missing sections',
      ],
      mustUseContext: [
        'attachment summary',
        'citation references',
        'vendor response stage',
      ],
      mustNotDo: [
        'invent vendor response facts',
        'summarize a file without parsed evidence',
      ],
      requiredEvidenceLevel: 4,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'defer',
    genericResponseFailureFlags: [
      'fileWithoutCitation',
      'hallucinatedFact',
      'genericConsultantVoice',
    ],
  }),
  fixture({
    id: 'source-golden-pattern-data-ai-rationale',
    category: 'patternGrounding',
    surface: 'nexusPanel',
    persona: 'cto',
    prompt: 'Why is this a Data & AI Modernization sourcing event?',
    eventId: DATA_AI_EVENT_ID,
    stageKey: 'scope',
    scenario: 'CTO asks why the selected pattern/archetype applies.',
    contextInput: sourceFixtureInput('Why is this a Data & AI Modernization sourcing event?', {
      eventId: DATA_AI_EVENT_ID,
      stageKey: 'scope',
      surface: 'nexusPanel',
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DATA_AI_EVENT_ID,
      expectedEventName: 'Data & AI Modernization SI Selection',
      expectedStageKey: 'scope',
      expectedLifecycleStatus: 'waiting_on_client',
      requiresStage: true,
      requiresPattern: true,
      requiresPatternSections: true,
      requiresValueLedger: true,
    }),
    expectedBehavior: {
      mustMention: [
        'Data & AI Modernization',
        'pattern pack',
        'application inventory',
        'analytics workload baseline',
      ],
      mustUseContext: [
        'selected pattern pack',
        'event archetype',
        'relevant pattern sections',
      ],
      mustNotDo: [
        'give a generic modernization explanation',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'genericSourcingAdvice',
      'genericConsultantVoice',
    ],
  }),
  fixture({
    id: 'source-golden-value-projected-realized',
    category: 'valueLedgerGrounding',
    surface: 'valueLedger',
    persona: 'cfo',
    prompt: 'What value is projected versus realized?',
    eventId: DATA_AI_EVENT_ID,
    stageKey: 'scope',
    scenario: 'CFO checks projected versus realized value and confidence.',
    contextInput: sourceFixtureInput('What value is projected versus realized?', {
      eventId: DATA_AI_EVENT_ID,
      stageKey: 'scope',
      surface: 'valueLedger',
      route: '/source/value',
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DATA_AI_EVENT_ID,
      expectedEventName: 'Data & AI Modernization SI Selection',
      expectedStageKey: 'scope',
      expectedLifecycleStatus: 'waiting_on_client',
      requiresStage: true,
      requiresValueLedger: true,
      requiresOwner: true,
      requiresAging: true,
      requiredAllowedActionIds: ['source-action-view-value-context'],
    }),
    expectedBehavior: {
      mustMention: [
        '$18.5M',
        'projected',
        'realized',
        'confidence',
        'assumptions',
      ],
      mustUseContext: [
        'projected value ledger',
        'realized value ledger',
        'ledger confidence',
      ],
      mustNotDo: [
        'state projected savings as realized',
        'invent realized value',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'valueWithoutLedger',
      'hallucinatedFact',
    ],
  }),
  fixture({
    id: 'source-golden-wait-state-owner',
    category: 'waitStateGrounding',
    surface: 'nexusPanel',
    persona: 'pmoLead',
    prompt: 'Why are we waiting and who owns it?',
    eventId: DATA_AI_EVENT_ID,
    stageKey: 'scope',
    scenario: 'PMO asks for the wait-state reason, owner, and aging.',
    contextInput: sourceFixtureInput('Why are we waiting and who owns it?', {
      eventId: DATA_AI_EVENT_ID,
      stageKey: 'scope',
      surface: 'nexusPanel',
    }),
    expectedContext: expectedContext({
      contextScope: 'stage',
      expectedEventId: DATA_AI_EVENT_ID,
      expectedEventName: 'Data & AI Modernization SI Selection',
      expectedStageKey: 'scope',
      expectedLifecycleStatus: 'waiting_on_client',
      requiresStage: true,
      requiresMissingInputs: true,
      requiresOwner: true,
      requiresAging: true,
      requiresGateCheck: true,
      requiresValueLedger: true,
      requiredAllowedActionIds: [
        'source-action-send-client-reminder',
        'source-action-update-owner',
      ],
    }),
    expectedBehavior: {
      mustMention: [
        'Waiting on Client',
        'Client PMO Lead',
        '12 days',
        'application inventory',
      ],
      mustUseContext: [
        'wait state',
        'owner',
        'aging',
        'blocker',
      ],
      mustNotDo: [
        'give generic delay advice',
      ],
      requiredEvidenceLevel: 3,
      suggestedActionsExpected: true,
    },
    expectedVerdict: 'pass',
    genericResponseFailureFlags: [
      'missingNextAction',
      'genericConsultantVoice',
    ],
  }),
];

export function getSourceAgentValidationFixture(
  fixtureId: string,
): SourceAgentValidationFixture | undefined {
  return SOURCE_AGENT_VALIDATION_FIXTURES.find((fixtureItem) => fixtureItem.id === fixtureId);
}

export function validateSourceAgentValidationFixture(
  fixtureItem: SourceAgentValidationFixture,
): SourceAgentValidationFixtureResult {
  const assemblyResult = buildSourceContextAssemblyResultFromSeed(fixtureItem.contextInput);

  if (!assemblyResult.ok || !assemblyResult.bundle) {
    return createAssemblyFailureResult(fixtureItem, assemblyResult.failure);
  }

  const bundle = assemblyResult.bundle;
  const contextUsed = getSourceContextUsed(bundle);
  const findings = collectFixtureFindings(fixtureItem, bundle);
  const actualVerdict = getFixtureVerdict(fixtureItem, bundle, findings);
  const validationResult = createFixtureValidationResult(
    fixtureItem,
    bundle,
    findings,
    actualVerdict,
  );

  return {
    fixtureId: fixtureItem.id,
    prompt: fixtureItem.prompt,
    expectedVerdict: fixtureItem.expectedVerdict,
    actualVerdict,
    passesExpectation: actualVerdict === fixtureItem.expectedVerdict,
    validationResult,
    contextUsed,
    missingContextReasons: getMissingContextReasons(bundle),
    genericResponseWouldFail: fixtureItem.genericResponseFailureFlags.length > 0,
    genericResponseFailureFlags: fixtureItem.genericResponseFailureFlags,
  };
}

export function validateSourceAgentValidationFixtures(
  fixtures: SourceAgentValidationFixture[] = SOURCE_AGENT_VALIDATION_FIXTURES,
): SourceAgentValidationFixtureResult[] {
  return fixtures.map(validateSourceAgentValidationFixture);
}

function collectFixtureFindings(
  fixtureItem: SourceAgentValidationFixture,
  bundle: SourceAgentContextBundle,
): SourceAgentValidationFinding[] {
  const findings: SourceAgentValidationFinding[] = [];
  const expected = fixtureItem.expectedContext;

  addFindingIf(
    findings,
    bundle.contextScope !== expected.contextScope,
    'context-scope-mismatch',
    'error',
    'contextGrounding',
    `Expected context scope ${expected.contextScope}, received ${bundle.contextScope}.`,
  );

  addFindingIf(
    findings,
    expected.requiresEvent && !bundle.sourcingEvent,
    'missing-event-context',
    'error',
    'missingContext',
    'Current event context is required but missing.',
  );

  addFindingIf(
    findings,
    Boolean(expected.expectedEventId && bundle.sourcingEvent?.id !== expected.expectedEventId),
    'unexpected-event-context',
    'error',
    'contextGrounding',
    `Expected event ${expected.expectedEventId}, received ${bundle.sourcingEvent?.id ?? 'none'}.`,
  );

  addFindingIf(
    findings,
    expected.requiresStage && !bundle.workflowStage,
    'missing-stage-context',
    'error',
    'missingContext',
    'Current stage context is required but missing.',
  );

  addFindingIf(
    findings,
    Boolean(expected.expectedStageKey && bundle.workflowStage?.key !== expected.expectedStageKey),
    'unexpected-stage-context',
    'error',
    'contextGrounding',
    `Expected stage ${expected.expectedStageKey}, received ${bundle.workflowStage?.key ?? 'none'}.`,
  );

  addFindingIf(
    findings,
    expected.requiresLifecycleStatus && !bundle.lifecycleStatus,
    'missing-lifecycle-status',
    'error',
    'contextGrounding',
    'Lifecycle status is required but missing.',
  );

  addFindingIf(
    findings,
    Boolean(expected.expectedLifecycleStatus && bundle.lifecycleStatus !== expected.expectedLifecycleStatus),
    'unexpected-lifecycle-status',
    'error',
    'contextGrounding',
    `Expected lifecycle status ${expected.expectedLifecycleStatus}, received ${bundle.lifecycleStatus ?? 'none'}.`,
  );

  addFindingIf(
    findings,
    expected.requiresMissingInputs && bundle.missingInputs.length === 0,
    'missing-input-awareness-empty',
    'error',
    'missingContext',
    'Missing-input awareness is required but no missing inputs were returned.',
  );

  addFindingIf(
    findings,
    expected.requiresOwner && !hasOwnerContext(bundle),
    'missing-owner-context',
    'error',
    'actionability',
    'Owner context is required but missing.',
  );

  addFindingIf(
    findings,
    expected.requiresAging && typeof bundle.agingDays !== 'number' && typeof bundle.waitState?.agingDays !== 'number',
    'missing-aging-context',
    'error',
    'actionability',
    'Aging context is required but missing.',
  );

  addFindingIf(
    findings,
    expected.requiresPattern && !bundle.selectedPatternPack,
    'missing-pattern-context',
    'warning',
    'missingContext',
    'Pattern/archetype context is required but missing.',
  );

  addFindingIf(
    findings,
    expected.requiresPatternSections && bundle.relevantPatternSections.length === 0,
    'missing-pattern-sections',
    'warning',
    'missingContext',
    'Pattern sections are required but not yet available.',
  );

  addFindingIf(
    findings,
    expected.requiresScorecard && !bundle.scorecard,
    'missing-scorecard-context',
    'error',
    'missingContext',
    'Scorecard context is required but missing.',
  );

  addFindingIf(
    findings,
    expected.requiresScorecardDefaultsOrOverrides && !hasScorecardDefaultsOrOverrides(bundle),
    'missing-scorecard-defaults-overrides',
    'warning',
    'missingContext',
    'Scorecard defaults or override history are required but missing.',
  );

  addFindingIf(
    findings,
    expected.requiresValueLedger && !hasValueLedgerContext(bundle),
    'missing-value-ledger-context',
    'warning',
    'missingContext',
    'Value ledger context is required but missing.',
  );

  addFindingIf(
    findings,
    expected.requiresAttachmentSummary && bundle.parsedFileSummaries.length === 0,
    'missing-attachment-summary',
    'warning',
    'missingContext',
    'Attachment-specific prompt requires parsed file summary context.',
  );

  addFindingIf(
    findings,
    expected.requiresAttachmentSummary && !hasAttachmentCitations(bundle),
    'missing-attachment-citation',
    'warning',
    'evidence',
    'Attachment-specific prompt requires file evidence or citation references.',
  );

  addFindingIf(
    findings,
    expected.requiresAttachmentSummary && hasPlaceholderAttachmentSummary(bundle),
    'attachment-summary-placeholder-only',
    'warning',
    'evidence',
    'Attachment summary is a deterministic seed placeholder, not parsed client evidence.',
  );

  addFindingIf(
    findings,
    expected.requiresArtifactReadiness && bundle.artifacts.length === 0,
    'missing-artifact-context',
    'warning',
    'missingContext',
    'Artifact readiness context is required but missing.',
  );

  addFindingIf(
    findings,
    expected.requiresGateCheck && bundle.stageGates.length === 0,
    'missing-gate-context',
    'error',
    'missingContext',
    'Stage-gate context is required but missing.',
  );

  for (const actionId of expected.requiredAllowedActionIds) {
    addFindingIf(
      findings,
      !bundle.allowedActions.some((action) => action.id === actionId && action.allowed),
      `missing-allowed-action-${actionId}`,
      'warning',
      'actionability',
      `Expected allowed action ${actionId} is missing.`,
    );
  }

  addFindingIf(
    findings,
    fixtureItem.category === 'artifactReadiness'
      && fixtureItem.expectedVerdict === 'defer'
      && bundle.missingInputs.length > 0,
    'artifact-generation-deferred-missing-inputs',
    'warning',
    'missingContext',
    'Artifact generation must defer while required Source inputs remain missing.',
  );

  return findings;
}

function createFixtureValidationResult(
  fixtureItem: SourceAgentValidationFixture,
  bundle: SourceAgentContextBundle,
  findings: SourceAgentValidationFinding[],
  verdict: SourceAgentValidationFixtureVerdict,
): SourceAgentValidationResult {
  const vanillaFlags = collectVanillaResponseFlags(fixtureItem, findings);

  return {
    responseId: `fixture-result-${fixtureItem.id}`,
    promptId: fixtureItem.id,
    eventId: bundle.sourcingEvent?.id ?? fixtureItem.eventId,
    persona: fixtureItem.persona,
    contextGrounding: getContextGroundingScore(bundle, findings),
    actionability: getActionabilityScore(bundle, findings),
    evidence: getEvidenceScore(fixtureItem, bundle, findings),
    vanillaResponseRisk: bundle.contextQuality.vanillaResponseRisk,
    hallucinationFlags: vanillaFlags.includes('hallucinatedFact') ? ['hallucinatedFact'] : [],
    missingContextFlags: findings
      .filter((finding) => finding.dimension === 'missingContext')
      .map((finding) => finding.id),
    vanillaResponseFlags: vanillaFlags,
    gateCheckPassed: !findings.some((finding) => finding.id === 'missing-gate-context'),
    suggestedActionsPresent: bundle.systemProposedActions.length > 0 || bundle.allowedActions.length > 0,
    nextActionIncluded: Boolean(bundle.nextAction) || bundle.allowedActions.length > 0,
    verdict: toValidationVerdict(verdict),
    findings,
    reviewerNotes: 'Deterministic fixture result only; no response text, UI, API route, or model call was generated.',
  };
}

function createAssemblyFailureResult(
  fixtureItem: SourceAgentValidationFixture,
  failure?: SourceContextAssemblyFailure,
): SourceAgentValidationFixtureResult {
  const finding: SourceAgentValidationFinding = {
    id: failure?.code ?? 'context-assembly-failed',
    severity: 'critical',
    dimension: 'missingContext',
    message: failure?.message ?? 'Context assembly failed before validation could run.',
    evidence: failure?.missingFields.join(', '),
  };
  const validationResult: SourceAgentValidationResult = {
    responseId: `fixture-result-${fixtureItem.id}`,
    promptId: fixtureItem.id,
    eventId: fixtureItem.eventId,
    persona: fixtureItem.persona,
    contextGrounding: 0,
    actionability: 0,
    evidence: 0,
    vanillaResponseRisk: 5,
    hallucinationFlags: [],
    missingContextFlags: [finding.id],
    vanillaResponseFlags: fixtureItem.genericResponseFailureFlags,
    gateCheckPassed: false,
    suggestedActionsPresent: false,
    nextActionIncluded: false,
    verdict: 'fail',
    findings: [finding],
    reviewerNotes: 'Context assembly failed deterministically.',
  };

  return {
    fixtureId: fixtureItem.id,
    prompt: fixtureItem.prompt,
    expectedVerdict: fixtureItem.expectedVerdict,
    actualVerdict: 'fail',
    passesExpectation: fixtureItem.expectedVerdict === 'fail',
    validationResult,
    contextUsed: emptyContextUsed(),
    missingContextReasons: failure?.missingFields ?? [],
    genericResponseWouldFail: fixtureItem.genericResponseFailureFlags.length > 0,
    genericResponseFailureFlags: fixtureItem.genericResponseFailureFlags,
  };
}

function addFindingIf(
  findings: SourceAgentValidationFinding[],
  condition: boolean,
  id: string,
  severity: SourceAgentValidationSeverity,
  dimension: SourceAgentValidationDimension | 'vanillaResponseRisk' | 'hallucination' | 'missingContext',
  message: string,
): void {
  if (!condition) return;

  findings.push({
    id,
    severity,
    dimension,
    message,
  });
}

function getFixtureVerdict(
  fixtureItem: SourceAgentValidationFixture,
  bundle: SourceAgentContextBundle,
  findings: SourceAgentValidationFinding[],
): SourceAgentValidationFixtureVerdict {
  if (findings.some((finding) => finding.severity === 'critical' || finding.severity === 'error')) {
    return 'fail';
  }

  const evidenceScore = getEvidenceScore(fixtureItem, bundle, findings);
  const hasWarning = findings.some((finding) => finding.severity === 'warning');
  const evidenceBelowRequired = evidenceScore < fixtureItem.expectedBehavior.requiredEvidenceLevel;

  if (hasWarning || evidenceBelowRequired) {
    return 'defer';
  }

  return 'pass';
}

function collectVanillaResponseFlags(
  fixtureItem: SourceAgentValidationFixture,
  findings: SourceAgentValidationFinding[],
): SourceVanillaResponseFlag[] {
  const flags = new Set<SourceVanillaResponseFlag>(fixtureItem.genericResponseFailureFlags);

  for (const finding of findings) {
    if (finding.id.includes('event')) flags.add('missingEventContext');
    if (finding.id.includes('stage')) flags.add('missingStageContext');
    if (finding.id.includes('gate')) flags.add('missingGateCheck');
    if (finding.id.includes('value-ledger')) flags.add('valueWithoutLedger');
    if (finding.id.includes('scorecard')) flags.add('scorecardWithoutDefaultsOrOverrides');
    if (finding.id.includes('attachment')) flags.add('fileWithoutCitation');
    if (finding.id.includes('allowed-action')) flags.add('missingNextAction');
  }

  return Array.from(flags);
}

function getContextGroundingScore(
  bundle: SourceAgentContextBundle,
  findings: SourceAgentValidationFinding[],
): SourceAgentValidationScore {
  if (findings.some((finding) => finding.severity === 'critical')) return 0;
  if (!bundle.sourcingEvent && bundle.contextScope !== 'portfolio') return 1;
  if (bundle.contextScope === 'portfolio') return score(3 + Number(bundle.risks.length > 0 && bundle.blockers.length > 0));
  if (bundle.sourcingEvent && bundle.workflowStage && bundle.lifecycleStatus && hasRichContext(bundle)) return 4;
  if (bundle.sourcingEvent && bundle.workflowStage && bundle.lifecycleStatus) return 3;
  if (bundle.sourcingEvent) return 2;
  return 1;
}

function getActionabilityScore(
  bundle: SourceAgentContextBundle,
  findings: SourceAgentValidationFinding[],
): SourceAgentValidationScore {
  if (findings.some((finding) => finding.id === 'missing-owner-context')) return 2;
  if (!bundle.nextAction && bundle.allowedActions.length === 0) return 0;
  if (hasOwnerContext(bundle) && (typeof bundle.agingDays === 'number' || bundle.blockers.length > 0) && bundle.stageGates.length > 0) {
    return 5;
  }
  if (hasOwnerContext(bundle) && (typeof bundle.agingDays === 'number' || bundle.blockers.length > 0)) {
    return 4;
  }
  if (hasOwnerContext(bundle)) return 3;
  return 2;
}

function getEvidenceScore(
  fixtureItem: SourceAgentValidationFixture,
  bundle: SourceAgentContextBundle,
  findings: SourceAgentValidationFinding[],
): SourceAgentValidationScore {
  if (findings.some((finding) => finding.id === 'missing-attachment-summary')) return 0;
  if (bundle.evidenceCitations.length > 0) return 5;
  if (fixtureItem.expectedContext.requiresValueLedger && hasValueLedgerEvidence(bundle)) return 4;
  if (bundle.artifacts.length > 0 || hasValueLedgerContext(bundle) || bundle.scorecard) return 3;
  if (bundle.selectedPatternPack) return 2;
  if (bundle.sourcingEvent || bundle.contextScope === 'portfolio') return 1;
  return 0;
}

function hasOwnerContext(bundle: SourceAgentContextBundle): boolean {
  return Boolean(
    bundle.nextActionOwner
    || bundle.eventOwner
    || bundle.stageOwner
    || bundle.decisionOwner
    || bundle.waitState?.owner,
  );
}

function hasRichContext(bundle: SourceAgentContextBundle): boolean {
  return Boolean(
    bundle.artifacts.length > 0
    || bundle.scorecard
    || hasValueLedgerContext(bundle),
  );
}

function hasScorecardDefaultsOrOverrides(bundle: SourceAgentContextBundle): boolean {
  return Boolean(
    bundle.scorecard
    && (bundle.scorecard.defaultWeights.length > 0 || bundle.scorecard.overrides.length > 0),
  );
}

function hasValueLedgerContext(bundle: SourceAgentContextBundle): boolean {
  return bundle.projectedValueLedger.length > 0 || Boolean(bundle.realizedValueLedger?.length);
}

function hasValueLedgerEvidence(bundle: SourceAgentContextBundle): boolean {
  return bundle.projectedValueLedger.some((line) => line.evidenceCount > 0)
    || Boolean(bundle.realizedValueLedger?.some((line) => line.evidenceCount > 0));
}

function hasAttachmentCitations(bundle: SourceAgentContextBundle): boolean {
  return bundle.parsedFileSummaries.some((summary) => summary.citations.length > 0)
    || bundle.uploadedFiles.some((file) => file.evidenceReferences.length > 0);
}

function hasPlaceholderAttachmentSummary(bundle: SourceAgentContextBundle): boolean {
  return bundle.parsedFileSummaries.some((summary) => (
    summary.keyFields.placeholder === true
    || summary.summary.toLowerCase().includes('placeholder')
  ));
}

function toValidationVerdict(verdict: SourceAgentValidationFixtureVerdict): SourceAgentValidationResult['verdict'] {
  return verdict === 'pass' ? 'pass' : verdict === 'defer' ? 'defer' : 'fail';
}

function score(value: number): SourceAgentValidationScore {
  return Math.max(0, Math.min(5, Math.round(value))) as SourceAgentValidationScore;
}

function emptyContextUsed(): SourceContextUsed[] {
  return [
    {
      eventStateUsed: false,
      patternSectionsUsed: [],
      artifactsUsed: [],
      uploadedFilesUsed: [],
      scorecardUsed: false,
      valueLedgerUsed: false,
      citationsUsed: [],
      deterministicFieldsUsed: [],
      modelAssistedFieldsUsed: [],
      evidenceGatedFieldsUsed: [],
      missingContext: ['Context assembly failed.'],
    },
  ];
}
