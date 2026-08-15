#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REGISTRY = 'datasets/tenant-inputs/tenant-input-registry.json';

const declaredTemplateVariants = new Map([
  ['08_it_budget_spend_value.csv', '08_spend_value.csv'],
  ['17_managed_services_scope.csv', '17_service_scope_managed_services.csv'],
]);

const sourceAdapterExtractPattern = /^SA\d{2}_.+\.csv$/i;
const numberedNewSourcePattern = /^(12b|19|20)_.+\.csv$/i;

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

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'));
}

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(next);
      else if (entry.isFile() && entry.name.toLowerCase().endsWith('.csv')) out.push(next);
    }
  }
  return out.sort();
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function anonymizeTenants(tenantKeys) {
  return new Map(tenantKeys.map((tenantKey, index) => [tenantKey, `tenant-${String(index + 1).padStart(2, '0')}`]));
}

function classifyUndeclaredFile(fileName) {
  if (declaredTemplateVariants.has(fileName)) {
    return {
      classification: 'variant_of_declared_template',
      proposedDisposition: 'rename-or-map-to-existing-declared-template-after-review',
      targetContractFile: declaredTemplateVariants.get(fileName),
      contractAmendmentNeeded: false,
    };
  }
  if (sourceAdapterExtractPattern.test(fileName)) {
    return {
      classification: 'source_adapter_extract_contract_candidate',
      proposedDisposition: 'add-to-source-adapter-intake-contract-or-move-out-of-active-canonical-root',
      targetContractFile: '',
      contractAmendmentNeeded: true,
    };
  }
  if (numberedNewSourcePattern.test(fileName)) {
    return {
      classification: 'genuine_new_source_contract_candidate',
      proposedDisposition: 'decide-owning-contract-before-any-template-manifest-amendment',
      targetContractFile: '',
      contractAmendmentNeeded: true,
    };
  }
  return {
    classification: 'artifact_or_unclassified_active_root_file',
    proposedDisposition: 'review-whether-file-belongs-in-active-intake-root',
    targetContractFile: '',
    contractAmendmentNeeded: false,
  };
}

function summarizeBy(rows, key) {
  const counts = new Map();
  for (const row of rows) counts.set(row[key], (counts.get(row[key]) ?? 0) + 1);
  return [...counts.entries()]
    .map(([value, count]) => ({ [key]: value, count }))
    .sort((a, b) => b.count - a.count || String(a[key]).localeCompare(String(b[key])));
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Layer 1 Undeclared Source Classification',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    '',
    'This is a sanitized, report-only Layer 1 classification. Tenant identifiers are anonymized. It does not amend `template-manifest.json`, move or delete tenant data, load the data plane, refresh projections, or make runtime truth claims.',
    '',
    '## Totals',
    '',
    `- Active-input CSV files scanned: ${report.summary.activeInputCsvFiles}`,
    `- Declared template CSV files present: ${report.summary.declaredTemplateCsvFiles}`,
    `- Undeclared active-input CSV files: ${report.summary.undeclaredActiveInputCsvFiles}`,
    `- Template contract amended: ${report.summary.templateContractAmended}`,
    '',
    '## Classification',
    '',
    '| Classification | Files |',
    '| --- | ---: |',
    ...report.classificationBreakdown.map((row) => `| \`${row.classification}\` | ${row.count} |`),
    '',
    '## File Families',
    '',
    '| File | Count | Classification | Proposed disposition |',
    '| --- | ---: | --- | --- |',
    ...report.fileFamilyBreakdown.map(
      (row) =>
        `| \`${row.fileName}\` | ${row.count} | \`${row.classification}\` | \`${row.proposedDisposition}\` |`,
    ),
    '',
    '## Tenant Aliases',
    '',
    '| Tenant | Active-input CSVs | Declared | Undeclared |',
    '| --- | ---: | ---: | ---: |',
    ...report.perTenant.map(
      (tenant) =>
        `| ${tenant.tenant} | ${tenant.activeInputCsvFiles} | ${tenant.declaredTemplateCsvFiles} | ${tenant.undeclaredActiveInputCsvFiles} |`,
    ),
    '',
    '## Gates Left Closed',
    '',
    ...report.gatesLeftClosed.map((gate) => `- ${gate}`),
    '',
  ];
  fs.writeFileSync(filePath, lines.join('\n'));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const outDir = requireArg(args, 'out-dir');
  const sourceSha = requireArg(args, 'source-sha');
  const registry = readJson(REGISTRY);
  const manifest = readJson(registry.universalTemplateSet.manifest);
  const declaredFiles = new Set(manifest.templates.map((template) => template.file));
  const activeTenants = registry.activeTenants;
  const tenantAliases = anonymizeTenants(activeTenants.map((tenant) => tenant.tenantKey));

  const perTenant = [];
  const undeclaredRows = [];
  let activeInputCsvFiles = 0;
  let declaredTemplateCsvFiles = 0;

  for (const tenant of activeTenants) {
    const tenantFiles = [];
    for (const packet of tenant.packets.filter((packet) => packet.status === 'active-input')) {
      const packetRoot = path.join(ROOT, packet.path);
      for (const absolutePath of walk(packetRoot)) {
        const fileName = path.basename(absolutePath);
        tenantFiles.push({ fileName, packetId: packet.packetId });
      }
    }
    const declared = tenantFiles.filter((file) => declaredFiles.has(file.fileName));
    const undeclared = tenantFiles.filter((file) => !declaredFiles.has(file.fileName));
    activeInputCsvFiles += tenantFiles.length;
    declaredTemplateCsvFiles += declared.length;

    perTenant.push({
      tenant: tenantAliases.get(tenant.tenantKey),
      activeInputCsvFiles: tenantFiles.length,
      declaredTemplateCsvFiles: declared.length,
      undeclaredActiveInputCsvFiles: undeclared.length,
    });

    for (const file of undeclared) {
      const classification = classifyUndeclaredFile(file.fileName);
      undeclaredRows.push({
        tenant: tenantAliases.get(tenant.tenantKey),
        fileName: file.fileName,
        packetId: file.packetId,
        ...classification,
      });
    }
  }

  const fileFamilyBreakdown = summarizeBy(undeclaredRows, 'fileName').map((row) => {
    const example = undeclaredRows.find((item) => item.fileName === row.fileName);
    return {
      fileName: row.fileName,
      count: row.count,
      classification: example?.classification ?? 'unclassified',
      proposedDisposition: example?.proposedDisposition ?? 'review-required',
      targetContractFile: example?.targetContractFile ?? '',
      contractAmendmentNeeded: Boolean(example?.contractAmendmentNeeded),
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-l1-undeclared-source-classification.mjs',
    sourceSha,
    mode: 'report_only_no_template_manifest_amendment_no_tenant_data_mutation_no_data_plane_load_no_projection_refresh',
    publicDisclosure: 'Tenant identifiers are anonymized. File rows and source values are omitted.',
    evidence: {
      tenantInputQuality:
        'npm run audit:tenant-input-quality -- --out-dir /tmp/nexus-l1-quality-fixed.b57XSe',
      l1Classification: `npm run audit:l1-undeclared-source-classification -- --out-dir ${outDir} --source-sha ${sourceSha}`,
    },
    summary: {
      activeInputCsvFiles,
      declaredTemplateCsvFiles,
      undeclaredActiveInputCsvFiles: undeclaredRows.length,
      templateContractAmended: false,
    },
    classificationBreakdown: summarizeBy(undeclaredRows, 'classification'),
    fileFamilyBreakdown,
    perTenant,
    undeclaredFiles: undeclaredRows,
    gatesLeftClosed: [
      'No template-manifest.json amendment.',
      'No tenant data mutation, move, deletion, or generated prose.',
      'No Azure/Postgres write or data-plane load.',
      'No registry/canonical store activation.',
      'No graph table materialization.',
      'No Layer 4 projection or product runtime refresh.',
      'No live-client truth claim.',
    ],
  };

  writeJson(path.join(outDir, 'l1-undeclared-source-classification.json'), report);
  writeMarkdown(path.join(outDir, 'l1-undeclared-source-classification.md'), report);
  console.log(
    `l1-undeclared-source-classification: ${activeInputCsvFiles} active-input CSV(s), ${undeclaredRows.length} undeclared`,
  );
  console.log(`  report: ${outDir}`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export { classifyUndeclaredFile, summarizeBy };
