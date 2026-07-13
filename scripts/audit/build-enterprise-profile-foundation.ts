import path from 'node:path';

import {
  ENTERPRISE_PROFILE_FOUNDATION_REPORT_DIR,
  writeEnterpriseProfileFoundationReport,
} from '../../src/lib/enterprise-data/enterprise-profile/enterprise-profile-foundation';

async function main() {
  const repoRoot = path.resolve(__dirname, '../..');
  const report = await writeEnterpriseProfileFoundationReport({
    repoRoot,
    outputDir: ENTERPRISE_PROFILE_FOUNDATION_REPORT_DIR,
  });

  console.log(
    `Enterprise profile foundation audit complete: ${report.summary.canonicalRecordCount} canonical records, ${report.summary.requiredGapCount} required gaps, ${report.summary.placeholderRejectionCount} placeholder rejections.`,
  );

  if (report.summary.tenantsWithSource !== report.summary.tenantsExpected) {
    throw new Error(
      `Enterprise profile source coverage failed: ${report.summary.tenantsWithSource}/${report.summary.tenantsExpected} active tenants have source rows.`,
    );
  }

  if (report.summary.placeholderRejectionCount > 0) {
    throw new Error(
      `Enterprise profile placeholder rejection failed: ${report.summary.placeholderRejectionCount} placeholder values were present.`,
    );
  }

  if (report.summary.requiredGapCount > 0) {
    throw new Error(
      `Enterprise profile completeness failed: ${report.summary.requiredGapCount} required gaps remain.`,
    );
  }

  if (!report.summary.northstarExcluded) {
    throw new Error('Northstar must be explicitly retired/excluded in the enterprise profile audit.');
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
