#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

const csvCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

function writeCsv(filePath, headers, rows) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = [
    headers.map((header) => header.csv).join(','),
    ...rows.map((row) => headers.map((header) => csvCell(row[header.key])).join(',')),
  ].join('\n');
  fs.writeFileSync(filePath, `${body}\n`);
}

const markdownCell = (value) => String(value ?? '').replaceAll('|', '\\|');

function aliasRows(ledger) {
  return (ledger.aliases ?? [])
    .filter((alias) => alias.active === true)
    .map((alias) => ({
      tenant: alias.tenant,
      alias: alias.alias,
      canonicalDisplayName: alias.canonicalDisplayName,
      objectType: alias.objectType,
      evidenceForMapping: [
        alias.matchRule,
        `canonical_source_row=${alias.canonicalSourceRowNumber}`,
        `canonical_mapping_profile=${alias.canonicalMappingProfile}`,
      ].join('; '),
      affectedEndpointOccurrences: alias.affectedEndpointOccurrences,
      reversible: alias.reversible,
      graphMaterialized: false,
    }));
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Graph Semantic Identity Alias Activation',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    '',
    'This is a sanitized activation proof for three reviewed semantic identity aliases. It records lookup aliases against existing graph reconciliation node IDs only.',
    '',
    '## Direct Answer',
    '',
    `Activated alias records: ${report.totals.activatedAliasRecords}. Quarantine changed from ${report.before.quarantinedRelationships} to ${report.after.quarantinedRelationships}, a delta of ${report.delta.quarantinedRelationships}. Graph tables written: ${report.acceptance.graphTablesWritten}. Product read models updated: ${report.acceptance.productReadModelsUpdated}.`,
    '',
    '## Approved Aliases',
    '',
    '| Tenant | Alias | Canonical identity | Evidence | Affected endpoint occurrences |',
    '| --- | --- | --- | --- | ---: |',
    ...report.aliases.map(
      (row) =>
        `| ${row.tenant} | \`${markdownCell(row.alias)}\` | \`${markdownCell(row.canonicalDisplayName)}\` | ${markdownCell(row.evidenceForMapping)} | ${row.affectedEndpointOccurrences} |`,
    ),
    '',
    '## Before / After',
    '',
    '| Metric | Before | After | Delta |',
    '| --- | ---: | ---: | ---: |',
    `| Relationship candidates | ${report.before.relationshipCandidates} | ${report.after.relationshipCandidates} | ${report.delta.relationshipCandidates} |`,
    `| Quarantined relationships | ${report.before.quarantinedRelationships} | ${report.after.quarantinedRelationships} | ${report.delta.quarantinedRelationships} |`,
    '',
    '## Closed Gates',
    '',
    ...report.closedGates.map((gate) => `- ${gate}`),
    '',
    '## Next Report-Only Lane',
    '',
    `- ${report.nextReportOnlyLane}`,
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function summaryMetrics(summary) {
  return {
    relationshipRows: summary.totals.relationshipRows,
    relationshipCandidates: summary.totals.relationshipCandidates,
    quarantinedRelationships: summary.totals.quarantinedRelationships,
    graphTablesWritten: summary.totals.graphTablesWritten,
    productReadModelsUpdated: summary.totals.productReadModelsUpdated,
  };
}

function buildReport({ beforeDir, afterDir, outDir, sourceSha, ledgerPath }) {
  const beforeSummary = readJson(path.join(beforeDir, 'summary.json'));
  const afterSummary = readJson(path.join(afterDir, 'summary.json'));
  const ledger = readJson(ledgerPath);
  const aliases = aliasRows(ledger);
  const before = summaryMetrics(beforeSummary);
  const after = summaryMetrics(afterSummary);
  const affectedEndpointOccurrences = aliases.reduce((sum, row) => sum + Number(row.affectedEndpointOccurrences), 0);
  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-graph-semantic-alias-activation-report.mjs',
    sourceSha,
    mode: 'semantic_identity_alias_lookup_activation_only_no_data_write_no_graph_materialization',
    publicDisclosure:
      'Tenant identifiers are anonymized. Source paths, real tenant keys, and source rows are omitted except reviewed canonical row numbers.',
    evidence: {
      beforeGraphReconciliationDir: beforeDir,
      afterGraphReconciliationDir: afterDir,
      semanticAliasLedger: ledgerPath,
      activationReport: outDir,
    },
    aliases,
    before,
    after,
    delta: {
      relationshipCandidates: after.relationshipCandidates - before.relationshipCandidates,
      quarantinedRelationships: after.quarantinedRelationships - before.quarantinedRelationships,
    },
    totals: {
      activatedAliasRecords: aliases.length,
      approvedAffectedEndpointOccurrences: affectedEndpointOccurrences,
      afterApprovedSemanticNodeAliasRecords: afterSummary.totals.approvedSemanticNodeAliasRecords ?? 0,
      afterApprovedSemanticNodeAliasesIndexed: afterSummary.totals.approvedSemanticNodeAliasesIndexed ?? 0,
      afterApprovedSemanticNodeAliasesAlreadyPresent: afterSummary.totals.approvedSemanticNodeAliasesAlreadyPresent ?? 0,
    },
    acceptance: {
      semanticIdentityAliasActivationPerformed: aliases.length === 3,
      activatedOnlyApprovedAliases:
        aliases.length === 3 &&
        aliases.every((row) =>
          ['CFO', 'CHRO', 'CISO'].includes(row.alias) &&
          row.tenant === 'tenant-07' &&
          row.objectType === 'organization_unit',
        ),
      quarantineDeltaMatchesApprovedOccurrences:
        before.quarantinedRelationships - after.quarantinedRelationships === affectedEndpointOccurrences,
      tenantDataMutated: false,
      canonicalDataPlaneWritten: false,
      graphTablesWritten: Boolean(before.graphTablesWritten || after.graphTablesWritten),
      productReadModelsUpdated: Boolean(before.productReadModelsUpdated || after.productReadModelsUpdated),
      graphMaterialized: false,
      liveClientTruthClaimMade: false,
      sourcePathsOmitted: true,
    },
    closedGates: [
      'No graph dictionary or object-registry activation.',
      'No graph materialization; graphTablesWritten must stay false.',
      'No canonical/data-plane write.',
      'No Layer 4 projection or product read-model refresh.',
      'No tenant data mutation.',
      'No live-client truth claim.',
    ],
    nextReportOnlyLane: 'Build the 6103 source-data-gated endpoint decision matrix.',
  };

  fs.mkdirSync(outDir, { recursive: true });
  writeJson(path.join(outDir, 'graph-semantic-alias-activation.json'), report);
  writeCsv(
    path.join(outDir, 'graph-semantic-alias-activation.csv'),
    [
      { key: 'tenant', csv: 'tenant' },
      { key: 'alias', csv: 'alias' },
      { key: 'canonicalDisplayName', csv: 'canonical_identity' },
      { key: 'objectType', csv: 'object_type' },
      { key: 'evidenceForMapping', csv: 'evidence_for_mapping' },
      { key: 'affectedEndpointOccurrences', csv: 'affected_endpoint_occurrences' },
      { key: 'reversible', csv: 'reversible' },
      { key: 'graphMaterialized', csv: 'graph_materialized' },
    ],
    aliases,
  );
  writeMarkdown(path.join(outDir, 'graph-semantic-alias-activation.md'), report);
  return report;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = buildReport({
    beforeDir: requireArg(args, 'before-dir'),
    afterDir: requireArg(args, 'after-dir'),
    outDir: requireArg(args, 'out-dir'),
    sourceSha: requireArg(args, 'source-sha'),
    ledgerPath: requireArg(args, 'ledger'),
  });
  console.log(
    `graph-semantic-alias-activation: ${report.totals.activatedAliasRecords} alias record(s), quarantine ${report.before.quarantinedRelationships} -> ${report.after.quarantinedRelationships} (${report.delta.quarantinedRelationships})`,
  );
  console.log(`  report: ${report.evidence.activationReport}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { aliasRows, buildReport, summaryMetrics };
