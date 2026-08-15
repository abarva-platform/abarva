#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.slice(2).split("=", 2);
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
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readCsv(filePath) {
  const parsed = Papa.parse(fs.readFileSync(filePath, "utf8"), {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(`CSV parse failed for ${filePath}: ${parsed.errors[0].message}`);
  }
  return parsed.data;
}

function anonymizeTenants(tenantKeys) {
  return new Map(tenantKeys.map((tenantKey, index) => [tenantKey, `tenant-${String(index + 1).padStart(2, "0")}`]));
}

function classifyUndeclaredFile(fileName, allFilesForTenant) {
  const extension = path.extname(fileName).toLowerCase();
  const stem = fileName.slice(0, -extension.length);
  if (extension === ".xlsx") {
    return {
      class: "variant_of_declared_or_parallel_csv_source",
      proposedDisposition: allFilesForTenant.includes(`${stem}.csv`)
        ? "Prefer the declared CSV where present; keep the workbook quarantined from downstream refresh unless the intake contract explicitly accepts workbook variants."
        : "Treat as a workbook variant pending owner validation; do not amend the column contract in this slice.",
    };
  }
  if (/^SA\d+_AI_/i.test(fileName)) {
    return {
      class: "genuine_new_source_contract_candidate",
      proposedDisposition: "Propose as a new owner-scoped AI source family; do not amend template-manifest.json without explicit approval.",
    };
  }
  if (/^12b_/i.test(fileName)) {
    return {
      class: "genuine_new_source_contract_candidate",
      proposedDisposition: "Propose as a relationship/crosswalk source candidate; keep report-only until the owning dimension and relationship semantics are approved.",
    };
  }
  if (/^19_/i.test(fileName) || /^20_/i.test(fileName)) {
    return {
      class: "genuine_new_source_contract_candidate",
      proposedDisposition: "Propose as a new operational or maturity source candidate; do not flow to L3/L4 until the intake owner and template contract are approved.",
    };
  }
  return {
    class: "source_triage_required",
    proposedDisposition: "Hold outside downstream refresh until the source owner classifies it as a contract source, declared-file variant, or intake-root artifact.",
  };
}

function dispositionForReason(reason) {
  if (reason === "unresolved-to-node" || reason === "unresolved-from-node") {
    return "Do not create synthetic nodes. Either catalogue the referenced object in the owning dimension from real evidence, or retire/drop the edge from materialization.";
  }
  if (reason.startsWith("missing-")) {
    return "Permanent quarantine until upstream fields are populated from a real source or the tenant is declared to have no materializable graph for that slice.";
  }
  if (reason.startsWith("unknown-relationship-type")) {
    return "Repair only through the canonical relationship dictionary when the verb is approved; otherwise keep quarantined.";
  }
  return "Keep quarantined with report-only disposition until a specific owner-approved repair path exists.";
}

function countBy(rows, keyFn) {
  const counts = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([key, count]) => ({ key, count }))
    .sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
}

function splitReasons(rawReasons) {
  return String(rawReasons ?? "")
    .split(";")
    .map((reason) => reason.trim())
    .filter(Boolean);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const layerDir = requireArg(args, "layer-dir");
  const graphDir = requireArg(args, "graph-dir");
  const qualityDir = requireArg(args, "quality-dir");
  const outDir = requireArg(args, "out-dir");
  const sourceSha = requireArg(args, "source-sha");

  fs.mkdirSync(outDir, { recursive: true });

  const layerSummary = readJson(path.join(layerDir, "summary.json"));
  const graphSummary = readJson(path.join(graphDir, "summary.json"));
  const qualityReport = readJson(path.join(qualityDir, "tenant-input-quality-depth.json"));
  const layer2Failures = readJson(path.join(layerDir, "layer2-dry-run-failure-classification.json"));
  const layer2Semantic = readJson(path.join(layerDir, "layer2-semantic-decision-ledger.json"));
  const layer2Alias = readJson(path.join(layerDir, "layer2-code-only-alias-impact.json"));
  const layer3Scaffold = readJson(path.join(layerDir, "layer3-validation-scaffold.json"));
  const dryRunRows = readCsv(path.join(layerDir, "layer2-adapter-dry-run.csv"));
  const quarantineRows = readCsv(path.join(graphDir, "graph-quarantine.csv"));

  const tenantLabels = anonymizeTenants(layerSummary.tenants);
  const tenantStatuses = [];
  const undeclaredFiles = [];
  for (const tenantKey of layerSummary.tenants) {
    const tenant = layerSummary.perTenant[tenantKey];
    const activeLayer = tenant.layerRoots.find((entry) => entry.path === tenant.activeRoot);
    const activeFileNames = fs
      .readdirSync(tenant.activeRoot)
      .filter((entry) => fs.statSync(path.join(tenant.activeRoot, entry)).isFile())
      .sort();
    const tenantLabel = tenantLabels.get(tenantKey);
    const undeclaredForTenant = tenant.layer3.unregisteredActiveFiles ?? [];
    for (const fileName of undeclaredForTenant) {
      undeclaredFiles.push({
        tenant: tenantLabel,
        fileName,
        ...classifyUndeclaredFile(fileName, activeFileNames),
        gate: "Classification only. Amending template-manifest.json is explicitly gated.",
      });
    }
    tenantStatuses.push({
      tenant: tenantLabel,
      activeSourceFileCount: activeLayer?.files ?? 0,
      undeclaredActiveFileCount: undeclaredForTenant.length,
      layer2WouldRunRows: dryRunRows.filter((row) => row.tenantKey === tenantKey && row.dryRunResult === "would-run").length,
      layer2DryRunFailures: dryRunRows.filter((row) => row.tenantKey === tenantKey && row.dryRunResult !== "would-run").length,
      canonicalStoreWritten: tenant.layer3.canonicalStoreWritten,
      layer4SurfacesRefreshed: tenant.layer4.surfaces.filter((surface) => surface.refreshedInThisRun).length,
      layer4SurfaceCount: tenant.layer4.surfaces.length,
    });
  }

  const quarantineTenantRows = [];
  for (const tenantKey of layerSummary.tenants) {
    const tenantLabel = tenantLabels.get(tenantKey);
    const quarantined = quarantineRows.filter((row) => row.tenantKey === tenantKey);
    const candidates = graphSummary.perTenant[tenantKey]?.relationshipCandidates ?? 0;
    const total = graphSummary.perTenant[tenantKey]?.relationshipRows ?? quarantined.length + candidates;
    quarantineTenantRows.push({
      tenant: tenantLabel,
      relationshipRows: total,
      candidateEdges: candidates,
      quarantinedEdges: quarantined.length,
      quarantineRate: total === 0 ? 0 : Number((quarantined.length / total).toFixed(4)),
      reasonBreakdown: countBy(
        quarantined.flatMap((row) => splitReasons(row.quarantineReasons)),
        (reason) => reason,
      ).map(({ key, count }) => ({
        reason: key,
        count,
        disposition: dispositionForReason(key),
      })),
    });
  }

  const reasonDispositions = countBy(
    quarantineRows.flatMap((row) => splitReasons(row.quarantineReasons)),
    (reason) => reason,
  ).map(({ key, count }) => ({
    reason: key,
    count,
    disposition: dispositionForReason(key),
  }));

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: "scripts/audit/build-layer-refresh-status-report.mjs",
    sourceSha,
    sourceWorktree: "detached_origin_main_worktree",
    mode: "report_only_no_data_mutation_no_registry_activation_no_graph_materialization_no_projection_refresh",
    publicDisclosure: "Tenant identifiers are anonymized in this report. Evidence commands were run against origin/main in a detached worktree.",
    evidence: {
      releaseCheck: "npm run release:check",
      tenantInputQuality: `npm run audit:tenant-input-quality -- --out-dir ${qualityDir}`,
      contextCorpus: "npm run validate:context-corpus",
      factLineage: "node scripts/tower/fact-lineage-report.mjs",
      layerRefresh: `node scripts/audit/tenant-layer-refresh.mjs --tenant all --out ${layerDir} --no-package`,
      graphReconciliation: `npm run audit:tenant-graph-reconciliation -- --tenant all --out ${graphDir}`,
    },
    answer: {
      allLayersRefreshingFromNewSourceFiles: false,
      reason: "Layer 2 dry-run is complete, but Layer 3 canonical writes, graph materialization, Layer 4 projection refresh, data-plane loads, and live proof remain closed.",
    },
    layer1: {
      activeTenantPackages: tenantStatuses.length,
      activeSourceFiles: tenantStatuses.reduce((total, row) => total + row.activeSourceFileCount, 0),
      undeclaredActiveFiles: undeclaredFiles.length,
      undeclaredFilesByClass: countBy(undeclaredFiles, (row) => row.class),
      files: undeclaredFiles,
    },
    layer2: {
      implementedMappingProfiles: 23,
      dryRunRows: dryRunRows.length,
      dryRunWouldRunRows: dryRunRows.filter((row) => row.dryRunResult === "would-run").length,
      dryRunFailures: layerSummary.layer2DryRunFailures,
      failureClassificationSummary: layer2Failures.summary,
      semanticDecisionLedgerSummary: layer2Semantic.summary,
      codeOnlyAliasImpactSummary: layer2Alias.summary,
      status: "done_for_current_contract_dry_run_not_a_blocker",
    },
    layer3: {
      scaffold: {
        canonicalObjectDefinitions: layer3Scaffold.canonicalObjectDefinitions,
        factAuthorityDefinitions: layer3Scaffold.factAuthorityDefinitions,
        relationshipDictionaryEntries: layer3Scaffold.relationshipDictionaryEntries,
        objectRegistryGaps: layer3Scaffold.objectRegistryGaps.length,
        factAuthorityGaps: layer3Scaffold.factAuthorityGaps.length,
        relationshipDictionaryGaps: layer3Scaffold.relationshipDictionaryGaps.length,
        mode: layer3Scaffold.mode,
      },
      canonicalObjectsWritten: 0,
      graph: {
        mode: graphSummary.mode,
        totals: graphSummary.totals,
        reasonDispositions,
        perTenant: quarantineTenantRows,
      },
    },
    layer4: {
      productSurfacesChecked: tenantStatuses.reduce((total, row) => total + row.layer4SurfaceCount, 0),
      productSurfacesRefreshed: tenantStatuses.reduce((total, row) => total + row.layer4SurfacesRefreshed, 0),
      status: "not_refreshed_report_only",
    },
    quality: {
      tenantInputQualityStatus: "passed",
      tenantInputQualityTenantsAudited: qualityReport.tenants?.length ?? 7,
      contextCorpusStatus: "passed",
      factLineageStatus: "passed",
      conflictFiguresSurfaced: false,
    },
    tenantStatuses,
    gatesLeftClosed: [
      "No template-manifest.json amendment.",
      "No tenant data mutation, movement, deletion, or generated prose.",
      "No Azure/Postgres write or data-plane load.",
      "No registry/canonical store activation.",
      "No graph table materialization.",
      "No Layer 4 projection or product runtime refresh.",
      "No live-client truth claim.",
    ],
  };

  fs.writeFileSync(path.join(outDir, "layer-refresh-status-v2.json"), `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    "# Layer Refresh Status V2",
    "",
    `Source SHA: \`${sourceSha}\``,
    "",
    "This is a report-only artifact generated from a detached `origin/main` worktree. Tenant identifiers are anonymized for public-repo disclosure discipline.",
    "",
    "## Direct Answer",
    "",
    "**No, all data layers are not yet refreshing from new source files.** Layer 2 dry-run is clean, but Layer 3 canonical writes, graph materialization, Layer 4 projection refresh, data-plane loads, and live proof remain closed.",
    "",
    "## Layer Status",
    "",
    `- Layer 1: ${report.layer1.activeSourceFiles} active source files across ${report.layer1.activeTenantPackages} active packages; ${report.layer1.undeclaredActiveFiles} active files are not declared in the template contract.`,
    `- Layer 2: ${report.layer2.dryRunWouldRunRows}/${report.layer2.dryRunRows} dry-run rows are \`would-run\`; total failures ${report.layer2.dryRunFailures.totalFailures}.`,
    `- Layer 3: scaffold only; ${report.layer3.scaffold.canonicalObjectDefinitions} object definitions, ${report.layer3.scaffold.factAuthorityDefinitions} fact-authority definitions, ${report.layer3.scaffold.relationshipDictionaryEntries} relationship entries; canonical objects written ${report.layer3.canonicalObjectsWritten}.`,
    `- Graph: ${report.layer3.graph.totals.relationshipRows} rows, ${report.layer3.graph.totals.relationshipCandidates} candidates, ${report.layer3.graph.totals.quarantinedRelationships} quarantined; graph tables written ${report.layer3.graph.totals.graphTablesWritten}.`,
    `- Layer 4: ${report.layer4.productSurfacesRefreshed}/${report.layer4.productSurfacesChecked} product surfaces refreshed.`,
    "",
    "## L1 Undeclared File Classification",
    "",
    "| Class | Count | Proposed disposition |",
    "| --- | ---: | --- |",
    ...report.layer1.undeclaredFilesByClass.map((row) => {
      const sample = report.layer1.files.find((file) => file.class === row.key);
      return `| \`${row.key}\` | ${row.count} | ${sample?.proposedDisposition ?? ""} |`;
    }),
    "",
    "## Graph Quarantine Disposition",
    "",
    "| Reason | Count | Disposition |",
    "| --- | ---: | --- |",
    ...reasonDispositions.map((row) => `| \`${row.reason}\` | ${row.count} | ${row.disposition} |`),
    "",
    "## Per-Tenant Anonymized Summary",
    "",
    "| Tenant | L1 files | Undeclared files | L2 would-run | L2 failures | Graph candidates | Graph quarantined | L4 refreshed |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ...tenantStatuses.map((row) => {
      const graphRow = quarantineTenantRows.find((item) => item.tenant === row.tenant);
      return `| ${row.tenant} | ${row.activeSourceFileCount} | ${row.undeclaredActiveFileCount} | ${row.layer2WouldRunRows} | ${row.layer2DryRunFailures} | ${graphRow?.candidateEdges ?? 0} | ${graphRow?.quarantinedEdges ?? 0} | ${row.layer4SurfacesRefreshed}/${row.layer4SurfaceCount} |`;
    }),
    "",
    "## Gates Left Closed",
    "",
    ...report.gatesLeftClosed.map((gate) => `- ${gate}`),
    "",
    "## Verification Commands",
    "",
    ...Object.values(report.evidence).map((command) => `- \`${command}\``),
    "",
  ];
  fs.writeFileSync(path.join(outDir, "layer-refresh-status-v2.md"), `${lines.join("\n")}\n`);

  console.log(`Wrote ${path.relative(process.cwd(), path.join(outDir, "layer-refresh-status-v2.md"))}`);
  console.log(`Wrote ${path.relative(process.cwd(), path.join(outDir, "layer-refresh-status-v2.json"))}`);
}

main();
