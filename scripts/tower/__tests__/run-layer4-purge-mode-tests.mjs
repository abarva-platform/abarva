#!/usr/bin/env node
/**
 * The Layer 4 purge mode exists to unblock a Layer 3 reload.
 *
 * `ecl_projection.tower_value_chain` carries `tower_value_chain_measure_fk` onto
 * `ecl_context.measure`, so Layer 3 cannot be replaced while Layer 4 rows reference it. That makes
 * every Layer 3 reload fail once Layer 4 has been built — structural, not incidental. These checks
 * pin the three properties the teardown depends on: it clears the referencing table, it clears
 * nothing it does not own, and it refuses to run without the same approval a write requires.
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const loader = fs.readFileSync(
  path.resolve(here, "../load-healthcare-demo-layer4-products.mjs"),
  "utf8",
);

function deleteBlock() {
  const start = loader.indexOf("function projectionDeletes(options)");
  const end = loader.indexOf("function writePurgeSql");
  assert.ok(start >= 0 && end > start, "projectionDeletes/writePurgeSql not found");
  return loader.slice(start, end);
}

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test("the deletes are shared, not duplicated between load and purge", () => {
  assert.match(loader, /function projectionDeletes\(options\)/);
  assert.match(loader, /\.\.\.projectionDeletes\(options\),/);
  assert.match(
    loader,
    /const sql = \["begin;", \.\.\.projectionDeletes\(options\), "commit;"\]/,
  );
});

test("purge clears the table that blocks the Layer 3 reload", () => {
  assert.match(deleteBlock(), /delete from ecl_projection\.tower_value_chain/);
});

test("purge clears only rows this loader owns", () => {
  const targets = [
    ...deleteBlock().matchAll(/delete from ([a-z_]+)\.([a-z_]+)/g),
  ].map((m) => `${m[1]}.${m[2]}`);
  assert.ok(targets.length > 0, "expected delete targets");
  for (const t of targets) {
    assert.ok(
      t.startsWith("ecl_projection.") || t === "ecl_context.snapshot",
      `purge must not touch ${t} — canonical rows are Layer 3's to own`,
    );
  }
  for (const forbidden of [
    "ecl_context.object",
    "ecl_context.measure",
    "ecl_context.relationship",
    "ecl_context.metric_definition",
  ]) {
    assert.ok(!targets.includes(forbidden), `purge must not delete ${forbidden}`);
  }
});

test("every delete is scoped to one tenant and one assessment", () => {
  for (const line of deleteBlock().split("\n")) {
    if (!line.includes("delete from")) continue;
    assert.ok(
      line.includes("tenant_key = ${tenant}") &&
        line.includes("assessment_id = ${assessment}"),
      `unscoped delete: ${line.trim().slice(0, 90)}`,
    );
  }
});

test("purge refuses to run without the write approval", () => {
  assert.match(
    loader,
    /Refusing Azure purge without TOWER_LAYER4_AZURE_WRITE_APPROVED=true/,
  );
});

test("purge reports that it wrote no projection", () => {
  assert.match(loader, /summary\.boundary\.product_projection_written = false;/);
  assert.match(loader, /summary\.boundary\.cube_layer_written = false;/);
  assert.match(loader, /summary\.status = "purge_applied";/);
});

test("purge is reachable from an npm script the operator wrapper can run", () => {
  const pkg = JSON.parse(
    fs.readFileSync(path.resolve(here, "../../../package.json"), "utf8"),
  );
  const script = pkg.scripts["tower:healthcare-demo-layer4-products:purge-job"];
  assert.ok(script, "missing purge-job script");
  assert.match(script, /TOWER_LAYER4_PURGE_ONLY=true/);
  assert.match(script, /TOWER_LAYER4_AZURE_WRITE_APPROVED=true/);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${err.message}`);
  }
}
console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
