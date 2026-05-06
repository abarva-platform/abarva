import type { SourceStageKey } from './types';

export type SourceWorkflowValidationOutcome =
  | 'PASS'
  | 'BLOCK'
  | 'DEFER'
  | 'WAIVER_REQUIRED'
  | 'FAIL';

export type SourceWorkflowValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

export type SourceWorkflowValidationActionKind =
  | 'advanceStage'
  | 'beginEvaluation'
  | 'generateArtifact'
  | 'markReadyForRelease'
  | 'lockArtifact'
  | 'approveArtifact'
  | 'uploadEditedDocument'
  | 'citeUploadedDocument'
  | 'completeVendorResponse'
  | 'markValueRealized'
  | 'skipApproval';

export type SourceWorkflowValidationRuleId =
  | 'rfp-package-approved-locked'
  | 'scorecard-locked-before-evaluation'
  | 'rich-artifact-required-inputs'
  | 'strategic-release-approval-route'
  | 'artifact-lock-required-comments'
  | 'approval-assigned-owner'
  | 'required-artifact-needs-inputs'
  | 'offline-edit-new-version'
  | 'uploaded-document-parse-before-citation'
  | 'vendor-response-pricing-template'
  | 'realized-value-owner-evidence'
  | 'approval-waiver-rationale';

export type SourceWorkflowArtifactStatus =
  | 'not_started'
  | 'draft'
  | 'needs_inputs'
  | 'in_review'
  | 'changes_requested'
  | 'approved'
  | 'locked'
  | 'issued'
  | 'superseded'
  | 'archived';

export type SourceWorkflowArtifactTier = 'stub' | 'outline' | 'rich';

export type SourceWorkflowApprovalStatus =
  | 'not_required'
  | 'not_started'
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'escalated'
  | 'waived'
  | 'expired';

export type SourceWorkflowDocumentParseStatus =
  | 'uploaded'
  | 'classified'
  | 'parsing'
  | 'parsed'
  | 'parse_failed'
  | 'validated';

export interface SourceWorkflowValidationEventState {
  eventId: string;
  eventName: string;
  currentStage: SourceStageKey;
  attemptedNextStage?: SourceStageKey;
  rigorLevel: string;
  valueTier: string;
}

export interface SourceWorkflowValidationArtifactState {
  artifactId: string;
  artifactType: string;
  name: string;
  status: SourceWorkflowArtifactStatus;
  tier?: SourceWorkflowArtifactTier;
  owner?: string;
  version?: string;
  locked: boolean;
  approvalStatus?: SourceWorkflowApprovalStatus;
  requiredForGate?: boolean;
}

export interface SourceWorkflowValidationScorecardState {
  scorecardId: string;
  status: SourceWorkflowArtifactStatus;
  locked: boolean;
  approvalStatus?: SourceWorkflowApprovalStatus;
}

export interface SourceWorkflowValidationRequiredInputState {
  id: string;
  label: string;
  owner?: string;
  present: boolean;
  waived?: boolean;
}

export interface SourceWorkflowValidationApprovalRouteState {
  routeId: string;
  requiredRoles: string[];
  assignedOwner?: string;
  status: SourceWorkflowApprovalStatus;
  missingRoles?: string[];
}

export interface SourceWorkflowValidationReviewerCommentState {
  commentId: string;
  artifactId: string;
  reviewerRole: string;
  required: boolean;
  resolved: boolean;
}

export interface SourceWorkflowValidationExportState {
  exportId: string;
  artifactId: string;
  version: string;
  format: 'docx' | 'xlsx' | 'pptx' | 'pdf';
  exportedBy: string;
}

export interface SourceWorkflowValidationUploadedDocumentState {
  uploadId: string;
  artifactId?: string;
  fileName: string;
  parseStatus: SourceWorkflowDocumentParseStatus;
  intendedVersion?: string;
  createsNewVersion?: boolean;
  hasValidatedCitation?: boolean;
}

export interface SourceWorkflowValidationVendorResponseState {
  responseId: string;
  vendorName: string;
  hasPricingTemplate: boolean;
  exceptionApproved?: boolean;
}

export interface SourceWorkflowValidationValueLedgerState {
  projectedValuePresent: boolean;
  realizedValueMarked: boolean;
  measurementOwner?: string;
  evidencePresent: boolean;
}

export interface SourceWorkflowValidationWaiverState {
  waiverId: string;
  approvalRouteId?: string;
  authorizedRole?: string;
  rationale?: string;
}

export interface SourceWorkflowValidationAttemptedAction {
  kind: SourceWorkflowValidationActionKind;
  label: string;
  targetStage?: SourceStageKey;
  artifactId?: string;
  approvalRouteId?: string;
  uploadId?: string;
  vendorResponseId?: string;
  requestedArtifactTier?: SourceWorkflowArtifactTier;
}

export interface SourceWorkflowValidationFixtureState {
  event: SourceWorkflowValidationEventState;
  artifacts: SourceWorkflowValidationArtifactState[];
  scorecard?: SourceWorkflowValidationScorecardState;
  requiredInputs: SourceWorkflowValidationRequiredInputState[];
  approvalRoutes: SourceWorkflowValidationApprovalRouteState[];
  reviewerComments: SourceWorkflowValidationReviewerCommentState[];
  exports: SourceWorkflowValidationExportState[];
  uploads: SourceWorkflowValidationUploadedDocumentState[];
  vendorResponses: SourceWorkflowValidationVendorResponseState[];
  valueLedger?: SourceWorkflowValidationValueLedgerState;
  waivers: SourceWorkflowValidationWaiverState[];
}

export interface SourceWorkflowValidationEvidenceRequirement {
  id: string;
  label: string;
  satisfied: boolean;
}

export interface SourceWorkflowValidationFinding {
  id: string;
  severity: SourceWorkflowValidationSeverity;
  outcome: Exclude<SourceWorkflowValidationOutcome, 'PASS'>;
  message: string;
  evidenceIds: string[];
}

export interface SourceWorkflowValidationFixture {
  id: string;
  title: string;
  ruleId: SourceWorkflowValidationRuleId;
  scenario: string;
  fixtureState: SourceWorkflowValidationFixtureState;
  attemptedAction: SourceWorkflowValidationAttemptedAction;
  expectedOutcome: SourceWorkflowValidationOutcome;
  expectedSentinelExplanation: string;
  expectedStewardEnforcement: string;
  evidenceNeeded: SourceWorkflowValidationEvidenceRequirement[];
  acceptanceCriteria: string[];
}

export interface SourceWorkflowValidationFixtureResult {
  fixtureId: string;
  ruleId: SourceWorkflowValidationRuleId;
  expectedOutcome: SourceWorkflowValidationOutcome;
  actualOutcome: SourceWorkflowValidationOutcome;
  passesExpectation: boolean;
  findings: SourceWorkflowValidationFinding[];
  sentinelExplanation: string;
  stewardEnforcement: string;
  evidenceNeeded: SourceWorkflowValidationEvidenceRequirement[];
}

export function evaluateSourceWorkflowValidationFixture(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFixtureResult {
  const findings = collectSourceWorkflowValidationFindings(fixture);
  const actualOutcome = deriveSourceWorkflowValidationOutcome(fixture, findings);

  return {
    fixtureId: fixture.id,
    ruleId: fixture.ruleId,
    expectedOutcome: fixture.expectedOutcome,
    actualOutcome,
    passesExpectation: actualOutcome === fixture.expectedOutcome,
    findings,
    sentinelExplanation: fixture.expectedSentinelExplanation,
    stewardEnforcement: fixture.expectedStewardEnforcement,
    evidenceNeeded: fixture.evidenceNeeded,
  };
}

function collectSourceWorkflowValidationFindings(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  switch (fixture.ruleId) {
    case 'rfp-package-approved-locked':
      return validateRfpPackageApprovedLocked(fixture);
    case 'scorecard-locked-before-evaluation':
      return validateScorecardLockedBeforeEvaluation(fixture);
    case 'rich-artifact-required-inputs':
      return validateRichArtifactRequiredInputs(fixture);
    case 'strategic-release-approval-route':
      return validateStrategicReleaseApprovalRoute(fixture);
    case 'artifact-lock-required-comments':
      return validateArtifactLockRequiredComments(fixture);
    case 'approval-assigned-owner':
      return validateApprovalAssignedOwner(fixture);
    case 'required-artifact-needs-inputs':
      return validateRequiredArtifactNeedsInputs(fixture);
    case 'offline-edit-new-version':
      return validateOfflineEditNewVersion(fixture);
    case 'uploaded-document-parse-before-citation':
      return validateUploadedDocumentParseBeforeCitation(fixture);
    case 'vendor-response-pricing-template':
      return validateVendorResponsePricingTemplate(fixture);
    case 'realized-value-owner-evidence':
      return validateRealizedValueOwnerEvidence(fixture);
    case 'approval-waiver-rationale':
      return validateApprovalWaiverRationale(fixture);
  }
}

function deriveSourceWorkflowValidationOutcome(
  fixture: SourceWorkflowValidationFixture,
  findings: SourceWorkflowValidationFinding[],
): SourceWorkflowValidationOutcome {
  if (findings.length === 0) return 'PASS';

  if (findings.some((finding) => finding.outcome === 'FAIL')) return 'FAIL';
  if (findings.some((finding) => finding.outcome === 'BLOCK')) return 'BLOCK';
  if (findings.some((finding) => finding.outcome === 'WAIVER_REQUIRED')) return 'WAIVER_REQUIRED';
  if (findings.some((finding) => finding.outcome === 'DEFER')) return 'DEFER';

  return fixture.expectedOutcome;
}

function validateRfpPackageApprovedLocked(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const artifact = findArtifact(fixture, fixture.attemptedAction.artifactId);
  if (!artifact) return [missingTargetFinding('rfp-package-missing', 'RFP package artifact is missing from fixture state.')];

  return [
    ...findingIf(
      artifact.status !== 'approved' && artifact.status !== 'locked',
      'rfp-package-not-approved',
      'RFP package must be approved before Vendor Responses can begin.',
      ['artifact-status', 'approval-status'],
    ),
    ...findingIf(
      !artifact.locked,
      'rfp-package-not-locked',
      'RFP package must be locked before vendor release.',
      ['lock-status'],
    ),
  ];
}

function validateScorecardLockedBeforeEvaluation(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const scorecard = fixture.fixtureState.scorecard;
  if (!scorecard) return [missingTargetFinding('scorecard-missing', 'Scorecard state is missing from fixture state.')];

  return findingIf(
    !scorecard.locked,
    'scorecard-not-locked',
    'Evaluation cannot begin while scorecard weights and criteria are still editable.',
    ['scorecard-lock-state'],
  );
}

function validateRichArtifactRequiredInputs(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const missingRequiredInputs = fixture.fixtureState.requiredInputs.filter((input) => !input.present && !input.waived);

  return findingIf(
    fixture.attemptedAction.requestedArtifactTier === 'rich' && missingRequiredInputs.length > 0,
    'rich-artifact-missing-required-inputs',
    'Rich-tier artifact generation requires required inputs to be present or waived.',
    missingRequiredInputs.map((input) => input.id),
  );
}

function validateStrategicReleaseApprovalRoute(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const route = fixture.fixtureState.approvalRoutes.find((approvalRoute) => approvalRoute.routeId === fixture.attemptedAction.approvalRouteId);
  if (!route) return [missingTargetFinding('approval-route-missing', 'Strategic release approval route is missing.')];

  const missingRoles = route.missingRoles ?? [];

  return findingIf(
    missingRoles.includes('legal') || missingRoles.includes('procurement'),
    'strategic-release-route-incomplete',
    'Strategic sourcing readiness requires legal and procurement review path.',
    ['approval-route', ...missingRoles],
  );
}

function validateArtifactLockRequiredComments(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const unresolved = fixture.fixtureState.reviewerComments.filter(
    (comment) => comment.artifactId === fixture.attemptedAction.artifactId && comment.required && !comment.resolved,
  );

  return findingIf(
    unresolved.length > 0,
    'required-reviewer-comments-unresolved',
    'Required reviewer comments must be resolved or waived before artifact lock.',
    unresolved.map((comment) => comment.commentId),
  );
}

function validateApprovalAssignedOwner(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const route = fixture.fixtureState.approvalRoutes.find((approvalRoute) => approvalRoute.routeId === fixture.attemptedAction.approvalRouteId);
  if (!route) return [missingTargetFinding('approval-route-missing', 'Approval route is missing from fixture state.')];

  return findingIf(
    !route.assignedOwner,
    'approval-owner-missing',
    'Approval cannot be recorded without an assigned approval owner.',
    ['approval-owner'],
  );
}

function validateRequiredArtifactNeedsInputs(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const blockingArtifact = fixture.fixtureState.artifacts.find(
    (artifact) => artifact.requiredForGate && artifact.status === 'needs_inputs',
  );
  const waiver = fixture.fixtureState.waivers.find((waiverItem) => Boolean(waiverItem.rationale));

  if (!blockingArtifact) return [];

  if (waiver) return [
    {
      id: 'required-artifact-needs-inputs-waiver-required',
      severity: 'warning',
      outcome: 'WAIVER_REQUIRED',
      message: 'Required artifact still needs inputs; advancement requires authorized waiver and rationale.',
      evidenceIds: [blockingArtifact.artifactId, waiver.waiverId],
    },
  ];

  return findingIf(
    true,
    'required-artifact-needs-inputs',
    'Required artifact still needs inputs and blocks stage advancement.',
    [blockingArtifact.artifactId],
  );
}

function validateOfflineEditNewVersion(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const upload = fixture.fixtureState.uploads.find((uploadedDocument) => uploadedDocument.uploadId === fixture.attemptedAction.uploadId);
  if (!upload) return [missingTargetFinding('offline-upload-missing', 'Uploaded offline edit is missing from fixture state.')];

  return findingIf(
    !upload.createsNewVersion,
    'offline-edit-same-version-blocked',
    'Re-uploaded external edits must create a new artifact version.',
    ['export-record', upload.uploadId],
  );
}

function validateUploadedDocumentParseBeforeCitation(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const upload = fixture.fixtureState.uploads.find((uploadedDocument) => uploadedDocument.uploadId === fixture.attemptedAction.uploadId);
  if (!upload) return [missingTargetFinding('uploaded-document-missing', 'Uploaded document is missing from fixture state.')];

  if (upload.parseStatus === 'parsed' || upload.parseStatus === 'validated') {
    return findingIf(
      !upload.hasValidatedCitation,
      'uploaded-document-citation-not-validated',
      'Uploaded document must have validated citation references before it can support recommendations.',
      [upload.uploadId],
      'DEFER',
    );
  }

  return [
    {
      id: 'uploaded-document-not-parse-validated',
      severity: 'warning',
      outcome: 'DEFER',
      message: 'Uploaded document cannot be cited until parsed and validated.',
      evidenceIds: [upload.uploadId, upload.parseStatus],
    },
  ];
}

function validateVendorResponsePricingTemplate(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const response = fixture.fixtureState.vendorResponses.find((vendorResponse) => vendorResponse.responseId === fixture.attemptedAction.vendorResponseId);
  if (!response) return [missingTargetFinding('vendor-response-missing', 'Vendor response is missing from fixture state.')];

  if (response.hasPricingTemplate) return [];

  if (response.exceptionApproved) {
    return [
      {
        id: 'vendor-response-pricing-template-waiver-required',
        severity: 'warning',
        outcome: 'WAIVER_REQUIRED',
        message: 'Vendor response completeness requires pricing template or approved exception path.',
        evidenceIds: [response.responseId],
      },
    ];
  }

  return findingIf(
    true,
    'vendor-response-pricing-template-missing',
    'Vendor response cannot be treated as comparable while pricing template is missing.',
    [response.responseId],
  );
}

function validateRealizedValueOwnerEvidence(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const valueLedger = fixture.fixtureState.valueLedger;
  if (!valueLedger) return [missingTargetFinding('value-ledger-missing', 'Value ledger state is missing from fixture state.')];

  return [
    ...findingIf(
      !valueLedger.measurementOwner,
      'realized-value-owner-missing',
      'Realized value requires a measurement owner.',
      ['measurement-owner'],
    ),
    ...findingIf(
      !valueLedger.evidencePresent,
      'realized-value-evidence-missing',
      'Realized value requires supporting evidence.',
      ['value-evidence'],
    ),
  ];
}

function validateApprovalWaiverRationale(
  fixture: SourceWorkflowValidationFixture,
): SourceWorkflowValidationFinding[] {
  const waiver = fixture.fixtureState.waivers[0];

  return findingIf(
    !waiver?.rationale,
    'approval-waiver-rationale-missing',
    'Approval can be waived only by an authorized role with rationale.',
    waiver ? [waiver.waiverId] : ['waiver-record'],
  );
}

function findArtifact(
  fixture: SourceWorkflowValidationFixture,
  artifactId?: string,
): SourceWorkflowValidationArtifactState | undefined {
  return fixture.fixtureState.artifacts.find((artifact) => artifact.artifactId === artifactId);
}

function findingIf(
  condition: boolean,
  id: string,
  message: string,
  evidenceIds: string[],
  outcome: Exclude<SourceWorkflowValidationOutcome, 'PASS'> = 'BLOCK',
): SourceWorkflowValidationFinding[] {
  if (!condition) return [];

  return [{
    id,
    severity: outcome === 'DEFER' || outcome === 'WAIVER_REQUIRED' ? 'warning' : 'error',
    outcome,
    message,
    evidenceIds,
  }];
}

function missingTargetFinding(
  id: string,
  message: string,
): SourceWorkflowValidationFinding {
  return {
    id,
    severity: 'critical',
    outcome: 'FAIL',
    message,
    evidenceIds: [],
  };
}
