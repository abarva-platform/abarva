#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const repoRoot = path.resolve(new URL("../../..", import.meta.url).pathname);
const refreshScript = fs.readFileSync(
  path.join(repoRoot, "scripts/data-build/refresh-runtime-layers.ts"),
  "utf8",
);
const readbackScript = fs.readFileSync(
  path.join(repoRoot, "scripts/data-build/verify-runtime-layer-refresh-readback.ts"),
  "utf8",
);
const forceRlsMigration = fs.readFileSync(
  path.join(repoRoot, "supabase/migrations/20260815204500_intelligence_v6_runtime_layer_force_rls.sql"),
  "utf8",
);

assert.match(refreshScript, /SET LOCAL ROLE authenticated/);
assert.match(refreshScript, /visibleOtherTenantRows/);
assert.match(refreshScript, /visibleTenantRows/);
assert.match(refreshScript, /request\.jwt\.claims/);
assert.match(refreshScript, /RESET ROLE/);
assert.match(readbackScript, /BEGIN READ ONLY/);
assert.match(readbackScript, /SET LOCAL ROLE authenticated/);
assert.match(readbackScript, /visibleOtherTenantRows/);
assert.match(readbackScript, /Out-of-scope tenant refused/);
const readbackQueries = [...readbackScript.matchAll(/client\.query\(([\s\S]*?)\)/g)].map((match) => match[1]);
for (const query of readbackQueries) {
  assert.doesNotMatch(query, /\bINSERT\s+INTO\b|\bUPDATE\s+\S+\s+SET\b|\bDELETE\s+FROM\b/i);
}
assert.ok(
  refreshScript.indexOf('await client.query("RESET ROLE");') <
    refreshScript.indexOf("const expectedTenantEdges = await count"),
  "readback must reset the operator role before computing each tenant's expected count",
);

for (const table of [
  "layer_refresh_runs",
  "business_records",
  "relationship_edges",
  "graph_nodes",
  "graph_edges",
  "graph_quality_reports",
]) {
  assert.match(
    forceRlsMigration,
    new RegExp(`ALTER TABLE intelligence_v6\\.${table} FORCE ROW LEVEL SECURITY;`),
  );
}

console.log("runtime-layer-refresh RLS readback guard tests passed");
