#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const DEFAULT_SCAN_ROOTS = [
  'src/app/(maestro)/home',
  'src/components/home',
  'src/lib/home',
];

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.ts', '.tsx']);

const FINDING_RULES = [
  {
    id: 'derived_home_artifact_read',
    sourceLayer: 'pre_layer4_derived_artifact',
    severity: 'blocker_before_refresh',
    boundary: 'Home runtime reads an approved Home artifact from the repository filesystem.',
    remediation:
      'Build a Layer 4 projection manifest from Layer 3 and read that projection instead of repository artifacts.',
    pattern: /datasets\/tenant-inputs\/[^"'\s]+\/approved-content\/home|datasets\/context-artifacts\/approved/gi,
  },
  {
    id: 'layer1_active_intake_read',
    sourceLayer: 'layer1_client_intake',
    severity: 'blocker_before_refresh',
    boundary: 'Home runtime reads active client-intake CSVs from the repository filesystem.',
    remediation:
      'Move Home consumption behind a Layer 4 projection generated from canonical Layer 3 records.',
    pattern: /datasets\/tenant-inputs\/active|local-v3-active/gi,
  },
  {
    id: 'layer1_standard_intake_read',
    sourceLayer: 'layer1_client_intake',
    severity: 'blocker_before_refresh',
    boundary: 'Home runtime reads standard intake packet files from the repository filesystem.',
    remediation:
      'Treat the standard packet as intake only; adapter and canonical write paths must precede Home refresh.',
    pattern: /datasets\/tenant-inputs\/[^"'\s]+\/standard-\d{4}-\d{2}-v\d+|local-v3-standard/gi,
  },
  {
    id: 'static_json_fixture_snapshot',
    sourceLayer: 'static_product_fixture',
    severity: 'refresh_gap',
    boundary: 'Home runtime imports static JSON snapshots instead of a rebuildable Layer 4 projection.',
    remediation:
      'Replace static snapshots with a projection manifest that names canonical version, object counts, blocked claims, and gaps.',
    pattern: /\.\/ai-success-data\//gi,
  },
  {
    id: 'generated_home_asset_path',
    sourceLayer: 'generated_static_asset',
    severity: 'refresh_gap',
    boundary: 'Home references generated Home assets outside a canonical projection manifest.',
    remediation:
      'Attach generated assets to the Layer 4 projection manifest with source layer and version metadata.',
    pattern: /\/generated\/home\//gi,
  },
];

const FILESYSTEM_PATTERN = /from\s+["']node:fs["']|fs\.(?:readFileSync|existsSync|readdirSync|statSync)|\b(?:readFileSync|existsSync|readdirSync|statSync)\b/g;

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const [key, inlineValue] = arg.slice(2).split('=', 2);
    const value = inlineValue ?? argv[index + 1];
    args.set(key, value);
    if (inlineValue === undefined) index += 1;
  }
  return args;
}

function requireArg(args, name) {
  const value = args.get(name);
  if (!value) throw new Error(`Missing required --${name}`);
  return value;
}

function walkFiles(relativeRoot) {
  const absoluteRoot = path.join(ROOT, relativeRoot);
  if (!fs.existsSync(absoluteRoot)) return [];
  const files = [];
  const stack = [absoluteRoot];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const absolutePath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(absolutePath);
      } else if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
        files.push(path.relative(ROOT, absolutePath));
      }
    }
  }
  return files.sort();
}

function isRuntimeSourceFile(relativePath) {
  return !relativePath.includes('/__tests__/') && !relativePath.includes('.test.');
}

function redactSensitiveTokens(value) {
  let redacted = value;
  redacted = redacted.replace(
    /datasets\/tenant-inputs\/active\/[^/"'\s]+\/current/gi,
    '[layer1-active-intake-root]',
  );
  redacted = redacted.replace(
    /datasets\/tenant-inputs\/[^/"'\s]+\/standard-\d{4}-\d{2}-v\d+/gi,
    '[layer1-standard-intake-root]',
  );
  redacted = redacted.replace(
    /datasets\/tenant-inputs\/[^/"'\s]+\/approved-content\/home/gi,
    '[home-approved-artifact-root]',
  );
  redacted = redacted.replace(
    /datasets\/context-artifacts\/approved\/[^/"'\s]+\/home-knowledge/gi,
    '[legacy-home-artifact-root]',
  );
  redacted = redacted.replace(
    /\/generated\/home\/[^/"'\s]+/gi,
    '[generated-home-asset-root]',
  );
  redacted = redacted.replace(/read[A-Z][A-Za-z]+AiSuccessHome/g, 'readTenantAiSuccessHome');
  return redacted;
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

function snippetAt(source, index) {
  const start = source.lastIndexOf('\n', index) + 1;
  const endIndex = source.indexOf('\n', index);
  const end = endIndex === -1 ? source.length : endIndex;
  return redactSensitiveTokens(source.slice(start, end).trim()).slice(0, 180);
}

function scanFile(relativePath, source) {
  const findings = [];
  for (const rule of FINDING_RULES) {
    rule.pattern.lastIndex = 0;
    for (const match of source.matchAll(rule.pattern)) {
      findings.push({
        file: redactSensitiveTokens(relativePath),
        line: lineNumberAt(source, match.index ?? 0),
        findingId: rule.id,
        sourceLayer: rule.sourceLayer,
        severity: rule.severity,
        boundary: rule.boundary,
        evidence: snippetAt(source, match.index ?? 0),
        remediation: rule.remediation,
        runtimeRoutingChanged: false,
      });
    }
  }

  const hasFilesystemApi = FILESYSTEM_PATTERN.test(source);
  FILESYSTEM_PATTERN.lastIndex = 0;
  const hasRepositoryDataToken = findings.some((finding) =>
    ['layer1_client_intake', 'pre_layer4_derived_artifact'].includes(finding.sourceLayer),
  );
  if (hasFilesystemApi && hasRepositoryDataToken) {
    findings.push({
      file: redactSensitiveTokens(relativePath),
      line: 1,
      findingId: 'filesystem_api_for_repository_data',
      sourceLayer: 'repository_filesystem',
      severity: 'blocker_before_refresh',
      boundary: 'Home runtime uses filesystem APIs on repository-held intake or derived artifacts.',
      evidence: 'filesystem API present with Layer 1 or derived artifact path in same runtime file',
      remediation: 'Remove filesystem reads from mounted Home product runtime before claiming Layer 4 refresh.',
      runtimeRoutingChanged: false,
    });
  }

  return findings;
}

function summarizeBy(rows, key) {
  const counts = new Map();
  for (const row of rows) counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ [key]: value, count }))
    .sort((a, b) => b.count - a.count || String(a[key]).localeCompare(String(b[key])));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Home Layer 4 Boundary Report',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    '',
    'This is a sanitized, report-only Layer 4 boundary audit. It does not rewire Home, refresh product projections, activate registries, write the data plane, mutate tenant data, or make runtime truth claims.',
    '',
    '## Summary',
    '',
    `- Runtime source files scanned: ${report.summary.runtimeFilesScanned}`,
    `- Boundary findings: ${report.summary.boundaryFindings}`,
    `- Blockers before Layer 4 refresh: ${report.summary.blockersBeforeRefresh}`,
    `- Product runtime changed: ${report.summary.productRuntimeChanged}`,
    `- Layer 4 surfaces refreshed by this change: ${report.summary.layer4SurfacesRefreshedByThisChange} of ${report.summary.layer4SurfaceRefreshTarget}`,
    '',
    '## Finding Classes',
    '',
    '| Finding | Count |',
    '| --- | ---: |',
    ...report.findingBreakdown.map((row) => `| \`${row.findingId}\` | ${row.count} |`),
    '',
    '## Source Layers',
    '',
    '| Source layer | Count |',
    '| --- | ---: |',
    ...report.sourceLayerBreakdown.map((row) => `| \`${row.sourceLayer}\` | ${row.count} |`),
    '',
    '## Files',
    '',
    '| File | Findings |',
    '| --- | ---: |',
    ...report.fileBreakdown.map((row) => `| \`${row.file}\` | ${row.count} |`),
    '',
    '## Required Next Gates',
    '',
    ...report.requiredNextGates.map((gate) => `- ${gate}`),
    '',
    '## Gates Left Closed',
    '',
    ...report.gatesLeftClosed.map((gate) => `- ${gate}`),
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'));
}

function buildReport({ sourceSha, scanRoots = DEFAULT_SCAN_ROOTS }) {
  const files = scanRoots.flatMap(walkFiles).filter(isRuntimeSourceFile);
  const findings = files.flatMap((file) => scanFile(file, fs.readFileSync(path.join(ROOT, file), 'utf8')));
  const blockersBeforeRefresh = findings.filter((finding) => finding.severity === 'blocker_before_refresh').length;

  return {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-home-layer4-boundary-report.mjs',
    sourceSha,
    mode: 'report_only_no_runtime_routing_change_no_projection_refresh_no_data_plane_write',
    publicDisclosure: 'Tenant identifiers and tenant-specific path segments are redacted in committed findings.',
    evidence: {
      homeLayer4Boundary: `npm run audit:home-layer4-boundary -- --out-dir reports/home-layer4-boundary/current-main --source-sha ${sourceSha}`,
    },
    summary: {
      runtimeFilesScanned: files.length,
      boundaryFindings: findings.length,
      blockersBeforeRefresh,
      productRuntimeChanged: false,
      layer4SurfacesRefreshedByThisChange: 0,
      layer4SurfaceRefreshTarget: 35,
      allHomeRuntimeReadsLayer4Projection: blockersBeforeRefresh === 0,
    },
    findingBreakdown: summarizeBy(findings, 'findingId'),
    sourceLayerBreakdown: summarizeBy(findings, 'sourceLayer'),
    severityBreakdown: summarizeBy(findings, 'severity'),
    fileBreakdown: summarizeBy(findings, 'file'),
    findings,
    requiredNextGates: [
      'Product/runtime routing change approval before rewiring Home reads.',
      'Canonical Layer 3 object writes and versioned projection build before claiming refreshed Home data.',
      'No CONFLICT figures may be surfaced without a fact-authority decision.',
      'Runtime proof after any future Home projection wiring or refresh.',
    ],
    gatesLeftClosed: [
      'No tenant data mutation, move, deletion, or generated prose.',
      'No Azure/Postgres write or data-plane load.',
      'No semantic identity alias activation.',
      'No graph dictionary/object-registry activation.',
      'No graph table materialization.',
      'No Layer 4 projection refresh or Home runtime route/read-path change.',
      'No live-client truth claim.',
    ],
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = requireArg(args, 'out-dir');
  const sourceSha = requireArg(args, 'source-sha');
  const report = buildReport({ sourceSha });
  writeJson(path.join(outDir, 'home-layer4-boundary-report.json'), report);
  writeMarkdown(path.join(outDir, 'home-layer4-boundary-report.md'), report);
  console.log(
    `home-layer4-boundary: ${report.summary.runtimeFilesScanned} runtime file(s), ${report.summary.boundaryFindings} finding(s), ${report.summary.blockersBeforeRefresh} blocker(s)`,
  );
  console.log(`  report: ${outDir}`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { buildReport, redactSensitiveTokens, scanFile, summarizeBy };
