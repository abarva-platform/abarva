import type {
  SourceAgentValidationFixture,
  SourceAgentValidationFixtureCategory,
  SourceAgentValidationFixtureResult,
  SourceAgentValidationSeverity,
  SourceVanillaResponseFlag,
} from './agent-validation';
import {
  SOURCE_AGENT_VALIDATION_FIXTURES,
  getSourceAgentValidationFixture,
  validateSourceAgentValidationFixture,
} from './agent-validation-fixtures';

export type SourceContextValidationRunnerVerdict = 'pass' | 'defer' | 'reject';

export interface SourceContextValidationRunnerOptions {
  fixtureIds?: string[];
  categories?: SourceAgentValidationFixtureCategory[];
  generatedAt?: string;
  allowDefer?: boolean;
  throwOnReject?: boolean;
}

export interface SourceContextValidationFixtureReportItem {
  fixtureId: string;
  category: SourceAgentValidationFixtureCategory;
  prompt: string;
  expectedVerdict: SourceContextValidationRunnerVerdict;
  actualVerdict: SourceContextValidationRunnerVerdict;
  matchesExpected: boolean;
  contextGrounding: number;
  actionability: number;
  evidence: number;
  vanillaResponseRisk: number;
  missingContextReasons: string[];
  failedOrDeferredDimensions: string[];
  vanillaResponseRiskFlags: SourceVanillaResponseFlag[];
}

export interface SourceContextValidationRunnerGap {
  id: string;
  severity: SourceAgentValidationSeverity;
  fixtures: string[];
  summary: string;
}

export interface SourceContextValidationAntiVanillaCoverage {
  flag: SourceVanillaResponseFlag;
  fixtures: string[];
}

export interface SourceContextValidationRunnerSummary {
  totalFixtures: number;
  passCount: number;
  deferCount: number;
  rejectCount: number;
  verdict: SourceContextValidationRunnerVerdict;
  acceptableForCurrentSlice: boolean;
}

export interface SourceContextValidationRunnerReport extends SourceContextValidationRunnerSummary {
  id: string;
  generatedAt: string;
  resultByFixture: SourceContextValidationFixtureReportItem[];
  results: SourceAgentValidationFixtureResult[];
  gaps: SourceContextValidationRunnerGap[];
  antiVanillaCoverage: SourceContextValidationAntiVanillaCoverage[];
  recommendedNextRemediation: string[];
}

const DEFAULT_RUNNER_REPORT_ID = 'source-context-validation-runner-report';
const DEFAULT_RUNNER_GENERATED_AT = '2026-04-24T00:00:00.000Z';

export function getSourceContextValidationFixtureById(
  id: string,
): SourceAgentValidationFixture | undefined {
  return getSourceAgentValidationFixture(id);
}

export function runSourceContextValidationFixtures(
  options: SourceContextValidationRunnerOptions = {},
): SourceContextValidationRunnerReport {
  const fixtures = selectFixtures(options);
  const results = fixtures.map(validateSourceAgentValidationFixture);
  const report = summarizeSourceContextValidationResults(results, fixtures, options);

  if (options.throwOnReject && report.verdict === 'reject') {
    throw new Error(`Source context validation rejected ${report.rejectCount} fixture(s).`);
  }

  return report;
}

export function getSourceContextValidationReport(
  options: SourceContextValidationRunnerOptions = {},
): SourceContextValidationRunnerReport {
  return runSourceContextValidationFixtures(options);
}

export function summarizeSourceContextValidationResults(
  results: SourceAgentValidationFixtureResult[],
  fixtures: SourceAgentValidationFixture[] = SOURCE_AGENT_VALIDATION_FIXTURES,
  options: SourceContextValidationRunnerOptions = {},
): SourceContextValidationRunnerReport {
  const fixtureById = new Map(fixtures.map((fixture) => [fixture.id, fixture]));
  const resultByFixture = results.map((result) => toReportItem(result, fixtureById.get(result.fixtureId)));
  const passCount = resultByFixture.filter((result) => result.actualVerdict === 'pass').length;
  const deferCount = resultByFixture.filter((result) => result.actualVerdict === 'defer').length;
  const rejectCount = resultByFixture.filter((result) => result.actualVerdict === 'reject').length;
  const verdict = getSuiteVerdict(rejectCount, deferCount);

  return {
    id: DEFAULT_RUNNER_REPORT_ID,
    generatedAt: options.generatedAt ?? DEFAULT_RUNNER_GENERATED_AT,
    totalFixtures: results.length,
    passCount,
    deferCount,
    rejectCount,
    verdict,
    acceptableForCurrentSlice: verdict === 'pass' || (verdict === 'defer' && options.allowDefer !== false),
    resultByFixture,
    results,
    gaps: collectGaps(results),
    antiVanillaCoverage: collectAntiVanillaCoverage(results),
    recommendedNextRemediation: getRecommendedNextRemediation(results),
  };
}

function selectFixtures(options: SourceContextValidationRunnerOptions): SourceAgentValidationFixture[] {
  const fixtureIds = new Set(options.fixtureIds ?? []);
  const categories = new Set(options.categories ?? []);

  return SOURCE_AGENT_VALIDATION_FIXTURES.filter((fixture) => {
    const matchesFixture = fixtureIds.size === 0 || fixtureIds.has(fixture.id);
    const matchesCategory = categories.size === 0 || categories.has(fixture.category);
    return matchesFixture && matchesCategory;
  });
}

function toReportItem(
  result: SourceAgentValidationFixtureResult,
  fixture?: SourceAgentValidationFixture,
): SourceContextValidationFixtureReportItem {
  const actualVerdict = toRunnerVerdict(result.actualVerdict);
  const expectedVerdict = toRunnerVerdict(result.expectedVerdict);
  const failedOrDeferredDimensions = result.validationResult.findings.map((finding) => finding.dimension);

  return {
    fixtureId: result.fixtureId,
    category: fixture?.category ?? 'portfolioAttention',
    prompt: result.prompt,
    expectedVerdict,
    actualVerdict,
    matchesExpected: expectedVerdict === actualVerdict,
    contextGrounding: result.validationResult.contextGrounding,
    actionability: result.validationResult.actionability,
    evidence: result.validationResult.evidence,
    vanillaResponseRisk: result.validationResult.vanillaResponseRisk,
    missingContextReasons: result.missingContextReasons,
    failedOrDeferredDimensions: Array.from(new Set(failedOrDeferredDimensions)),
    vanillaResponseRiskFlags: result.validationResult.vanillaResponseFlags,
  };
}

function collectGaps(
  results: SourceAgentValidationFixtureResult[],
): SourceContextValidationRunnerGap[] {
  const gapMap = new Map<string, SourceContextValidationRunnerGap>();

  for (const result of results) {
    for (const finding of result.validationResult.findings) {
      addGap(gapMap, {
        id: finding.id,
        severity: finding.severity,
        fixtures: [result.fixtureId],
        summary: finding.message,
      });
    }

    for (const reason of result.missingContextReasons) {
      addGap(gapMap, {
        id: toGapId(reason),
        severity: 'warning',
        fixtures: [result.fixtureId],
        summary: reason,
      });
    }
  }

  return Array.from(gapMap.values()).sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
}

function collectAntiVanillaCoverage(
  results: SourceAgentValidationFixtureResult[],
): SourceContextValidationAntiVanillaCoverage[] {
  const coverage = new Map<SourceVanillaResponseFlag, Set<string>>();

  for (const result of results) {
    for (const flag of result.genericResponseFailureFlags) {
      const existing = coverage.get(flag) ?? new Set<string>();
      existing.add(result.fixtureId);
      coverage.set(flag, existing);
    }
  }

  return Array.from(coverage.entries())
    .map(([flag, fixtures]) => ({
      flag,
      fixtures: Array.from(fixtures).sort(),
    }))
    .sort((a, b) => a.flag.localeCompare(b.flag));
}

function getRecommendedNextRemediation(
  results: SourceAgentValidationFixtureResult[],
): string[] {
  const findingIds = new Set(results.flatMap((result) => result.validationResult.findings.map((finding) => finding.id)));
  const recommendations: string[] = [];

  if (findingIds.has('missing-value-ledger-context')) {
    recommendations.push('Populate portfolio-level per-event value context so dashboard fixtures can rank value at stake.');
  }
  if (findingIds.has('missing-pattern-sections')) {
    recommendations.push('Populate relevant pattern sections for Data & AI Modernization sourcing guidance.');
  }
  if (findingIds.has('missing-scorecard-defaults-overrides')) {
    recommendations.push('Add scorecard default weights, rationale, and override history before scorecard chat guidance.');
  }
  if (findingIds.has('missing-attachment-summary') || findingIds.has('missing-attachment-citation')) {
    recommendations.push('Add deterministic attachment summary and citation placeholders before vendor-response prompts.');
  }
  if (findingIds.has('artifact-generation-deferred-missing-inputs')) {
    recommendations.push('Keep artifact generation blocked until Scope missing inputs and gate checks are satisfied.');
  }

  if (recommendations.length === 0) {
    recommendations.push('No deterministic remediation required before the next review gate.');
  }

  return recommendations;
}

function addGap(
  gapMap: Map<string, SourceContextValidationRunnerGap>,
  gap: SourceContextValidationRunnerGap,
): void {
  const existing = gapMap.get(gap.id);
  if (!existing) {
    gapMap.set(gap.id, gap);
    return;
  }

  gapMap.set(gap.id, {
    ...existing,
    severity: higherSeverity(existing.severity, gap.severity),
    fixtures: Array.from(new Set([...existing.fixtures, ...gap.fixtures])).sort(),
  });
}

function toRunnerVerdict(verdict: SourceAgentValidationFixtureResult['actualVerdict']): SourceContextValidationRunnerVerdict {
  return verdict === 'fail' ? 'reject' : verdict;
}

function getSuiteVerdict(
  rejectCount: number,
  deferCount: number,
): SourceContextValidationRunnerVerdict {
  if (rejectCount > 0) return 'reject';
  if (deferCount > 0) return 'defer';
  return 'pass';
}

function toGapId(reason: string): string {
  return reason
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

function higherSeverity(
  a: SourceAgentValidationSeverity,
  b: SourceAgentValidationSeverity,
): SourceAgentValidationSeverity {
  return severityRank(a) >= severityRank(b) ? a : b;
}

function severityRank(severity: SourceAgentValidationSeverity): number {
  switch (severity) {
    case 'critical':
      return 4;
    case 'error':
      return 3;
    case 'warning':
      return 2;
    case 'info':
      return 1;
  }
}
