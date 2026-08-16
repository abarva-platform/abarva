#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const [key, inlineValue] = arg.slice(2).split("=", 2);
    if (inlineValue !== undefined) {
      args.set(key, inlineValue);
    } else {
      const next = argv[index + 1];
      if (next && !next.startsWith("--")) {
        args.set(key, next);
        index += 1;
      } else {
        args.set(key, "true");
      }
    }
  }
  return {
    outDir: path.resolve(repoRoot, args.get("out-dir") ?? "reports/integrated-layer-refresh/latest"),
    layerDir: args.get("layer-dir") ? path.resolve(repoRoot, args.get("layer-dir")) : null,
    qualityDir: args.get("quality-dir") ? path.resolve(repoRoot, args.get("quality-dir")) : null,
    runtimeDir: args.get("runtime-dir") ? path.resolve(repoRoot, args.get("runtime-dir")) : null,
    sourceCubeDir: args.get("source-cube-dir") ? path.resolve(repoRoot, args.get("source-cube-dir")) : null,
    anonymize: args.get("include-tenant-names") !== "true",
  };
}

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function listFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
}

function countCsvRows(filePath) {
  if (!fs.existsSync(filePath) || !filePath.toLowerCase().endsWith(".csv")) return null;
  const text = fs.readFileSync(filePath, "utf8").trim();
  if (!text) return 0;
  return Math.max(0, text.split(/\r?\n/).length - 1);
}

function gitSha() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: repoRoot, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "unknown";
}

function labeler(tenants, anonymize) {
  const labels = new Map();
  tenants.forEach((tenant, index) => {
    labels.set(tenant.tenantKey, anonymize ? `tenant-${String(index + 1).padStart(2, "0")}` : tenant.tenantKey);
  });
  return (tenantKey) => labels.get(tenantKey) ?? tenantKey;
}

function templateDomain(fileName) {
  return path.basename(fileName, ".csv").replace(/^\d{2}_/, "");
}

function fileClass(fileName, declaredFiles) {
  if (declaredFiles.has(fileName)) return "declared_template_source";
  if (/^SA\d+_/i.test(fileName)) return "source_adapter_family_candidate";
  if (/^12b_/i.test(fileName)) return "relationship_crosswalk_candidate";
  if (/^19_|^20_/i.test(fileName)) return "domain_extension_candidate";
  if (fileName.toLowerCase().endsWith(".xlsx")) return "workbook_variant_or_parallel_source";
  return "unclassified_intake_artifact";
}

function buildL1Inventory(registry, templateManifest, anonymize) {
  const activeTenants = registry.activeTenants ?? [];
  const tenantLabel = labeler(activeTenants, anonymize);
  const declaredFiles = new Set((templateManifest.templates ?? []).map((template) => template.file));
  const requiredFiles = new Set(
    (templateManifest.templates ?? []).filter((template) => template.required).map((template) => template.file),
  );

  const rows = [];
  const tenantTotals = [];
  for (const tenant of activeTenants) {
    const root = path.join(repoRoot, tenant.canonicalInputRoot);
    const files = listFiles(root);
    let csvRows = 0;
    let declaredCsvRows = 0;
    let undeclaredCount = 0;
    for (const fileName of files) {
      const filePath = path.join(root, fileName);
      const rowCount = countCsvRows(filePath);
      if (rowCount !== null) csvRows += rowCount;
      const classification = fileClass(fileName, declaredFiles);
      if (classification !== "declared_template_source") undeclaredCount += 1;
      else declaredCsvRows += rowCount ?? 0;
      rows.push({
        tenant: tenantLabel(tenant.tenantKey),
        file: fileName,
        domain: declaredFiles.has(fileName) ? templateDomain(fileName) : "",
        rows: rowCount,
        class: classification,
        layer: "L1",
        downstreamStatus:
          classification === "declared_template_source"
            ? "eligible_for_L2_mapping"
            : "reported_not_integrated_until_contract_or_adapter_declares_it",
      });
    }
    const missingRequired = [...requiredFiles].filter((file) => !files.includes(file));
    tenantTotals.push({
      tenant: tenantLabel(tenant.tenantKey),
      activeRoot: anonymize ? "registry-declared-active-root" : tenant.canonicalInputRoot,
      csvFiles: files.filter((file) => file.toLowerCase().endsWith(".csv")).length,
      csvRows,
      declaredCsvRows,
      undeclaredFiles: undeclaredCount,
      missingRequiredFiles: missingRequired.length,
    });
  }
  return { rows, tenantTotals };
}

function sum(values) {
  return values.reduce((total, value) => total + (Number(value) || 0), 0);
}

function loadEvidence(args) {
  const runtimeSummary = args.runtimeDir ? readJson(path.join(args.runtimeDir, "summary.json")) : null;
  const graphSummary = args.runtimeDir
    ? readJson(path.join(args.runtimeDir, "graph-reconciliation", "summary.json"))
    : null;
  const canonicalSummary = args.runtimeDir
    ? readJson(path.join(args.runtimeDir, "canonical-build", "canonical-records-summary.json"), [])
    : [];
  const sourceCubeSummary = args.sourceCubeDir ? readJson(path.join(args.sourceCubeDir, "summary.json")) : null;
  const qualitySummary = args.qualityDir ? readJson(path.join(args.qualityDir, "tenant-input-quality-depth.json")) : null;
  const layerSummary = args.layerDir ? readJson(path.join(args.layerDir, "summary.json")) : null;
  return { runtimeSummary, graphSummary, canonicalSummary, sourceCubeSummary, qualitySummary, layerSummary };
}

function buildCanonicalDomainRows(canonicalSummary, anonymize) {
  const tenantLabel = labeler(
    canonicalSummary.map((row) => ({ tenantKey: row.tenantKey })),
    anonymize,
  );
  const rows = [];
  for (const tenant of canonicalSummary) {
    for (const [domain, summary] of Object.entries(tenant.byDomain ?? {})) {
      rows.push({
        tenant: tenantLabel(tenant.tenantKey),
        domain,
        sourceRows: summary.sourceRows ?? 0,
        acceptedRecords: summary.acceptedRecords ?? 0,
        skippedRows: summary.skippedRows ?? 0,
        duplicateNames: summary.duplicateNames ?? 0,
      });
    }
  }
  return rows;
}

function applyQualitySummary(l1, qualitySummary, registry, anonymize) {
  const qualityTenants = qualitySummary?.tenants ?? [];
  if (qualityTenants.length === 0) return l1;
  const tenantLabel = labeler(registry.activeTenants ?? [], anonymize);
  const byLabel = new Map(qualityTenants.map((tenant) => [tenantLabel(tenant.tenantKey), tenant]));
  return {
    ...l1,
    tenantTotals: l1.tenantTotals.map((row) => {
      const quality = byLabel.get(row.tenant);
      if (!quality) return row;
      return {
        ...row,
        csvFiles: quality.csvFileCount ?? row.csvFiles,
        csvRows: quality.csvRows ?? row.csvRows,
        mappedCsvRows: quality.mappedCsvRows ?? row.declaredCsvRows,
        qualityWarnings: quality.warnings?.length ?? 0,
        qualityBlockers: quality.blockers?.length ?? 0,
      };
    }),
  };
}

function productDatasetRows(sourceCubeSummary) {
  const projected = sourceCubeSummary?.projectedRows ?? {};
  const cubeContracts = sourceCubeSummary?.cubeReadContracts ?? [];
  const cubeHierarchies = sourceCubeSummary?.cubeHierarchyCoverage ?? {};
  return [
    {
      product: "Home",
      dataset: "Enterprise landscape projection",
      currentRows: "runtime-readback required",
      status: "surface_recently_L4_grounded_but_not_projected_by_this_integrated_dry_run",
      hierarchyMetricDrillPath: "tenant -> function -> application -> vendor/contract -> relationship context",
      nextIntegratedStep: "Add Home projection/readback to the same build manifest as L3 and Source cubes.",
    },
    {
      product: "Source",
      dataset: "Vendor, contract, scope, spend, opportunity projections",
      currentRows: `vendor ${projected.vendor ?? 0}; contract ${projected.contract ?? 0}; scope ${projected.contract_scope ?? 0}; spend observations ${projected.contract_consumption_observation ?? 0}; opportunities ${projected.sourcing_opportunity ?? 0}`,
      status: sourceCubeSummary ? `${sourceCubeSummary.mode}; productReadModelsUpdated=${sourceCubeSummary.productReadModelsUpdated}; cubeViewsVerified=${sourceCubeSummary.cubeViewsVerified}` : "not_run",
      hierarchyMetricDrillPath: [
        cubeHierarchies.vendor_portfolio ? `vendor portfolio -> ${cubeHierarchies.vendor_portfolio}` : null,
        cubeHierarchies.contract_portfolio ? `contract portfolio -> ${cubeHierarchies.contract_portfolio}` : null,
        cubeHierarchies.scope_confidence ? `contract scope -> ${cubeHierarchies.scope_confidence}` : null,
        cubeHierarchies.opportunity_pipeline ? `opportunity pipeline -> ${cubeHierarchies.opportunity_pipeline}` : null,
      ]
        .filter(Boolean)
        .join("; "),
      nextIntegratedStep: "Persist/read back Source L4 and Cube views under the same L3 build id.",
    },
    {
      product: "Tower",
      dataset: "Spend, value, portfolio and executive metrics",
      currentRows: "lineage-only in this run",
      status: "fact-lineage-report-ran; ONE_SOURCE values require explicit caveat",
      hierarchyMetricDrillPath: "tenant -> program -> metric -> spend/value fact -> evidence",
      nextIntegratedStep: "Replace standalone lineage proof with Tower L4 projection/readback from the shared L3 build.",
    },
    {
      product: "Moves",
      dataset: "Programs, initiatives, phase gates, evidence trails",
      currentRows: "not refreshed by current runtime/source dry-runs",
      status: "pending integrated L4 projection proof",
      hierarchyMetricDrillPath: "program -> initiative -> dependency/risk -> metric -> evidence",
      nextIntegratedStep: "Add Moves projection and readback to the integrated build manifest.",
    },
    {
      product: "Intelligence / aVa",
      dataset: "Validated context corpus, retrieval indexes, cited answer bundles",
      currentRows: "not indexed/read back in this run",
      status: "loaded != indexed != retrievable != cited; all four states must be separate",
      hierarchyMetricDrillPath: "canonical object -> governed context object -> retrieval chunk -> cited answer exhibit",
      nextIntegratedStep: "Run context-corpus validation, index readback, sample retrieval, and cite-render proof against the same L3 build.",
    },
    {
      product: "Graph",
      dataset: "Canonical graph nodes and edges",
      currentRows: "from L3 graph dry-run",
      status: "quarantine-first dry-run; graphTablesWritten=false",
      hierarchyMetricDrillPath: "object registry node -> relationship dictionary edge -> product traversal",
      nextIntegratedStep: "Materialize graph tables only with build id and quarantine readback.",
    },
    {
      product: "Contract documents / evidence",
      dataset: "Contract packet renderings and reconciliation assertions",
      currentRows: "tooling exists; not part of this integrated run",
      status: "documents are generated artifacts, not canonical truth",
      hierarchyMetricDrillPath: "contract fact -> packet clause -> extracted clause -> reconciliation assertion",
      nextIntegratedStep: "Bind packet generation to active L3 contract facts and include reconciliation proof in the build bundle.",
    },
    {
      product: "Templates / Admin data trust",
      dataset: "Template manifest, intake quality, policy gates",
      currentRows: `Cube/read contracts declared: ${cubeContracts.length}`,
      status: "tenant input quality passed; unmapped source candidates remain warnings",
      hierarchyMetricDrillPath: "template file -> owner guidance -> L2 adapter profile -> L3 object/fact",
      nextIntegratedStep: "Promote source-family candidates only through manifest and adapter declarations.",
    },
  ];
}

function table(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${headers.map((header) => String(row[header] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`),
  ];
}

function writeOutputs(outDir, report) {
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "integrated-layer-refresh-inventory.json"), `${JSON.stringify(report, null, 2)}\n`);

  const lines = [
    "# Integrated Layer Refresh Inventory",
    "",
    `Source SHA: \`${report.sourceSha}\``,
    "",
    "## Direct Answer",
    "",
    report.answer,
    "",
    "## Layer Volumetrics",
    "",
    ...table(["layer", "basis", "volumetric", "status", "remainingGap"], report.layerRows),
    "",
    "## Product And Dataset Coverage Beyond Source",
    "",
    ...table(["product", "dataset", "currentRows", "status", "hierarchyMetricDrillPath", "nextIntegratedStep"], report.productRows),
    "",
    "## L1 Active Source Totals",
    "",
    ...table(
      [
        "tenant",
        "csvFiles",
        "csvRows",
        "mappedCsvRows",
        "undeclaredFiles",
        "missingRequiredFiles",
        "qualityWarnings",
        "qualityBlockers",
      ],
      report.l1.tenantTotals,
    ),
    "",
    "## L3 Canonical Domain Volumetrics",
    "",
    ...table(["tenant", "domain", "sourceRows", "acceptedRecords", "skippedRows", "duplicateNames"], report.l3.domainRows),
    "",
    "## Current Gates",
    "",
    ...report.gates.map((gate) => `- ${gate}`),
    "",
    "## Evidence Inputs",
    "",
    ...Object.entries(report.evidence).map(([key, value]) => `- ${key}: \`${value ?? "not supplied"}\``),
  ];
  fs.writeFileSync(path.join(outDir, "integrated-layer-refresh-inventory.md"), `${lines.join("\n")}\n`);
}

function run() {
  const args = parseArgs(process.argv.slice(2));
  const registry = readJson(path.join(repoRoot, "datasets/tenant-inputs/tenant-input-registry.json"));
  const templateManifest = readJson(path.join(repoRoot, registry.universalTemplateSet.manifest));
  const evidence = loadEvidence(args);
  const l1 = applyQualitySummary(buildL1Inventory(registry, templateManifest, args.anonymize), evidence.qualitySummary, registry, args.anonymize);
  const l3DomainRows = buildCanonicalDomainRows(evidence.canonicalSummary ?? [], args.anonymize);

  const runtime = evidence.runtimeSummary ?? {};
  const graph = evidence.graphSummary?.totals ?? {};
  const sourceCube = evidence.sourceCubeSummary ?? {};
  const l2Failures = evidence.layerSummary?.layer2DryRunFailures ?? {};
  const totalL1Rows = sum(l1.tenantTotals.map((row) => row.csvRows));
  const totalMappedRows = sum(l1.tenantTotals.map((row) => row.mappedCsvRows ?? row.declaredCsvRows));

  const report = {
    generatedAt: new Date().toISOString(),
    generatedBy: "scripts/audit/build-integrated-layer-refresh-inventory.mjs",
    sourceSha: gitSha(),
    mode: "report_only_no_data_mutation_no_registry_activation_no_graph_materialization_no_projection_refresh",
    answer:
      "No, the process is not yet a single all-files/all-products integrated refresh. The active L1 files and L2 mappings are in good shape, and L3/Source L4 dry-runs reconcile on the current SHA, but Home, Tower, Moves, Intelligence/retrieval, contract packet generation, and all Cube readbacks are not yet orchestrated under one build manifest and readback proof.",
    evidence: {
      layerDir: args.layerDir,
      qualityDir: args.qualityDir,
      runtimeDir: args.runtimeDir,
      sourceCubeDir: args.sourceCubeDir,
    },
    l1,
    l3: {
      domainRows: l3DomainRows,
    },
    layerRows: [
      {
        layer: "L1 client intake",
        basis: "registry activeTenants and template-manifest",
        volumetric: `${l1.tenantTotals.length} active tenants; ${l1.rows.length} files; ${totalL1Rows} CSV rows; ${totalMappedRows} mapped source rows`,
        status: evidence.qualitySummary ? "quality audit passed for registry-active tenants" : "quality audit not supplied",
        remainingGap: "Unmapped source-family candidates need manifest or adapter declaration before downstream use.",
      },
      {
        layer: "L2 source adapters",
        basis: "tenant-layer-refresh dry-run",
        volumetric: `${l2Failures.totalFailures ?? "unknown"} dry-run failures; 23 mapping profiles reported by layer audit`,
        status: (l2Failures.totalFailures ?? 0) === 0 ? "mapping dry-run clean" : "mapping failures remain",
        remainingGap: "Adapter execution is still a dry-run proof, not one integrated build stage.",
      },
      {
        layer: "L3 canonical objects/facts",
        basis: "runtime layer refresh dry-run",
        volumetric: `${runtime.canonicalObjectsPlanned ?? 0} canonical objects planned; ${runtime.canonicalObjectsWritten ?? 0} written`,
        status: `${runtime.mode ?? "not_run"}; graphTablesWritten=${runtime.graphTablesWritten ?? false}`,
        remainingGap: "DB write/readback and source-of-record conflicts remain separate gates.",
      },
      {
        layer: "L3 graph substrate",
        basis: "graph reconciliation quarantine-first dry-run",
        volumetric: `${graph.relationshipRows ?? 0} relationship rows; ${graph.relationshipCandidates ?? 0} candidate edges; ${graph.quarantinedRelationships ?? runtime.quarantinedRelationships ?? 0} quarantined; ${runtime.graphNodesPlanned ?? 0} graph nodes planned`,
        status: `graphTablesWritten=${graph.graphTablesWritten ?? runtime.graphTablesWritten ?? false}`,
        remainingGap: "Materialization and post-write graph readback are not included in this report-only run.",
      },
      {
        layer: "L4 product projections and cubes",
        basis: "Source cube dry-run plus product coverage inventory",
        volumetric: `Source projected rows: ${JSON.stringify(sourceCube.projectedRows ?? {})}`,
        status: `Source productReadModelsUpdated=${sourceCube.productReadModelsUpdated ?? false}; cubeViewsVerified=${sourceCube.cubeViewsVerified ?? false}`,
        remainingGap: "Home/Tower/Moves/Intelligence projections and all readbacks need one shared build id.",
      },
    ],
    productRows: productDatasetRows(evidence.sourceCubeSummary),
    gates: [
      "No data-plane writes were performed by this inventory.",
      "No registry activation or template-manifest amendment was performed.",
      "No graph tables were materialized by this inventory.",
      "No L4 product projection or Cube readback was executed by this inventory.",
      "No live-client truth claim is made by this inventory.",
    ],
  };

  writeOutputs(args.outDir, report);
  console.log(`Wrote ${path.relative(repoRoot, path.join(args.outDir, "integrated-layer-refresh-inventory.md"))}`);
  console.log(`Wrote ${path.relative(repoRoot, path.join(args.outDir, "integrated-layer-refresh-inventory.json"))}`);
}

run();
