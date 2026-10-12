import test from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import crypto from "node:crypto";
import { runOriginRepair } from "../document-origin-repair.mjs";

const connectionString = process.env.SOURCE_ORIGIN_TEST_DATABASE_URL;
const url = connectionString ? new URL(connectionString) : null;
if (url)
  assert.ok(
    ["127.0.0.1", "localhost"].includes(url.hostname) &&
      url.pathname === "/origin_repair_fixture",
    "Disposable localhost fixture database only",
  );
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const old = {
  dataset_version: "fixture-v1",
  synthetic_policy: "synthetic_demo_only_not_client_truth",
};
const target = (id) => ({
  file_id: id,
  tenant_key: "fixture",
  contract_ref: "contract-fixture",
  expected_content_sha256: "b".repeat(64),
  expected_load_run_id: "fixture-load",
  expected_metadata_json: old,
  proposed_metadata_json: {
    ...old,
    upstream_source_system: "Synthetic CLM export",
    source_basis: "declared_synthetic_manifest",
    source_origin_review_state: "synthetic_origin_pending_review",
    source_manifest_sha256: "a".repeat(64),
  },
});
const inputs = (mode) => ({
  mode,
  plan: {
    tenant_key: "fixture",
    contract_id: "contract-fixture",
    targets: [target("f1"), target("f2")],
  },
  planSha256: "a".repeat(64),
  approval: { decisionId: "fixture-decision" },
  meta: { runId: `fixture-${mode}`, jobName: "fixture-job" },
});

test(
  "real Postgres exact-target transaction and rollback",
  { skip: !connectionString },
  async (t) => {
    const client = new pg.Client({ connectionString });
    await client.connect();
    try {
      await client.query("CREATE SCHEMA IF NOT EXISTS doc");
      await client.query(`CREATE TABLE doc.file (tenant_key text NOT NULL, file_id text NOT NULL, contract_ref text,
      content_sha256 text, load_run_id text, metadata_json jsonb, original_text text,
      PRIMARY KEY(tenant_key,file_id))`);
      const seed = async () => {
        await client.query("TRUNCATE doc.file");
        for (const [tenant, contract, id] of [
          ["fixture", "contract-fixture", "f1"],
          ["fixture", "contract-fixture", "f2"],
          ["fixture", "contract-fixture", "unowned"],
          ["other", "contract-fixture", "f1"],
          ["fixture", "other-contract", "f3"],
        ])
          await client.query(
            "INSERT INTO doc.file VALUES($1,$2,$3,$4,$5,$6::jsonb,$7)",
            [
              tenant,
              id,
              contract,
              "b".repeat(64),
              "fixture-load",
              JSON.stringify(old),
              "untouched content",
            ],
          );
      };
      const rows = async () =>
        (
          await client.query(
            "SELECT to_jsonb(f) AS row FROM doc.file f ORDER BY tenant_key,file_id",
          )
        ).rows.map((r) => r.row);
      await t.test("preflight is read only", async () => {
        await seed();
        const before = await rows();
        const p = await runOriginRepair(
          client,
          inputs("preflight"),
          async () => "private-proof",
        );
        assert.equal(p.committed, false);
        assert.equal(p.updatedRows, 0);
        assert.deepEqual(await rows(), before);
      });
      await t.test(
        "applies exactly two metadata objects and guarded restore returns full before-image",
        async () => {
          await seed();
          const before = await rows();
          const saved = [];
          const persist = async (name, proof) => {
            saved.push({ name, proof: structuredClone(proof) });
            return "private-proof";
          };
          const applied = await runOriginRepair(
            client,
            inputs("apply"),
            persist,
          );
          assert.equal(applied.committed, true);
          assert.equal(applied.updatedRows, 2);
          const after = await rows();
          for (const r of after) {
            const b = before.find(
              (v) => v.tenant_key === r.tenant_key && v.file_id === r.file_id,
            );
            assert.deepEqual(
              r,
              r.tenant_key === "fixture" && ["f1", "f2"].includes(r.file_id)
                ? {
                    ...b,
                    metadata_json: target(r.file_id).proposed_metadata_json,
                  }
                : b,
            );
          }
          assert.ok(
            saved.some((v) => v.name.endsWith("-before")) &&
              saved.some((v) => v.name.endsWith("-validated")),
          );
          const verified = await runOriginRepair(
            client,
            inputs("verify"),
            persist,
          );
          assert.equal(verified.updatedRows, 0);
          const restored = await runOriginRepair(
            client,
            { ...inputs("restore"), restoreProof: applied },
            persist,
          );
          assert.equal(restored.updatedRows, 2);
          assert.deepEqual(await rows(), before);
        },
      );
      await t.test(
        "count mismatch rolls back the first update too",
        async () => {
          await seed();
          const before = await rows();
          let updates = 0;
          const injected = {
            query: async (...args) => {
              const r = await client.query(...args);
              if (args[0].startsWith("UPDATE doc.file") && ++updates === 2)
                return { ...r, rowCount: 0 };
              return r;
            },
          };
          await assert.rejects(
            runOriginRepair(injected, inputs("apply"), async () => "proof"),
            /affected-count/,
          );
          assert.deepEqual(await rows(), before);
        },
      );
      await t.test(
        "concurrent before-image drift refuses every write",
        async () => {
          await seed();
          await client.query(
            "UPDATE doc.file SET content_sha256='changed' WHERE tenant_key='fixture' AND file_id='f2'",
          );
          const before = await rows();
          await assert.rejects(
            runOriginRepair(client, inputs("apply"), async () => "proof"),
            /drift/,
          );
          assert.deepEqual(await rows(), before);
        },
      );
      await t.test("failed private backup prevents all writes", async () => {
        await seed();
        const before = await rows();
        await assert.rejects(
          runOriginRepair(client, inputs("apply"), async () => {
            throw new Error("proof unavailable");
          }),
          /proof unavailable/,
        );
        assert.deepEqual(await rows(), before);
      });
      await t.test(
        "non-metadata side effect is detected and rolled back",
        async () => {
          await seed();
          const before = await rows();
          const injected = {
            query: async (...args) => {
              const r = await client.query(...args);
              if (args[0].startsWith("UPDATE doc.file"))
                await client.query(
                  "UPDATE doc.file SET original_text='changed' WHERE tenant_key='fixture' AND file_id='f1'",
                );
              return r;
            },
          };
          await assert.rejects(
            runOriginRepair(injected, inputs("apply"), async () => "proof"),
            /Non-metadata/,
          );
          assert.deepEqual(await rows(), before);
        },
      );
      await t.test("restore refuses newer after-image edits", async () => {
        await seed();
        const applied = await runOriginRepair(
          client,
          inputs("apply"),
          async () => "proof",
        );
        await client.query(
          "UPDATE doc.file SET original_text='newer' WHERE tenant_key='fixture' AND file_id='f1'",
        );
        const before = await rows();
        await assert.rejects(
          runOriginRepair(
            client,
            { ...inputs("restore"), restoreProof: applied },
            async () => "proof",
          ),
          /after-image drift/,
        );
        assert.deepEqual(await rows(), before);
      });
      await t.test(
        "post-commit proof failure reports a commit rather than a rollback",
        async () => {
          await seed();
          const proof = [];
          await assert.rejects(
            runOriginRepair(client, inputs("apply"), async (name, p) => {
              proof.push(structuredClone(p));
              if (name.endsWith("-result")) throw new Error("proof failure");
              return "proof";
            }),
            /Repair committed/,
          );
          assert.equal(proof.at(-1).committed, true);
          assert.equal(proof.at(-1).updatedRows, 2);
          assert.equal(proof.at(-1).state, "committed_proof_failed");
          assert.equal(
            (await rows()).find(
              (r) => r.tenant_key === "fixture" && r.file_id === "f1",
            ).metadata_json.source_basis,
            "declared_synthetic_manifest",
          );
          assert.equal(
            hash(JSON.stringify(proof.at(-1).afterRows)),
            proof.at(-1).afterRowsSha256,
          );
        },
      );
    } finally {
      await client.query("DROP TABLE IF EXISTS doc.file");
      await client.end();
    }
  },
);
