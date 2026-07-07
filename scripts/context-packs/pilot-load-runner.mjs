#!/usr/bin/env node
/**
 * Controlled pilot load runner.
 *
 * Safe default:
 *   node scripts/context-packs/pilot-load-runner.mjs --prepare --preflight --package --client all --version v4
 *
 * Mutating mode requires an explicit confirmation flag:
 *   node scripts/context-packs/pilot-load-runner.mjs --preflight --apply --confirm-client-scoped-replace --client first-capital --version v4
 */

import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUTPUT_ROOT = path.join(REPO_ROOT, 'outputs/context-refresh');
const KNOWN_CLIENTS = ['skyharbor-air', 'first-capital', 'meridian-health', 'lakeshore', 'apex-retail'];

function parseArgs(argv) {
  const out = {
    client: 'all',
    version: 'v4',
    prepare: false,
    preflight: false,
    package: false,
    apply: false,
    confirmClientScopedReplace: false,
    allowAllClients: false,
  };
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--client') out.client = argv[++i];
    else if (arg === '--version') out.version = argv[++i];
    else if (arg === '--prepare') out.prepare = true;
    else if (arg === '--preflight') out.preflight = true;
    else if (arg === '--package') out.package = true;
    else if (arg === '--apply') out.apply = true;
    else if (arg === '--confirm-client-scoped-replace') out.confirmClientScopedReplace = true;
    else if (arg === '--allow-all-clients') out.allowAllClients = true;
    else if (arg === '--help' || arg === '-h') out.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!out.prepare && !out.preflight && !out.package && !out.apply) {
    out.prepare = true;
    out.preflight = true;
    out.package = true;
  }
  return out;
}

function usage() {
  return `Pilot load runner

Safe preparation:
  node scripts/context-packs/pilot-load-runner.mjs --prepare --preflight --package --client all --version v4

Single-client apply after review:
  node scripts/context-packs/pilot-load-runner.mjs --preflight --apply --confirm-client-scoped-replace --client first-capital --version v4

Flags:
  --client <all|client[,client]>  Client scope. Known clients: ${KNOWN_CLIENTS.join(', ')}
  --version <v4>                  Dataset version. Default v4.
  --prepare                       Generate/finalize local load packs.
  --preflight                     Run actual loader in dry-run mode.
  --package                       Create a zip bundle in Downloads.
  --apply                         Mutating DB replace/load through the loader.
  --confirm-client-scoped-replace Required with --apply.
  --allow-all-clients             Required to apply against --client all.
`;
}

function clientsFor(raw) {
  if (!raw || raw === 'all') return KNOWN_CLIENTS;
  const clients = raw.split(',').map((item) => item.trim()).filter(Boolean);
  const unknown = clients.filter((client) => !KNOWN_CLIENTS.includes(client));
  if (unknown.length) throw new Error(`Unknown client(s): ${unknown.join(', ')}`);
  return clients;
}

function run(command, args, options = {}) {
  const display = [command, ...args].join(' ');
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    env: { ...process.env, ...(options.env || {}) },
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
  if (result.status !== 0) {
    const detail = result.stderr || result.stdout || '';
    throw new Error(`Command failed (${result.status}): ${display}\n${detail}`);
  }
  return result.stdout || '';
}

function extractResultJson(text) {
  const match = text.match(/RESULT_JSON\s+(\{[\s\S]*\})/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function writeJson(file, value) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function datasetDirs(version, selectedClients) {
  const map = {
    'skyharbor-air': `datasets/skyharbor-air-synthetic-${version}`,
    'first-capital': `datasets/first-capital-financial-synthetic-${version}`,
    'meridian-health': `datasets/meridian-health-synthetic-${version}`,
    lakeshore: `datasets/lakeshore-industries-synthetic-${version}`,
    'apex-retail': `datasets/apex-retail-synthetic-${version}`,
  };
  return selectedClients.map((client) => map[client]);
}

function packagePacks(version, selectedClients, runDir) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const zip = `/Users/anand/Downloads/abarva-${version}-pilot-load-${selectedClients.join('-')}-${stamp}.zip`;
  const args = ['-qr', zip, ...datasetDirs(version, selectedClients), path.relative(REPO_ROOT, runDir)];
  run('zip', args);
  return { path: zip, sha256: sha256(zip), bytes: fs.statSync(zip).size };
}

function loadMatrixIfPresent(version) {
  const matrix = path.join(OUTPUT_ROOT, `${version}-pack-readiness`, 'CLIENT_PACK_READINESS_MATRIX.md');
  return fs.existsSync(matrix) ? matrix : null;
}

function markMatrixPreflightPassed(matrixFile, preflightFile) {
  if (!matrixFile || !fs.existsSync(matrixFile)) return;
  let text = fs.readFileSync(matrixFile, 'utf8');
  text = text.replace(
    /The next gate is loader dry-run preflight\. Azure truncate\/load should happen only\n(?:.*\n)?after this matrix and the dry-run output are reviewed\./,
    `Loader dry-run preflight has passed against the actual refresh worker. Azure truncate/load should happen only after this matrix and the dry-run output are reviewed.\n\nDry-run evidence: \`${path.relative(REPO_ROOT, preflightFile)}\``,
  );
  text = text.replaceAll('READY FOR DRY-RUN', 'DRY-RUN PASSED');
  text = text.replace(
    '- Local parse/preflight passed: pending dry-run',
    `- Local parse/preflight passed: yes (\`${path.relative(REPO_ROOT, preflightFile)}\`)`,
  );
  fs.writeFileSync(matrixFile, text, 'utf8');
}

function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    console.log(usage());
    return;
  }
  if (args.version !== 'v4') {
    throw new Error('Only v4 is supported by the standardized pilot runner today.');
  }
  const selectedClients = clientsFor(args.client);
  if (args.apply && !args.confirmClientScopedReplace) {
    throw new Error('--apply requires --confirm-client-scoped-replace');
  }
  if (args.apply && args.client === 'all' && !args.allowAllClients) {
    throw new Error('--apply with --client all requires --allow-all-clients');
  }
  if (args.apply && !process.env.DATABASE_URL && !process.env.ABARVA_AZURE_DATABASE_URL) {
    throw new Error('--apply requires DATABASE_URL or ABARVA_AZURE_DATABASE_URL');
  }

  const runId = `pilot-load-${args.version}-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}`;
  const runDir = path.join(OUTPUT_ROOT, runId);
  ensureDir(runDir);
  const receipt = {
    ok: false,
    run_id: runId,
    version: args.version,
    clients: selectedClients,
    states: {
      local_artifact_generated: false,
      local_parse_preflight_passed: false,
      packaged_for_review: false,
      azure_blob_staged: false,
      queue_worker_handoff: false,
      parser_extracted_with_citations: false,
      review_queue_populated: false,
      db_committed: false,
      embeddings_search_refreshed: false,
      live_signed_in_retrieval_proven: false,
    },
    artifacts: {},
  };

  if (args.prepare) {
    run('python3', ['scripts/context-packs/finalize-client-v4-load-packs.py']);
    receipt.states.local_artifact_generated = true;
    receipt.artifacts.readiness_matrix = loadMatrixIfPresent(args.version);
  }

  if (args.preflight || args.apply) {
    const stdout = run('node', ['scripts/jobs/load-meridian-lakeshore-v2.cjs', '--client', args.client], {
      capture: true,
      env: {
        CONTEXT_DATASET_VERSION: args.version,
        CONTEXT_REFRESH_RUN_ID: `${runId}-dry-run`,
      },
    });
    const preflightFile = path.join(runDir, 'loader-dry-run-result.txt');
    fs.writeFileSync(preflightFile, stdout, 'utf8');
    const parsed = extractResultJson(stdout);
    if (!parsed?.ok) throw new Error(`Dry-run failed or did not emit ok RESULT_JSON: ${preflightFile}`);
    receipt.states.local_parse_preflight_passed = true;
    receipt.artifacts.preflight = preflightFile;
    receipt.preflight = parsed;
    markMatrixPreflightPassed(receipt.artifacts.readiness_matrix || loadMatrixIfPresent(args.version), preflightFile);
  }

  if (args.apply) {
    const stdout = run('node', ['scripts/jobs/load-meridian-lakeshore-v2.cjs', '--client', args.client, '--apply'], {
      capture: true,
      env: {
        CONTEXT_DATASET_VERSION: args.version,
        CONTEXT_REFRESH_RUN_ID: `${runId}-apply`,
      },
    });
    const applyFile = path.join(runDir, 'loader-apply-result.txt');
    fs.writeFileSync(applyFile, stdout, 'utf8');
    const parsed = extractResultJson(stdout);
    if (!parsed?.ok) throw new Error(`Apply failed or did not emit ok RESULT_JSON: ${applyFile}`);
    receipt.states.db_committed = true;
    receipt.artifacts.apply = applyFile;
    receipt.apply = parsed;
  }

  if (args.package) {
    receipt.artifacts.package = packagePacks(args.version, selectedClients, runDir);
    receipt.states.packaged_for_review = true;
  }

  receipt.ok = true;
  writeJson(path.join(runDir, 'receipt.json'), receipt);
  console.log('RESULT_JSON ' + JSON.stringify(receipt, null, 2));
}

try {
  main();
} catch (error) {
  console.error('RESULT_JSON ' + JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
  }, null, 2));
  process.exit(1);
}
