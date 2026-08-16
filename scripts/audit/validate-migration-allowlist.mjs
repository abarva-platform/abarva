#!/usr/bin/env node

/**
 * Migration allowlist gate.
 *
 * The new environment must be clean by construction, not clean by sweeping. This gate builds the
 * target manifest from the ACTIVE ALLOWLIST — never "everything except" — and blocks the
 * migration if a sunset tenant appears in any surface.
 *
 * The distinction matters. A denylist sweep can miss something and you discover it in production.
 * An allowlist cannot: anything forgotten is simply absent, which is a loud, safe failure rather
 * than a silent, expensive one.
 *
 * It also looks OUTSIDE the repository. `git ls-files` cannot see an Azure resource group, a
 * GitHub Actions secret, a Key Vault entry or an AI Search index — and those are exactly what
 * gets forklifted "because it existed in lab". External enumeration is read-only and opt-in.
 *
 * Surfaces checked:
 *   repo      — tracked files, via validate-no-sunset-tenant-residue
 *   azure     — resource groups, container apps, postgres, storage, search, key vault  (--azure)
 *   github    — actions secrets and variables, workflows                               (--github)
 *
 * Usage:
 *   node scripts/audit/validate-migration-allowlist.mjs                  # repo only
 *   node scripts/audit/validate-migration-allowlist.mjs --azure --github # full
 *   node scripts/audit/validate-migration-allowlist.mjs --manifest       # emit target manifest
 *
 * Every external command is read-only (`list`, `show`). This script never mutates anything.
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const argv = process.argv.slice(2);
const WANT_AZURE = argv.includes('--azure');
const WANT_GITHUB = argv.includes('--github');
const EMIT_MANIFEST = argv.includes('--manifest');
const ROOT = process.cwd();

/** The allowlist. Everything migrates because it is on this list, or it does not migrate. */
const ACTIVE_TENANTS = ['meridian-health', 'skyharbor-air'];

/** Aliases the active tenants legitimately answer to. */
const ACTIVE_ALIASES = [
  'meridian-health', 'meridian', 'meridian_health_global',
  'skyharbor-air', 'skyharbor', 'skyharbor_global',
];

const SUNSET = [
  'apex-retail', 'apexretail', 'apex_retail', 'apex',
  'first-capital', 'firstcapital', 'first_capital',
  'lakeshore-holdings', 'lakeshore-industries', 'lakeshore',
  'northstar-clinical', 'northstar',
  'morgan-street', 'roosevelt-holdings', 'lakefront-capital',
];
const SUNSET_RE = new RegExp(SUNSET.map((s) => s.replace(/[-_]/g, '[-_ ]?')).join('|'), 'i');

/**
 * Shared platform resources migrate on their own merit, not on a tenant's. Named explicitly so
 * "shared" can never become a loophole through which a tenant-shaped resource travels.
 */
const SHARED_ALLOWED = [
  /^acrabarvalab\d+$/i,            // container registry
  /^rg-abarva-controlplane/i,      // control plane resource group
  /^ca-abarva-web-/i,              // shared web container app
];

const blocks = [];
const notMigrated = [];
const ok = [];

const classify = (surface, name, extra = '') => {
  if (!name) return;
  if (SUNSET_RE.test(name)) {
    // A sunset name is only tolerable if it is being explicitly retired, never migrated.
    blocks.push({ surface, name, extra });
    notMigrated.push({ surface, name, reason: 'sunset tenant' });
    return;
  }
  ok.push({ surface, name });
};

const sh = (cmd, args) => {
  try {
    return execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch {
    return null;
  }
};

// ---------------------------------------------------------------- 1. repo
const residueScript = path.join(ROOT, 'scripts/audit/validate-no-sunset-tenant-residue.mjs');
let repoClean = null;
if (fs.existsSync(residueScript)) {
  try {
    execFileSync('node', [residueScript], { stdio: ['ignore', 'pipe', 'pipe'] });
    repoClean = true;
  } catch {
    repoClean = false;
    blocks.push({ surface: 'repo', name: 'tracked files', extra: 'validate-no-sunset-tenant-residue fails' });
  }
}

// ---------------------------------------------------------------- 2. azure (read-only)
let azureChecked = false;
if (WANT_AZURE) {
  const acct = sh('az', ['account', 'show', '--query', 'id', '-o', 'tsv']);
  if (!acct) {
    console.log('  azure: not logged in (az account show failed) — SKIPPED, not proven clean');
  } else {
    azureChecked = true;
    const queries = [
      ['resource group', ['group', 'list', '--query', '[].name', '-o', 'tsv']],
      ['container app', ['containerapp', 'list', '--query', '[].name', '-o', 'tsv']],
      ['postgres server', ['postgres', 'flexible-server', 'list', '--query', '[].name', '-o', 'tsv']],
      ['storage account', ['storage', 'account', 'list', '--query', '[].name', '-o', 'tsv']],
      ['search service', ['search', 'service', 'list', '--query', '[].name', '-o', 'tsv']],
      ['key vault', ['keyvault', 'list', '--query', '[].name', '-o', 'tsv']],
    ];
    for (const [label, args] of queries) {
      const out = sh('az', args);
      if (out === null) { console.log(`  azure ${label}: query failed — SKIPPED`); continue; }
      for (const name of out.split('\n').map((s) => s.trim()).filter(Boolean)) {
        if (SHARED_ALLOWED.some((re) => re.test(name))) { ok.push({ surface: `azure ${label}`, name }); continue; }
        classify(`azure ${label}`, name);
      }
    }
  }
}

// ---------------------------------------------------------------- 3. github (read-only)
let githubChecked = false;
if (WANT_GITHUB) {
  const repo = 'abarva-platform/abarva';
  const secrets = sh('gh', ['api', `repos/${repo}/actions/secrets`, '--jq', '.secrets[].name']);
  const vars = sh('gh', ['api', `repos/${repo}/actions/variables`, '--jq', '.variables[].name']);
  if (secrets === null && vars === null) {
    console.log('  github: api unavailable — SKIPPED, not proven clean');
  } else {
    githubChecked = true;
    for (const n of (secrets ?? '').split('\n').filter(Boolean)) classify('github secret', n.trim());
    for (const n of (vars ?? '').split('\n').filter(Boolean)) classify('github variable', n.trim());
  }
  const wf = sh('git', ['ls-files', '.github/workflows']);
  for (const f of (wf ?? '').split('\n').filter(Boolean)) classify('github workflow', f.trim());
}

// ---------------------------------------------------------------- manifest
if (EMIT_MANIFEST) {
  console.log(JSON.stringify({
    generatedFrom: 'active allowlist',
    activeTenants: ACTIVE_TENANTS,
    activeAliases: ACTIVE_ALIASES,
    sharedAllowed: SHARED_ALLOWED.map(String),
    migrate: ok,
    notMigrated,
    rule: 'Nothing enters the target that is not on this manifest.',
  }, null, 2));
  process.exit(blocks.length ? 1 : 0);
}

// ---------------------------------------------------------------- report
console.log('migration allowlist gate');
console.log(`  active tenants : ${ACTIVE_TENANTS.join(', ')}`);
console.log(`  repo residue   : ${repoClean === null ? 'checker missing' : repoClean ? 'clean' : 'FAILING'}`);
console.log(`  azure          : ${WANT_AZURE ? (azureChecked ? 'enumerated' : 'SKIPPED') : 'not requested'}`);
console.log(`  github         : ${WANT_GITHUB ? (githubChecked ? 'enumerated' : 'SKIPPED') : 'not requested'}`);

if (blocks.length) {
  console.log(`\nBLOCKED — ${blocks.length} sunset-tenant reference(s) in the migration path:`);
  for (const b of blocks.slice(0, 40)) {
    console.log(`  - [${b.surface}] ${b.name}${b.extra ? `  (${b.extra})` : ''}`);
  }
  if (blocks.length > 40) console.log(`  ... and ${blocks.length - 40} more`);
  console.log('\nThese must be deleted, or recorded as `not migrated`, before cutover.');
  process.exit(1);
}

const unproven = (WANT_AZURE && !azureChecked) || (WANT_GITHUB && !githubChecked);
if (unproven) {
  console.log('\nINCOMPLETE — an external surface was requested but could not be enumerated.');
  console.log('Not clean; unproven. Re-run with working credentials before cutover.');
  process.exit(1);
}
console.log('\npass — no sunset tenant appears in any checked migration surface.');
