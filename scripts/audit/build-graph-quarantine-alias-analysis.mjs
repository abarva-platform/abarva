#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

function slug(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function compactSlug(value) {
  return slug(value).replaceAll('-', '');
}

function acronym(value) {
  return String(value ?? '')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .toLowerCase();
}

function splitReasons(rawReasons) {
  return String(rawReasons ?? '')
    .split(';')
    .map((reason) => reason.trim())
    .filter(Boolean);
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

function nodeBuckets(nodes) {
  const buckets = new Map();
  for (const node of nodes) {
    const key = `${node.tenantKey}|${node.objectType}`;
    const rows = buckets.get(key) ?? [];
    rows.push(node);
    buckets.set(key, rows);
  }
  return buckets;
}

function endpointSpecs(row) {
  return [
    {
      side: 'from',
      reason: 'unresolved-from-node',
      objectType: row.fromObjectType,
      objectName: row.fromObjectName,
      nodeId: row.fromNodeId,
    },
    {
      side: 'to',
      reason: 'unresolved-to-node',
      objectType: row.toObjectType,
      objectName: row.toObjectName,
      nodeId: row.toNodeId,
    },
  ];
}

function classifyEndpointOpportunity({ endpoint, tenantKey, buckets }) {
  if (!endpoint.objectType || !endpoint.objectName) {
    return {
      opportunityClass: 'source_endpoint_missing_required_value',
      candidateCount: 0,
      proposedDisposition: 'source-data-gated-required-endpoint-value-missing',
    };
  }

  const candidates = buckets.get(`${tenantKey}|${endpoint.objectType}`) ?? [];
  const looseMatches = candidates.filter((candidate) => compactSlug(candidate.displayName) === compactSlug(endpoint.objectName));
  const acronymMatches = candidates.filter((candidate) => acronym(candidate.displayName) === compactSlug(endpoint.objectName));

  if (looseMatches.length === 1) {
    return {
      opportunityClass: 'code_only_loose_normalization_candidate',
      candidateCount: 1,
      proposedDisposition: 'report-only-candidate-do-not-activate-without-review',
    };
  }
  if (acronymMatches.length === 1) {
    return {
      opportunityClass: 'code_only_acronym_alias_candidate',
      candidateCount: 1,
      proposedDisposition: 'semantic-identity-alias-activation-gated',
    };
  }
  if (looseMatches.length > 1 || acronymMatches.length > 1) {
    return {
      opportunityClass: 'ambiguous_code_alias_candidate',
      candidateCount: Math.max(looseMatches.length, acronymMatches.length),
      proposedDisposition: 'manual-review-required-before-any-alias-activation',
    };
  }
  return {
    opportunityClass: 'source_data_dimension_or_edge_retirement_gate',
    candidateCount: 0,
    proposedDisposition: 'catalogue-object-from-real-evidence-or-retire-edge-never-create-node-to-satisfy-edge',
  };
}

function analyzeAliasOpportunities({ quarantineRows, nodes }) {
  const buckets = nodeBuckets(nodes);
  const endpoints = [];
  const rows = new Map();

  for (const row of quarantineRows) {
    const reasons = splitReasons(row.quarantineReasons);
    const rowKey = `${row.tenantKey}|${row.relationshipId}|${row.sourceRowNumber}`;
    const rowState = rows.get(rowKey) ?? {
      tenantKey: row.tenantKey,
      relationshipId: row.relationshipId,
      unresolvedEndpointCount: 0,
      codeOnlyEndpointCount: 0,
      sourceDataGatedEndpointCount: 0,
      ambiguousEndpointCount: 0,
    };

    for (const endpoint of endpointSpecs(row)) {
      if (!reasons.includes(endpoint.reason) || endpoint.nodeId) continue;
      const classification = classifyEndpointOpportunity({
        endpoint,
        tenantKey: row.tenantKey,
        buckets,
      });
      const endpointRecord = {
        tenantKey: row.tenantKey,
        relationshipId: row.relationshipId,
        sourceRowNumber: row.sourceRowNumber,
        side: endpoint.side,
        objectType: endpoint.objectType,
        opportunityClass: classification.opportunityClass,
        candidateCount: classification.candidateCount,
        proposedDisposition: classification.proposedDisposition,
      };
      endpoints.push(endpointRecord);
      rowState.unresolvedEndpointCount += 1;
      if (classification.opportunityClass.startsWith('code_only_')) {
        rowState.codeOnlyEndpointCount += 1;
      } else if (classification.opportunityClass === 'ambiguous_code_alias_candidate') {
        rowState.ambiguousEndpointCount += 1;
      } else {
        rowState.sourceDataGatedEndpointCount += 1;
      }
    }

    rows.set(rowKey, rowState);
  }

  const rowClassifications = [...rows.values()].filter((row) => row.unresolvedEndpointCount > 0);
  for (const row of rowClassifications) {
    if (row.codeOnlyEndpointCount > 0 && row.sourceDataGatedEndpointCount === 0 && row.ambiguousEndpointCount === 0) {
      row.rowOpportunityClass = 'all_unresolved_endpoints_code_only_candidate';
    } else if (row.codeOnlyEndpointCount > 0) {
      row.rowOpportunityClass = 'mixed_code_only_and_gated_endpoints';
    } else if (row.ambiguousEndpointCount > 0) {
      row.rowOpportunityClass = 'ambiguous_alias_review_gate';
    } else {
      row.rowOpportunityClass = 'source_data_dimension_or_edge_retirement_gate';
    }
  }

  return { endpoints, rowClassifications };
}

function percent(part, total) {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function writeMarkdown(filePath, report) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const lines = [
    '# Graph Quarantine Alias Analysis',
    '',
    `Source SHA: \`${report.sourceSha}\``,
    '',
    'This is a sanitized, report-only alias-opportunity analysis. It does not activate semantic identity aliases, write tenant data, materialize graph tables, refresh product projections, or make runtime truth claims.',
    '',
    '## Direct Answer',
    '',
    `Code-only alias candidates exist for ${report.totals.codeOnlyAliasCandidateEndpoints} unresolved endpoint(s), but semantic identity alias activation remains gated. The remaining ${report.totals.sourceDataGatedEndpoints} unresolved endpoint(s) require source evidence, dimension catalogue work, or edge retirement.`,
    '',
    '## Totals',
    '',
    `- Relationship rows: ${report.graphTotals.relationshipRows}`,
    `- Quarantined relationships: ${report.graphTotals.quarantinedRelationships}`,
    `- Unresolved endpoints analyzed: ${report.totals.unresolvedEndpointsAnalyzed}`,
    `- Code-only alias candidate endpoints: ${report.totals.codeOnlyAliasCandidateEndpoints}`,
    `- Fully code-only candidate rows: ${report.totals.fullyCodeOnlyCandidateRows}`,
    `- Source-data gated endpoints: ${report.totals.sourceDataGatedEndpoints}`,
    `- Semantic identity aliases activated: ${report.acceptance.semanticIdentityAliasActivationPerformed}`,
    `- Graph tables written: ${report.acceptance.graphTablesWritten}`,
    '',
    '## Endpoint Opportunity Classes',
    '',
    '| Class | Endpoints | Disposition |',
    '| --- | ---: | --- |',
    ...report.endpointClassBreakdown.map(
      (row) => `| \`${row.opportunityClass}\` | ${row.count} | \`${row.proposedDisposition}\` |`,
    ),
    '',
    '## Row Opportunity Classes',
    '',
    '| Class | Rows |',
    '| --- | ---: |',
    ...report.rowClassBreakdown.map((row) => `| \`${row.rowOpportunityClass}\` | ${row.count} |`),
    '',
    '## Tenant Aliases',
    '',
    '| Tenant | Unresolved endpoints | Code-only candidate endpoints | Source-data gated endpoints | Fully code-only candidate rows |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...report.perTenant.map(
      (tenant) =>
        `| ${tenant.tenant} | ${tenant.unresolvedEndpointsAnalyzed} | ${tenant.codeOnlyAliasCandidateEndpoints} | ${tenant.sourceDataGatedEndpoints} | ${tenant.fullyCodeOnlyCandidateRows} |`,
    ),
    '',
    '## Next Safe Slice',
    '',
    `- ${report.nextPrSizedSafeCodeSlice.title}: ${report.nextPrSizedSafeCodeSlice.scope}`,
    '',
    '## Gates Left Closed',
    '',
    ...report.gatesLeftClosed.map((gate) => `- ${gate}`),
  ];
  fs.writeFileSync(filePath, `${lines.join('\n')}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const graphDir = requireArg(args, 'graph-dir');
  const outDir = requireArg(args, 'out-dir');
  const sourceSha = requireArg(args, 'source-sha');

  const summary = readJson(path.join(graphDir, 'summary.json'));
  const nodes = readCsv(path.join(graphDir, 'graph-node-index.csv'));
  const quarantineRows = readCsv(path.join(graphDir, 'graph-quarantine.csv'));
  const tenantKeys = summary.tenants ?? Object.keys(summary.perTenant ?? {});
  const tenantAliases = anonymizeTenants(tenantKeys);
  const { endpoints, rowClassifications } = analyzeAliasOpportunities({ quarantineRows, nodes });
  const endpointClassBreakdown = countBy(endpoints, (row) => row.opportunityClass).map(({ key, count }) => {
    const sample = endpoints.find((row) => row.opportunityClass === key);
    return {
      opportunityClass: key,
      count,
      proposedDisposition: sample?.proposedDisposition ?? 'unknown',
    };
  });
  const rowClassBreakdown = countBy(rowClassifications, (row) => row.rowOpportunityClass).map(({ key, count }) => ({
    rowOpportunityClass: key,
    count,
  }));

  const codeOnlyAliasCandidateEndpoints = endpoints.filter((row) => row.opportunityClass.startsWith('code_only_')).length;
  const sourceDataGatedEndpoints = endpoints.filter(
    (row) => row.opportunityClass === 'source_data_dimension_or_edge_retirement_gate',
  ).length;
  const fullyCodeOnlyCandidateRows = rowClassifications.filter(
    (row) => row.rowOpportunityClass === 'all_unresolved_endpoints_code_only_candidate',
  ).length;

  const perTenant = tenantKeys.map((tenantKey) => {
    const tenantEndpoints = endpoints.filter((row) => row.tenantKey === tenantKey);
    const tenantRows = rowClassifications.filter((row) => row.tenantKey === tenantKey);
    return {
      tenant: tenantAliases.get(tenantKey),
      unresolvedEndpointsAnalyzed: tenantEndpoints.length,
      codeOnlyAliasCandidateEndpoints: tenantEndpoints.filter((row) => row.opportunityClass.startsWith('code_only_'))
        .length,
      sourceDataGatedEndpoints: tenantEndpoints.filter(
        (row) => row.opportunityClass === 'source_data_dimension_or_edge_retirement_gate',
      ).length,
      fullyCodeOnlyCandidateRows: tenantRows.filter(
        (row) => row.rowOpportunityClass === 'all_unresolved_endpoints_code_only_candidate',
      ).length,
      unresolvedEndpointRatePercent: percent(tenantEndpoints.length, summary.perTenant[tenantKey]?.relationshipRows ?? 0),
    };
  });

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: 'scripts/audit/build-graph-quarantine-alias-analysis.mjs',
    sourceSha,
    graphGeneratedAt: summary.generatedAt,
    mode: 'report_only_no_semantic_alias_activation_no_data_mutation_no_graph_materialization',
    publicDisclosure: 'Tenant identifiers are anonymized. Endpoint names, node names, source values, and source paths are omitted.',
    evidence: {
      graphReconciliation: `npm run audit:tenant-graph-reconciliation -- --tenant all --out ${graphDir}`,
      graphQuarantineAliasAnalysis: `npm run audit:graph-quarantine-alias-analysis -- --graph-dir ${graphDir} --out-dir ${outDir} --source-sha ${sourceSha}`,
    },
    graphTotals: {
      relationshipRows: summary.totals.relationshipRows,
      relationshipCandidates: summary.totals.relationshipCandidates,
      quarantinedRelationships: summary.totals.quarantinedRelationships,
      graphTablesWritten: summary.totals.graphTablesWritten,
      productReadModelsUpdated: summary.totals.productReadModelsUpdated,
    },
    totals: {
      unresolvedEndpointsAnalyzed: endpoints.length,
      rowsWithUnresolvedEndpoints: rowClassifications.length,
      codeOnlyAliasCandidateEndpoints,
      fullyCodeOnlyCandidateRows,
      sourceDataGatedEndpoints,
      ambiguousAliasCandidateEndpoints: endpoints.filter((row) => row.opportunityClass === 'ambiguous_code_alias_candidate')
        .length,
    },
    endpointClassBreakdown,
    rowClassBreakdown,
    perTenant,
    acceptance: {
      semanticIdentityAliasActivationPerformed: false,
      tenantDataMutated: false,
      graphTablesWritten: summary.totals.graphTablesWritten,
      productReadModelsUpdated: summary.totals.productReadModelsUpdated,
      rowLevelNamesOmitted: true,
    },
    nextPrSizedSafeCodeSlice: {
      title: 'Evaluate acronym alias candidates behind an explicit semantic-identity gate',
      scope:
        'Add fault-injected tests for unique acronym alias matching without changing graph materialization, registry activation, tenant data, or product read models.',
      hardGatesBeforeActivation: [
        'semantic identity alias activation',
        'registry activation',
        'graph table materialization',
        'data-plane load/write',
        'Layer 4 projection refresh',
      ],
    },
    gatesLeftClosed: [
      'No semantic identity alias activation.',
      'No tenant data mutation, move, deletion, or generated prose.',
      'No Azure/Postgres write or data-plane load.',
      'No registry/canonical store activation.',
      'No graph table materialization.',
      'No Layer 4 projection or product runtime refresh.',
      'No live-client truth claim.',
    ],
  };

  fs.mkdirSync(outDir, { recursive: true });
  writeJson(path.join(outDir, 'graph-quarantine-alias-analysis.json'), report);
  writeMarkdown(path.join(outDir, 'graph-quarantine-alias-analysis.md'), report);
  console.log(
    `graph-quarantine-alias-analysis: ${endpoints.length} unresolved endpoint(s), ${codeOnlyAliasCandidateEndpoints} code-only alias candidate(s), ${sourceDataGatedEndpoints} source-data gated endpoint(s)`,
  );
  console.log(`  report: ${outDir}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

export {
  acronym,
  analyzeAliasOpportunities,
  classifyEndpointOpportunity,
  compactSlug,
  splitReasons,
  slug,
};
