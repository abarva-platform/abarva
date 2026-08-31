#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  PROOF_BEGIN_MARKER,
  addIfNotExistsToIndexDef,
  orderViewsByDependency,
  renderBaselineSql,
} from "../emit-ecl-substrate-baseline.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, "../../..");

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

function fixtureCatalog() {
  return {
    schemas: ["ecl_context", "ecl_projection", "serving"],
    tables: [
      {
        schema_name: "ecl_context",
        table_name: "object",
        table_key: "ecl_context.object",
        relpersistence: "p",
        relrowsecurity: true,
        relforcerowsecurity: false,
      },
      {
        schema_name: "ecl_projection",
        table_name: "tower_ai_portfolio",
        table_key: "ecl_projection.tower_ai_portfolio",
        relpersistence: "p",
        relrowsecurity: true,
        relforcerowsecurity: false,
      },
    ],
    columns: [
      {
        table_key: "ecl_context.object",
        column_name: "id",
        data_type: "uuid",
        default_expr: "gen_random_uuid()",
        attnotnull: true,
        attidentity: "",
        attgenerated: "",
      },
      {
        table_key: "ecl_projection.tower_ai_portfolio",
        column_name: "id",
        data_type: "uuid",
        default_expr: null,
        attnotnull: true,
        attidentity: "",
        attgenerated: "",
      },
      {
        table_key: "ecl_projection.tower_ai_portfolio",
        column_name: "object_id",
        data_type: "uuid",
        default_expr: null,
        attnotnull: false,
        attidentity: "",
        attgenerated: "",
      },
    ],
    tableConstraints: [
      {
        schema_name: "ecl_context",
        table_name: "object",
        constraint_name: "object_pkey",
        definition: "PRIMARY KEY (id)",
      },
      {
        schema_name: "ecl_projection",
        table_name: "tower_ai_portfolio",
        constraint_name: "tower_ai_portfolio_pkey",
        definition: "PRIMARY KEY (id)",
      },
      {
        schema_name: "ecl_projection",
        table_name: "tower_ai_portfolio",
        constraint_name: "tower_ai_portfolio_quality_check",
        definition: "CHECK ((id IS NOT NULL))",
      },
    ],
    foreignKeys: [
      {
        schema_name: "ecl_projection",
        table_name: "tower_ai_portfolio",
        constraint_name: "tower_ai_portfolio_object_fk",
        definition: "FOREIGN KEY (object_id) REFERENCES ecl_context.object(id)",
      },
    ],
    indexes: [
      {
        indexdef: "CREATE INDEX tower_ai_portfolio_object_idx ON ecl_projection.tower_ai_portfolio USING btree (object_id)",
      },
    ],
    functions: [
      {
        schema_name: "serving",
        function_name: "tower_active_assessment_keys",
        identity_arguments: "",
        definition:
          "CREATE FUNCTION serving.tower_active_assessment_keys()\n RETURNS TABLE(assessment_id text)\n LANGUAGE sql\nAS $function$ select 'active'::text $function$;",
      },
    ],
    views: [
      {
        schema_name: "serving",
        view_name: "tower_ai_portfolio_v1",
        view_key: "serving.tower_ai_portfolio_v1",
        relkind: "v",
        definition: " SELECT id FROM ecl_projection.tower_ai_portfolio",
      },
      {
        schema_name: "serving",
        view_name: "tower_ai_portfolio_summary_v1",
        view_key: "serving.tower_ai_portfolio_summary_v1",
        relkind: "v",
        definition: " SELECT id FROM serving.tower_ai_portfolio_v1",
      },
    ],
    viewDependencies: [
      {
        view_key: "serving.tower_ai_portfolio_summary_v1",
        depends_on_key: "serving.tower_ai_portfolio_v1",
      },
    ],
    policies: [
      {
        schemaname: "ecl_projection",
        tablename: "tower_ai_portfolio",
        policyname: "tower_ai_portfolio_tenant_select",
        permissive: "PERMISSIVE",
        roles: ["public"],
        cmd: "SELECT",
        qual: "tenant_key = current_setting('app.tenant_key'::text, true)",
        with_check: null,
      },
    ],
  };
}

test("emitted SQL keeps foreign keys after all table definitions and non-FK constraints", () => {
  const sql = renderBaselineSql(fixtureCatalog());
  const tableAt = sql.indexOf('create table if not exists "ecl_projection"."tower_ai_portfolio"');
  const pkAt = sql.indexOf('add constraint "tower_ai_portfolio_pkey" PRIMARY KEY');
  const checkAt = sql.indexOf('add constraint "tower_ai_portfolio_quality_check" CHECK');
  const fkAt = sql.indexOf('add constraint "tower_ai_portfolio_object_fk" FOREIGN KEY');
  assert.ok(tableAt >= 0, "table definition missing");
  assert.ok(pkAt > tableAt, "primary key must follow table definitions");
  assert.ok(checkAt > tableAt, "check constraint must follow table definitions");
  assert.ok(fkAt > pkAt && fkAt > checkAt, "foreign keys must be emitted after non-FK constraints");
});

test("views are ordered by dependency depth", () => {
  const ordered = orderViewsByDependency(fixtureCatalog().views, fixtureCatalog().viewDependencies);
  assert.deepEqual(
    ordered.map((view) => view.view_key),
    ["serving.tower_ai_portfolio_v1", "serving.tower_ai_portfolio_summary_v1"],
  );
});

test("plain catalog indexes become idempotent and constraint indexes stay external to the renderer", () => {
  assert.equal(
    addIfNotExistsToIndexDef(
      "CREATE UNIQUE INDEX tower_row_key_unique ON ecl_projection.tower_ai_portfolio USING btree (row_key)",
    ),
    "CREATE UNIQUE INDEX IF NOT EXISTS tower_row_key_unique ON ecl_projection.tower_ai_portfolio USING btree (row_key)",
  );
  assert.equal(
    addIfNotExistsToIndexDef(
      "CREATE INDEX IF NOT EXISTS tower_row_key_idx ON ecl_projection.tower_ai_portfolio USING btree (row_key)",
    ),
    "CREATE INDEX IF NOT EXISTS tower_row_key_idx ON ecl_projection.tower_ai_portfolio USING btree (row_key)",
  );
});

test("the npm entrypoint is read-only and emits the proof marker the operator wrapper extracts", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  const script = pkg.scripts["ops:emit-ecl-substrate-baseline"];
  assert.ok(script, "missing ops:emit-ecl-substrate-baseline script");
  assert.match(script, /emit-ecl-substrate-baseline\.mjs/);
  assert.match(script, /--emit-proof-bundle/);
  assert.doesNotMatch(script, /run-migrations|:apply|WRITE_APPROVED|purge/i);

  const wrapper = fs.readFileSync(path.join(repoRoot, "scripts/ops/submit-aca-operator-job.mjs"), "utf8");
  assert.ok(wrapper.includes(PROOF_BEGIN_MARKER), "operator wrapper must extract ECL baseline proof bundles");
});

test("emitted SQL names the four Tower projection tables that were previously only live substrate", () => {
  const emitter = fs.readFileSync(path.join(repoRoot, "scripts/ops/emit-ecl-substrate-baseline.mjs"), "utf8");
  const sql = renderBaselineSql(fixtureCatalog());
  assert.match(emitter, /pg_get_constraintdef/);
  assert.match(emitter, /pg_get_viewdef/);
  assert.match(emitter, /pg_get_functiondef/);
  assert.match(emitter, /pg_policies/);
  assert.match(sql, /create table if not exists "ecl_projection"\."tower_ai_portfolio"/);
});

let failed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (error) {
    failed += 1;
    console.error(`  FAIL  ${name}\n        ${error.message}`);
  }
}

console.log(`\n${tests.length - failed}/${tests.length} passed`);
process.exit(failed ? 1 : 0);
