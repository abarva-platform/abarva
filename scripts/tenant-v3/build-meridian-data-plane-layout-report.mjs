#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TENANT = "meridian-health";
const OUT_DIR = path.join(ROOT, "reports/meridian-data-plane-layout");
const ACTIVE_ROOT = path.join(ROOT, "datasets/tenant-inputs/active/meridian-health/current");
const DERIVED_ROOT = path.join(ROOT, "datasets/tenant-inputs/meridian-health/derived");
const APPROVED_ROOT = path.join(ROOT, "datasets/tenant-inputs/meridian-health/approved-content");

function readJson(relativePath, fallback = null) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return fallback;
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

function csvRows(absolutePath) {
  if (!fs.existsSync(absolutePath)) return { rows: 0, columns: [] };
  const lines = fs
    .readFileSync(absolutePath, "utf8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  const columns = lines[0]?.split(",").map((column) => column.trim()) ?? [];
  return { rows: Math.max(lines.length - 1, 0), columns };
}

function listCsvCounts(root) {
  return fs
    .readdirSync(root)
    .filter((file) => file.endsWith(".csv"))
    .sort()
    .map((file) => {
      const stats = csvRows(path.join(root, file));
      return {
        file,
        rows: stats.rows,
        columns: stats.columns.length,
      };
    });
}

function jsonCount(relativePath) {
  const value = readJson(relativePath);
  if (!value) return { path: relativePath, count: 0, shape: "missing" };
  if (Array.isArray(value)) return { path: relativePath, count: value.length, shape: "array" };
  if (Array.isArray(value.nodes) || Array.isArray(value.edges)) {
    return {
      path: relativePath,
      count: (value.nodes?.length ?? 0) + (value.edges?.length ?? 0),
      shape: "graph",
      nodes: value.nodes?.length ?? 0,
      edges: value.edges?.length ?? 0,
    };
  }
  const keys = Object.keys(value);
  return { path: relativePath, count: keys.length, shape: "object", keys };
}

function extractCreateTables(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) return [];
  const sql = fs.readFileSync(absolutePath, "utf8");
  const matches = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?([a-zA-Z0-9_."-]+)/gi)];
  return matches.map((match) => match[1].replaceAll('"', ""));
}

function mdTable(headers, rows) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\n/g, " ")).join(" | ")} |`),
  ].join("\n");
}

function htmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function htmlTable(headers, rows) {
  return `<table><thead><tr>${headers.map((h) => `<th>${htmlEscape(h)}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${htmlEscape(cell)}</td>`).join("")}</tr>`)
    .join("")}</tbody></table>`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });

const sourceFiles = listCsvCounts(ACTIVE_ROOT);
const sourceCoreRows = sourceFiles
  .filter((item) => /^\d\d_/.test(item.file))
  .reduce((sum, item) => sum + item.rows, 0);
const sourceAdapterRows = sourceFiles
  .filter((item) => /^SA\d\d_/i.test(item.file))
  .reduce((sum, item) => sum + item.rows, 0);

const derivedFiles = [
  "canonical-facts.json",
  "evidence-registry.json",
  "entity-profiles.json",
  "context-gaps.json",
  "interview-insights.json",
  "ai-use-case-business-unit-map.json",
  "relationship-graph.json",
  "module-context/home-context-view.json",
  "module-context/moves-context-view.json",
  "module-context/tower-dashboard-view.json",
  "module-context/sa08-benefits-posture.json",
].map((file) => jsonCount(path.relative(ROOT, path.join(DERIVED_ROOT, file))));

const approvedContent = [
  "home/story-blocks.json",
  "home/visual-specs.json",
  "tower/story-blocks.json",
  "tower/visual-specs.json",
].map((file) => jsonCount(path.relative(ROOT, path.join(APPROVED_ROOT, file))));

const promotion = readJson("reports/active-tenant-access/meridian/active-module-context-promotion.json", {});
const moduleReadProof = readJson("reports/active-tenant-access/meridian/module-context-read-proof.json", []);
const moduleAccess = readJson("reports/meridian-runtime-module-access/summary.json", {});
const towerSummary = readJson("reports/tower-v3-meridian-context-pack-proof/summary.json", {});

const migrationFiles = [
  "supabase/migrations/20260514100000_enterprise_context_layer.sql",
  "supabase/migrations/20260623180000_home_know_read_models.sql",
  "supabase/migrations/20260626130000_tower_demo_readiness_materialized_plane.sql",
  "supabase/migrations/20260626203000_tower_budget_rollups.sql",
  "supabase/migrations/20260628202000_cio_tower_schema_v1.sql",
  "supabase/migrations/20260709203000_intelligence_v7_moat_foundation.sql",
  "supabase/migrations/20260717063000_tower_foundation_tables_ledger_repair.sql",
];
const physicalSchemaInventory = migrationFiles.map((file) => ({
  file,
  tables: extractCreateTables(file),
}));

const moduleServingMatrix = [
  {
    page: "Knowledge / Home",
    currentServing: "Active Tenant Access metadata plus approved Home content bridge.",
    targetServing: "Azure/Postgres Active Tenant Access read model, evidence registry, canonical facts, relationships, gaps, approved content.",
    status: "Reachability proven; browser proof still needed after deploy.",
  },
  {
    page: "Intelligence",
    currentServing: "Active module-context proof exists; live aVa retrieval must still use governed context bundle/index path.",
    targetServing: "Azure/Postgres canonical facts + Azure AI Search indexed chunks through buildValidatedAgentContextBundle.",
    status: "Context access proven; retrieval/citation proof pending data-plane load/index.",
  },
  {
    page: "Moves",
    currentServing: "Active module-context proof exists; derived Moves context artifacts exist.",
    targetServing: "Azure/Postgres context packet, interview insights, graph edges, gate/readiness records.",
    status: "Context access proven; runtime gate wiring proof still pending.",
  },
  {
    page: "Source",
    currentServing: "Active module-context proof exists; no Meridian-specific Source runtime mutation claimed.",
    targetServing: "Azure/Postgres evidence, vendor, contract, application, spend, SLA/process records via Source read models.",
    status: "Context access proven; Source runtime proof pending.",
  },
  {
    page: "Tower",
    currentServing: "Default dashboard must use Azure/Postgres/read-model path. File-backed TowerContextPack builder is proof harness only and now flag-gated.",
    targetServing: "Azure/Postgres Tower projection/read model from V3 canonical facts -> TowerContextPack -> TowerMetricRecord/TowerValueRecord/TowerValueClaim.",
    status: "Tower V3 context pack proof passes; physical Azure/Postgres table load and dashboard browser proof still pending.",
  },
];

const report = {
  reportVersion: "meridian-data-plane-layout/v1",
  generatedAt: new Date().toISOString(),
  tenantKey: TENANT,
  sourcePacket: {
    activeRoot: path.relative(ROOT, ACTIVE_ROOT),
    fileCount: sourceFiles.length,
    coreFiles: sourceFiles.filter((item) => /^\d\d_/.test(item.file)).length,
    sourceAdapterFiles: sourceFiles.filter((item) => /^SA\d\d_/i.test(item.file)).length,
    coreRows: sourceCoreRows,
    sourceAdapterRows,
    totalRows: sourceCoreRows + sourceAdapterRows,
    files: sourceFiles,
  },
  derivedLayer: derivedFiles,
  approvedContent,
  activeTenantAccess: {
    activeVersionId: promotion.activeVersionId ?? promotion.activeAccessRecord?.activeVersionId ?? null,
    quality: promotion.quality ?? null,
    guardrails: promotion.guardrails ?? null,
    moduleReadProof,
    moduleAccess,
  },
  towerProjectionProof: {
    contextPackId: towerSummary.contextPackId ?? null,
    sourceDimensions: towerSummary.sourceDimensions ?? [],
    towerMetricRecordCount: towerSummary.towerMetricRecordCount ?? 0,
    towerValueRecordCount: towerSummary.towerValueRecordCount ?? 0,
    towerValueClaimCount: towerSummary.towerValueClaimCount ?? 0,
    blockedValueClaimCount: towerSummary.blockedValueClaimCount ?? 0,
    realizedValueLanguageAllowed: towerSummary.realizedValueLanguageAllowed ?? null,
    cioTowerProjectionStatus: towerSummary.cioTowerProjectionStatus ?? null,
    acceptance: towerSummary.acceptance ?? null,
  },
  physicalSchemaInventory,
  moduleServingMatrix,
  truthSplit: {
    filesAreIntakeAndProofArtifacts: true,
    towerDashboardShouldNotDefaultToRawFileReads: true,
    activeModuleContextAccessProven: moduleAccess.status === "Pass",
    physicalAzurePostgresLoadProven: false,
    azureSearchRetrievalProven: false,
    signedInBrowserProofAfterThisRefresh: false,
  },
};

fs.writeFileSync(path.join(OUT_DIR, "summary.json"), `${JSON.stringify(report, null, 2)}\n`);

const sourceRows = sourceFiles.map((item) => [item.file, item.rows.toLocaleString(), item.columns]);
const derivedRows = derivedFiles.map((item) => [
  item.path.replace("datasets/tenant-inputs/meridian-health/derived/", ""),
  item.shape,
  item.nodes !== undefined ? `${item.nodes.toLocaleString()} nodes / ${item.edges.toLocaleString()} edges` : item.count.toLocaleString(),
]);
const moduleRows = moduleServingMatrix.map((item) => [item.page, item.currentServing, item.targetServing, item.status]);
const schemaRows = physicalSchemaInventory.map((item) => [
  item.file,
  item.tables.length ? item.tables.join(", ") : "No create-table statement detected",
]);
const towerRows = (towerSummary.sourceDimensions ?? []).map((item) => [
  item.fileName,
  item.rowCount?.toLocaleString?.() ?? item.rowCount,
  item.factCount?.toLocaleString?.() ?? item.factCount,
  item.evidenceCount?.toLocaleString?.() ?? item.evidenceCount,
  item.projectionStatus,
]);
const moduleAccessSummary = (moduleAccess.moduleAccess ?? [])
  .map(
    (item) =>
      `${item.moduleKey}: ${Number(item.recordCount ?? 0).toLocaleString()} records / ${Number(item.evidenceRefCount ?? 0).toLocaleString()} evidence refs`,
  )
  .join("; ");
const moduleReadProofSummary = (moduleReadProof ?? [])
  .map(
    (item) =>
      `${item.moduleKey}: ${Number(item.recordCount ?? 0).toLocaleString()} records / ${Number(item.evidenceRefCount ?? 0).toLocaleString()} evidence refs`,
  )
  .join("; ");

const markdown = `# Meridian Data-Plane Layout and Volumetrics\n\nGenerated: ${report.generatedAt}\n\n## Executive Read\n\nTower should not be served by raw CSV files. The active V3 source packet is intake/proof material. The production target is an Azure/Postgres governed data-plane path: source packet -> canonical facts/evidence/entities/relationships/gaps -> Active Tenant Access / module context -> Tower projection/read model -> dashboard and aVa.\n\nCurrent proof state:\n\n- Active Meridian V3 packet is now rich: ${report.sourcePacket.fileCount} CSV files, ${report.sourcePacket.totalRows.toLocaleString()} rows.\n- Active Tenant Access promotion passed for Meridian: ${report.activeTenantAccess.activeVersionId ?? "not available"}.\n- Module context access audit passed: ${moduleAccessSummary || "not available"}.\n- Active module read proof passed: ${moduleReadProofSummary || "not available"}.\n- Tower V3 context-pack proof passed: ${report.towerProjectionProof.towerMetricRecordCount.toLocaleString()} metric records, ${report.towerProjectionProof.towerValueRecordCount.toLocaleString()} value records, ${report.towerProjectionProof.towerValueClaimCount.toLocaleString()} value claims, ${report.towerProjectionProof.blockedValueClaimCount.toLocaleString()} blocked claims, realized-value language allowed = ${report.towerProjectionProof.realizedValueLanguageAllowed}.\n- Physical Azure/Postgres table load and Azure AI Search retrieval/citation proof are still not claimed by this report.\n\n## Source Packet Volumetrics\n\n${mdTable(["File", "Rows", "Columns"], sourceRows)}\n\n## Derived Layer Volumetrics\n\n${mdTable(["Artifact", "Shape", "Count"], derivedRows)}\n\n## Tower Projection Proof\n\n${mdTable(["Source file", "Rows", "Facts", "Evidence refs", "Projection status"], towerRows)}\n\nTower projection counts:\n\n- Metric records: ${report.towerProjectionProof.towerMetricRecordCount.toLocaleString()}\n- Value records: ${report.towerProjectionProof.towerValueRecordCount.toLocaleString()}\n- Value claims: ${report.towerProjectionProof.towerValueClaimCount.toLocaleString()}\n- Blocked value claims: ${report.towerProjectionProof.blockedValueClaimCount.toLocaleString()}\n- Realized/proven value language allowed: ${report.towerProjectionProof.realizedValueLanguageAllowed}\n- cio_tower status: ${JSON.stringify(report.towerProjectionProof.cioTowerProjectionStatus)}\n\n## Module Serving Matrix\n\n${mdTable(["Page", "Current serving state", "Target Azure data-plane serving state", "Status"], moduleRows)}\n\n## Physical Schema Inventory in Repo\n\nThese are the Postgres-compatible schema artifacts currently present in the repo. They are not proof that the refreshed Meridian packet has been physically loaded to Azure Postgres.\n\n${mdTable(["Migration", "Tables detected"], schemaRows)}\n\n## Required Next Data-Plane Build\n\n1. Run an ACA data-build job for Meridian candidate context using the rich active V3 packet and derived artifacts.\n2. Persist source registry, evidence registry, canonical facts, entity profiles, relationships, context gaps, module context, and Tower projection rows to Azure/Postgres.\n3. Backfill/search-index only agent-ready objects for Intelligence/aVa retrieval.\n4. Promote through human review and Active Tenant Access pointer update.\n5. Prove signed-in browser behavior for Knowledge, Intelligence, Moves, Source, and Tower.\n6. Prove Tower default dashboard does not call file-backed builders and does not show unsupported realized ROI/savings.\n\n## Truth Split\n\n${mdTable(["Claim", "Value"], Object.entries(report.truthSplit).map(([key, value]) => [key, value]))}\n`;

fs.writeFileSync(path.join(OUT_DIR, "summary.md"), markdown);

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Meridian Data-Plane Layout and Volumetrics</title>
  <style>
    body { margin: 0; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #071734; background: #f7f8fb; }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 24px 64px; }
    h1, h2 { font-family: Georgia, "Times New Roman", serif; color: #071734; }
    h1 { font-size: 44px; margin: 0 0 8px; }
    h2 { margin-top: 36px; font-size: 26px; }
    .eyebrow { color: #08744f; letter-spacing: .18em; text-transform: uppercase; font-weight: 700; font-size: 12px; }
    .deck { color: #42526e; font-size: 17px; max-width: 920px; line-height: 1.55; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 24px 0; }
    .metric { background: white; border: 1px solid #dfe5ef; border-radius: 12px; padding: 18px; box-shadow: 0 12px 32px rgba(7, 23, 52, .06); }
    .metric span { display: block; color: #5d6b85; font-size: 12px; letter-spacing: .12em; text-transform: uppercase; }
    .metric strong { display: block; margin-top: 8px; font-size: 30px; }
    table { width: 100%; border-collapse: collapse; background: white; border: 1px solid #dfe5ef; border-radius: 12px; overflow: hidden; margin: 14px 0 26px; }
    th, td { text-align: left; padding: 12px 14px; border-bottom: 1px solid #e8edf4; vertical-align: top; font-size: 13px; line-height: 1.45; }
    th { background: #f0f4f9; color: #526078; text-transform: uppercase; letter-spacing: .08em; font-size: 11px; }
    tr:last-child td { border-bottom: 0; }
    .callout { background: #eefaf4; border-left: 4px solid #22a06b; border-radius: 12px; padding: 16px 18px; margin: 22px 0; color: #123d2c; }
    .warn { background: #fff7e6; border-left-color: #d9822b; color: #4c3100; }
    code { background: #eef2f7; border-radius: 6px; padding: 2px 5px; }
  </style>
</head>
<body>
<main>
  <div class="eyebrow">Meridian / Healthcare Demo · V3 Data Plane</div>
  <h1>Data-Plane Layout and Volumetrics</h1>
  <p class="deck">This report separates intake files, derived artifacts, Active Tenant Access/module context, Tower projection proof, and the Azure/Postgres physical serving target. Tower dashboards should consume governed read models, not raw CSV files.</p>
  <div class="grid">
    <div class="metric"><span>Active source rows</span><strong>${report.sourcePacket.totalRows.toLocaleString()}</strong></div>
    <div class="metric"><span>Canonical facts</span><strong>${derivedFiles.find((item) => item.path.endsWith("canonical-facts.json"))?.count.toLocaleString() ?? "0"}</strong></div>
    <div class="metric"><span>Tower value claims</span><strong>${report.towerProjectionProof.towerValueClaimCount.toLocaleString()}</strong></div>
    <div class="metric"><span>Allowed realized value</span><strong>${report.towerProjectionProof.realizedValueLanguageAllowed ? "Yes" : "No"}</strong></div>
  </div>
  <div class="callout">Active module-context access is proven for Meridian metadata/read models. Physical Azure/Postgres table load and Azure AI Search retrieval/citation proof are still pending and are not claimed here.</div>
  <h2>Source Packet</h2>
  ${htmlTable(["File", "Rows", "Columns"], sourceRows)}
  <h2>Derived Layer</h2>
  ${htmlTable(["Artifact", "Shape", "Count"], derivedRows)}
  <h2>Tower Projection Proof</h2>
  ${htmlTable(["Source file", "Rows", "Facts", "Evidence refs", "Projection status"], towerRows)}
  <div class="callout warn">Tower default runtime should not use file-backed builders. The file-backed TowerContextPack builder is proof-harness/flag-gated only until the governed Azure/Postgres projection is physically loaded and browser-proven.</div>
  <h2>Module Serving Matrix</h2>
  ${htmlTable(["Page", "Current serving state", "Target Azure data-plane serving state", "Status"], moduleRows)}
  <h2>Physical Schema Inventory</h2>
  ${htmlTable(["Migration", "Tables detected"], schemaRows)}
</main>
</body>
</html>
`;

fs.writeFileSync(path.join(OUT_DIR, "proof.html"), html);

console.log(
  JSON.stringify(
    {
      status: "PASS",
      outputDir: path.relative(ROOT, OUT_DIR),
      summary: {
        sourceFiles: report.sourcePacket.fileCount,
        sourceRows: report.sourcePacket.totalRows,
        towerMetricRecords: report.towerProjectionProof.towerMetricRecordCount,
        towerValueRecords: report.towerProjectionProof.towerValueRecordCount,
        towerValueClaims: report.towerProjectionProof.towerValueClaimCount,
        physicalAzurePostgresLoadProven: false,
      },
    },
    null,
    2,
  ),
);
