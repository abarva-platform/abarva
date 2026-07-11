#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const defaultTargets = [
  'docs/architecture/README.md',
  'docs/architecture/enterprise-data-layer.md',
  'docs/architecture/naming-conventions.md',
  'docs/architecture/tenant-packet-contract.md',
  'docs/architecture/canonical-ingestion-contract.md',
  'docs/architecture/source-adapter-framework.md',
  'docs/architecture/mapping-registry.md',
  'docs/architecture/schema-contract-registry.md',
  'docs/architecture/target-data-layer-writer.md',
  'docs/architecture/module-context-apis.md',
  'docs/architecture/outcome-ledger.md',
  'docs/architecture/module-memory.md',
  'docs/architecture/proof-harness.md',
  'reports/abarva-enterprise-data-architecture-summary.md',
  'reports/abarva-enterprise-data-architecture-latest.html',
  'reports/abarva-enterprise-data-implementation-design-summary.md',
  'reports/abarva-enterprise-data-implementation-design-latest.html',
  'reports/enterprise-data-implementation-status.md',
];

const legacyNamePattern = /\b[Vv](?:1|2|4|6|7)(?:_[A-Za-z0-9]+)?\b/g;
const allowedContextPattern =
  /legacyMigrationName|historical|compatibility|migration|adapter|appendix|current-to-target|current \/ legacy|evidence path|evidence paths|evidencereferences|sourceReportPaths|scripts\/v[0-9]|intelligence_v[0-9]|supabase\/migrations|datasets\/|docs\/standards\/V[0-9]|V6_GENERATED_MANIFEST|internalCompatibilityName/i;

function parseTargets() {
  const args = process.argv.slice(2);
  const explicitFiles = [];
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--file' && args[index + 1]) {
      explicitFiles.push(args[index + 1]);
      index += 1;
    } else if (arg === '--changed') {
      const changed = process.env.CHANGED_FILES?.split(/\r?\n/).filter(Boolean) ?? [];
      explicitFiles.push(...changed);
    }
  }
  return explicitFiles.length > 0 ? explicitFiles : defaultTargets;
}

const targets = [...new Set(parseTargets())]
  .map((target) => path.resolve(repoRoot, target))
  .filter((target) => fs.existsSync(target) && fs.statSync(target).isFile());

const violations = [];

for (const filePath of targets) {
  const relativePath = path.relative(repoRoot, filePath);
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    const matches = [...line.matchAll(legacyNamePattern)];
    if (matches.length === 0) return;
    if (allowedContextPattern.test(line)) return;
    for (const match of matches) {
      violations.push({
        file: relativePath,
        line: lineIndex + 1,
        term: match[0],
        text: line.trim().slice(0, 240),
      });
    }
  });
}

if (violations.length > 0) {
  console.error('Enterprise naming convention check failed.');
  console.error('Legacy version labels are allowed only as migration/compatibility/evidence-path identifiers.');
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} ${violation.term} :: ${violation.text}`);
  }
  process.exit(1);
}

console.log(`Enterprise naming convention check passed (${targets.length} files).`);
