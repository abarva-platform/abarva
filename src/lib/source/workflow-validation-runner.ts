import {
  evaluateSourceWorkflowValidationFixtures,
  SOURCE_WORKFLOW_VALIDATION_FIXTURES,
} from './workflow-validation-fixtures';
import type {
  SourceWorkflowValidationFixture,
  SourceWorkflowValidationFixtureResult,
  SourceWorkflowValidationFinding,
  SourceWorkflowValidationOutcome,
  SourceWorkflowValidationRuleId,
} from './workflow-validation';

export const SOURCE_WORKFLOW_VALIDATION_RUNNER_VERSION = 'source-workflow-validation-runner/v1';

export type SourceWorkflowValidationSuiteVerdict =
  | 'pass'
  | 'defer'
  | 'waiver_required'
  | 'fail';

export type SourceWorkflowValidationFixtureMatchStatus =
  | 'matches_expected'
  | 'unexpected';

export interface SourceWorkflowValidationRunnerOptions {
  fixtures?: SourceWorkflowValidationFixture[];
  generatedAt?: string;
}

export interface SourceWorkflowValidationOutcomeCounts {
  PASS: number;
  BLOCK: number;
  DEFER: number;
  WAIVER_REQUIRED: number;
  FAIL: number;
}

export interface SourceWorkflowValidationFixtureReportRow {
  fixtureId: string;
  title: string;
  ruleId: SourceWorkflowValidationRuleId;
  scenario: string;
  attemptedAction: string;
  expectedOutcome: SourceWorkflowValidationOutcome;
  actualOutcome: SourceWorkflowValidationOutcome;
  status: SourceWorkflowValidationFixtureMatchStatus;
  blockerExplanations: string[];
  sentinelExplanation: string;
  stewardEnforcement: string;
  evidenceRequirements: Array<{
    id: string;
    label: string;
    satisfied: boolean;
  }>;
  findings: SourceWorkflowValidationFinding[];
  requiredRemediation: string;
}

export interface SourceWorkflowValidationExplanation {
  fixtureId: string;
  ruleId: SourceWorkflowValidationRuleId;
  outcome: SourceWorkflowValidationOutcome;
  explanation: string;
  remediation: string;
}

export interface SourceWorkflowValidationFailedExpectation {
  fixtureId: string;
  ruleId: SourceWorkflowValidationRuleId;
  expectedOutcome: SourceWorkflowValidationOutcome;
  actualOutcome: SourceWorkflowValidationOutcome;
  remediation: string;
}

export interface SourceWorkflowValidationRunnerReport {
  reportId: string;
  reportVersion: typeof SOURCE_WORKFLOW_VALIDATION_RUNNER_VERSION;
  generatedAt: string;
  validationScope: string[];
  explicitOutOfScope: string[];
  totalFixtures: number;
  passCount: number;
  blockCount: number;
  deferCount: number;
  waiverRequiredCount: number;
  failCount: number;
  mismatchCount: number;
  suiteVerdict: SourceWorkflowValidationSuiteVerdict;
  expectedSummary: string;
  resultsByFixture: SourceWorkflowValidationFixtureReportRow[];
  blockerExplanations: SourceWorkflowValidationExplanation[];
  deferExplanations: SourceWorkflowValidationExplanation[];
  waiverRequiredExplanations: SourceWorkflowValidationExplanation[];
  failedExpectations: SourceWorkflowValidationFailedExpectation[];
  requiredRemediations: string[];
  remainingWorkflowGaps: string[];
  nextRecommendedSlice: string;
}

const EXPECTED_WORKFLOW_VALIDATION_SUMMARY = '12 total / 11 BLOCK / 1 DEFER / 0 mismatches';

const VALIDATION_SCOPE = [
  'deterministic Source workflow validation fixtures',
  'stage gates',
  'artifact lifecycle rules',
  'document review and approval readiness',
  'offline edit / re-upload rules',
  'waiver and evidence readiness checks',
];

const EXPLICIT_OUT_OF_SCOPE = [
  'workflow engine',
  'approval engine',
  'artifact versioning implementation',
  'document export/import implementation',
  'chat UI',
  'model calls',
  'API routes',
  'upload/parsing',
  'event canvas expansion',
  'scorecard UI',
  'artifact drawer UI',
  'value ledger UI',
  'vendor flow',
  'AI/RFP generation',
  '/programs integration',
  '/preview or /demo surfaces',
];

const REMEDIATION_BY_RULE_ID: Record<SourceWorkflowValidationRuleId, string> = {
  'rfp-package-approved-locked': 'Approve and lock the RFP/RFI package before moving to Vendor Responses.',
  'scorecard-locked-before-evaluation': 'Lock scorecard criteria and weights before beginning Evaluation.',
  'rich-artifact-required-inputs': 'Collect or explicitly waive missing required inputs before Rich-tier RFP generation.',
  'strategic-release-approval-route': 'Configure legal and procurement review routes before strategic vendor release.',
  'artifact-lock-required-comments': 'Resolve or formally waive required reviewer comments before artifact lock.',
  'approval-assigned-owner': 'Assign an approval owner before recording approval completion.',
  'required-artifact-needs-inputs': 'Complete the required artifact or capture an authorized waiver with rationale before advancing stage.',
  'offline-edit-new-version': 'Create a new artifact version for re-uploaded external edits and preserve the prior version.',
  'uploaded-document-parse-before-citation': 'Parse and validate uploaded documents before allowing citation-backed recommendations.',
  'vendor-response-pricing-template': 'Collect the pricing template or record an approved exception before marking vendor response complete.',
  'realized-value-owner-evidence': 'Assign a measurement owner and attach evidence before marking value realized.',
  'approval-waiver-rationale': 'Capture authorized waiver rationale before skipping a required approval.',
};

export function runSourceWorkflowValidationFixtures(
  fixtures: SourceWorkflowValidationFixture[] = SOURCE_WORKFLOW_VALIDATION_FIXTURES,
): SourceWorkflowValidationFixtureResult[] {
  return evaluateSourceWorkflowValidationFixtures(fixtures);
}

export function summarizeSourceWorkflowValidationResults(
  results: SourceWorkflowValidationFixtureResult[],
): SourceWorkflowValidationOutcomeCounts & { mismatchCount: number } {
  const counts: SourceWorkflowValidationOutcomeCounts = {
    PASS: 0,
    BLOCK: 0,
    DEFER: 0,
    WAIVER_REQUIRED: 0,
    FAIL: 0,
  };

  for (const result of results) {
    counts[result.actualOutcome] += 1;
  }

  return {
    ...counts,
    mismatchCount: results.filter((result) => !result.passesExpectation).length,
  };
}

export function getSourceWorkflowValidationReport(
  options: SourceWorkflowValidationRunnerOptions = {},
): SourceWorkflowValidationRunnerReport {
  const fixtures = options.fixtures ?? SOURCE_WORKFLOW_VALIDATION_FIXTURES;
  const results = runSourceWorkflowValidationFixtures(fixtures);
  const summary = summarizeSourceWorkflowValidationResults(results);
  const rows = results.map((result) => toWorkflowValidationFixtureRow(result, fixtures));

  return {
    reportId: 'source-workflow-validation-report',
    reportVersion: SOURCE_WORKFLOW_VALIDATION_RUNNER_VERSION,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
    validationScope: [...VALIDATION_SCOPE],
    explicitOutOfScope: [...EXPLICIT_OUT_OF_SCOPE],
    totalFixtures: results.length,
    passCount: summary.PASS,
    blockCount: summary.BLOCK,
    deferCount: summary.DEFER,
    waiverRequiredCount: summary.WAIVER_REQUIRED,
    failCount: summary.FAIL,
    mismatchCount: summary.mismatchCount,
    suiteVerdict: deriveWorkflowValidationSuiteVerdict(summary),
    expectedSummary: EXPECTED_WORKFLOW_VALIDATION_SUMMARY,
    resultsByFixture: rows,
    blockerExplanations: rows
      .filter((row) => row.actualOutcome === 'BLOCK')
      .map((row) => toWorkflowValidationExplanation(row)),
    deferExplanations: rows
      .filter((row) => row.actualOutcome === 'DEFER')
      .map((row) => toWorkflowValidationExplanation(row)),
    waiverRequiredExplanations: rows
      .filter((row) => row.actualOutcome === 'WAIVER_REQUIRED')
      .map((row) => toWorkflowValidationExplanation(row)),
    failedExpectations: rows
      .filter((row) => row.status === 'unexpected')
      .map((row) => ({
        fixtureId: row.fixtureId,
        ruleId: row.ruleId,
        expectedOutcome: row.expectedOutcome,
        actualOutcome: row.actualOutcome,
        remediation: row.requiredRemediation,
      })),
    requiredRemediations: collectSourceWorkflowValidationRemediations(rows),
    remainingWorkflowGaps: getRemainingWorkflowValidationGaps(rows),
    nextRecommendedSlice: 'Harden the readable workflow validation report before workflow engine, UI, API, approval, versioning, or export/import implementation.',
  };
}

function toWorkflowValidationFixtureRow(
  result: SourceWorkflowValidationFixtureResult,
  fixtures: SourceWorkflowValidationFixture[],
): SourceWorkflowValidationFixtureReportRow {
  const fixture = fixtures.find((item) => item.id === result.fixtureId);

  return {
    fixtureId: result.fixtureId,
    title: fixture?.title ?? result.fixtureId,
    ruleId: result.ruleId,
    scenario: fixture?.scenario ?? '',
    attemptedAction: fixture?.attemptedAction.label ?? 'Unknown attempted action',
    expectedOutcome: result.expectedOutcome,
    actualOutcome: result.actualOutcome,
    status: result.passesExpectation ? 'matches_expected' : 'unexpected',
    blockerExplanations: result.findings.map((finding) => finding.message),
    sentinelExplanation: result.sentinelExplanation,
    stewardEnforcement: result.stewardEnforcement,
    evidenceRequirements: result.evidenceNeeded.map((evidence) => ({
      id: evidence.id,
      label: evidence.label,
      satisfied: evidence.satisfied,
    })),
    findings: result.findings,
    requiredRemediation: REMEDIATION_BY_RULE_ID[result.ruleId],
  };
}

function deriveWorkflowValidationSuiteVerdict(
  summary: SourceWorkflowValidationOutcomeCounts & { mismatchCount: number },
): SourceWorkflowValidationSuiteVerdict {
  if (summary.mismatchCount > 0 || summary.FAIL > 0) return 'fail';
  if (summary.DEFER > 0) return 'defer';
  if (summary.WAIVER_REQUIRED > 0) return 'waiver_required';
  return 'pass';
}

function toWorkflowValidationExplanation(
  row: SourceWorkflowValidationFixtureReportRow,
): SourceWorkflowValidationExplanation {
  return {
    fixtureId: row.fixtureId,
    ruleId: row.ruleId,
    outcome: row.actualOutcome,
    explanation: row.blockerExplanations[0] ?? row.sentinelExplanation,
    remediation: row.requiredRemediation,
  };
}

function getRemainingWorkflowValidationGaps(
  rows: SourceWorkflowValidationFixtureReportRow[],
): string[] {
  const gaps = rows
    .filter((row) => row.actualOutcome === 'DEFER' || row.status === 'unexpected')
    .map((row) => `${row.fixtureId}: ${row.blockerExplanations[0] ?? row.requiredRemediation}`);

  return gaps.length > 0
    ? gaps
    : ['No remaining workflow validation gaps are visible in the deterministic fixture report.'];
}

function collectSourceWorkflowValidationRemediations(
  rows: SourceWorkflowValidationFixtureReportRow[],
): string[] {
  return unique(rows.map((row) => `${row.fixtureId}: ${row.requiredRemediation}`));
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}
