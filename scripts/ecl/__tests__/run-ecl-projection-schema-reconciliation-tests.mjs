#!/usr/bin/env node

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

const REF = process.env.ECL_RECONCILE_REF || "origin/main";
const PRODUCT_DDL = "docs/architecture/sql-drafts/ecl_product_projection_tables_v1_draft.sql";
const CUBE_DDL = "docs/architecture/sql-drafts/ecl_cube_read_models_v1_draft.sql";
const NEEDS_DOC = "docs/architecture/ECL_PRODUCT_DETERMINISTIC_NEEDS_2026_08_22.md";
const PLAN_DOC = "docs/architecture/ECL_CLEAN_BREAK_INTEGRATED_EXECUTION_PLAN_2026_08_24.md";
const SOURCE_PROJECTION_LOADER = "scripts/ecl/load_dense_source_room_source_projection_layer.py";

const CUBE_TABLES = ["cube_manifest", "cube_slice", "cube_slice_metric", "cube_slice_measure"];
const EXPECTED_SURFACE_COUNTS = {
  Home: 16,
  Tower: 9,
  Source: 9,
  Intelligence: 6,
};
const NON_PRODUCT_PROJECTION_TABLES = new Set([
  "projection_manifest",
  "projection_entry",
  "projection_entry_object_ref",
  "projection_entry_metric_ref",
  "projection_entry_measure_ref",
  "projection_entry_relationship_ref",
  "projection_entry_source_record_ref",
  "projection_entry_document_extraction_ref",
  ...CUBE_TABLES,
]);

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

function gitLsTree(paths) {
  const result = spawnSync("git", ["ls-tree", "-r", "--name-only", REF, "--", ...paths], {
    encoding: "utf8",
  });
  assert.equal(
    result.status,
    0,
    `git ls-tree ${REF} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`,
  );
  return result.stdout.split(/\r?\n/).filter(Boolean);
}

function cleanMarkdownCell(value) {
  return value.trim().replace(/^`|`$/g, "");
}

function extractMarkdownTable(markdown, heading) {
  const start = markdown.indexOf(heading);
  assert.notEqual(start, -1, `${PLAN_DOC} must contain ${heading}`);
  const rest = markdown.slice(start + heading.length);
  const nextHeading = rest.search(/\n#{1,6}\s+/);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  const lines = section
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && line.endsWith("|"));
  assert(lines.length >= 2, `${heading} must contain a markdown table`);
  const headers = lines[0].split("|").slice(1, -1).map(cleanMarkdownCell);
  return lines.slice(2).map((line) => {
    const cells = line.split("|").slice(1, -1).map(cleanMarkdownCell);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
}

function projectionNamesFromNeeds(markdown) {
  return [
    ...new Set(
      [...markdown.matchAll(/ecl_projection\.([a-z0-9_]+)/gi)]
        .map((match) => match[1])
        .filter((name) => !NON_PRODUCT_PROJECTION_TABLES.has(name)),
    ),
  ].sort();
}

function eclProjectionCreateTables(sql) {
  return [...sql.matchAll(/create table if not exists\s+ecl_projection\.([a-z0-9_]+)/gi)].map((match) => match[1]);
}

function servingViewsFromSql(sql) {
  return [...sql.matchAll(/create\s+(?:or\s+replace\s+)?view\s+serving\.([a-z0-9_]+)/gi)].map(
    (match) => `serving.${match[1]}`,
  );
}

function incomingFkCount(sql, table) {
  const re = new RegExp(`references\\s+ecl_projection\\.${table}\\b`, "gi");
  return [...sql.matchAll(re)].length;
}

function upgradeColumnCount(sql, table) {
  const re = new RegExp(
    `alter\\s+table\\s+if\\s+exists\\s+ecl_projection\\.${table}[\\s\\S]+?add\\s+column\\s+if\\s+not\\s+exists\\s+projection_entry_id\\s+uuid`,
    "gi",
  );
  return [...sql.matchAll(re)].length;
}

function upgradeConstraintCount(sql, table) {
  const constraintName = table === "home_enterprise_landscape"
    ? "home_enterprise_landscape_entry_fk"
    : `${table}_entry_fk`;
  const re = new RegExp(
    `conrelid\\s*=\\s*'ecl_projection\\.${table}'::regclass[\\s\\S]+?conname\\s*=\\s*'${constraintName}'[\\s\\S]+?alter\\s+table\\s+ecl_projection\\.${table}[\\s\\S]+?add\\s+constraint\\s+${constraintName}[\\s\\S]+?foreign\\s+key\\s*\\(tenant_key,\\s*assessment_id,\\s*projection_entry_id\\)[\\s\\S]+?references\\s+ecl_projection\\.projection_entry`,
    "i",
  );
  return re.test(sql) ? 1 : 0;
}

const productDdl = gitShow(PRODUCT_DDL);
const cubeDdl = gitShow(CUBE_DDL);
const needsDoc = gitShow(NEEDS_DOC);
const planDoc = gitShow(PLAN_DOC);
const sourceProjectionLoader = gitShow(SOURCE_PROJECTION_LOADER);
const productTables = eclProjectionCreateTables(productDdl);
const cubeTables = eclProjectionCreateTables(cubeDdl);
const specifiedProductProjections = projectionNamesFromNeeds(needsDoc);
const surfaceEnumeration = extractMarkdownTable(planDoc, "### Serving Surface Enumeration");
const notBuiltDeclarations = extractMarkdownTable(planDoc, "### Planned `serving.serving_contract` Not-Built Declarations");
const notBuiltByBacking = new Map(
  notBuiltDeclarations.map((row) => [row["ecl backing"].replace(/^ecl_projection\./, ""), row]),
);

assert.equal(
  surfaceEnumeration.length,
  Object.values(EXPECTED_SURFACE_COUNTS).reduce((sum, count) => sum + count, 0),
  "serving surface enumeration must contain exactly 40 product surfaces",
);

assert.deepEqual(
  Object.fromEntries(
    Object.entries(EXPECTED_SURFACE_COUNTS).map(([product]) => [
      product,
      surfaceEnumeration.filter((row) => row.product === product).length,
    ]),
  ),
  EXPECTED_SURFACE_COUNTS,
  "serving surface enumeration must preserve Home 16, Tower 9, Source 9, Intelligence 6",
);

for (const requiredHeader of ["surface_key", "product", "serving view", "ecl backing", "build_state"]) {
  assert(
    Object.hasOwn(surfaceEnumeration[0], requiredHeader),
    `serving surface enumeration must include ${requiredHeader}`,
  );
}

const surfaceKeys = surfaceEnumeration.map((row) => row.surface_key);
assert.equal(new Set(surfaceKeys).size, surfaceKeys.length, "each enumerated surface_key must be unique");

const servingViews = surfaceEnumeration.map((row) => row["serving view"]);
assert.equal(new Set(servingViews).size, servingViews.length, "each enumerated surface must have exactly one unique serving view");

const enumBackings = [...new Set(surfaceEnumeration.map((row) => row["ecl backing"].replace(/^ecl_projection\./, "")))].sort();
assert.deepEqual(
  enumBackings.filter((backing) => !specifiedProductProjections.includes(backing)),
  [],
  "every enumerated ECL backing must be specified in the deterministic needs doc",
);

assert.deepEqual(
  specifiedProductProjections.filter(
    (surface) => !productTables.includes(surface) && notBuiltByBacking.get(surface)?.build_state !== "not_built",
  ),
  [],
  "every specified product projection must exist in DDL or be declared not_built in serving.serving_contract planning",
);

assert.deepEqual(
  CUBE_TABLES.filter((table) => !cubeTables.includes(table)),
  [],
  "the named-ref cube DDL must contain all cube projection tables",
);

for (const surface of specifiedProductProjections) {
  const isBuilt = productTables.includes(surface);
  const declaration = notBuiltByBacking.get(surface);
  if (!isBuilt) {
    assert.equal(declaration?.build_state, "not_built", `${surface} must be declared not_built when absent from DDL`);
    assert.match(declaration.owner_person ?? "", /\S/, `${surface} not_built declaration must include owner_person`);
    assert.match(declaration.due_date ?? "", /^\d{4}-\d{2}-\d{2}$/, `${surface} not_built declaration must include ISO due_date`);
    continue;
  }
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
  assert.equal(
    upgradeColumnCount(productDdl, surface),
    1,
    `${surface} must include an additive projection_entry_id upgrade clause for existing databases in ${REF}`,
  );
  assert.equal(
    upgradeConstraintCount(productDdl, surface),
    1,
    `${surface} must include an additive projection_entry FK upgrade block for existing databases in ${REF}`,
  );
}

for (const row of surfaceEnumeration) {
  const backing = row["ecl backing"].replace(/^ecl_projection\./, "");
  const isBuilt = productTables.includes(backing);
  assert.match(row["serving view"], /^serving\.[a-z0-9_]+$/, `${row.surface_key} must name one serving.<view>`);
  assert.match(row["ecl backing"], /^ecl_projection\.[a-z0-9_]+$/, `${row.surface_key} must name one ecl_projection backing`);
  assert(
    isBuilt ? row.build_state !== "not_built" : row.build_state === "not_built",
    `${row.surface_key} build_state must match whether ${row["ecl backing"]} is present in DDL`,
  );
}

const sqlDraftFiles = gitLsTree(["docs/architecture/sql-drafts", "supabase/migrations"]).filter((path) =>
  path.endsWith(".sql"),
);
const servingSql = sqlDraftFiles
  .map((path) => gitShow(path))
  .filter((sql) => /\bserving\./i.test(sql) || /create\s+schema\s+(?:if\s+not\s+exists\s+)?serving\b/i.test(sql))
  .join("\n\n");
const committedServingViews = servingViewsFromSql(servingSql);
if (committedServingViews.length > 0) {
  for (const view of servingViews) {
    assert.equal(
      committedServingViews.filter((candidate) => candidate === view).length,
      1,
      `${view} must be created exactly once in serving DDL once W3 has serving views`,
    );
  }
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
      specifiedProductProjections: specifiedProductProjections.length,
      builtProductProjections: specifiedProductProjections.filter((surface) => productTables.includes(surface)).length,
      notBuiltProductProjections: specifiedProductProjections.filter((surface) => !productTables.includes(surface)).length,
      enumeratedProductSurfaces: surfaceEnumeration.length,
      enumeratedProductSurfaceCounts: Object.fromEntries(
        Object.entries(EXPECTED_SURFACE_COUNTS).map(([product]) => [
          product,
          surfaceEnumeration.filter((row) => row.product === product).length,
        ]),
      ),
      cubeTables: CUBE_TABLES.length,
      productTableCountAtRef: productTables.length,
      cubeTableCountAtRef: cubeTables.length,
      servingViewsInDdlAtRef: committedServingViews.length,
      incomingFkToProductSurfacesAtRef: Object.fromEntries(
        specifiedProductProjections
          .filter((surface) => productTables.includes(surface))
          .map((surface) => [surface, incomingFkCount(productDdl, surface)]),
      ),
      productSurfaceUpgradeColumnClausesAtRef: Object.fromEntries(
        specifiedProductProjections
          .filter((surface) => productTables.includes(surface))
          .map((surface) => [surface, upgradeColumnCount(productDdl, surface)]),
      ),
      productSurfaceUpgradeConstraintBlocksAtRef: Object.fromEntries(
        specifiedProductProjections
          .filter((surface) => productTables.includes(surface))
          .map((surface) => [surface, upgradeConstraintCount(productDdl, surface)]),
      ),
      notBuiltDeclarationsAtRef: notBuiltDeclarations.length,
    },
    null,
    2,
  ),
);
