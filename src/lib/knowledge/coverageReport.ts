import {
  QUESTION_CATEGORIES,
  type CoverageReport,
} from '@/lib/knowledge/coverage';

export function formatCoverageReportForPrompt(report: CoverageReport): string {
  const spec = QUESTION_CATEGORIES[report.category];
  const missing = report.missingSegments.length > 0
    ? report.missingSegments.join(', ')
    : 'none';
  const present = report.presentSegments.length > 0
    ? report.presentSegments.join(', ')
    : 'none';

  return [
    'COVERAGE REPORT',
    `Question category: ${report.category} (${spec.label})`,
    `Coverage status: ${report.status}`,
    `Sources retrieved: ${report.sourceCount} (minimum expected ${report.minSources})`,
    `Required segments present: ${present}`,
    `Required segments missing: ${missing}`,
    'Use this as private grounding context. If coverage is partial, answer from present evidence and name only the specific missing segment needed to tighten the answer. Do not refuse when at least one relevant source is present.',
  ].join('\n');
}
