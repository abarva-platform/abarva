#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Papa from 'papaparse';

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

function readCsv(filePath) {
  const parsed = Papa.parse(fs.readFileSync(filePath, 'utf8'), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse failed for ${filePath}: ${parsed.errors[0].message}`);
  }
  return parsed.data;
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function percent(part, total) {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function anonymizeTenants(tenantKeys) {
  return new Map(tenantKeys.map((tenantKey, index) => [tenantKey, `tenant-${String(index + 1).padStart(2, '0')}`]));
}

function splitReasons(row) {
  return String(row.quarantineReasons ?? '')
    .split(';')
    .map((reason) => reason.trim())
    .filter(Boolean);
}

function classifyReductionPath(reasons) {
  if (reasons.some((reason) => reason.startsWith('unknown-'))) {
    return 'code_dictionary_or_endpoint_alias_repair';
  }
  if (reasons.includes('tenant-key-mismatch')) {
    return 'tenant_identity_source_gate';
  }
  if (reasons.some((reason) => reason.startsWith('missing-evidence'))) {
    return 'evidence_basis_source_gate';
  }
  if (reasons.some((reason) => reason.startsWith('missing-'))) {
    return 'upstream_source_absence_or_no_graph_disposition';
  }
  if (reasons.includes('unresolved-from-node') || reasons.includes('unresolved-to-node')) {
    return 'source_data_dimension_or_edge_retirement_gate';
  }
  return 'manual_review_gate';
}

function dispositionForReductionPath(pathName) {
  switch (pathName) {
    case 'code_dictionary_or_endpoint_alias_repair':
      return 'safe-code-slice-if-a-canonical-dictionary-or-unique-identity-alias-can-resolve-it';
    case 'tenant_identity_source_gate':
      return 'source-row-tenant-identity-must-match-before-materialization';
    case 'evidence_basis_source_gate':
      return 'source-row-evidence-basis-must-exist-before-materialization';
    case 'upstream_source_absence_or_no_graph_disposition':
      return 'permanent-quarantine-or-declare-no-graph-until-required-endpoint-fields-exist';
    case 'source_data_dimension_or_edge_retirement_gate':
      return 'catalogue-object-from-real-evidence-or-retire-edge-never-create-node-to-satisfy-edge';
    default:
      return 'quarantine-until-specific-owner-approved-repair-path-exists';
  }
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function buildReasonBreakdown(rows) {
  return countBy(
    rows.flatMap((row) => splitReasons(row)),
    (reason) => reason,
  ).map(({ key, count }) => ({ reason: key, count }));
}

function buildReductionBreakdown(rows) {
  return countBy(rows, (row) => classifyReductionPath(splitReasons(row))).map(({ key, count }) => ({
    reductionPath: key,
    count,
    disposition: dispositionForReductionPath(key),
  }));
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Graph Quarantine Reduction Plan',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    '',
    'This is a sanitized, report-only reduction plan. It does not write tenant data, activate registries, materialize graph tables, refresh product projections, or make runtime truth claims.',
    '',
    '## Current Graph Dry-Run',
    '',
    `- Relationship rows: ${report.totals.relationshipRows}`,
    `- Candidate edges: ${report.totals.relationshipCandidates}`,
    `- Quarantined edges: ${report.totals.quarantinedRelationships}`,
    `- Quarantine rate: ${report.totals.quarantineRatePercent}%`,
    `- Unique identity aliases indexed: ${report.totals.nodeLookupAliasesIndexed}`,
    `- Ambiguous identity aliases skipped: ${report.totals.ambiguousNodeLookupAliasesSkipped}`,
    `- Graph tables written: ${report.totals.graphTablesWritten}`,
    '',
    '## Reduction Paths',
    '',
    '| Path | Rows | Disposition |',
    '| --- | ---: | --- |',
    ...report.reductionBreakdown.map(
      (row) => `| \`${row.reductionPath}\` | ${row.count} | \`${row.disposition}\` |`,
    ),
    '',
    '## Reason Counts',
    '',
    '| Reason | Count |',
    '| --- | ---: |',
    ...report.reasonBreakdown.map((row) => `| \`${row.reason}\` | ${row.count} |`),
    '',
    '## Tenant Aliases',
    '',
    '| Tenant | Rows | Candidates | Quarantined | Rate | Top reduction path |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...report.perTenant.map(
      (tenant) =>
        `| ${tenant.tenant} | ${tenant.relationshipRows} | ${tenant.relationshipCandidates} | ${tenant.quarantinedRelationships} | ${tenant.quarantineRatePercent}% | \`${tenant.topReductionPath}\` |`,
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
  const graphDir = requireArg(args, 'graph-dir');
  const outDir = requireArg(args, 'out-dir');
  const sourceSha = requireArg(args, 'source-sha');

  const summary = readJson(path.join(graphDir, 'summary.json'));
  const quarantineRows = readCsv(path.join(graphDir, 'graph-quarantine.csv'));
  const tenantKeys = summary.tenants ?? Object.keys(summary.perTenant ?? {});
  const tenantAliases = anonymizeTenants(tenantKeys);
  const reductionBreakdown = buildReductionBreakdown(quarantineRows);
  const codeRepairRows =
    reductionBreakdown.find((row) => row.reductionPath === 'code_dictionary_or_endpoint_alias_repair')?.count ?? 0;

  const perTenant = tenantKeys.map((tenantKey) => {
    const tenantSummary = summary.perTenant[tenantKey];
    const tenantRows = quarantineRows.filter((row) => row.tenantKey === tenantKey);
    const tenantReduction = buildReductionBreakdown(tenantRows);
    return {
      tenant: tenantAliases.get(tenantKey),
      relationshipRows: tenantSummary.relationshipRows,
      relationshipCandidates: tenantSummary.relationshipCandidates,
      quarantinedRelationships: tenantSummary.quarantinedRelationships,
      quarantineRatePercent: percent(tenantSummary.quarantinedRelationships, tenantSummary.relationshipRows),
      topReductionPath: tenantReduction[0]?.reductionPath ?? 'none',
      reductionBreakdown: tenantReduction,
      reasonBreakdown: buildReasonBreakdown(tenantRows),
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-graph-quarantine-reduction-plan.mjs',
    sourceSha,
    graphGeneratedAt: summary.generatedAt,
    mode: 'report_only_no_data_mutation_no_registry_activation_no_graph_materialization_no_projection_refresh',
    publicDisclosure: 'Tenant identifiers are anonymized. Row-level object names, source values, and source paths are omitted.',
    evidence: {
      graphReconciliation: `npm run audit:tenant-graph-reconciliation -- --tenant all --out ${graphDir}`,
      graphQuarantineReductionPlan: `npm run audit:graph-quarantine-reduction -- --graph-dir ${graphDir} --out-dir ${outDir} --source-sha ${sourceSha}`,
    },
    totals: {
      relationshipRows: summary.totals.relationshipRows,
      relationshipCandidates: summary.totals.relationshipCandidates,
      quarantinedRelationships: summary.totals.quarantinedRelationships,
      quarantineRatePercent: percent(summary.totals.quarantinedRelationships, summary.totals.relationshipRows),
      nodeCandidatesIndexed: summary.totals.nodeCandidatesIndexed,
      nodeLookupAliasesIndexed: summary.totals.nodeLookupAliasesIndexed ?? 0,
      ambiguousNodeLookupAliasesSkipped: summary.totals.ambiguousNodeLookupAliasesSkipped ?? 0,
      graphTablesWritten: summary.totals.graphTablesWritten,
      productReadModelsUpdated: summary.totals.productReadModelsUpdated,
    },
    reductionBreakdown,
    reasonBreakdown: buildReasonBreakdown(quarantineRows),
    perTenant,
    acceptance: {
      codeOnlyDictionaryOrEndpointAliasRepairRows: codeRepairRows,
      codeOnlyDictionaryOrEndpointAliasRepairAvailable: codeRepairRows > 0,
      sourceDataOrDispositionRows: quarantineRows.length - codeRepairRows,
      graphMaterializationStillBlocked: summary.totals.graphTablesWritten === false,
    },
    gatesLeftClosed: [
      'No tenant data mutation, move, deletion, or generated prose.',
      'No Azure/Postgres write or data-plane load.',
      'No registry/canonical store activation.',
      'No graph table materialization.',
      'No Layer 4 projection or product runtime refresh.',
      'No live-client truth claim.',
    ],
  };

  writeJson(path.join(outDir, 'graph-quarantine-reduction-plan.json'), report);
  writeMarkdown(path.join(outDir, 'graph-quarantine-reduction-plan.md'), report);
  console.log(
    `graph-quarantine-reduction-plan: ${report.totals.quarantinedRelationships} quarantined row(s), ${codeRepairRows} code-repair row(s), ${report.acceptance.sourceDataOrDispositionRows} source/disposition-gated row(s)`,
  );
  console.log(`  report: ${outDir}`);
}

if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export {
  buildReasonBreakdown,
  buildReductionBreakdown,
  classifyReductionPath,
  dispositionForReductionPath,
};
