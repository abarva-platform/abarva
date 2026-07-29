#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(
  ROOT,
  "proof",
  "airline-source-moves-operational-migration-2026-07-29",
);
const REPORT = path.join(
  ROOT,
  "reports",
  "airline-source-moves-operational-migration-2026-07-29.md",
);

const TENANT = "airline-demo-new";
const DB_HOST = "pg-abarva-airdn-lab-eus2-001.postgres.database.azure.com";
const DB_NAME = "abarva_airline_demo_new_knowledge_lab";
const BLOB_DESTINATION =
  "Airline tenant-scoped Azure Blob path required; route-level proof pending";

function read(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), "utf8");
  } catch {
    return "";
  }
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function has(rel, marker) {
  return read(rel).includes(marker);
}

function listFiles(dir, predicate = () => true) {
  const abs = path.join(ROOT, dir);
  const out = [];
  function walk(current) {
    if (!fs.existsSync(current)) return;
    const stat = fs.statSync(current);
    if (stat.isDirectory()) {
      for (const child of fs.readdirSync(current)) walk(path.join(current, child));
      return;
    }
    const rel = path.relative(ROOT, current);
    if (predicate(rel)) out.push(rel);
  }
  walk(abs);
  return out.sort();
}

function sourceMovesRoutes() {
  const sourcePages = listFiles("src/app/(maestro)/source", (rel) =>
    rel.endsWith("page.tsx") || rel.endsWith("layout.tsx"),
  );
  const movesPages = listFiles("src/app/(maestro)/strategic-moves", (rel) =>
    rel.endsWith("page.tsx") || rel.endsWith("layout.tsx"),
  );
  const sourceApis = [
    ...listFiles("src/app/api/v1/source", (rel) => rel.endsWith("route.ts")),
    ...listFiles("src/app/api/source", (rel) => rel.endsWith("route.ts")),
  ];
  const movesApis = [
    ...listFiles("src/app/api/v1/moves", (rel) => rel.endsWith("route.ts")),
    ...listFiles("src/app/api/programs", (rel) => rel.endsWith("route.ts")),
    ...listFiles("src/app/api/instruments/discovery-kit", (rel) =>
      rel.endsWith("route.ts"),
    ),
  ];
  return { sourcePages, movesPages, sourceApis, movesApis };
}

const routeInventory = sourceMovesRoutes();

const checks = [
  {
    id: "source-events-read-selector",
    file: "src/lib/data-plane/read-adapters/sourceEventsReadAdapter.ts",
    marker: "resolveDataPlaneForTenant(tenantKey, plane)",
  },
  {
    id: "source-events-read-callers",
    file: "src/lib/source/queries.ts",
    marker: "selectSourceEventsReadAdapter(\n    undefined,\n    clientKey",
  },
  {
    id: "source-work-items-read-selector",
    file: "src/lib/data-plane/read-adapters/sourcingWorkItemsReadAdapter.ts",
    marker: "resolveDataPlaneForTenant(tenantKey, plane)",
  },
  {
    id: "source-work-items-write-selector",
    file: "src/lib/data-plane/write-adapters/sourcingWorkItemsWriteAdapter.ts",
    marker: "resolveDataPlaneForTenant(tenantKey, plane)",
  },
  {
    id: "moves-programs-read-selector",
    file: "src/lib/data-plane/read-adapters/programsReadAdapter.ts",
    marker: "resolveDataPlaneForTenant(tenantKey, plane)",
  },
  {
    id: "moves-programs-read-callers",
    file: "src/lib/programs/queries.ts",
    marker: "selectProgramsReadAdapter(undefined, ctx.clientKey)",
  },
  {
    id: "moves-preferences-read-selector",
    file: "src/lib/data-plane/read-adapters/strategicMovesPreferencesReadAdapter.ts",
    marker: "resolveDataPlaneForTenant(tenantKey, plane)",
  },
  {
    id: "moves-attachment-write-selector",
    file: "src/lib/data-plane/write-adapters/attachmentsWriteAdapter.ts",
    marker: "resolveDataPlaneForTenant(tenantKey, plane)",
  },
  {
    id: "moves-attachment-write-caller",
    file: "src/lib/programs/attachments/index.ts",
    marker: "selectAttachmentsWriteAdapter(\n    undefined,\n    input.tenantKey",
  },
  {
    id: "object-storage-azure",
    file: "src/lib/data-plane/objectStorage.ts",
    marker: "BlobServiceClient",
  },
];

const evaluatedChecks = checks.map((check) => ({
  ...check,
  exists: exists(check.file),
  found: has(check.file, check.marker),
}));

const rows = [
  {
    module: "Source",
    uiAction: "Open Source portfolio and event lists",
    api: "src/lib/source/queries.ts",
    dbHost: DB_HOST,
    schemaTable: "source_events",
    blobDestination: "none",
    newPlane: "tenant-aware DB selector patched",
    legacyDependency: "Seed overlay still exists for non-foundation tenants; Airline selector now fails closed from Supabase",
    proof: "source-events-read-selector, source-events-read-callers",
  },
  {
    module: "Source",
    uiAction: "Create/open sourcing event",
    api: "createSourcingEvent in src/lib/source/queries.ts",
    dbHost: DB_HOST,
    schemaTable: "source_events",
    blobDestination: "none",
    newPlane: "partial",
    legacyDependency: "Direct getAzureWriteFluentClient write path still needs runtime DB role/table proof",
    proof: "inventory only",
  },
  {
    module: "Source",
    uiAction: "Create/list Source work items and Tower-watch items",
    api: "src/lib/source/work-items/service.ts",
    dbHost: DB_HOST,
    schemaTable: "sourcing_work_items",
    blobDestination: "none",
    newPlane: "tenant-aware read/write selector patched",
    legacyDependency: "No Supabase fallback for foundation tenant after this patch",
    proof:
      "source-work-items-read-selector, source-work-items-write-selector",
  },
  {
    module: "Source",
    uiAction: "Upload artifact/source file",
    api: "src/app/api/v1/source/[eventId]/artifacts/upload/route.ts",
    dbHost: DB_HOST,
    schemaTable: "source artifact metadata tables",
    blobDestination: BLOB_DESTINATION,
    newPlane: "pending",
    legacyDependency:
      "Storage path and container must be proven by signed-in upload; no old storage fallback may remain for Airline",
    proof: "blob runtime proof pending",
  },
  {
    module: "Source",
    uiAction: "Generate/retrieve/accept Source artifact",
    api: "src/app/api/v1/source/[eventId]/artifacts/[artifactCode]/*",
    dbHost: DB_HOST,
    schemaTable: "source artifact/state tables",
    blobDestination: BLOB_DESTINATION,
    newPlane: "partially fenced",
    legacyDependency:
      "Known legacy synthesis/fixture routes are fenced; full artifact lifecycle still needs signed-in DB/blob proof",
    proof: "existing Source fence PRs plus this inventory",
  },
  {
    module: "Moves",
    uiAction: "Open Moves portfolio and Move detail",
    api: "src/lib/programs/queries.ts",
    dbHost: DB_HOST,
    schemaTable: "engagements",
    blobDestination: "none",
    newPlane: "tenant-aware DB selector patched",
    legacyDependency:
      "Explicit Supabase adapter option remains for legacy callers; foundation tenant default is Azure when ctx.clientKey is supplied",
    proof: "moves-programs-read-selector, moves-programs-read-callers",
  },
  {
    module: "Moves",
    uiAction: "Read Strategic Moves preferences",
    api: "src/lib/programs/strategic-moves-preferences.ts",
    dbHost: DB_HOST,
    schemaTable: "tower_user_preferences.default_filters",
    blobDestination: "none",
    newPlane: "tenant-aware DB selector patched",
    legacyDependency: "No Supabase fallback for foundation tenant after this patch",
    proof: "moves-preferences-read-selector",
  },
  {
    module: "Moves",
    uiAction: "Upload Move evidence/artifact metadata",
    api: "src/lib/programs/attachments/index.ts",
    dbHost: DB_HOST,
    schemaTable: "program_attachments",
    blobDestination: BLOB_DESTINATION,
    newPlane: "metadata tenant-aware; file-byte proof pending",
    legacyDependency:
      "Storage upload route still needs canonical Airline Blob proof and old-storage-disabled proof",
    proof: "moves-attachment-write-selector, moves-attachment-write-caller",
  },
  {
    module: "Moves",
    uiAction: "Generate board-grade artifacts",
    api: "src/app/api/v1/moves/board-grade-*",
    dbHost: DB_HOST,
    schemaTable: "artifact/generated-output tables pending route proof",
    blobDestination: BLOB_DESTINATION,
    newPlane: "partially fenced",
    legacyDependency:
      "Reference fallback guards exist; operational persistence and generated-file storage still need signed-in proof",
    proof: "existing Moves fence PRs plus this inventory",
  },
];

const openItems = rows.filter((row) => !String(row.newPlane).includes("patched"));

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(REPORT), { recursive: true });

const summary = {
  tenant: TENANT,
  generatedAt: new Date().toISOString(),
  database: { host: DB_HOST, name: DB_NAME },
  routeInventoryCounts: {
    sourcePages: routeInventory.sourcePages.length,
    sourceApis: routeInventory.sourceApis.length,
    movesPages: routeInventory.movesPages.length,
    movesApis: routeInventory.movesApis.length,
  },
  checks: evaluatedChecks,
  rows,
  openItems,
  completion: {
    tenantAwareSelectorPatch:
      evaluatedChecks.filter((check) => check.found).length +
      "/" +
      evaluatedChecks.length,
    fullOperationalMigration:
      "not complete; DB schema/row migration, Blob migration, signed-in runtime proof, negative fallback proof still required",
  },
};

fs.writeFileSync(
  path.join(OUT_DIR, "inventory.json"),
  JSON.stringify(summary, null, 2),
);

const csvHeader = [
  "Module",
  "UI action",
  "API",
  "DB host",
  "Schema/table",
  "Blob destination",
  "New plane",
  "Legacy dependency",
  "Proof",
];
const csv = [
  csvHeader.join(","),
  ...rows.map((row) =>
    [
      row.module,
      row.uiAction,
      row.api,
      row.dbHost,
      row.schemaTable,
      row.blobDestination,
      row.newPlane,
      row.legacyDependency,
      row.proof,
    ]
      .map((value) => `"${String(value).replaceAll('"', '""')}"`)
      .join(","),
  ),
].join("\n");
fs.writeFileSync(path.join(OUT_DIR, "certification-matrix.csv"), `${csv}\n`);

const md = `# Airline Source and Moves Operational Migration Inventory

Generated: ${summary.generatedAt}

Tenant: \`${TENANT}\`  
Database host: \`${DB_HOST}\`  
Database name: \`${DB_NAME}\`

## Executive Status

The Knowledge foundation is complete and immutable. This report covers only Source and Moves operational persistence.

Current state:

- Tenant-aware DB selection has been added for the core Source/Moves selectors that already receive tenant context.
- Full operational migration is **not complete** until DB rows, Blob paths, signed-in actions, negative fallback tests, and rollback/restore are proven.
- Source/Moves generated and uploaded file-byte paths still require canonical Airline Blob proof.

## Route Inventory Counts

| Area | Count |
|---|---:|
| Source pages/layouts | ${routeInventory.sourcePages.length} |
| Source API routes | ${routeInventory.sourceApis.length} |
| Moves pages/layouts | ${routeInventory.movesPages.length} |
| Moves API routes | ${routeInventory.movesApis.length} |

## Static Guard Checks

| Check | File | Found |
|---|---|---:|
${evaluatedChecks
  .map(
    (check) =>
      `| ${check.id} | \`${check.file}\` | ${check.found ? "yes" : "no"} |`,
  )
  .join("\n")}

## Certification Matrix

| Module | UI action | API | DB host | Schema/table | Blob destination | New plane | Legacy dependency | Proof |
|---|---|---|---|---|---|---|---|---|
${rows
  .map(
    (row) =>
      `| ${row.module} | ${row.uiAction} | \`${row.api}\` | \`${row.dbHost}\` | ${row.schemaTable} | ${row.blobDestination} | ${row.newPlane} | ${row.legacyDependency} | ${row.proof} |`,
  )
  .join("\n")}

## Open Migration Items

${openItems
  .map(
    (row) =>
      `- ${row.module}: ${row.uiAction} — ${row.newPlane}. ${row.legacyDependency}`,
  )
  .join("\n")}

## Required Next Proof

1. Verify all referenced operational tables exist in the Airline Azure PostgreSQL database.
2. Migrate only required active Airline rows; do not copy retired tenants.
3. Define and prove canonical Airline Blob destinations for Source and Moves file bytes.
4. Execute signed-in Source and Moves workflows and capture DB-side row IDs plus Blob hashes.
5. Run negative proof with Supabase, old Blob credentials, fixtures, and SkyHarbor mappings unavailable.
6. Only after proof, disable old storage writes and remove fallback.
`;

fs.writeFileSync(REPORT, md);

console.log(JSON.stringify(summary, null, 2));
