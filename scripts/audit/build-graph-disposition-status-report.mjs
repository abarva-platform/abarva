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

function anonymizeTenants(tenantKeys) {
  return new Map(tenantKeys.map((tenantKey, index) => [tenantKey, `tenant-${String(index + 1).padStart(2, '0')}`]));
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

function splitReasons(rawReasons) {
  return String(rawReasons ?? '')
    .split(';')
    .map((reason) => reason.trim())
    .filter(Boolean);
}

function percent(part, total) {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function reasonBreakdown(rows) {
  return countBy(
    rows.flatMap((row) => splitReasons(row.quarantineReasons)),
    (reason) => reason,
  ).map(({ key, count }) => {
    const matching = rows.find((row) => splitReasons(row.quarantineReasons).includes(key));
    return {
      reason: key,
      count,
      quarantineClass: matching?.quarantineClass || 'unclassified_quarantine',
      quarantineDisposition: matching?.quarantineDisposition || 'quarantine-until-specific-owner-approved-repair-path-exists',
    };
  });
}

function classBreakdown(rows) {
  return countBy(rows, (row) => row.quarantineClass || 'missing_class').map(({ key, count }) => {
    const matching = rows.find((row) => (row.quarantineClass || 'missing_class') === key);
    return {
      quarantineClass: key,
      count,
      quarantineDisposition: matching?.quarantineDisposition || 'missing_disposition',
    };
  });
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Graph Disposition Status',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    `Graph dry-run generated at: \`${report.graphGeneratedAt}\``,
    '',
    'This is a sanitized, report-only graph status artifact. Tenant identifiers are anonymized, and no graph tables, product projections, registry activations, or tenant data writes are performed.',
    '',
    '## Totals',
    '',
    `- Relationship rows: ${report.totals.relationshipRows}`,
    `- Candidate edges: ${report.totals.relationshipCandidates}`,
    `- Quarantined edges: ${report.totals.quarantinedRelationships}`,
    `- Quarantine rate: ${report.totals.quarantineRatePercent}%`,
    `- Graph tables written: ${report.totals.graphTablesWritten}`,
    `- Product read models updated: ${report.totals.productReadModelsUpdated}`,
    `- Quarantined rows missing class/disposition: ${report.acceptance.missingClassOrDispositionRows}`,
    '',
    '## Quarantine Classes',
    '',
    '| Class | Count | Disposition |',
    '| --- | ---: | --- |',
    ...report.totals.classBreakdown.map(
      (row) => `| \`${row.quarantineClass}\` | ${row.count} | \`${row.quarantineDisposition}\` |`,
    ),
    '',
    '## Tenant Aliases',
    '',
    '| Tenant | Rows | Candidates | Quarantined | Rate | Top class |',
    '| --- | ---: | ---: | ---: | ---: | --- |',
    ...report.perTenant.map((tenant) => {
      const topClass = tenant.classBreakdown[0]?.quarantineClass ?? 'none';
      return `| ${tenant.tenant} | ${tenant.relationshipRows} | ${tenant.relationshipCandidates} | ${tenant.quarantinedRelationships} | ${tenant.quarantineRatePercent}% | \`${topClass}\` |`;
    }),
    '',
    '## Open Gates',
    '',
    ...report.gatesLeftClosed.map((gate) => `- ${gate}`),
    '',
    '## Acceptance',
    '',
    `- Every remaining quarantined edge has class and disposition: ${report.acceptance.everyRemainingQuarantineHasClassAndDisposition}`,
    `- Quarantine rate is reported per tenant with reason breakdown: ${report.acceptance.perTenantRateAndReasonBreakdownPresent}`,
    `- Graph materialization is still blocked: ${report.acceptance.graphMaterializationStillBlocked}`,
    '',
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}`);
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
  const rowsMissingClassOrDisposition = quarantineRows.filter(
    (row) => !row.quarantineClass || !row.quarantineDisposition,
  );

  const perTenant = tenantKeys.map((tenantKey) => {
    const tenantSummary = summary.perTenant[tenantKey];
    const rows = quarantineRows.filter((row) => row.tenantKey === tenantKey);
    return {
      tenant: tenantAliases.get(tenantKey),
      relationshipRows: tenantSummary.relationshipRows,
      relationshipCandidates: tenantSummary.relationshipCandidates,
      quarantinedRelationships: tenantSummary.quarantinedRelationships,
      quarantineRatePercent: percent(tenantSummary.quarantinedRelationships, tenantSummary.relationshipRows),
      classBreakdown: classBreakdown(rows),
      reasonBreakdown: reasonBreakdown(rows),
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-graph-disposition-status-report.mjs',
    sourceSha,
    graphGeneratedAt: summary.generatedAt,
    mode: 'report_only_no_data_mutation_no_registry_activation_no_graph_materialization_no_projection_refresh',
    publicDisclosure: 'Tenant identifiers are anonymized. Row-level object names and source paths are intentionally omitted.',
    evidence: {
      graphReconciliation: `npm run audit:tenant-graph-reconciliation -- --tenant all --out ${graphDir}`,
      graphDispositionStatus: `npm run audit:graph-disposition-status -- --graph-dir ${graphDir} --out-dir ${outDir} --source-sha ${sourceSha}`,
    },
    totals: {
      relationshipRows: summary.totals.relationshipRows,
      relationshipCandidates: summary.totals.relationshipCandidates,
      quarantinedRelationships: summary.totals.quarantinedRelationships,
      quarantineRatePercent: percent(summary.totals.quarantinedRelationships, summary.totals.relationshipRows),
      classBreakdown: classBreakdown(quarantineRows),
      reasonBreakdown: reasonBreakdown(quarantineRows),
      graphTablesWritten: summary.totals.graphTablesWritten,
      productReadModelsUpdated: summary.totals.productReadModelsUpdated,
    },
    perTenant,
    acceptance: {
      everyRemainingQuarantineHasClassAndDisposition: rowsMissingClassOrDisposition.length === 0,
      missingClassOrDispositionRows: rowsMissingClassOrDisposition.length,
      perTenantRateAndReasonBreakdownPresent: perTenant.every(
        (tenant) => tenant.relationshipRows >= 0 && Array.isArray(tenant.reasonBreakdown),
      ),
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

  writeJson(path.join(outDir, 'graph-disposition-status.json'), report);
  writeMarkdown(path.join(outDir, 'graph-disposition-status.md'), report);
  console.log(
    `graph-disposition-status: ${report.totals.relationshipRows} relationship row(s), ${report.totals.quarantinedRelationships} quarantined, ${rowsMissingClassOrDisposition.length} missing class/disposition`,
  );
  console.log(`  report: ${outDir}`);
}

main();
