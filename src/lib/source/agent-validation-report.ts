import type {
  SourceAgentValidationFixture,
  SourceAgentValidationFixtureCategory,
  SourceAgentValidationFixtureResult,
  SourceVanillaResponseFlag,
} from './agent-validation';
import {
  SOURCE_AGENT_VALIDATION_FIXTURES,
} from './agent-validation-fixtures';
import type {
  SourceContextValidationRunnerGap,
  SourceContextValidationRunnerOptions,
  SourceContextValidationRunnerReport,
  SourceContextValidationRunnerVerdict,
} from './agent-validation-runner';
import {
  getSourceContextValidationReport,
} from './agent-validation-runner';
import type { SourcePersona, SourceSurface } from './agent-context';
import type { SourceStageKey } from './types';

export const SOURCE_CONTEXT_VALIDATION_REPORT_VERSION = 'source-context-validation-report/v1';

export interface SourceContextValidationReportSuiteSummary {
  totalFixtures: number;
  passCount: number;
  deferCount: number;
  rejectCount: number;
  verdict: SourceContextValidationRunnerVerdict;
  expectedSummary: string;
}

export interface SourceContextValidationFixtureReportRow {
  fixtureId: string;
  prompt: string;
  category: SourceAgentValidationFixtureCategory;
  persona?: SourcePersona;
  surface?: SourceSurface;
  stageKey?: SourceStageKey;
  expectedOutcome: SourceContextValidationRunnerVerdict;
  actualOutcome: SourceContextValidationRunnerVerdict;
  status: 'matches_expected' | 'unexpected';
  dimensionsChecked: Array<'contextGrounding' | 'actionability' | 'evidence'>;
  contextGrounding: number;
  actionability: number;
  evidence: number;
  missingContextReasons: string[];
  vanillaResponseRiskFlags: SourceVanillaResponseFlag[];
  recommendedRemediation: string;
}

export interface SourceIntentionalValidationDefer {
  fixtureId: string;
  prompt: string;
  reason: string;
  remediationRequiredBeforePass: string;
}

export interface SourceContextValidationReadableReport {
  reportId: string;
  reportVersion: typeof SOURCE_CONTEXT_VALIDATION_REPORT_VERSION;
  generatedAt: string;
  validationScope: string[];
  explicitOutOfScope: string[];
  suite: SourceContextValidationReportSuiteSummary;
  resultsByFixture: SourceContextValidationFixtureReportRow[];
  deferReasons: SourceIntentionalValidationDefer[];
  rejectReasons: Array<{
    fixtureId: string;
    prompt: string;
    reason: string;
  }>;
  remainingContextGaps: SourceContextValidationRunnerGap[];
  recommendedRemediations: string[];
  nextRecommendedSlice: string;
}

const EXPECTED_CURRENT_SUMMARY = '10 total / 8 pass / 2 defer / 0 reject';
const NEXT_RECOMMENDED_SLICE = 'Keep hardening deterministic context and validation before chat UI, API routes, or model calls.';

const VALIDATION_SCOPE = [
  'deterministic Source validation fixtures',
  'seeded Source context only',
  'anti-vanilla context grounding checks',
  'pass/defer/reject report readability',
];

const EXPLICIT_OUT_OF_SCOPE = [
  'chat UI',
  'API routes',
  'model calls',
  'upload/parsing',
  'event canvas expansion',
  'scorecard UI',
  'artifact drawer',
  'value ledger UI',
  'vendor response flow',
  'AI/RFP generation',
  '/programs integration',
  '/preview or /demo surfaces',
];

const INTENTIONAL_DEFER_REASON_BY_FIXTURE_ID: Record<string, Omit<SourceIntentionalValidationDefer, 'fixtureId' | 'prompt'>> = {
  'source-golden-artifact-generate-rfp': {
    reason: 'Required client inputs are still missing, so RFP generation must remain blocked at the Scope gate.',
    remediationRequiredBeforePass: 'Upload/validate application inventory and analytics workload baseline, then clear the Scope gate and artifact readiness checks.',
  },
  'source-golden-attachment-vendor-response-summary': {
    reason: 'No real uploaded vendor response or client evidence exists; only a seed placeholder attachment is present.',
    remediationRequiredBeforePass: 'Upload a real vendor response, parse it into an attachment summary, attach citations, and record confidence before summarization can pass.',
  },
};

export function getSourceContextValidationReadableReport(
  options: SourceContextValidationRunnerOptions = {},
): SourceContextValidationReadableReport {
  return createSourceContextValidationReadableReport(getSourceContextValidationReport(options));
}

export function createSourceContextValidationReadableReport(
  runnerReport: SourceContextValidationRunnerReport,
): SourceContextValidationReadableReport {
  return {
    reportId: runnerReport.id,
    reportVersion: SOURCE_CONTEXT_VALIDATION_REPORT_VERSION,
    generatedAt: runnerReport.generatedAt,
    validationScope: [...VALIDATION_SCOPE],
    explicitOutOfScope: [...EXPLICIT_OUT_OF_SCOPE],
    suite: {
      totalFixtures: runnerReport.totalFixtures,
      passCount: runnerReport.passCount,
      deferCount: runnerReport.deferCount,
      rejectCount: runnerReport.rejectCount,
      verdict: runnerReport.verdict,
      expectedSummary: EXPECTED_CURRENT_SUMMARY,
    },
    resultsByFixture: runnerReport.results.map((result) => toReadableFixtureRow(result)),
    deferReasons: getIntentionalSourceValidationDefers(runnerReport),
    rejectReasons: getSourceContextValidationRejectReasons(runnerReport),
    remainingContextGaps: runnerReport.gaps,
    recommendedRemediations: getSourceContextValidationRemediations(runnerReport),
    nextRecommendedSlice: NEXT_RECOMMENDED_SLICE,
  };
}

export function formatSourceContextValidationReport(
  report: SourceContextValidationReadableReport = getSourceContextValidationReadableReport(),
): string {
  return formatSourceContextValidationReportAsMarkdown(report);
}

export function formatSourceContextValidationReportAsMarkdown(
  report: SourceContextValidationReadableReport = getSourceContextValidationReadableReport(),
): string {
  const lines = [
    '# Source Context Validation Report',
    '',
    `Report version: ${report.reportVersion}`,
    `Generated at: ${report.generatedAt}`,
    '',
    '## Suite Summary',
    '',
    `Source Context Validation: ${report.suite.totalFixtures} fixtures`,
    `PASS: ${report.suite.passCount}`,
    `DEFER: ${report.suite.deferCount}`,
    `REJECT: ${report.suite.rejectCount}`,
    `Suite verdict: ${report.suite.verdict.toUpperCase()}`,
    `Expected current outcome: ${report.suite.expectedSummary}`,
    '',
    '## Fixture Outcomes',
    '',
    '| Fixture | Prompt | Outcome | Expected | Status | Scores | Key gaps |',
    '|---|---|---:|---:|---|---|---|',
    ...report.resultsByFixture.map((row) => (
      `| ${row.fixtureId} | ${escapeTableCell(row.prompt)} | ${row.actualOutcome.toUpperCase()} | ${row.expectedOutcome.toUpperCase()} | ${row.status} | G:${row.contextGrounding} A:${row.actionability} E:${row.evidence} | ${escapeTableCell(formatList(row.missingContextReasons))} |`
    )),
    '',
    '## Intentional Defers',
    '',
    ...formatIntentionalDefers(report.deferReasons),
    '',
    '## Remaining Context Gaps',
    '',
    ...formatGaps(report.remainingContextGaps),
    '',
    '## Recommended Remediations',
    '',
    ...report.recommendedRemediations.map((remediation) => `- ${remediation}`),
    '',
    '## Validation Scope',
    '',
    ...report.validationScope.map((scope) => `- ${scope}`),
    '',
    '## Explicitly Out Of Scope',
    '',
    ...report.explicitOutOfScope.map((item) => `- ${item}`),
    '',
    '## Next Recommended Slice',
    '',
    report.nextRecommendedSlice,
  ];

  return `${lines.join('\n')}\n`;
}

export function getIntentionalSourceValidationDefers(
  runnerReport: SourceContextValidationRunnerReport = getSourceContextValidationReport(),
): SourceIntentionalValidationDefer[] {
  return runnerReport.results
    .filter((result) => toRunnerVerdict(result.actualVerdict) === 'defer')
    .map((result) => {
      const knownDefer = INTENTIONAL_DEFER_REASON_BY_FIXTURE_ID[result.fixtureId];
      return {
        fixtureId: result.fixtureId,
        prompt: result.prompt,
        reason: knownDefer?.reason ?? 'Fixture deferred because deterministic context remains incomplete.',
        remediationRequiredBeforePass: knownDefer?.remediationRequiredBeforePass ?? 'Fill the missing deterministic context listed in the runner gaps before expecting pass.',
      };
    });
}

export function getSourceContextValidationRemediations(
  runnerReport: SourceContextValidationRunnerReport = getSourceContextValidationReport(),
): string[] {
  return runnerReport.recommendedNextRemediation;
}

function getSourceContextValidationRejectReasons(
  runnerReport: SourceContextValidationRunnerReport,
): SourceContextValidationReadableReport['rejectReasons'] {
  return runnerReport.results
    .filter((result) => toRunnerVerdict(result.actualVerdict) === 'reject')
    .map((result) => ({
      fixtureId: result.fixtureId,
      prompt: result.prompt,
      reason: result.validationResult.findings.map((finding) => finding.message).join(' ') || 'Fixture rejected by deterministic validation.',
    }));
}

function toReadableFixtureRow(
  result: SourceAgentValidationFixtureResult,
): SourceContextValidationFixtureReportRow {
  const fixture = getFixture(result.fixtureId);
  return {
    fixtureId: result.fixtureId,
    prompt: result.prompt,
    category: fixture?.category ?? 'portfolioAttention',
    persona: fixture?.persona,
    surface: fixture?.surface,
    stageKey: fixture?.contextInput.stageKey,
    expectedOutcome: toRunnerVerdict(result.expectedVerdict),
    actualOutcome: toRunnerVerdict(result.actualVerdict),
    status: result.passesExpectation ? 'matches_expected' : 'unexpected',
    dimensionsChecked: ['contextGrounding', 'actionability', 'evidence'],
    contextGrounding: result.validationResult.contextGrounding,
    actionability: result.validationResult.actionability,
    evidence: result.validationResult.evidence,
    missingContextReasons: result.missingContextReasons,
    vanillaResponseRiskFlags: result.validationResult.vanillaResponseFlags,
    recommendedRemediation: getFixtureRemediation(result),
  };
}

function getFixtureRemediation(result: SourceAgentValidationFixtureResult): string {
  const knownDefer = INTENTIONAL_DEFER_REASON_BY_FIXTURE_ID[result.fixtureId];
  if (knownDefer && toRunnerVerdict(result.actualVerdict) === 'defer') {
    return knownDefer.remediationRequiredBeforePass;
  }
  if (toRunnerVerdict(result.actualVerdict) === 'pass') {
    return 'No deterministic remediation required for this fixture.';
  }
  if (toRunnerVerdict(result.actualVerdict) === 'reject') {
    return result.validationResult.findings.map((finding) => finding.message).join(' ') || 'Resolve deterministic validation rejection.';
  }
  return result.missingContextReasons.join(' ') || 'Fill missing deterministic context before expecting pass.';
}

function getFixture(fixtureId: string): SourceAgentValidationFixture | undefined {
  return SOURCE_AGENT_VALIDATION_FIXTURES.find((fixture) => fixture.id === fixtureId);
}

function toRunnerVerdict(
  verdict: SourceAgentValidationFixtureResult['actualVerdict'],
): SourceContextValidationRunnerVerdict {
  return verdict === 'fail' ? 'reject' : verdict;
}

function formatIntentionalDefers(defers: SourceIntentionalValidationDefer[]): string[] {
  if (defers.length === 0) {
    return ['- None.'];
  }

  return defers.flatMap((defer) => [
    `- ${defer.fixtureId}: ${defer.prompt}`,
    `  - Reason: ${defer.reason}`,
    `  - Required before pass: ${defer.remediationRequiredBeforePass}`,
  ]);
}

function formatGaps(gaps: SourceContextValidationRunnerGap[]): string[] {
  if (gaps.length === 0) {
    return ['- None.'];
  }

  return gaps.map((gap) => (
    `- ${gap.id} (${gap.severity}; fixtures: ${gap.fixtures.join(', ')}): ${gap.summary}`
  ));
}

function formatList(values: string[]): string {
  return values.length > 0 ? values.join('; ') : 'None';
}

function escapeTableCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}
