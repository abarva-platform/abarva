#!/usr/bin/env node
/**
 * Control-plane tenant-purity scanner.
 *
 * Principle: tenant-specific names (Apex Retail, Meridian Health, First
 * Capital, Heliara, Arcturus, Northstar Clinical) belong in the DATA PLANE
 * — `datasets/`, Supabase rows, corpus
 * chunks — not in the APP CONTROL PLANE (`src/lib/`, `src/app/`,
 * `src/components/`). Hardcoded tenant strings in control-plane code are
 * cross-tenant-leak landmines: the STRESS-P0-001..008 chain was each one
 * of these landmines exploding for a specific signed-in user.
 *
 * This scanner counts and reports control-plane tenant references.
 *
 * Usage:
 *   node scripts/audit/control-plane-tenant-purity.mjs                       # report
 *   node scripts/audit/control-plane-tenant-purity.mjs --baseline             # write baseline
 *   node scripts/audit/control-plane-tenant-purity.mjs --check                # fail if count > baseline
 *   node scripts/audit/control-plane-tenant-purity.mjs --json                 # machine-readable
 *
 * Allowlist:
 *   - src/lib/client-config.ts                 — CANONICAL TENANT REGISTRY (must
 *                                                 contain tenant names here)
 *   - src/lib/active-client.ts                 — slug-to-key resolver (legitimate)
 *   - src/data/{apex,meridian,arcturus,northstar}/  — explicitly tenant-tagged
 *                                                 data-plane subtrees
 *   - tests, specs, mocks                      — verification code, not runtime
 *   - **\/__tests__\/**, **.test.ts, **.spec.ts
 *
 * The baseline file at scripts/audit/control-plane-tenant-purity.baseline.json
 * captures the current debt count per tenant. In --check mode, the scanner
 * fails if any tenant's count *exceeds* the baseline — i.e. existing debt is
 * tolerated, but new hardcoded references are blocked.
 *
 * Reducing the baseline = paying down architectural debt.
 *
 * Authored 2026-05-26 after STRESS-P0-008 (Northstar tenant resolver bug),
 * STRESS-P0-007 (/intelligence/solutions Apex hardcode), STRESS-P0-001 (Apex
 * leakage to Meridian) — three of the same family, each a control-plane
 * leak from data-plane content baked into shipped code.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BASELINE_PATH = path.join(REPO_ROOT, 'scripts/audit/control-plane-tenant-purity.baseline.json');

const TENANT_TERMS = [
  'Apex Retail',
  'Meridian Health',
  'Meridian Hospital',
  'First Capital',
  'Heliara',
  'Arcturus Financial',
  'Northstar Clinical',
];

// Files explicitly allowed to contain tenant names because they ARE the
// canonical registry / resolver. Any other file in control-plane scope
// that wants tenant names should justify it in a comment and add itself
// here with a justification.
const FILE_ALLOWLIST = new Set([
  'src/lib/client-config.ts',           // canonical tenant registry
  'src/lib/active-client.ts',           // slug-to-key resolver
  'src/lib/auth/cxo-personas.ts',       // demo persona registry (tenant-scoped by design)
  'src/lib/auth/agent-client-logins.ts', // non-human proof/crawl agent registry (tenant-scoped by design)
  'src/lib/demo/demo-dataset-registry.ts', // demo-fixture registry (tenant-tagged)
  'src/lib/intelligence/ask/tenant-safety-policy.ts', // runtime deny-list policy; tenant names are safety gates, not answer content
  'src/lib/admin/release-ledger.ts',     // internal audit sanitizer replaces tenant names before display
  'src/lib/knowledge/synthetic-datasets.ts', // tenant-tagged corpus fixture data
  'src/app/(maestro)/platform/admin/approvals/page.tsx', // internal cross-tenant admin queue
  'src/app/(maestro)/platform/admin/data-governance/page.tsx', // internal cross-tenant governance inventory
]);

// Path-prefix allowlist: anything under these prefixes is data-plane or
// verification code, not control-plane runtime.
const PATH_ALLOWLIST_PREFIXES = [
  'src/data/',                          // tenant-tagged data-plane subtree
  'src/lib/demo-data/',                 // tenant-tagged demo fixture data
  'src/lib/knowledge-corpus/fixtures/', // tenant-tagged corpus fixture data
  'src/__tests__/',                     // tests
  'src/__mocks__/',                     // mocks
  'src/exports-shared/__mocks__/',      // shared mocks
];

// Filename suffix allowlist (tests, specs, fixtures-suffixed files).
const FILENAME_ALLOWLIST_SUFFIXES = [
  '.test.ts',
  '.test.tsx',
  '.spec.ts',
  '.spec.tsx',
];

const SCAN_ROOTS = ['src/lib/', 'src/app/', 'src/components/'];

const args = process.argv.slice(2);
const isBaseline = args.includes('--baseline');
const isCheck = args.includes('--check');
const isJson = args.includes('--json');

function isAllowlistedFile(relPath) {
  if (FILE_ALLOWLIST.has(relPath)) return true;
  if (PATH_ALLOWLIST_PREFIXES.some((p) => relPath.startsWith(p))) return true;
  if (FILENAME_ALLOWLIST_SUFFIXES.some((s) => relPath.endsWith(s))) return true;
  if (relPath.includes('/__tests__/')) return true;
  if (relPath.includes('/__mocks__/')) return true;
  if (relPath.includes('/__fixtures__/')) return true; // test fixtures — verification data, never runtime
  return false;
}

function* walk(rootRel) {
  const root = path.join(REPO_ROOT, rootRel);
  if (!fs.existsSync(root)) return;
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist') continue;
        stack.push(abs);
      } else if (entry.isFile()) {
        if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(entry.name)) continue;
        const rel = path.relative(REPO_ROOT, abs);
        yield { abs, rel };
      }
    }
  }
}

function scan() {
  const perTermCount = Object.fromEntries(TENANT_TERMS.map((t) => [t, 0]));
  const fileHits = []; // { rel, term, count }
  for (const root of SCAN_ROOTS) {
    for (const { abs, rel } of walk(root)) {
      if (isAllowlistedFile(rel)) continue;
      const contents = fs.readFileSync(abs, 'utf8');
      for (const term of TENANT_TERMS) {
        // Build a regex matching the term as a token in code/text. Allow
        // common surrounding chars (whitespace, quotes, slashes, dots).
        const escaped = term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
        const re = new RegExp(escaped, 'g');
        const matches = contents.match(re);
        if (matches && matches.length > 0) {
          perTermCount[term] += matches.length;
          fileHits.push({ rel, term, count: matches.length });
        }
      }
    }
  }
  return { perTermCount, fileHits, total: Object.values(perTermCount).reduce((a, b) => a + b, 0) };
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeBaseline(snapshot) {
  fs.writeFileSync(
    BASELINE_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        notes:
          'Captured by scripts/audit/control-plane-tenant-purity.mjs --baseline. ' +
          'Existing hardcoded tenant strings in control-plane code (src/lib, src/app, ' +
          'src/components) excluding allowlisted files (client-config.ts, active-client.ts, ' +
          'cxo-personas.ts, demo-dataset-registry.ts, src/data/**, tests, mocks). ' +
          'A future run with --check FAILS if any tenant count exceeds this baseline. ' +
          'Reducing the baseline = paying down debt.',
        perTermCount: snapshot.perTermCount,
        total: snapshot.total,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(`Wrote baseline to ${path.relative(REPO_ROOT, BASELINE_PATH)} (total=${snapshot.total}).`);
}

function reportHuman(snapshot, baseline) {
  console.log('─────────────────────────────────────────────────────────────────');
  console.log('Control-plane tenant-purity scan');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`Scanned: ${SCAN_ROOTS.join(', ')}`);
  console.log(`Allowlist (canonical registry / data-plane): ${[...FILE_ALLOWLIST].join(', ')}, src/data/**, tests, mocks`);
  console.log('');
  console.log('Tenant references per term:');
  const sortedTerms = TENANT_TERMS.slice().sort((a, b) => snapshot.perTermCount[b] - snapshot.perTermCount[a]);
  for (const term of sortedTerms) {
    const c = snapshot.perTermCount[term];
    const b = baseline?.perTermCount?.[term] ?? null;
    const delta = b == null ? '' : c > b ? ` (↑${c - b} ABOVE BASELINE)` : c < b ? ` (↓${b - c} below baseline)` : ' (= baseline)';
    console.log(`  ${term.padEnd(28)} ${String(c).padStart(5)}${delta}`);
  }
  console.log('');
  console.log(`TOTAL: ${snapshot.total}${baseline ? ` (baseline ${baseline.total})` : ''}`);
}

function checkMode(snapshot, baseline) {
  if (!baseline) {
    console.error('No baseline found. Run with --baseline first.');
    process.exit(2);
  }
  const violations = [];
  for (const term of TENANT_TERMS) {
    const cur = snapshot.perTermCount[term] ?? 0;
    const base = baseline.perTermCount[term] ?? 0;
    if (cur > base) {
      violations.push({ term, current: cur, baseline: base, delta: cur - base });
    }
  }
  if (violations.length === 0) {
    console.log('✓ Control-plane tenant-purity check passed. No new hardcoded tenant strings landed in src/lib, src/app, or src/components.');
    process.exit(0);
  }
  console.error('✗ Control-plane tenant-purity check FAILED. New hardcoded tenant strings landed in control-plane code:');
  for (const v of violations) {
    console.error(`  ${v.term.padEnd(28)} current=${v.current} baseline=${v.baseline} delta=+${v.delta}`);
  }
  console.error('');
  console.error('Move tenant-specific content to:');
  console.error('  - datasets/<tenant>/   (the canonical data-plane subtree)');
  console.error('  - Supabase corpus chunks (loaded via the ingestion pipeline)');
  console.error('  - The canonical CLIENT_KEY_TO_DB_NAME map in src/lib/client-config.ts (registry only)');
  console.error('');
  console.error('Or, if the new reference is legitimate, justify it in a comment AND add the file to FILE_ALLOWLIST in this scanner.');
  process.exit(1);
}

const snapshot = scan();
const baseline = loadBaseline();

if (isJson) {
  console.log(JSON.stringify({ snapshot, baseline }, null, 2));
  process.exit(0);
}

if (isBaseline) {
  writeBaseline(snapshot);
  process.exit(0);
}

reportHuman(snapshot, baseline);

if (isCheck) {
  checkMode(snapshot, baseline);
}
