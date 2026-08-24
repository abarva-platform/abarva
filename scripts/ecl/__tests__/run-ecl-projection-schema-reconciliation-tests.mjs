#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const REF = process.env.ECL_RECONCILE_REF || "origin/main";
const PRODUCT_DDL = "docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql";
const CUBE_DDL = "docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql";
const SOURCE_PROJECTION_LOADER = "scripts/ecl/load_dense_source_room_source_projection_layer.py";

const PRODUCT_SURFACES = [
  "home_enterprise_landscape",
  "source_contract_360",
  "source_vendor_360",
  "source_value_levers",
  "source_event_workspace",
  "tower_command_center",
  "intelligence_context_pack",
];

const CUBE_TABLES = ["cube_manifest", "cube_slice", "cube_slice_metric", "cube_slice_measure"];

function gitShow(path) {
  const result = spawnSync("git", ["show", `${REF}:${path}`], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git show ${REF}:${path} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout;
}

function eclProjectionCreateTables(sql) {
  return [...sql.matchAll(/create table if not exists\s+ecl_projection\.([a-z0-9_]+)/gi)].map((match) => match[1]);
}

function incomingFkCount(sql, table) {
  const re = new RegExp(`references\\s+ecl_projection\\.${table}\\b`, "gi");
  return [...sql.matchAll(re)].length;
}

const productDdl = gitShow(PRODUCT_DDL);
const cubeDdl = gitShow(CUBE_DDL);
const sourceProjectionLoader = gitShow(SOURCE_PROJECTION_LOADER);
const productTables = eclProjectionCreateTables(productDdl);
const cubeTables = eclProjectionCreateTables(cubeDdl);

assert.deepEqual(
  PRODUCT_SURFACES.filter((surface) => !productTables.includes(surface)),
  [],
  "the named-ref product DDL must contain all seven product projection surfaces",
);

assert.deepEqual(
  CUBE_TABLES.filter((table) => !cubeTables.includes(table)),
  [],
  "the named-ref cube DDL must contain all cube projection tables",
);

for (const surface of PRODUCT_SURFACES) {
  assert.match(
    sourceProjectionLoader,
    new RegExp(`ecl_projection\\.${surface}`, "g"),
    `${surface} must be generated/loaded by ${SOURCE_PROJECTION_LOADER}`,
  );
  assert.equal(
    incomingFkCount(productDdl, surface),
    0,
    `${surface} should remain a terminal product read model in ${REF}; child refs must point to projection_entry, not the surface table`,
  );
}

assert.doesNotMatch(
  productDdl,
  /create table if not exists\s+source_value_levers\b/i,
  "legacy public-schema source_value_levers must not be counted as an ECL projection table",
);

console.log(
  JSON.stringify(
    {
      accepted: true,
      ref: REF,
      productSurfaces: PRODUCT_SURFACES.length,
      cubeTables: CUBE_TABLES.length,
      productTableCountAtRef: productTables.length,
      cubeTableCountAtRef: cubeTables.length,
      incomingFkToProductSurfacesAtRef: Object.fromEntries(
        PRODUCT_SURFACES.map((surface) => [surface, incomingFkCount(productDdl, surface)]),
      ),
    },
    null,
    2,
  ),
);
