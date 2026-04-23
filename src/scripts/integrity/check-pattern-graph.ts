import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { validatePatternGraph } from '@/lib/intelligence/pattern-graph-validation';

const REPORT_DIR = join(process.cwd(), 'reports');

function main() {
  const result = validatePatternGraph();
  const timestamp = process.env.PATTERN_GRAPH_REPORT_TIMESTAMP ?? new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = join(REPORT_DIR, `pattern-graph-integrity-${timestamp}.json`);

  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(reportPath, `${JSON.stringify(result, null, 2)}\n`);

  console.log(
    [
      `patternCount=${result.summary.patternCount}`,
      `tenantCount=${result.summary.tenantCount}`,
      `programCount=${result.summary.programCount}`,
      `deliverableCount=${result.summary.deliverableCount}`,
      `relatedTo=${result.summary.edgeCounts.relatedTo}`,
      `appliedIn=${result.summary.edgeCounts.appliedIn}`,
      `applicableToTenant=${result.summary.edgeCounts.applicableToTenant}`,
      `sourcedFrom=${result.summary.edgeCounts.sourcedFrom}`,
    ].join(' '),
  );

  if (result.warnings.length > 0) {
    console.warn(`[pattern-graph] warnings=${result.warnings.length}`);
    for (const warning of result.warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (result.errors.length > 0) {
    console.error(`[pattern-graph] errors=${result.errors.length}`);
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`[pattern-graph] integrity check passed · report=${reportPath}`);
}

main();
