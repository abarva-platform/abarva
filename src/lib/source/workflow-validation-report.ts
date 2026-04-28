import type { SourceWorkflowValidationOutcome } from './workflow-validation';
import {
  getSourceWorkflowValidationReport,
  type SourceWorkflowValidationExplanation,
  type SourceWorkflowValidationFailedExpectation,
  type SourceWorkflowValidationFixtureReportRow,
  type SourceWorkflowValidationRunnerOptions,
  type SourceWorkflowValidationRunnerReport,
} from './workflow-validation-runner';

export const SOURCE_WORKFLOW_VALIDATION_READABLE_REPORT_VERSION = 'source-workflow-validation-readable-report/v1';

export interface SourceWorkflowValidationOutcomeDistribution {
  outcome: SourceWorkflowValidationOutcome;
  count: number;
  interpretation: string;
}

export interface SourceWorkflowValidationReadableFixtureRow {
  fixtureId: string;
  title: string;
  ruleId: string;
  attemptedAction: string;
  expectedOutcome: SourceWorkflowValidationOutcome;
  actualOutcome: SourceWorkflowValidationOutcome;
  status: 'matches_expected' | 'unexpected';
  meaning: string;
  primaryExplanation: string;
  stewardEnforcement: string;
  evidenceSummary: string;
  remediation: string;
}

export interface SourceWorkflowValidationReportComparison {
  contextValidationChecks: string[];
  workflowValidationChecks: string[];
  sharedPurpose: string;
  keyDifference: string;
}

export interface SourceWorkflowValidationReadableReport {
  reportId: string;
  reportVersion: typeof SOURCE_WORKFLOW_VALIDATION_READABLE_REPORT_VERSION;
  sourceReportVersion: SourceWorkflowValidationRunnerReport['reportVersion'];
  generatedAt: string;
  summaryHeadline: string;
  suiteVerdict: SourceWorkflowValidationRunnerReport['suiteVerdict'];
  totalFixtures: number;
  outcomeDistribution: SourceWorkflowValidationOutcomeDistribution[];
  mismatchCount: number;
  fixtureOutcomes: SourceWorkflowValidationReadableFixtureRow[];
  blockerExplanations: SourceWorkflowValidationExplanation[];
  intentionalDefers: SourceWorkflowValidationExplanation[];
  waiverRequiredExplanations: SourceWorkflowValidationExplanation[];
  failedExpectations: SourceWorkflowValidationFailedExpectation[];
  remediationByFixture: string[];
  remainingWorkflowGaps: string[];
  contextValidationComparison: SourceWorkflowValidationReportComparison;
  validationScope: string[];
  explicitOutOfScope: string[];
  recommendedNextSlice: string;
}

export function getSourceWorkflowValidationReadableReport(
  options: SourceWorkflowValidationRunnerOptions = {},
): SourceWorkflowValidationReadableReport {
  return createSourceWorkflowValidationReadableReport(getSourceWorkflowValidationReport(options));
}

export function createSourceWorkflowValidationReadableReport(
  runnerReport: SourceWorkflowValidationRunnerReport,
): SourceWorkflowValidationReadableReport {
  return {
    reportId: `${runnerReport.reportId}-readable`,
    reportVersion: SOURCE_WORKFLOW_VALIDATION_READABLE_REPORT_VERSION,
    sourceReportVersion: runnerReport.reportVersion,
    generatedAt: runnerReport.generatedAt,
    summaryHeadline: createSourceWorkflowValidationSummaryHeadline(runnerReport),
    suiteVerdict: runnerReport.suiteVerdict,
    totalFixtures: runnerReport.totalFixtures,
    outcomeDistribution: createOutcomeDistribution(runnerReport),
    mismatchCount: runnerReport.mismatchCount,
    fixtureOutcomes: runnerReport.resultsByFixture.map(toReadableFixtureRow),
    blockerExplanations: getSourceWorkflowValidationBlockers(runnerReport),
    intentionalDefers: getIntentionalSourceWorkflowValidationDefers(runnerReport),
    waiverRequiredExplanations: runnerReport.waiverRequiredExplanations,
    failedExpectations: runnerReport.failedExpectations,
    remediationByFixture: getSourceWorkflowValidationRemediations(runnerReport),
    remainingWorkflowGaps: runnerReport.remainingWorkflowGaps,
    contextValidationComparison: {
      contextValidationChecks: [
        'event, stage, pattern, evidence, and missing-input grounding',
        'agent response actionability',
        'anti-vanilla response quality',
      ],
      workflowValidationChecks: [
        'stage-gate enforcement',
        'artifact lifecycle readiness',
        'review, approval, waiver, version, citation, and value-realization safety',
      ],
      sharedPurpose: 'Both reports make missing context or missing workflow state visible before UI, API, or model implementation.',
      keyDifference: 'Context validation checks whether Nexus can answer safely; workflow validation checks whether Source should permit or block workflow actions.',
    },
    validationScope: runnerReport.validationScope,
    explicitOutOfScope: runnerReport.explicitOutOfScope,
    recommendedNextSlice: runnerReport.nextRecommendedSlice,
  };
}

export function formatSourceWorkflowValidationReport(
  report: SourceWorkflowValidationReadableReport = getSourceWorkflowValidationReadableReport(),
): string {
  return formatSourceWorkflowValidationReportAsMarkdown(report);
}

export function formatSourceWorkflowValidationReportAsMarkdown(
  report: SourceWorkflowValidationReadableReport = getSourceWorkflowValidationReadableReport(),
): string {
  const lines = [
    '# Source Workflow Validation Report',
    '',
    `Report version: ${report.reportVersion}`,
    `Source report version: ${report.sourceReportVersion}`,
    `Generated at: ${report.generatedAt}`,
    '',
    '## Suite Summary',
    '',
    report.summaryHeadline,
    `Suite verdict: ${report.suiteVerdict.toUpperCase()}`,
    `Mismatches: ${report.mismatchCount}`,
    '',
    '## Outcome Distribution',
    '',
    '| Outcome | Count | Interpretation |',
    '|---|---:|---|',
    ...report.outcomeDistribution.map((item) => (
      `| ${item.outcome} | ${item.count} | ${escapeTableCell(item.interpretation)} |`
    )),
    '',
    '## Fixture Outcomes',
    '',
    '| Fixture | Rule | Action | Expected | Actual | Status | Meaning |',
    '|---|---|---|---:|---:|---|---|',
    ...report.fixtureOutcomes.map((row) => (
      `| ${row.fixtureId} | ${row.ruleId} | ${escapeTableCell(row.attemptedAction)} | ${row.expectedOutcome} | ${row.actualOutcome} | ${row.status} | ${escapeTableCell(row.meaning)} |`
    )),
    '',
    '## BLOCK Reasons',
    '',
    ...formatExplanations(report.blockerExplanations),
    '',
    '## Intentional DEFER Reasons',
    '',
    ...formatExplanations(report.intentionalDefers),
    '',
    '## WAIVER_REQUIRED Readiness',
    '',
    ...formatWaiverReadiness(report.waiverRequiredExplanations),
    '',
    '## Failed Expectations',
    '',
    ...formatFailedExpectations(report.failedExpectations),
    '',
    '## Remediation By Fixture',
    '',
    ...report.remediationByFixture.map((item) => `- ${item}`),
    '',
    '## Remaining Workflow Gaps',
    '',
    ...report.remainingWorkflowGaps.map((item) => `- ${item}`),
    '',
    '## Workflow Validation Vs Context Validation',
    '',
    `Shared purpose: ${report.contextValidationComparison.sharedPurpose}`,
    `Key difference: ${report.contextValidationComparison.keyDifference}`,
    '',
    'Context validation checks:',
    ...report.contextValidationComparison.contextValidationChecks.map((item) => `- ${item}`),
    '',
    'Workflow validation checks:',
    ...report.contextValidationComparison.workflowValidationChecks.map((item) => `- ${item}`),
    '',
    '## Explicitly Out Of Scope',
    '',
    ...report.explicitOutOfScope.map((item) => `- ${item}`),
    '',
    '## Recommended Next Slice',
    '',
    report.recommendedNextSlice,
  ];

  return `${lines.join('\n')}\n`;
}

export function getIntentionalSourceWorkflowValidationDefers(
  report: SourceWorkflowValidationRunnerReport = getSourceWorkflowValidationReport(),
): SourceWorkflowValidationExplanation[] {
  return report.deferExplanations.map((defer) => ({
    ...defer,
    explanation: `${defer.explanation} This is an intentional defer until the required source data or capability is available.`,
  }));
}

export function getSourceWorkflowValidationRemediations(
  report: SourceWorkflowValidationRunnerReport = getSourceWorkflowValidationReport(),
): string[] {
  return report.resultsByFixture.map((row) => `${row.fixtureId}: ${row.requiredRemediation}`);
}

export function getSourceWorkflowValidationBlockers(
  report: SourceWorkflowValidationRunnerReport = getSourceWorkflowValidationReport(),
): SourceWorkflowValidationExplanation[] {
  return report.blockerExplanations.map((blocker) => ({
    ...blocker,
    explanation: `${blocker.explanation} This BLOCK is expected enforcement when the fixture outcome matches.`,
  }));
}

function createSourceWorkflowValidationSummaryHeadline(
  report: SourceWorkflowValidationRunnerReport,
): string {
  return `Source workflow validation: ${report.totalFixtures} total / ${report.blockCount} BLOCK / ${report.deferCount} DEFER / ${report.mismatchCount} mismatches`;
}

function createOutcomeDistribution(
  report: SourceWorkflowValidationRunnerReport,
): SourceWorkflowValidationOutcomeDistribution[] {
  return [
    {
      outcome: 'PASS',
      count: report.passCount,
      interpretation: 'Safe action allowed or safe state confirmed.',
    },
    {
      outcome: 'BLOCK',
      count: report.blockCount,
      interpretation: 'Unsafe action correctly blocked by deterministic workflow rule.',
    },
    {
      outcome: 'DEFER',
      count: report.deferCount,
      interpretation: 'Action cannot be fully evaluated because required deterministic context or capability is unavailable.',
    },
    {
      outcome: 'WAIVER_REQUIRED',
      count: report.waiverRequiredCount,
      interpretation: 'Action can proceed only through governed exception path with owner, authority, rationale, and audit trail.',
    },
    {
      outcome: 'FAIL',
      count: report.failCount,
      interpretation: 'Validator outcome is unsafe or unexpected and should block review.',
    },
  ];
}

function toReadableFixtureRow(
  row: SourceWorkflowValidationFixtureReportRow,
): SourceWorkflowValidationReadableFixtureRow {
  return {
    fixtureId: row.fixtureId,
    title: row.title,
    ruleId: row.ruleId,
    attemptedAction: row.attemptedAction,
    expectedOutcome: row.expectedOutcome,
    actualOutcome: row.actualOutcome,
    status: row.status,
    meaning: getFixtureOutcomeMeaning(row),
    primaryExplanation: row.blockerExplanations[0] ?? row.nexusExplanation,
    stewardEnforcement: row.stewardEnforcement,
    evidenceSummary: formatEvidenceSummary(row),
    remediation: row.requiredRemediation,
  };
}

function getFixtureOutcomeMeaning(
  row: SourceWorkflowValidationFixtureReportRow,
): string {
  if (row.status === 'unexpected') {
    return 'Unexpected outcome; review should stop until the fixture or validator is corrected.';
  }

  if (row.actualOutcome === 'BLOCK') {
    return 'Expected enforcement; Source is preventing an unsafe workflow move.';
  }

  if (row.actualOutcome === 'DEFER') {
    return 'Intentional defer; required data or capability is not ready yet.';
  }

  if (row.actualOutcome === 'WAIVER_REQUIRED') {
    return 'Governed exception path is required before action can proceed.';
  }

  if (row.actualOutcome === 'PASS') {
    return 'Safe workflow state is confirmed.';
  }

  return 'Failure outcome; review should stop.';
}

function formatEvidenceSummary(
  row: SourceWorkflowValidationFixtureReportRow,
): string {
  const satisfied = row.evidenceRequirements.filter((item) => item.satisfied).length;
  return `${satisfied}/${row.evidenceRequirements.length} evidence requirements satisfied`;
}

function formatExplanations(
  explanations: SourceWorkflowValidationExplanation[],
): string[] {
  if (explanations.length === 0) return ['- None'];

  return explanations.map((item) => (
    `- ${item.fixtureId} (${item.outcome}): ${item.explanation} Remediation: ${item.remediation}`
  ));
}

function formatWaiverReadiness(
  explanations: SourceWorkflowValidationExplanation[],
): string[] {
  if (explanations.length === 0) {
    return [
      '- No current fixture returns WAIVER_REQUIRED.',
      '- Future waiver rows should show waiver-capable rule, authorized role, required rationale, evidence status, and whether action remains blocked until waiver is captured.',
    ];
  }

  return formatExplanations(explanations);
}

function formatFailedExpectations(
  failedExpectations: SourceWorkflowValidationFailedExpectation[],
): string[] {
  if (failedExpectations.length === 0) return ['- None'];

  return failedExpectations.map((item) => (
    `- ${item.fixtureId}: expected ${item.expectedOutcome}, got ${item.actualOutcome}. Remediation: ${item.remediation}`
  ));
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, '<br />');
}
