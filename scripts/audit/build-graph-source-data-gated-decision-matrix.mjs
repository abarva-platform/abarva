#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';

import { analyzeAliasOpportunities } from './build-graph-quarantine-alias-analysis.mjs';

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith('--')) continue;
    const [key, inlineValue] = arg.slice(2).split('=', 2);
    const hasSeparateValue = inlineValue === undefined && argv[index + 1] && !argv[index + 1].startsWith('--');
    const value = inlineValue ?? (hasSeparateValue ? argv[index + 1] : 'true');
    args.set(key, value);
    if (hasSeparateValue) index += 1;
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

function anonymizeTenants(tenantKeys) {
  return new Map(tenantKeys.map((tenantKey, index) => [tenantKey, `tenant-${String(index + 1).padStart(2, '0')}`]));
}

function stableHash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 16);
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

function buildDecisionRows({ endpoints, tenantAliases, includeEndpointLabels }) {
  const groups = new Map();
  for (const endpoint of endpoints) {
    if (endpoint.opportunityClass !== 'source_data_dimension_or_edge_type_correction_gate') continue;
    const tenant = tenantAliases.get(endpoint.tenantKey);
    const endpointHash = stableHash(`${tenant}|${endpoint.objectType}|${endpoint.endpointName}`);
    const key = `${tenant}|${endpoint.objectType}|${endpointHash}`;
    const existing = groups.get(key) ?? {
      tenant,
      decisionId: `sdg-${endpointHash}`,
      objectType: endpoint.objectType,
      endpointLabelHash: endpointHash,
      endpointLabel: includeEndpointLabels ? endpoint.endpointName : '',
      unresolvedEndpointOccurrences: 0,
      affectedRelationshipRows: new Set(),
      firstSourceRowNumber: Number(endpoint.sourceRowNumber) || '',
      proposedDecisionRequired:
        'catalogue-object-from-real-evidence-or-correct-edge-type-never-create-node-to-satisfy-edge',
      allowedDecisionOne: 'catalogue_existing_or_new_canonical_object_from_source_evidence',
      allowedDecisionTwo: 'correct_relationship_endpoint_type_with_source_owner_approval',
      blockedDecision: 'never_create_placeholder_node_to_satisfy_edge',
      hardGateRequiredBeforeWrite: true,
      reportOnly: true,
    };
    existing.unresolvedEndpointOccurrences += 1;
    existing.affectedRelationshipRows.add(endpoint.relationshipId);
    const sourceRow = Number(endpoint.sourceRowNumber);
    if (sourceRow && (!existing.firstSourceRowNumber || sourceRow < existing.firstSourceRowNumber)) {
      existing.firstSourceRowNumber = sourceRow;
    }
    groups.set(key, existing);
  }

  return [...groups.values()]
    .map((row) => ({
      ...row,
      affectedRelationshipRows: row.affectedRelationshipRows.size,
    }))
    .sort(
      (a, b) =>
        b.unresolvedEndpointOccurrences - a.unresolvedEndpointOccurrences ||
        a.tenant.localeCompare(b.tenant) ||
        a.objectType.localeCompare(b.objectType) ||
        a.decisionId.localeCompare(b.decisionId),
    );
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Graph Source-Data-Gated Decision Matrix',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    '',
    'This is a report-only decision matrix for graph reconciliation endpoints that still cannot be resolved by code-only alias handling. Tenant identifiers are anonymized. Endpoint labels are omitted unless the script is run with an explicit local labels flag.',
    '',
    '## Direct Answer',
    '',
    `There are ${report.totals.sourceDataGatedEndpointOccurrences} source-data-gated unresolved endpoint occurrence(s), grouped into ${report.totals.decisionRows} decision row(s). No graph tables, canonical data-plane state, tenant data, or Layer 4 projections were written.`,
    '',
    '## Required Decision',
    '',
    'Every row requires one of two source-owner decisions: catalogue the object from real evidence, or correct the relationship endpoint type. Creating placeholder nodes just to satisfy edges remains blocked, and edge retirement remains a separate explicit gate.',
    '',
    '## Totals',
    '',
    `- Relationship rows: ${report.graphTotals.relationshipRows}`,
    `- Quarantined relationships: ${report.graphTotals.quarantinedRelationships}`,
    `- Decision rows: ${report.totals.decisionRows}`,
    `- Source-data-gated endpoint occurrences: ${report.totals.sourceDataGatedEndpointOccurrences}`,
    `- Endpoint labels included: ${report.acceptance.endpointLabelsIncluded}`,
    `- Graph tables written: ${report.acceptance.graphTablesWritten}`,
    '',
    '## Object-Type Breakdown',
    '',
    '| Object type | Endpoint occurrences | Decision rows |',
    '| --- | ---: | ---: |',
    ...report.objectTypeBreakdown.map(
      (row) => `| \`${markdownCell(row.objectType)}\` | ${row.unresolvedEndpointOccurrences} | ${row.decisionRows} |`,
    ),
    '',
    '## Tenant Breakdown',
    '',
    '| Tenant | Endpoint occurrences | Decision rows |',
    '| --- | ---: | ---: |',
    ...report.tenantBreakdown.map(
      (row) => `| ${row.tenant} | ${row.unresolvedEndpointOccurrences} | ${row.decisionRows} |`,
    ),
    '',
    '## Closed Gates',
    '',
    ...report.closedGates.map((gate) => `- ${gate}`),
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function buildReport({ graphDir, outDir, sourceSha, includeEndpointLabels }) {
  const summary = readJson(path.join(graphDir, 'summary.json'));
  const nodes = readCsv(path.join(graphDir, 'graph-node-index.csv'));
  const quarantineRows = readCsv(path.join(graphDir, 'graph-quarantine.csv'));
  const tenantKeys = summary.tenants ?? Object.keys(summary.perTenant ?? {});
  const tenantAliases = anonymizeTenants(tenantKeys);
  const { endpoints } = analyzeAliasOpportunities({ quarantineRows, nodes });
  const decisionRows = buildDecisionRows({ endpoints, tenantAliases, includeEndpointLabels });
  const sourceDataGatedEndpointOccurrences = decisionRows.reduce(
    (sum, row) => sum + row.unresolvedEndpointOccurrences,
    0,
  );
  const objectTypeRows = countBy(decisionRows, (row) => row.objectType).map(({ key }) => {
    const rows = decisionRows.filter((row) => row.objectType === key);
    return {
      objectType: key,
      unresolvedEndpointOccurrences: rows.reduce((sum, row) => sum + row.unresolvedEndpointOccurrences, 0),
      decisionRows: rows.length,
    };
  });
  const tenantRows = countBy(decisionRows, (row) => row.tenant).map(({ key }) => {
    const rows = decisionRows.filter((row) => row.tenant === key);
    return {
      tenant: key,
      unresolvedEndpointOccurrences: rows.reduce((sum, row) => sum + row.unresolvedEndpointOccurrences, 0),
      decisionRows: rows.length,
    };
  });
  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-graph-source-data-gated-decision-matrix.mjs',
    sourceSha,
    graphGeneratedAt: summary.generatedAt,
    mode: 'report_only_source_data_decision_matrix_no_data_write_no_graph_materialization',
    publicDisclosure: includeEndpointLabels
      ? 'Endpoint labels are included for local review. Do not commit this variant to public artifacts.'
      : 'Tenant identifiers are anonymized and endpoint labels are omitted. Stable hashes support grouping without disclosing source labels.',
    evidence: {
      graphReconciliation: `npm run audit:tenant-graph-reconciliation -- --tenant all --out ${graphDir}`,
      sourceDataGatedDecisionMatrix: `npm run audit:graph-source-data-gated-matrix -- --graph-dir ${graphDir} --out-dir ${outDir} --source-sha ${sourceSha}`,
      outputDir: outDir,
    },
    graphTotals: {
      relationshipRows: summary.totals.relationshipRows,
      relationshipCandidates: summary.totals.relationshipCandidates,
      quarantinedRelationships: summary.totals.quarantinedRelationships,
      graphTablesWritten: summary.totals.graphTablesWritten,
      productReadModelsUpdated: summary.totals.productReadModelsUpdated,
      semanticIdentityAliasesActivated: summary.totals.semanticIdentityAliasesActivated ?? false,
    },
    totals: {
      sourceDataGatedEndpointOccurrences,
      decisionRows: decisionRows.length,
    },
    objectTypeBreakdown: objectTypeRows,
    tenantBreakdown: tenantRows,
    decisionRows,
    acceptance: {
      reportOnly: true,
      endpointLabelsIncluded: includeEndpointLabels,
      tenantDataMutated: false,
      canonicalDataPlaneWritten: false,
      graphTablesWritten: Boolean(summary.totals.graphTablesWritten),
      productReadModelsUpdated: Boolean(summary.totals.productReadModelsUpdated),
      graphMaterialized: false,
      liveClientTruthClaimMade: false,
    },
    closedGates: [
      'No graph dictionary or object-registry activation.',
      'No semantic identity alias activation beyond the already approved three-record ledger.',
      'No graph materialization.',
      'No canonical/data-plane write.',
      'No Layer 4 projection or product read-model refresh.',
      'No tenant data mutation.',
      'No live-client truth claim.',
    ],
  };

  fs.mkdirSync(outDir, { recursive: true });
  writeJson(path.join(outDir, 'graph-source-data-gated-decision-matrix.json'), report);
  writeCsv(
    path.join(outDir, 'graph-source-data-gated-decision-matrix.csv'),
    [
      { key: 'tenant', csv: 'tenant' },
      { key: 'decisionId', csv: 'decision_id' },
      { key: 'objectType', csv: 'object_type' },
      { key: 'endpointLabelHash', csv: 'endpoint_label_hash' },
      { key: 'endpointLabel', csv: 'endpoint_label' },
      { key: 'unresolvedEndpointOccurrences', csv: 'unresolved_endpoint_occurrences' },
      { key: 'affectedRelationshipRows', csv: 'affected_relationship_rows' },
      { key: 'firstSourceRowNumber', csv: 'first_source_row_number' },
      { key: 'proposedDecisionRequired', csv: 'proposed_decision_required' },
      { key: 'allowedDecisionOne', csv: 'allowed_decision_one' },
      { key: 'allowedDecisionTwo', csv: 'allowed_decision_two' },
      { key: 'blockedDecision', csv: 'blocked_decision' },
      { key: 'hardGateRequiredBeforeWrite', csv: 'hard_gate_required_before_write' },
      { key: 'reportOnly', csv: 'report_only' },
    ],
    decisionRows,
  );
  writeMarkdown(path.join(outDir, 'graph-source-data-gated-decision-matrix.md'), report);
  return report;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const report = buildReport({
    graphDir: requireArg(args, 'graph-dir'),
    outDir: requireArg(args, 'out-dir'),
    sourceSha: requireArg(args, 'source-sha'),
    includeEndpointLabels: args.get('include-endpoint-labels') === 'true',
  });
  console.log(
    `graph-source-data-gated-decision-matrix: ${report.totals.sourceDataGatedEndpointOccurrences} source-data gated endpoint occurrence(s), ${report.totals.decisionRows} decision row(s)`,
  );
  console.log(`  report: ${report.evidence.outputDir}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export { buildDecisionRows, buildReport };
