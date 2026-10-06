import assert from "node:assert/strict";
import { test } from "node:test";
import { buildProof, evidenceTuples } from "../opportunity-ownership-cutover-preflight.mjs";

const manifest = {
  schema_version: 1,
  packages: [
    { tenant_key: "fixture-tenant", dataset_version: "writer-v1", contracts: [
      { role: "canonical_writer", contract_id: "CONTRACT-1", evidence_only_dataset_versions: ["evidence-v1"] },
    ] },
    { tenant_key: "fixture-tenant", dataset_version: "evidence-v1", contracts: [
      { role: "evidence_only", contract_id: "CONTRACT-1", canonical_writer_dataset_version: "writer-v1" },
    ] },
  ],
};

const columns = {
  optimization_opportunity: ["tenant_key", "dataset_version", "contract_id", "opportunity_id"],
  optimization_baseline: ["tenant_key", "dataset_version", "contract_id", "baseline_id"],
  optimization_case: ["tenant_key", "dataset_version", "contract_id", "optimization_case_id", "baseline_id"],
  calculation_run: ["tenant_key", "dataset_version", "opportunity_id", "calculation_run_id"],
  calculation_input: ["tenant_key", "dataset_version", "calculation_run_id"],
  opportunity_overlap: ["tenant_key", "dataset_version", "opportunity_id", "overlaps_opportunity_id"],
  approval_request: ["tenant_key", "dataset_version", "opportunity_id", "optimization_case_id", "approval_request_id"],
  approval_decision: ["tenant_key", "dataset_version", "approval_request_id"],
  opportunity_claim: ["tenant_key", "dataset_version", "contract_id", "opportunity_id"],
};

function fakeClient({ missingSchema = false, missingUniqueIndex = false } = {}) {
  const calls = [];
  const client = {
    calls,
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes("information_schema.columns")) {
        return { rows: Object.entries(columns).flatMap(([table_name, names]) =>
          (missingSchema && table_name === "optimization_opportunity" ? [] : names.map((column_name) => ({ table_name, column_name })))) };
      }
      if (sql.includes("pg_catalog.pg_constraint")) return { rows: [{ table_name: "optimization_opportunity", name: "opportunity_fk", type: "f", definition: "FOREIGN KEY (...)" }] };
      if (sql.includes("pg_catalog.pg_index")) return { rows: missingUniqueIndex ? [] : [{ table_name: "optimization_opportunity", name: "unique_opportunity", unique: true, valid: true,
        definition: "CREATE UNIQUE INDEX unique_opportunity ON source.optimization_opportunity USING btree (tenant_key, opportunity_id)" }] };
      const table = sql.match(/FROM "source"\."([a-z_]+)" t/)?.[1];
      if (sql.includes("SELECT DISTINCT")) {
        const field = sql.match(/SELECT DISTINCT t\."([a-z_]+)"/)?.[1];
        const ids = { optimization_opportunity: { opportunity_id: "OPP-1" }, optimization_baseline: { baseline_id: "BASE-1" },
          optimization_case: { optimization_case_id: "CASE-1" }, calculation_run: { calculation_run_id: "RUN-1" },
          approval_request: { approval_request_id: "APPROVAL-1" } };
        return { rows: ids[table]?.[field] ? [{ id: ids[table][field] }] : [] };
      }
      if (sql.includes("row_count")) {
        const row_count = values[1] === "writer-v1" ? 3 : table === "optimization_opportunity" ? 1 : 2;
        return { rows: [{ row_count: String(row_count), row_checksum: "checksum" }] };
      }
      if (sql.includes("reference_count")) return { rows: [{ reference_count: "1" }] };
      return { rows: [] };
    },
  };
  return client;
}

test("derives the exact evidence and writer tuple from declarations", () => {
  assert.deepEqual(evidenceTuples(manifest), [{ tenant_key: "fixture-tenant", contract_id: "CONTRACT-1",
    dataset_version: "evidence-v1", canonical_writer_dataset_version: "writer-v1" }]);
  const broken = structuredClone(manifest);
  broken.packages[0].contracts[0].evidence_only_dataset_versions = [];
  assert.throws(() => evidenceTuples(broken), /ambiguous_canonical_writer/);
});

test("inspects installed catalog and scoped references in one read-only transaction", async () => {
  const client = fakeClient();
  const proof = await buildProof(client, manifest);
  assert.equal(client.calls[0].sql, "BEGIN READ ONLY");
  assert.equal(client.calls.at(-1).sql, "COMMIT");
  assert.ok(client.calls.some(({ sql, values }) => sql.includes("set_config('app.tenant_key'") && values[0] === "fixture-tenant"));
  assert.equal(proof.evidence_tuples[0].opportunity_ids[0], "OPP-1");
  assert.equal(proof.evidence_tuples[0].canonical_writer_control.counts.optimization_opportunity.row_count, 3);
  assert.ok(proof.evidence_tuples[0].canonical_writer_control.counts.calculation_input.row_count > 0);
  assert.equal(proof.evidence_tuples[0].checks.evidence_only_opportunities_absent, false);
  assert.equal(proof.evidence_tuples[0].checks.evidence_only_ownership_rows_absent, false);
  assert.equal(proof.ready, false);
  assert.equal(proof.evidence_tuples[0].checks.tenant_opportunity_unique_index_valid, true);
  assert.ok(proof.schema.tables.includes("opportunity_overlap"));
  assert.equal(proof.evidence_tuples[0].dependent_counts.opportunity_overlap.reference_counts.overlaps_opportunity_id, 1);
  assert.ok(client.calls.some(({ sql, values }) => sql.includes('FROM "source"."calculation_input"') && values.some((value) =>
    Array.isArray(value) && value.includes("RUN-1"))));
  assert.ok(client.calls.some(({ sql, values }) => sql.includes('FROM "source"."approval_decision"') && values.some((value) =>
    Array.isArray(value) && value.includes("APPROVAL-1"))));
  assert.ok(client.calls.some(({ sql, values }) => sql.includes('FROM "source"."opportunity_claim"') &&
    sql.includes('t."contract_id" = $3') && values[2] === "CONTRACT-1"));
  assert.ok(client.calls.filter(({ sql }) => sql.includes("row_count")).every(({ sql, values }) =>
    sql.includes('t."tenant_key" = $1') && sql.includes('t."dataset_version" = $2') && values[0] === "fixture-tenant"));
  assert.ok(client.calls.every(({ sql }) => !/\b(INSERT|UPDATE|DELETE|ALTER|CREATE|DROP)\b/i.test(sql)));
  assert.ok(!proof.evidence_tuples[0].opportunity_ids.includes("UNRELATED-OPP"));
});

test("rolls back and emits no partial proof on schema drift", async () => {
  const client = fakeClient({ missingSchema: true });
  await assert.rejects(buildProof(client, manifest), /missing_required_opportunity_schema/);
  assert.equal(client.calls.at(-1).sql, "ROLLBACK");
});

test("reports a missing installed uniqueness control", async () => {
  const proof = await buildProof(fakeClient({ missingUniqueIndex: true }), manifest);
  assert.equal(proof.evidence_tuples[0].checks.tenant_opportunity_unique_index_valid, false);
  assert.equal(proof.ready, false);
});
