#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { readCsv, writeCsv } from "../tenant-v3/lib/csv.mjs";

const repoRoot = process.cwd();
const generatedAt = new Date().toISOString();
const reportDir = path.join(repoRoot, "reports/home-tenant-coverage");

const TENANTS = [
  {
    routeKey: "skyharbor-air",
    sourceKey: "skyharbor-air",
    displayName: "Airline Demo",
    allowedDisplayNames: ["Airline Demo"],
    minRelationshipRows: 300,
    forbiddenVisibleText: ["SkyHarbor Air", "Lakeshore Industries", "First Capital Financial"],
  },
  {
    routeKey: "first-capital",
    sourceKey: "first-capital-financial",
    displayName: "FS Demo",
    allowedDisplayNames: ["FS Demo"],
    minRelationshipRows: 300,
    forbiddenVisibleText: ["First Capital Financial", "SkyHarbor Air", "Lakeshore Industries"],
  },
  {
    routeKey: "lakeshore-holdings",
    sourceKey: "lakeshore-holdings",
    displayName: "Lakeshore Holdings",
    allowedDisplayNames: ["Lakeshore Holdings"],
    minRelationshipRows: 250,
    forbiddenVisibleText: ["Lakeshore Industries", "First Capital Financial", "SkyHarbor Air"],
  },
  {
    routeKey: "apex-retail",
    sourceKey: "apex-retail",
    displayName: "Retail Demo",
    allowedDisplayNames: ["Retail Demo"],
    minRelationshipRows: 300,
    forbiddenVisibleText: ["Apex Retail Group", "First Capital Financial", "SkyHarbor Air", "Lakeshore Industries"],
  },
  {
    routeKey: "meridian-health",
    sourceKey: "meridian-health",
    displayName: "Healthcare Demo",
    allowedDisplayNames: ["Healthcare Demo", "Meridian Health System"],
    minRelationshipRows: 100,
    forbiddenVisibleText: ["First Capital Financial", "SkyHarbor Air", "Lakeshore Industries"],
  },
];

function exists(file) {
  return fs.existsSync(file);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function relationshipFile(tenant) {
  return path.join(
    repoRoot,
    "datasets/tenant-inputs/active",
    tenant.sourceKey,
    "current/12_relationships.csv",
  );
}

function packFile(tenant) {
  return path.join(
    repoRoot,
    "datasets/tenant-inputs",
    tenant.routeKey,
    "approved-content/home/design-contract-pack.json",
  );
}

function approvedMirrorPackFile(tenant) {
  return path.join(
    repoRoot,
    "datasets/context-artifacts/approved",
    tenant.routeKey,
    "home-knowledge/approved-home-knowledge-design-contract-pack.json",
  );
}

function graphFile(tenant) {
  return path.join(
    repoRoot,
    "datasets/tenant-inputs",
    tenant.routeKey,
    "derived/relationship-graph.json",
  );
}

function countSelfLoops(edges) {
  return edges.filter((edge) => {
    const fromId = clean(edge.from_object_id || edge.from_node_id);
    const toId = clean(edge.to_object_id || edge.to_node_id);
    const fromName = clean(edge.from_object_name || edge.from_name);
    const toName = clean(edge.to_object_name || edge.to_name);
    return Boolean((fromId && fromId === toId) || (fromName && fromName === toName));
  }).length;
}

function countMissingEndpoints(rows) {
  return rows.filter(
    (row) => !clean(row.from_object_name) || !clean(row.to_object_name),
  ).length;
}

function visibleAliasHits(value, forbiddenVisibleText) {
  const text = JSON.stringify(value ?? {});
  return forbiddenVisibleText.filter((term) => text.includes(term));
}

function validateTenant(tenant) {
  const issues = [];
  const relationshipPath = relationshipFile(tenant);
  const packPath = packFile(tenant);
  const mirrorPath = approvedMirrorPackFile(tenant);
  const graphPath = graphFile(tenant);

  const relationshipRows = exists(relationshipPath) ? readCsv(relationshipPath) : [];
  if (!exists(relationshipPath)) issues.push("missing active relationship CSV");
  if (relationshipRows.length < tenant.minRelationshipRows) {
    issues.push(`relationship row depth below minimum: ${relationshipRows.length} < ${tenant.minRelationshipRows}`);
  }
  const missingEndpoints = countMissingEndpoints(relationshipRows);
  if (missingEndpoints) issues.push(`${missingEndpoints} relationship rows have missing endpoints`);
  const relationshipLoops = relationshipRows.filter(
    (row) => clean(row.from_object_name).toLowerCase() === clean(row.to_object_name).toLowerCase(),
  ).length;
  if (relationshipLoops) issues.push(`${relationshipLoops} relationship rows are self-loops`);
  const wrongTenantRows = relationshipRows.filter(
    (row) => clean(row.tenant_key) !== tenant.sourceKey,
  ).length;
  if (wrongTenantRows) issues.push(`${wrongTenantRows} relationship rows have wrong tenant_key`);

  const pack = exists(packPath) ? readJson(packPath) : null;
  const mirrorPack = exists(mirrorPath) ? readJson(mirrorPath) : null;
  if (!pack) issues.push("missing canonical Home design pack");
  if (!mirrorPack) issues.push("missing approved Home design pack mirror");
  if (pack) {
    if (pack.tenant_key !== tenant.routeKey) issues.push("Home pack tenant_key mismatch");
    if (!tenant.allowedDisplayNames.includes(pack.tenant_name)) {
      issues.push("Home pack display name mismatch");
    }
    if (pack.artifact_type !== "NexusHomeKnowledgeDesignContractPack") {
      issues.push("Home pack artifact type mismatch");
    }
    if (pack.validation?.status !== "pass") issues.push("Home pack validation is not pass");
    const slots = pack.design_slots ?? {};
    if ((slots.DIMS ?? []).length !== 19) issues.push(`Home pack dimension count is ${(slots.DIMS ?? []).length}, expected 19`);
    if (Object.keys(slots.DATA ?? {}).length !== 19) issues.push(`Home pack DATA slot count is ${Object.keys(slots.DATA ?? {}).length}, expected 19`);
    if (Object.keys(slots.STORY ?? {}).length !== 19) issues.push(`Home pack STORY slot count is ${Object.keys(slots.STORY ?? {}).length}, expected 19`);
    if (Object.keys(slots.EVID ?? {}).length !== 19) issues.push(`Home pack EVID slot count is ${Object.keys(slots.EVID ?? {}).length}, expected 19`);
    if (Object.keys(slots.DGAPS ?? {}).length !== 19) issues.push(`Home pack DGAPS slot count is ${Object.keys(slots.DGAPS ?? {}).length}, expected 19`);
    const aliasHits = visibleAliasHits(pack, tenant.forbiddenVisibleText);
    if (aliasHits.length) issues.push(`Home pack contains visible stale/internal aliases: ${aliasHits.join(", ")}`);
  }
  if (pack && mirrorPack && JSON.stringify(pack) !== JSON.stringify(mirrorPack)) {
    issues.push("canonical and approved mirror Home packs differ");
  }

  const graph = exists(graphPath) ? readJson(graphPath) : null;
  const graphEdges = Array.isArray(graph?.edges) ? graph.edges : [];
  const graphNodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  if (!graph) issues.push("missing derived relationship graph");
  if (graph && graph.tenant_key !== tenant.routeKey) issues.push("graph tenant_key mismatch");
  if (graphEdges.length < tenant.minRelationshipRows) {
    issues.push(`graph edge depth below minimum: ${graphEdges.length} < ${tenant.minRelationshipRows}`);
  }
  if (!graphNodes.length) issues.push("graph has no nodes");
  const graphLoops = countSelfLoops(graphEdges);
  if (graphLoops) issues.push(`${graphLoops} graph edges are self-loops`);
  const graphAliasHits = visibleAliasHits(graph, tenant.forbiddenVisibleText);
  if (graphAliasHits.length) {
    issues.push(`graph contains visible stale/internal aliases: ${graphAliasHits.join(", ")}`);
  }

  return {
    tenant_key: tenant.routeKey,
    source_tenant_key: tenant.sourceKey,
    display_name: tenant.displayName,
    status: issues.length ? "fail" : "pass",
    relationship_rows: relationshipRows.length,
    missing_relationship_endpoints: missingEndpoints,
    relationship_self_loops: relationshipLoops,
    graph_nodes: graphNodes.length,
    graph_edges: graphEdges.length,
    graph_self_loops: graphLoops,
    dimensions: pack?.design_slots?.DIMS?.length ?? 0,
    data_tabs: Object.keys(pack?.design_slots?.DATA ?? {}).length,
    story_tabs: Object.keys(pack?.design_slots?.STORY ?? {}).length,
    evidence_tabs: Object.keys(pack?.design_slots?.EVID ?? {}).length,
    gap_tabs: Object.keys(pack?.design_slots?.DGAPS ?? {}).length,
    issues,
  };
}

function parseTenantArg() {
  const arg = process.argv.find((item) => item.startsWith("--tenant="));
  if (!arg) return TENANTS;
  const values = arg.split("=", 2)[1].split(",").map((item) => item.trim());
  if (values.includes("all")) return TENANTS;
  return TENANTS.filter(
    (tenant) => values.includes(tenant.routeKey) || values.includes(tenant.sourceKey),
  );
}

function writeReports(rows) {
  fs.mkdirSync(reportDir, { recursive: true });
  const base = path.join(reportDir, "home-tenant-coverage-audit");
  fs.writeFileSync(`${base}.json`, `${JSON.stringify({ generated_at: generatedAt, rows }, null, 2)}\n`);
  writeCsv(`${base}.csv`, [
    "tenant_key",
    "source_tenant_key",
    "display_name",
    "status",
    "relationship_rows",
    "missing_relationship_endpoints",
    "relationship_self_loops",
    "graph_nodes",
    "graph_edges",
    "graph_self_loops",
    "dimensions",
    "data_tabs",
    "story_tabs",
    "evidence_tabs",
    "gap_tabs",
    "issues",
  ], rows.map((row) => ({ ...row, issues: row.issues.join("; ") })));
  const lines = [
    "# Home Tenant Coverage Audit",
    "",
    `Generated: ${generatedAt}`,
    "",
    "Read-only audit of active relationship rows, approved Home design packs, and derived relationship graphs.",
    "",
    "| Tenant | Source tenant | Status | Relationship rows | Graph nodes | Graph edges | Dimensions | Issues |",
    "| --- | --- | --- | ---: | ---: | ---: | ---: | --- |",
    ...rows.map((row) =>
      `| ${row.tenant_key} | ${row.source_tenant_key} | ${row.status} | ${row.relationship_rows.toLocaleString()} | ${row.graph_nodes.toLocaleString()} | ${row.graph_edges.toLocaleString()} | ${row.dimensions} | ${row.issues.length ? row.issues.join("; ") : "none"} |`,
    ),
    "",
    "## Boundary",
    "",
    "- This audit proves local Home render artifacts and active CSV relationship coverage only.",
    "- Azure/Postgres materialization still requires the governed ACA data-build job and live signed-in proof.",
  ];
  fs.writeFileSync(`${base}.md`, `${lines.join("\n")}\n`);
}

function main() {
  const tenants = parseTenantArg();
  if (!tenants.length) throw new Error("No tenants selected");
  const rows = tenants.map(validateTenant);
  writeReports(rows);
  for (const row of rows) {
    console.log(
      `${row.tenant_key}: ${row.status}, relationships=${row.relationship_rows}, graph=${row.graph_nodes}/${row.graph_edges}, dims=${row.dimensions}`,
    );
    for (const issue of row.issues) console.log(`  - ${issue}`);
  }
  if (rows.some((row) => row.status !== "pass")) {
    process.exitCode = 1;
  }
}

main();
