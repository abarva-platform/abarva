import fs from 'node:fs/promises';
import { hasP0, type CrawlComparison } from '../../src/lib/crawl/baseline-compare';

interface Payload {
  comparison: CrawlComparison;
}

async function main() {
  const args = process.argv.slice(2);
  const file = valueAfter(args, '--result') ?? 'audit-artifacts/post-deploy-crawl/latest.json';
  const execute = args.includes('--execute') || process.env.CRAWL_ENABLE_AUTO_ROLLBACK === 'true';
  const target = valueAfter(args, '--target') ?? process.env.VERCEL_ROLLBACK_TARGET;
  const raw = await fs.readFile(file, 'utf8').catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT') {
      console.log(`No crawl result found at ${file}. Rollback skipped because the crawl did not produce a comparison artifact.`);
      return null;
    }
    throw error;
  });
  if (!raw) return;
  const payload = JSON.parse(raw) as Payload;

  if (!hasP0(payload.comparison)) {
    console.log('No P0 findings. Rollback skipped.');
    return;
  }

  const alert = {
    severity: 'P0',
    action: execute ? 'rollback_execute' : 'rollback_dry_run',
    target: target ?? 'previous-production',
    findings: payload.comparison.findings.filter((finding) => finding.severity === 'P0'),
  };
  console.log(JSON.stringify(alert, null, 2));

  if (!execute) {
    console.log('Dry-run only. Set CRAWL_ENABLE_AUTO_ROLLBACK=true or pass --execute in the controlled deploy workflow.');
    process.exitCode = 2;
    return;
  }

  console.error(
    'Automatic production rollback is disabled. Use the Azure Container Apps deploy runbook to restore an approved digest.',
  );
  process.exitCode = 1;
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
