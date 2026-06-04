import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const strict = args.has('--strict');
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

const checks = [];
const nextCommands = [
  'node scripts/lakeshore/verify-synthetic-context.mjs',
  'npm run lakeshore:live-activation:verify',
  'npx tsx scripts/provision-cxo-personas.ts --client lakeshore --plan-only',
  'npx tsx scripts/provision-cxo-personas.ts --client lakeshore --clerk-only --apply',
  'npm run embed:pending-chunks -- --tenant lakeshore --dry-run',
  'npm run embed:pending-chunks -- --tenant lakeshore',
];

function addCheck(area, name, status, detail, blocking = false) {
  checks.push({ area, name, status, detail, blocking });
}

function rel(...segments) {
  return path.join(repoRoot, ...segments);
}

function fileExists(...segments) {
  return existsSync(rel(...segments));
}

function readJson(...segments) {
  return JSON.parse(readFileSync(rel(...segments), 'utf8'));
}

function checkFile(area, name, segments, { blocking = true, detail, missingDetail } = {}) {
  const ok = fileExists(...segments);
  addCheck(area, name, ok ? 'ready' : 'missing', ok ? (detail ?? segments.join('/')) : (missingDetail ?? `Missing ${segments.join('/')}`), blocking);
  return ok;
}

function envPresent(names) {
  return names.some((name) => Boolean(process.env[name]));
}

function checkEnv(area, name, names, { blocking = false, detail } = {}) {
  const ok = envPresent(names);
  addCheck(
    area,
    name,
    ok ? 'ready' : 'missing',
    ok ? `${names.join(' or ')} is configured` : (detail ?? `Set one of: ${names.join(', ')}`),
    blocking,
  );
  return ok;
}

const loadedRoot = ['docs', 'build', 'lakeshore', 'loaded'];
const manifestOk = checkFile('artifact', 'Lakeshore manifest', [...loadedRoot, 'manifest.json']);
let manifest = null;

if (manifestOk) {
  manifest = readJson(...loadedRoot, 'manifest.json');
  addCheck('artifact', 'Tenant identity', manifest.tenantKey === 'lakeshore' && manifest.brokerKey === 'lakeshore-holdings' ? 'ready' : 'blocked', `tenantKey=${manifest.tenantKey}; brokerKey=${manifest.brokerKey}`, true);
  addCheck('artifact', 'Synthetic label', String(manifest.syntheticNotice ?? '').includes('SYNTHETIC') ? 'ready' : 'blocked', manifest.syntheticNotice ?? 'Missing synthetic notice', true);
  addCheck('artifact', 'Structured files', manifest.totals?.csvFiles >= 18 ? 'ready' : 'blocked', `${manifest.totals?.csvFiles ?? 0} CSV files`, true);
  addCheck('artifact', 'Structured records', manifest.totals?.structuredRecords >= 1250 ? 'ready' : 'blocked', `${manifest.totals?.structuredRecords ?? 0} structured rows`, true);
  addCheck('artifact', 'Documents', manifest.totals?.generatedDocuments >= 20 ? 'ready' : 'blocked', `${manifest.totals?.generatedDocuments ?? 0} documents`, true);

  for (const file of manifest.dataFiles ?? []) {
    checkFile('artifact:data', file.templateId, ['docs', 'build', 'lakeshore', 'loaded', file.path], { blocking: true, detail: `${file.rows} rows` });
  }

  for (const doc of manifest.documents ?? []) {
    checkFile('artifact:document', doc.fileName, ['docs', 'build', 'lakeshore', 'loaded', doc.path], { blocking: true });
  }
}

checkFile('artifact', 'Offline review ZIP', [...loadedRoot, 'review-bundle', 'lakeshore-offline-review-bundle.zip']);
if (fileExists(...loadedRoot, 'review-bundle', 'lakeshore-offline-review-bundle.zip')) {
  const zipSizeMb = statSync(rel(...loadedRoot, 'review-bundle', 'lakeshore-offline-review-bundle.zip')).size / 1024 / 1024;
  addCheck('artifact', 'Offline ZIP size', zipSizeMb > 0.05 ? 'ready' : 'blocked', `${zipSizeMb.toFixed(2)} MB`, true);
}

checkFile('script', 'Synthetic package verifier', ['scripts', 'lakeshore', 'verify-synthetic-context.mjs']);
checkFile('script', 'Private data-plane deployer', ['scripts', 'lakeshore', 'deploy-private-data-plane.sh']);
checkFile('runbook', 'Private data-plane runbook', ['docs', 'runbooks', 'lakeshore-private-data-plane.md']);
checkFile('runbook', 'Document Intelligence runbook', ['docs', 'runbooks', 'document-intelligence.md']);

const packageJson = readJson('package.json');
addCheck(
  'script',
  'Embedding command',
  packageJson.scripts?.['embed:pending-chunks'] ? 'ready' : 'missing',
  packageJson.scripts?.['embed:pending-chunks'] ?? 'Missing npm script embed:pending-chunks',
  true,
);

checkFile('pr-dependent', 'Governed load dry-run evidence', ['docs', 'build', 'lakeshore', 'loaded', 'load-runs', 'lakeshore-governed-load-dry-run-latest.json'], {
  blocking: false,
  missingDetail: 'Expected after PR #2997 lands and the governed loader rehearsal runs',
});
checkFile('pr-dependent', 'CXO corpus activation plan', ['docs', 'build', 'lakeshore', 'agent-grounding', 'lakeshore-corpus-activation-plan.json'], {
  blocking: false,
  missingDetail: 'Expected after PR #2998 lands',
});
checkFile('pr-dependent', 'CXO persona provisioner', ['scripts', 'provision-cxo-personas.ts'], {
  blocking: false,
  missingDetail: 'Expected after PR #2998 lands',
});

checkEnv('environment', 'Clerk API', ['CLERK_SECRET_KEY'], { blocking: false, detail: 'Required to create Lakeshore CXO users in Clerk' });
checkEnv('environment', 'Postgres app data plane', ['DATABASE_URL'], { blocking: false, detail: 'Required for live data-backed app verification and governed commits' });
checkEnv('environment', 'Membership write adapter', ['NEXT_PUBLIC_SUPABASE_URL'], { blocking: false, detail: 'Compatibility env currently used by membership provisioning until the adapter is fully renamed' });
checkEnv('environment', 'Membership service credential', ['SUPABASE_SERVICE_ROLE_KEY'], { blocking: false, detail: 'Compatibility env currently used by membership provisioning until the adapter is fully renamed' });
checkEnv('environment', 'Embedding provider', ['OPENAI_API_KEY'], { blocking: false, detail: 'Required for live embeddings; dry-run can execute without it' });
checkEnv('environment', 'Optional vector index API key', ['PINECONE_API_KEY'], { blocking: false, detail: 'Optional when using Postgres-only embedding persistence' });
checkEnv('environment', 'Optional vector index name', ['PINECONE_INDEX_NAME', 'PINECONE_INDEX'], { blocking: false, detail: 'Optional when using Postgres-only embedding persistence' });

const hasDocEndpoint = envPresent(['DOCUMENT_INTELLIGENCE_ENDPOINT', 'AZURE_DOCUMENT_INTELLIGENCE_ENDPOINT']);
const hasDocCredential = envPresent(['DOCUMENT_INTELLIGENCE_API_KEY', 'AZURE_DOCUMENT_INTELLIGENCE_API_KEY']) || process.env.DOCUMENT_INTELLIGENCE_USE_AAD === 'true';
addCheck(
  'environment',
  'Azure Document Intelligence',
  hasDocEndpoint && hasDocCredential ? 'ready' : 'missing',
  hasDocEndpoint && hasDocCredential
    ? 'Endpoint and API key/AAD mode configured'
    : 'Set DOCUMENT_INTELLIGENCE_ENDPOINT plus DOCUMENT_INTELLIGENCE_API_KEY, or DOCUMENT_INTELLIGENCE_USE_AAD=true',
  false,
);

const blocking = checks.filter((check) => check.blocking && check.status !== 'ready');
const warnings = checks.filter((check) => !check.blocking && check.status !== 'ready');
const summary = {
  status: blocking.length === 0 ? (warnings.length === 0 ? 'ready' : 'ready_with_warnings') : 'blocked',
  checkedAt: new Date().toISOString(),
  tenantKey: 'lakeshore',
  brokerKey: 'lakeshore-holdings',
  totals: {
    checks: checks.length,
    ready: checks.filter((check) => check.status === 'ready').length,
    blocking: blocking.length,
    warnings: warnings.length,
  },
  blocking,
  warnings,
  nextCommands,
  checks,
};

if (asJson) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`Lakeshore live activation readiness: ${summary.status}`);
  console.log(`Checks: ${summary.totals.ready}/${summary.totals.checks} ready; ${summary.totals.blocking} blocking; ${summary.totals.warnings} warnings`);
  if (blocking.length > 0) {
    console.log('\nBlocking gaps');
    for (const item of blocking) console.log(`- [${item.area}] ${item.name}: ${item.detail}`);
  }
  if (warnings.length > 0) {
    console.log('\nWarnings / pending live inputs');
    for (const item of warnings) console.log(`- [${item.area}] ${item.name}: ${item.detail}`);
  }
  console.log('\nNext commands');
  for (const command of nextCommands) console.log(`- ${command}`);
}

if (strict && summary.status !== 'ready') {
  process.exitCode = 1;
}
