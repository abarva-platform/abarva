import test from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import Papa from "papaparse";
import ts from "typescript";
import pg from "pg";
import { performanceMeasureFromSource } from "../../../src/lib/source/contract-intelligence/performance-units.ts";
import {
  contractInputQualityState,
  contractTermGovernance,
} from "../../../src/lib/source/contract-depth-package/clause-text-basis.ts";

const file = new URL("../load-contract-depth-package.ts", import.meta.url);
const parsed = ts.createSourceFile(
  file.pathname,
  fs.readFileSync(file, "utf8"),
  ts.ScriptTarget.Latest,
  true,
);
// Execute the actual writer functions without importing the operator CLI.
const functions = parsed.statements
  .filter(ts.isFunctionDeclaration)
  .map((statement) => statement.getText(parsed))
  .join("\n");
const compiled = ts.transpileModule(functions, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText;
const writer = vm.runInNewContext(
  `${compiled}\n({readSourceFiles,upsertContractContextFacts,upsertContracts,upsertContractTerms,upsertContractScope,upsertSpend,upsertPerformance})`,
  {
    SOURCE_SYSTEM: "fixture_loader",
    fs,
    path,
    performanceMeasureFromSource,
    contractInputQualityState,
    contractTermGovernance,
  },
);
const connectionString = process.env.SOURCE_WRITER_TEST_DATABASE_URL;
if (connectionString) {
  const url = new URL(connectionString);
  assert.ok(
    ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.pathname === "/origin_repair_fixture",
    "Explicit disposable localhost fixture only",
  );
}
const args = {
  tenantKey: "fixture",
  datasetVersion: "fixture-version",
  loadRunId: "fixture-run",
};
const row = {
  tenant_key: "fixture",
  dataset_version: "fixture-version",
  source_row_id: "row-test",
  contract_id: "contract-test",
  extraction_id: "term-test",
  vendor_ref: "vendor-test",
  contract_name: "Fixture agreement",
  category: "Software subscription",
  archetype: "software_subscription",
  start_date: "2026-01-01",
  end_date: "2027-01-01",
  renewal_notice_date: "2026-10-01",
  annual_value_usd: "100",
  source_file_id: "DOC-declared-fixture",
  contract_purpose_summary: "Synthetic unreviewed purpose",
  concept_ref: "minimum",
  value_text: "Synthetic unreviewed term",
  source_page: "1",
  source_section: "minimum",
  review_state: "not_reviewed",
  source_basis: "synthetic_modelled",
  application_ref: "app-test",
  application_name: "Fixture app",
  period_start: "2026-01-01",
  period_end: "2026-01-31",
  committed_base_amount_usd: "100",
  actual_spend_usd: "80",
  invoice_amount_usd: "80",
  paid_amount_usd: "0",
  metric_name: "platform_availability_pct",
  unit: "%",
  actual_result_pct: "99.95",
  committed_threshold_pct: "99.9",
  breach_state: "met",
};
const primaryKeys = {
  canonical_fact_assertion: ["tenant_key", "dataset_version", "assertion_id"],
  contract: ["tenant_key", "contract_id"],
  contract_term: ["tenant_key", "term_id"],
  contract_scope: ["tenant_key", "contract_scope_id"],
  contract_consumption_observation: ["tenant_key", "observation_id"],
  contract_performance_observation: ["tenant_key", "observation_id"],
  contract_service_credit: ["tenant_key", "service_credit_id"],
};

const contextMigration = fs.readFileSync(
  new URL(
    "../../../supabase/migrations/20260803160000_source_sourcing_context_depth_contract.sql",
    import.meta.url,
  ),
  "utf8",
);
const factMigration = fs.readFileSync(
  new URL(
    "../../../supabase/migrations/20260809161500_source_contract_optimization_fact_assertions.sql",
    import.meta.url,
  ),
  "utf8",
);
function tableDefinition(table) {
  const source =
    table === "canonical_fact_assertion" ? factMigration : contextMigration;
  const start = source.indexOf(`CREATE TABLE IF NOT EXISTS source.${table} (`);
  const end = source.indexOf("\n);", start);
  assert.ok(
    start >= 0 && end > start,
    "Exact repository migration table definition exists",
  );
  return source.slice(start, end + 3);
}

// Replay the exact selected CREATE TABLE statements, not all migrations or
// RLS. This catches real nullability, types and bindings without shared data.
async function persist(method, ...inputs) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  const created = new Set();
  try {
    await client.query("BEGIN");
    await client.query("CREATE SCHEMA IF NOT EXISTS source");
    for (const table of Object.keys(primaryKeys)) {
      await client.query(tableDefinition(table));
      created.add(table);
    }
    for (const input of inputs) await writer[method](client, args, [input]);
    const result = {};
    for (const table of created)
      result[table] = (
        await client.query(`SELECT * FROM source.${table}`)
      ).rows;
    return result;
  } finally {
    await client.query("ROLLBACK");
    await client.end();
  }
}

test(
  "actual contract writers preserve provenance in disposable Postgres",
  { skip: !connectionString },
  async (t) => {
    for (const [method, table] of [
      ["upsertContractScope", "contract_scope"],
      ["upsertPerformance", "contract_performance_observation"],
    ]) {
      for (const serviceId of [undefined, "", "SVC-declared-fixture"]) {
        await t.test(
          `${method} preserves only declared service identity ${serviceId ?? "absent"}`,
          async () => {
            const input = {
              ...row,
              scope_role: "included",
              service_tower: "Managed service label",
              credit_owed_usd: "1",
              service_id: serviceId,
            };
            const result = await persist(method, input);
            assert.equal(result[table][0].service_id, serviceId || null);
            if (method === "upsertPerformance")
              assert.equal(
                result.contract_service_credit[0].service_id,
                serviceId || null,
              );
          },
        );
      }
      await t.test(
        `${method} changes declared service identity on repeat import`,
        async () => {
          const input = {
            ...row,
            scope_role: "included",
            service_tower: "Managed service label",
            credit_owed_usd: "1",
          };
          const result = await persist(
            method,
            { ...input, service_id: "SVC-declared-fixture" },
            { ...input, service_id: "" },
          );
          assert.equal(result[table][0].service_id, null);
          if (method === "upsertPerformance")
            assert.equal(result.contract_service_credit[0].service_id, null);
        },
      );
    }
    await t.test(
      "genuine clause declarations survive actual normalization and canonical persistence",
      async () => {
        const dir = fs.mkdtempSync(
          path.join(os.tmpdir(), "source-clause-writer-"),
        );
        fs.mkdirSync(path.join(dir, "source-files"));
        try {
          fs.writeFileSync(
            path.join(dir, "source-files", "contracts.csv"),
            Papa.unparse([row]),
          );
          fs.writeFileSync(
            path.join(dir, "source-files", "contract_clauses.csv"),
            Papa.unparse([
              {
                ...row,
                source_basis: "document_extracted",
                review_state: "human_reviewed",
                confidence: "0.74",
                source_page: "17",
                source_section: "Schedule 4",
                value_text: "Supplier shall maintain monthly availability.",
              },
            ]),
          );
          const normalized = writer.readSourceFiles(
            dir,
            args.tenantKey,
            args.datasetVersion,
          ).contractClauses[0];
          const result = await persist("upsertContractTerms", normalized);
          const term = result.contract_term[0];
          assert.equal(term.quality_state, "reviewed");
          assert.equal(Number(term.confidence), 0.74);
          assert.equal(term.page_ref, "17");
          assert.equal(term.clause_ref, "Schedule 4");
          assert.equal(term.raw_payload.source_file_id, row.source_file_id);
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      },
    );
    await t.test(
      "missing header document stays absent through normalization and actual purpose persistence",
      async () => {
        const dir = fs.mkdtempSync(
          path.join(os.tmpdir(), "source-header-writer-"),
        );
        fs.mkdirSync(path.join(dir, "source-files"));
        try {
          fs.writeFileSync(
            path.join(dir, "source-files", "contracts.csv"),
            Papa.unparse([{ ...row, source_file_id: "" }]),
          );
          const normalized = writer.readSourceFiles(
            dir,
            args.tenantKey,
            args.datasetVersion,
          ).contracts[0];
          const result = await persist(
            "upsertContractContextFacts",
            normalized,
          );
          assert.equal(
            result.canonical_fact_assertion[0].source_document_id,
            null,
          );
          assert.deepEqual(result.canonical_fact_assertion[0].source_refs, [
            row.source_row_id,
          ]);
        } finally {
          fs.rmSync(dir, { recursive: true, force: true });
        }
      },
    );
    await t.test(
      "purpose keeps the declared document and does not claim extraction",
      async () => {
        const result = await persist("upsertContractContextFacts", row);
        const fact = result.canonical_fact_assertion[0];
        assert.equal(fact.source_document_id, row.source_file_id);
        assert.deepEqual(fact.source_refs, [
          row.source_row_id,
          row.source_file_id,
        ]);
        assert.equal(fact.review_state, "not_reviewed");
        assert.equal(Number(fact.confidence), 0);
        assert.match(
          fact.assertion_basis,
          /imported from the declared contract header/,
        );
      },
    );
    await t.test(
      "missing document is absent, not an invented fallback",
      async () => {
        const result = await persist("upsertContractContextFacts", {
          ...row,
          source_file_id: "",
        });
        assert.equal(
          result.canonical_fact_assertion[0].source_document_id,
          null,
        );
        assert.deepEqual(result.canonical_fact_assertion[0].source_refs, [
          row.source_row_id,
        ]);
      },
    );
    for (const [method, relation, confidenceColumn] of [
      ["upsertContracts", "contract", "confidence"],
      ["upsertContractTerms", "contract_term", "confidence"],
      ["upsertContractScope", "contract_scope", "relationship_confidence"],
      ["upsertSpend", "contract_consumption_observation", "confidence"],
      ["upsertPerformance", "contract_performance_observation", "confidence"],
    ]) {
      await t.test(
        `${method} leaves synthetic review and missing confidence unearned`,
        async () => {
          const result = await persist(method, row);
          assert.equal(result[relation][0].quality_state, "unreviewed");
          if (relation === "contract_scope")
            assert.equal(Number(result[relation][0][confidenceColumn]), 0);
          else assert.equal(result[relation][0][confidenceColumn], null);
        },
      );
      await t.test(
        `${method} updates quality on repeat import without inventing review`,
        async () => {
          const result = await persist(
            method,
            {
              ...row,
              source_basis: "document_extracted",
              review_state: "human_reviewed",
            },
            row,
          );
          assert.equal(result[relation].length, 1);
          assert.equal(result[relation][0].quality_state, "unreviewed");
        },
      );
    }
    await t.test(
      "genuinely reviewed extraction retains page, confidence and text basis",
      async () => {
        const input = {
          ...row,
          source_basis: "document_extracted",
          review_state: "human_reviewed",
          confidence: "0.74",
        };
        const result = await persist("upsertContractTerms", input);
        const term = result.contract_term[0];
        assert.equal(term.quality_state, "reviewed");
        assert.equal(term.page_ref, "1");
        assert.equal(Number(term.confidence), 0.74);
        assert.equal(term.raw_payload.clause_text_basis, "document_extracted");
      },
    );
    for (const [sourceBasis, expectedBasis] of [
      ["authored_reference", "derived_not_extracted"],
      ["", "imported_unverified"],
      ["unknown_import", "imported_unverified"],
    ]) {
      await t.test(
        `term writer does not promote ${sourceBasis || "undeclared"} import`,
        async () => {
          const result = await persist("upsertContractTerms", {
            ...row,
            value_text:
              "Proposed operating model assigns an owner to the transition review.",
            source_basis: sourceBasis,
            review_state: "unreviewed",
            confidence: "0.9",
          });
          const term = result.contract_term[0];
          assert.equal(term.quality_state, "unreviewed");
          assert.equal(term.page_ref, null);
          assert.equal(term.confidence, null);
          assert.equal(term.raw_payload.clause_text_basis, expectedBasis);
          assert.equal(
            term.term_value,
            "Proposed operating model assigns an owner to the transition review.",
          );
        },
      );
    }
    await t.test(
      "credit writer also preserves unreviewed quality and unknown confidence",
      async () => {
        const result = await persist("upsertPerformance", {
          ...row,
          credit_owed_usd: "1",
        });
        assert.equal(
          result.contract_service_credit[0].quality_state,
          "unreviewed",
        );
        assert.equal(result.contract_service_credit[0].confidence, null);
      },
    );
  },
);
