import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { crawlCanonicalRouteSurface } from '@/lib/integrity/link-crawler';

function main() {
  const timestamp = process.env.REPORT_TIMESTAMP ?? new Date().toISOString().replace(/[:.]/g, '-');
  const report = crawlCanonicalRouteSurface();
  const outputDir = join(process.cwd(), 'reports');
  const outputPath = join(outputDir, `link-crawler-${timestamp}.json`);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Link crawler report written: ${outputPath}`);
  console.log(
    [
      `routes=${report.summary.routeCount}`,
      `links=${report.summary.linkCount}`,
      `brokenRoutes=${report.summary.brokenRouteCount}`,
      `brokenLinks=${report.summary.brokenInternalLinkCount}`,
      `redirectViolations=${report.summary.redirectChainViolationCount}`,
    ].join(' · '),
  );

  if (
    report.summary.brokenRouteCount > 0
    || report.summary.brokenInternalLinkCount > 0
    || report.summary.redirectChainViolationCount > 0
  ) {
    process.exitCode = 1;
  }
}

main();
