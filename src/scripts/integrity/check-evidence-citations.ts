import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { validateEvidenceCitations } from '@/lib/integrity/evidence-citations';

function main() {
  const timestamp = process.env.REPORT_TIMESTAMP ?? new Date().toISOString().replace(/[:.]/g, '-');
  const report = validateEvidenceCitations();
  const outputDir = join(process.cwd(), 'reports');
  const outputPath = join(outputDir, `evidence-citations-${timestamp}.json`);

  mkdirSync(outputDir, { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);

  console.log(`Evidence citation report written: ${outputPath}`);
  console.log(
    [
      `bases=${report.summary.evidenceBaseCount}`,
      `refs=${report.summary.referenceCount}`,
      `renderRefs=${report.summary.renderModelReferenceCount}`,
      `authoredRefs=${report.summary.authoredContentReferenceCount}`,
      `unresolved=${report.summary.unresolvedCount}`,
      `resolutionRate=${Math.round(report.summary.resolutionRate * 100)}%`,
    ].join(' · '),
  );

  if (report.summary.unresolvedCount > 0 || report.summary.resolutionRate < 1) {
    process.exitCode = 1;
  }
}

main();
