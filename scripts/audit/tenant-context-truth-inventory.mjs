#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = process.cwd();
const DEFAULT_TENANTS = ['meridian-health', 'skyharbor-air'];
const SEARCH_ROOTS = [
  'datasets/tenant-inputs',
  'reports',
  'docs',
  'src',
  'scripts',
  'tower-standardized-v1',
];
const TEXT_EXTENSIONS = new Set([
  '.csv',
  '.json',
  '.jsonl',
  '.md',
  '.mdx',
  '.txt',
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.yml',
  '.yaml',
  '.html',
]);
const MAX_TEXT_SCAN_BYTES = 1024 * 1024;

function parseArgs(argv) {
  const args = {
    tenants: [],
    out: '',
    includeContentMatches: true,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--tenant') {
      args.tenants.push(argv[index + 1]);
      index += 1;
    } else if (value === '--out') {
      args.out = argv[index + 1];
      index += 1;
    } else if (value === '--path-only') {
      args.includeContentMatches = false;
    } else if (value === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  if (args.tenants.length === 0) args.tenants = DEFAULT_TENANTS;
  args.tenants = [...new Set(args.tenants.filter(Boolean))];
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  if (!args.out) args.out = path.join('reports', 'tenant-context-truth-redo', stamp);
  return args;
}

function printHelp() {
  console.log(`Usage:
  node scripts/audit/tenant-context-truth-inventory.mjs [--tenant <tenant-key>] [--out <path>] [--path-only]

Examples:
  node scripts/audit/tenant-context-truth-inventory.mjs
  node scripts/audit/tenant-context-truth-inventory.mjs --tenant meridian-health --tenant skyharbor-air
`);
}

function readRegistry() {
  const registryPath = path.join(ROOT, 'datasets/tenant-inputs/tenant-input-registry.json');
  if (!fs.existsSync(registryPath)) return { activeByTenant: new Map(), registryPath: '' };
  const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
  const activeByTenant = new Map();
  for (const tenant of registry.activeTenants || []) {
    activeByTenant.set(tenant.tenantKey, tenant.canonicalInputRoot);
  }
  return { activeByTenant, registryPath: 'datasets/tenant-inputs/tenant-input-registry.json' };
}

function aliasesForTenant(tenantKey) {
  const compact = tenantKey.replace(/-/g, '');
  const firstToken = tenantKey.split('-')[0];
  const display = tenantKey
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  return [...new Set([tenantKey, compact, firstToken, display])].filter(Boolean);
}

function walk(relativeRoot) {
  const absoluteRoot = path.join(ROOT, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];
  const stack = [relativeRoot];
  const files = [];

  while (stack.length > 0) {
    const current = stack.pop();
    const absolute = path.join(ROOT, current);
    const stat = fs.statSync(absolute);
    if (stat.isFile()) {
      files.push(current.replaceAll(path.sep, '/'));
      continue;
    }
    if (!stat.isDirectory()) continue;

    for (const child of fs.readdirSync(absolute)) {
      if (shouldSkipName(child)) continue;
      stack.push(path.join(current, child));
    }
  }

  return files;
}

function shouldSkipName(name) {
  return name === '.git'
    || name === '.next'
    || name === 'node_modules'
    || name === 'dist'
    || name === 'coverage'
    || name === 'test-results';
}

function canScanText(relativePath, stat) {
  if (stat.size > MAX_TEXT_SCAN_BYTES) return false;
  return TEXT_EXTENSIONS.has(path.extname(relativePath).toLowerCase());
}

function fileHash(relativePath) {
  const body = fs.readFileSync(path.join(ROOT, relativePath));
  return crypto.createHash('sha256').update(body).digest('hex');
}

function pathOrContentMatches(relativePath, tenantKey, aliases, includeContentMatches, stat) {
  const lowerPath = relativePath.toLowerCase();
  const pathMatches = aliases.some((alias) => lowerPath.includes(alias.toLowerCase()));
  if (pathMatches) return { matched: true, matchType: 'path' };
  if (!includeContentMatches || !canScanText(relativePath, stat)) return { matched: false, matchType: '' };

  const text = fs.readFileSync(path.join(ROOT, relativePath), 'utf8').toLowerCase();
  const contentMatches = aliases.some((alias) => text.includes(alias.toLowerCase()));
  return contentMatches ? { matched: true, matchType: 'content' } : { matched: false, matchType: '' };
}

function classify(relativePath, tenantKey, activeRoot) {
  const p = relativePath.replaceAll(path.sep, '/');
  const lower = p.toLowerCase();
  const fileName = path.basename(p);

  let artifactFamily = 'unclassified';
  let layer = 'unknown';
  let eligibility = 'review-required';
  let recommendedAction = 'review-and-classify';
  let reason = 'Matched tenant alias but no specific family rule applied.';

  const isActiveRoot = activeRoot && (p === activeRoot || p.startsWith(`${activeRoot}/`));
  const isSa = /^SA\d+_/i.test(fileName) || lower.includes('/source-adapters/') || lower.includes('layer2') || lower.includes('layer_2');
  const isCanonicalDimension = /^\d{2}_.+\.(csv|json|xlsx)$/i.test(fileName);

  if (isActiveRoot && isSa) {
    artifactFamily = 'active-source-adapter-output';
    layer = 'L2-source-adapter';
    eligibility = 'generated-output';
    recommendedAction = 'regenerate-from-approved-intake-before-new-package-activation';
    reason = 'File is under the registry-declared active root but appears to be source-adapter shaped.';
  } else if (isActiveRoot && isCanonicalDimension) {
    artifactFamily = 'active-canonical-dimension-candidate';
    layer = 'L3-canonical-candidate';
    eligibility = 'current-active-candidate';
    recommendedAction = 'reconcile-and-regenerate-into-new-governed-package';
    reason = 'File is under the registry-declared active root and appears to be one of the canonical dimensions.';
  } else if (isActiveRoot) {
    artifactFamily = 'active-root-other';
    layer = 'review';
    eligibility = 'current-active-candidate';
    recommendedAction = 'inspect-before-carry-forward';
    reason = 'File is under the registry-declared active root but does not match a known dimension or adapter pattern.';
  } else if (lower.includes('/interviews/')) {
    artifactFamily = 'interview-discovery-channel';
    layer = 'L1-client-intake-discovery';
    eligibility = 'source-evidence-or-signal';
    recommendedAction = 'migrate-into-first-class-interview-workstream';
    reason = 'Interview evidence must be governed separately from canonical dimensions.';
  } else if (lower.includes('/approved-content/')) {
    artifactFamily = 'approved-content-derived';
    layer = 'derived-narrative';
    eligibility = 'derived-output';
    recommendedAction = 'rebuild-after-canonical-validation';
    reason = 'Approved content is derived from context and should not become source truth.';
  } else if (lower.includes('/derived/')) {
    artifactFamily = 'derived-context-artifact';
    layer = 'derived';
    eligibility = 'derived-output';
    recommendedAction = 'regenerate-after-source-reconciliation';
    reason = 'Derived artifacts are disposable and should trace back to canonical objects.';
  } else if (lower.includes('/standard-')) {
    artifactFamily = 'legacy-standard-pack';
    layer = isSa ? 'L2-source-adapter-template-or-output' : 'L3-canonical-candidate';
    eligibility = 'adjacent-non-active';
    recommendedAction = 'compare-to-active-then-retire-or-use-as-source-evidence';
    reason = 'Standard pack is outside the registry-declared active root.';
  } else if (lower.includes('/generated/')) {
    artifactFamily = 'generated-tenant-pack';
    layer = 'generated';
    eligibility = 'generated-output';
    recommendedAction = 'treat-as-rebuild-input-only-if-lineage-is-proven';
    reason = 'Generated packs cannot become truth by path convention.';
  } else if (lower.includes('/candidates/')) {
    artifactFamily = 'candidate-pack';
    layer = 'candidate';
    eligibility = 'not-active';
    recommendedAction = 'keep-out-of-runtime-unless-promoted-by-registry';
    reason = 'Candidate packs are not active truth without registry promotion.';
  } else if (lower.includes('/source_system_extracts/') || lower.includes('/layer_1') || lower.includes('/layer1')) {
    artifactFamily = 'offline-proof-layer1';
    layer = 'L1-client-intake-proof';
    eligibility = 'offline-proof';
    recommendedAction = 'use-as-evidence-only-after-manifest-and-attestation-review';
    reason = 'Layer 1 proof packages are useful evidence but not active truth.';
  } else if (lower.includes('/layer2') || lower.includes('/layer_2')) {
    artifactFamily = 'offline-proof-layer2';
    layer = 'L2-source-adapter-proof';
    eligibility = 'offline-proof';
    recommendedAction = 'regenerate-from-approved-intake';
    reason = 'Layer 2 proof output is disposable and re-runnable.';
  } else if (lower.includes('/layer3') || lower.includes('/layer_3') || lower.includes('/canonical')) {
    artifactFamily = 'offline-proof-layer3';
    layer = 'L3-canonical-proof';
    eligibility = 'offline-proof';
    recommendedAction = 'compare-with-new-canonical-build';
    reason = 'Canonical proof artifacts need reconciliation before reuse.';
  } else if (lower.includes('/layer4') || lower.includes('/layer_4') || lower.includes('/cube') || lower.includes('/projection')) {
    artifactFamily = 'offline-proof-layer4';
    layer = 'L4-product-projection-proof';
    eligibility = 'product-projection';
    recommendedAction = 'rebuild-from-new-canonical-package';
    reason = 'Layer 4 projections are not source truth.';
  } else if (lower.startsWith('reports/')) {
    artifactFamily = 'report-artifact';
    layer = 'report';
    eligibility = 'audit-evidence-not-truth';
    recommendedAction = 'retain-as-audit-evidence-or-retire-by-manifest';
    reason = 'Reports are evidence about prior runs, not active tenant context.';
  } else if (lower.startsWith('src/')) {
    artifactFamily = lower.includes('fixture') ? 'runtime-fixture' : 'runtime-reference';
    layer = 'L4-product-runtime';
    eligibility = 'runtime-risk';
    recommendedAction = 'ensure-runtime-reads-canonical-projections-only';
    reason = 'Runtime references need review so product code does not own data.';
  } else if (lower.startsWith('scripts/')) {
    artifactFamily = 'script-or-loader';
    layer = 'tooling';
    eligibility = 'execution-path-risk';
    recommendedAction = 'confirm-script-respects-registry-and-layer-boundaries';
    reason = 'Scripts may create or consume tenant context and need governance review.';
  } else if (lower.startsWith('docs/')) {
    artifactFamily = 'documentation';
    layer = 'documentation';
    eligibility = 'narrative-not-truth';
    recommendedAction = 'keep-if-current-or-retire-by-manifest';
    reason = 'Documentation may contain old claims and should not be treated as source truth.';
  }

  return { artifactFamily, layer, eligibility, recommendedAction, reason };
}

function csvEscape(value) {
  const text = value == null ? '' : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function writeCsv(filePath, rows) {
  const headers = [
    'tenantKey',
    'path',
    'matchType',
    'artifactFamily',
    'layer',
    'eligibility',
    'recommendedAction',
    'reason',
    'sizeBytes',
    'sha256',
  ];
  const body = [
    headers.join(','),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${body}\n`);
}

function summarize(rows, tenants, activeByTenant) {
  const summary = {
    generatedAt: new Date().toISOString(),
    tenants,
    activeRoots: Object.fromEntries(tenants.map((tenant) => [tenant, activeByTenant.get(tenant) || null])),
    totalFiles: rows.length,
    byTenant: {},
    byFamily: {},
    byLayer: {},
    byEligibility: {},
    topRecommendedActions: {},
  };

  for (const row of rows) {
    increment(summary.byTenant, row.tenantKey);
    increment(summary.byFamily, row.artifactFamily);
    increment(summary.byLayer, row.layer);
    increment(summary.byEligibility, row.eligibility);
    increment(summary.topRecommendedActions, row.recommendedAction);
  }

  return summary;
}

function increment(bucket, key) {
  bucket[key] = (bucket[key] || 0) + 1;
}

function markdownReport(summary) {
  const lines = [
    '# Tenant Context Truth Inventory',
    '',
    `Generated: ${summary.generatedAt}`,
    `Total matched files: ${summary.totalFiles}`,
    '',
    '## Active Roots',
    '',
    '| Tenant key | Registry active root |',
    '| --- | --- |',
    ...Object.entries(summary.activeRoots).map(([tenant, activeRoot]) => `| ${tenant} | ${activeRoot || 'not found'} |`),
    '',
    '## By Tenant',
    '',
    tableFromCounts(summary.byTenant, 'Tenant key'),
    '',
    '## By Artifact Family',
    '',
    tableFromCounts(summary.byFamily, 'Artifact family'),
    '',
    '## By Layer',
    '',
    tableFromCounts(summary.byLayer, 'Layer'),
    '',
    '## By Eligibility',
    '',
    tableFromCounts(summary.byEligibility, 'Eligibility'),
    '',
    '## Next Action',
    '',
    'Review `truth-inventory.csv`, confirm the active package strategy, then produce the retirement manifest before any move, delete, registry activation, or runtime rewiring.',
    '',
  ];
  return `${lines.join('\n')}\n`;
}

function tableFromCounts(counts, label) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return [
    `| ${label} | Count |`,
    '| --- | ---: |',
    ...entries.map(([key, count]) => `| ${key} | ${count} |`),
  ].join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const { activeByTenant, registryPath } = readRegistry();
  const allFiles = SEARCH_ROOTS.flatMap(walk);
  const rows = [];

  for (const relativePath of allFiles) {
    const stat = fs.statSync(path.join(ROOT, relativePath));
    if (!stat.isFile()) continue;

    for (const tenantKey of args.tenants) {
      const aliases = aliasesForTenant(tenantKey);
      const match = pathOrContentMatches(relativePath, tenantKey, aliases, args.includeContentMatches, stat);
      if (!match.matched) continue;

      const classification = classify(relativePath, tenantKey, activeByTenant.get(tenantKey));
      rows.push({
        tenantKey,
        path: relativePath,
        matchType: match.matchType,
        ...classification,
        sizeBytes: stat.size,
        sha256: fileHash(relativePath),
      });
    }
  }

  rows.sort((a, b) => a.tenantKey.localeCompare(b.tenantKey) || a.path.localeCompare(b.path));
  const outDir = path.resolve(ROOT, args.out);
  fs.mkdirSync(outDir, { recursive: true });

  const summary = summarize(rows, args.tenants, activeByTenant);
  summary.registryPath = registryPath;
  summary.searchRoots = SEARCH_ROOTS;
  summary.includeContentMatches = args.includeContentMatches;

  fs.writeFileSync(path.join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  fs.writeFileSync(path.join(outDir, 'summary.md'), markdownReport(summary));
  writeCsv(path.join(outDir, 'truth-inventory.csv'), rows);

  console.log(`tenant-context-truth-inventory: wrote ${rows.length} row(s) to ${path.relative(ROOT, outDir)}`);
}

main();
