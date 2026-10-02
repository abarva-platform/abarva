import assert from "node:assert/strict";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import {
  generatePack,
  readDatasetManifests,
  type GeneratedPack,
  type SourceFile,
} from "../load_synthetic_enterprise_v1";
import {
  PROJECTION_TABLES,
  refreshProjectionStatistics,
  runProjectionJob,
  type ProjectionRuntime,
} from "../project_synthetic_enterprise_home";
import { runReadbackJob } from "../readback_synthetic_enterprise_v2";
import { connectDatabase, jobLimits } from "../synthetic_enterprise_home_job";
import {
  persistedProjectedRow,
  projectedRowsHash,
  type PersistedHomeRow,
} from "../synthetic_enterprise_home_rows";
import {
  buildTechnologyEstateFromHomeProjectionRows,
  type HomeProjectionRow,
} from "../../../src/lib/home/preview/ecl-projection-bundle";
import {
  assertJobRuleFields,
  assertWorkflowTriggersCover,
  disposableDatabaseUrl,
  fileProofStore,
  homeJobEnv,
  proofDirectory,
  registryWithApprovals,
  type FileProofStore,
} from "./synthetic_enterprise_gate_fixtures";

/**
 * Runs the projection job against the disposable admission database, after
 * the versioned load test has loaded the assessment and before anything has
 * projected it. The proofs it writes stay in the proof directory, where the
 * admission test that follows reads them.
 */

/** The hash of the canonical input every projected row of the pinned source version is made from. */
const PINNED_PROJECTION_HASH =
  "b564fe263c0af7e124e20db98a2464883d41c0dac71646f989e837023c9c83be";
/**
 * The hash of what a projection of the pinned source version serves. It moves
 * whenever the row mapper changes any field of any row, which also changes
 * what Home shows for a projection that has already been proved.
 */
const PINNED_PROJECTED_ROWS_HASH =
  "65ffe53c6f2a289fa8e3a0d27e01e66d2326aafa59bc9efe2909170f8795aea8";

const scoped = "tenant_key = $1 and assessment_id = $2";

type Outcome = {
  code: number;
  report: Record<string, unknown> | undefined;
  failure: string;
  connections: number;
};

async function main(): Promise<void> {
  const connectionString = disposableDatabaseUrl();
  const pack = await generatePack("v2");
  const { manifest } = pack;
  const scope = [manifest.tenant_key, manifest.assessment_id];
  const prefix = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}`;
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  try {
    const state = await admin.query<{ objects: string; projections: string }>(
      `select
         (select count(*) from ecl_context.object where ${scoped}) as objects,
         (select count(*) from ecl_projection.projection_manifest where ${scoped}) as projections`,
      scope,
    );
    assert.equal(
      Number(state.rows[0].objects),
      pack.normalized.objects.length,
      "the versioned load test must have loaded this assessment first",
    );
    assert.equal(
      Number(state.rows[0].projections),
      0,
      "this test projects an assessment nothing has projected yet",
    );
    // A new chain of proofs starts here.
    await rm(proofDirectory(), { recursive: true, force: true });
    const registry = registryWithApprovals(await readDatasetManifests(), pack, {
      serving: false,
    });

    const project = async (
      options: {
        env?: Record<string, string | undefined>;
        store?: FileProofStore;
        manifests?: unknown[];
      } = {},
    ): Promise<Outcome> => {
      const reported: string[] = [];
      const failures: string[] = [];
      let connections = 0;
      const runtime: ProjectionRuntime = {
        generate: async () => pack,
        dispose: async () => undefined,
        manifests: async () => options.manifests ?? registry,
        connect: (databaseUrl) => {
          connections += 1;
          return connectDatabase(databaseUrl);
        },
        store: async () => options.store ?? fileProofStore(proofDirectory()),
        report: (line) => reported.push(line),
        fail: (error) =>
          failures.push(error instanceof Error ? error.message : String(error)),
      };
      const code = await runProjectionJob(
        homeJobEnv(pack, {
          ECL_SYNTHETIC_READBACK_PROOF_URI: readbackUri,
          ...options.env,
        }),
        runtime,
      );
      assert.ok(reported.length <= 1, "a run reports once");
      return {
        code,
        report: reported[0] ? JSON.parse(reported[0]) : undefined,
        failure: failures.join("\n"),
        connections,
      };
    };
    const projected = async () =>
      Number(
        (
          await admin.query<{ n: string }>(
            `select (select count(*) from ecl_projection.projection_manifest where ${scoped})
               + (select count(*) from ecl_projection.home_enterprise_landscape where ${scoped})
               + (select count(*) from ecl_projection.projection_entry where ${scoped})
               + (select count(*) from ecl_context.snapshot where ${scoped}) as n`,
            scope,
          )
        ).rows[0].n,
      );
    const refused = async (
      message: RegExp,
      options: Parameters<typeof project>[0],
      opensDatabase: boolean,
    ) => {
      const outcome = await project(options);
      assert.equal(outcome.code, 1, outcome.failure);
      assert.match(outcome.failure, message);
      assert.equal(outcome.report, undefined);
      assert.equal(outcome.connections, opensDatabase ? 1 : 0);
      assert.equal(await projected(), 0, "a refused run writes nothing");
    };

    // The readback a projection is authorised by: the readback job's own
    // proof of this load, taken before any projection of it exists.
    const store = fileProofStore(proofDirectory());
    const readback = async (runId: string): Promise<string> => {
      let uri = "";
      const sourceUri = (file: SourceFile) =>
        `https://synthetic.invalid/${manifest.source_set_hash}/${file.source_room_family}`;
      const code = await runReadbackJob(
        {
          ...homeJobEnv(pack, { ECL_SYNTHETIC_RUN_ID: runId }),
          ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: "absent",
        },
        {
          generate: async () => pack,
          dispose: async () => undefined,
          connect: connectDatabase,
          storage: (_settings, generated: GeneratedPack) => ({
            blobUriFor: sourceUri,
            fetchBlob: async (blobUri) => {
              const file = generated.manifest.files.find(
                (candidate) => sourceUri(candidate) === blobUri,
              );
              if (!file) throw new Error(`no such blob: ${blobUri}`);
              return readFile(path.join(generated.dir, "pack", file.file_path));
            },
            writeProof: async (proof) => {
              uri = (
                await store.writeOnce(
                  `${prefix}/runs/${runId}/readback.json`,
                  Buffer.from(JSON.stringify(proof)),
                )
              ).uri;
              return uri;
            },
          }),
          report: () => undefined,
          fail: (error) => {
            throw error;
          },
        },
      );
      assert.equal(code, 0, "the readback of the untouched load passes");
      return uri;
    };
    const readbackUri = await readback("readback-fixture-1");
    const otherReadbackUri = await readback("readback-fixture-2");

    // Refused before the database is opened.
    await refused(
      /^Projection gate failed: manifest carries no load_approval$/,
      { manifests: await readDatasetManifests() },
      false,
    );
    await refused(
      /^Readback proof URI is outside the pinned source set$/,
      {
        env: {
          ECL_SYNTHETIC_READBACK_PROOF_URI: readbackUri.replace(
            manifest.source_set_hash,
            "0".repeat(64),
          ),
        },
      },
      false,
    );
    // A readback that did not pass authorises nothing, wherever it is kept.
    const failedReadback = await store.writeOnce(
      `${prefix}/runs/readback-fixture-failed/readback.json`,
      Buffer.from(
        JSON.stringify({
          ...JSON.parse((await store.read(readbackUri)).toString("utf8")),
          status: "failed",
        }),
      ),
    );
    await refused(
      /^Admission readback proof did not authorize this projection$/,
      { env: { ECL_SYNTHETIC_READBACK_PROOF_URI: failedReadback.uri } },
      false,
    );
    await refused(
      /^Projection source version is not pinned$/,
      { env: { ECL_SYNTHETIC_INPUT_SOURCE_VERSION: "0".repeat(64) } },
      false,
    );
    await refused(
      /^Projection idempotency key does not name this assessment and source set$/,
      { env: { ECL_SYNTHETIC_IDEMPOTENCY_KEY: manifest.assessment_id } },
      false,
    );
    await refused(
      /^Job image digest must be pinned and be the image the job runs$/,
      {
        env: {
          ABARVA_OPERATOR_IMAGE: `registry.invalid/web@sha256:${"0".repeat(64)}`,
        },
      },
      false,
    );
    // A statement that outlasts its limit stops the run and leaves nothing behind.
    await refused(
      /^Projection stopped at its statement timeout; nothing was written$/,
      { env: { ECL_SYNTHETIC_STATEMENT_TIMEOUT_MS: "1" } },
      true,
    );

    // Canonical rows that drifted from what the independent readback proved are
    // refused before anything is written: the readback authorised one state,
    // and the projection would be built from another. One column of one row is
    // changed and put back through a backup, so the undrifted state is restored
    // byte for byte.
    const drifted = async (
      message: RegExp,
      table: string,
      where: string,
      column: string,
      other: string,
    ) => {
      const bk = "public.projection_drift_backup";
      await admin.query(
        `create table ${bk} as select id, ${column} as kept from ${table} where ${where}`,
        scope,
      );
      await admin.query(
        `update ${table} set ${column} = ${other} where ${where}`,
        scope,
      );
      try {
        const outcome = await project({
          env: { ECL_SYNTHETIC_RUN_ID: "projection-drift" },
        });
        assert.equal(outcome.code, 1, outcome.failure);
        assert.match(outcome.failure, message);
        assert.equal(outcome.report, undefined);
        assert.equal(await projected(), 0, "a drifted run writes nothing");
      } finally {
        await admin.query(
          `update ${table} t set ${column} = b.kept from ${bk} b where t.id = b.id`,
        );
        await admin.query(`drop table ${bk}`);
      }
    };
    const oneAccepted = `${scoped} and quality_state = 'accepted' and id = (select id from ecl_source.source_file where ${scoped} and quality_state = 'accepted' order by id limit 1)`;
    // A source file whose recorded hash no longer matches its catalog entry.
    await drifted(
      /^Canonical source catalog drifted after independent readback$/,
      "ecl_source.source_file",
      oneAccepted,
      "file_hash",
      "repeat('a', 64)",
    );
    // One application retyped to a type the mapper does not project as such, so
    // a whole required family comes up short.
    await drifted(
      /^Home projection lost a required canonical family$/,
      "ecl_context.object",
      `${scoped} and object_type = 'application' and id = (select id from ecl_context.object where ${scoped} and object_type = 'application' order by id limit 1)`,
      "object_type",
      "'application_module'",
    );
    // One more canonical object than the readback counted.
    const added = `${scoped} and object_key = 'FIXTURE-EXTRA'`;
    await admin.query(
      `insert into ecl_context.object
         (tenant_key, assessment_id, object_key, object_type, display_name,
          lifecycle_state, source_record_id, basis, value_state, review_state, attributes_json)
       select tenant_key, assessment_id, 'FIXTURE-EXTRA', object_type, display_name,
          lifecycle_state, source_record_id, basis, value_state, review_state, attributes_json
       from ecl_context.object where ${scoped} and object_type = 'enterprise'`,
      scope,
    );
    try {
      const outcome = await project({
        env: { ECL_SYNTHETIC_RUN_ID: "projection-count" },
      });
      assert.equal(outcome.code, 1, outcome.failure);
      assert.match(
        outcome.failure,
        /^Canonical object count changed after independent readback$/,
      );
      assert.equal(await projected(), 0);
    } finally {
      await admin.query(`delete from ecl_context.object where ${added}`, scope);
    }

    // The rows are committed, and then the proof cannot be written.
    const firstRun = "projection-fixture-1";
    const firstProofPath = `${prefix}/runs/${firstRun}/projection-proof.json`;
    const lost = await project({
      env: { ECL_SYNTHETIC_RUN_ID: firstRun },
      store: fileProofStore(proofDirectory(), async (blobPath) => {
        if (blobPath === firstProofPath) throw new Error("store unreachable");
      }),
    });
    assert.equal(lost.code, 1);
    assert.match(lost.failure, /store unreachable/);
    assert.equal(lost.report?.status, "failed");
    assert.equal(lost.report?.projection, "committed");
    assert.equal(lost.report?.proof, "missing");
    assert.equal(lost.report?.proof_uri, store.uriFor(firstProofPath));
    assert.equal(await store.proofAt(firstProofPath), null);
    const committed = await admin.query<{
      id: string;
      row_count: number;
      projection_hash: string;
      proof_uri: string;
      quality_state: string;
      created_at: Date;
    }>(
      `select id::text, row_count, projection_hash, proof_uri, quality_state, created_at
       from ecl_projection.projection_manifest where ${scoped}`,
      scope,
    );
    assert.equal(committed.rows.length, 1);
    assert.equal(committed.rows[0].row_count, 3643);
    assert.equal(committed.rows[0].proof_uri, store.uriFor(firstProofPath));
    // What the job stamps is unchanged: the manifest a warning, each row passed.
    assert.equal(committed.rows[0].quality_state, "warning");

    // A proof already at the recorded location that states another projection
    // is not this projection's proof, and is not taken for it.
    for (const [field, other] of [
      ["assessment_id", "assessment-fixture-other"],
      ["source_set_hash", "0".repeat(64)],
      ["projection_hash", "0".repeat(64)],
      ["rows", 3642],
    ] as const) {
      await mkdir(path.dirname(store.fileFor(firstProofPath)), {
        recursive: true,
      });
      await writeFile(
        store.fileFor(firstProofPath),
        JSON.stringify({
          assessment_id: manifest.assessment_id,
          source_set_hash: manifest.source_set_hash,
          projection_hash: PINNED_PROJECTION_HASH,
          rows: 3643,
          [field]: other,
        }),
      );
      try {
        const contradicted = await project({
          env: { ECL_SYNTHETIC_RUN_ID: "projection-fixture-2" },
        });
        assert.equal(contradicted.code, 1, field);
        assert.equal(
          contradicted.failure,
          `The proof already at the recorded location states a different ${field}`,
        );
        assert.equal(contradicted.report?.status, "failed");
        assert.equal(contradicted.report?.outcome, "already_projected");
        assert.equal(contradicted.report?.proof, "missing");
      } finally {
        await rm(store.fileFor(firstProofPath));
      }
    }

    // A second run finds exactly its own committed projection: it writes no
    // row and re-emits the proof where the manifest says the proof is.
    const recovered = await project({
      env: { ECL_SYNTHETIC_RUN_ID: "projection-fixture-2" },
    });
    assert.equal(recovered.failure, "");
    assert.equal(recovered.code, 0);
    const report = recovered.report!;
    assert.equal(report.outcome, "already_projected");
    assert.equal(report.proof_written, true);
    assert.equal(report.proof_uri, store.uriFor(firstProofPath));
    assert.equal(report.projection_written_by_run, firstRun);
    assert.equal(report.run_id, "projection-fixture-2");
    assert.equal(
      await store.proofAt(
        `${prefix}/runs/projection-fixture-2/projection-proof.json`,
      ),
      null,
      "the proof goes where the manifest records it, not under the second run",
    );
    const after = await admin.query<{ created_at: Date; n: string }>(
      `select created_at, (select count(*) from ecl_projection.home_enterprise_landscape
          where ${scoped}) as n
       from ecl_projection.projection_manifest where ${scoped}`,
      scope,
    );
    assert.deepEqual(
      [after.rows[0].created_at.toISOString(), Number(after.rows[0].n)],
      [committed.rows[0].created_at.toISOString(), 3643],
      "the committed projection is untouched",
    );

    const proof = (await store.proofAt(firstProofPath))!;
    assertJobRuleFields(proof, {
      job_name: "ecl-synthetic-enterprise-v2-project",
      run_id: "projection-fixture-2",
      status: "passed",
    });
    assert.equal(proof.blob_proof_bundle, store.uriFor(firstProofPath));
    assert.equal(proof.tenant_scope, manifest.tenant_key);
    assert.equal(proof.input_source_version, manifest.source_set_hash);
    assert.equal(
      proof.idempotency_key,
      `${manifest.assessment_id}:${manifest.source_set_hash}`,
    );
    assert.equal(proof.assessment_id, manifest.assessment_id);
    assert.equal(proof.source_set_hash, manifest.source_set_hash);
    assert.equal(proof.readback_proof_uri, readbackUri);
    assert.equal(proof.projection_manifest_id, committed.rows[0].id);
    assert.equal(proof.serving_state, "shadow_not_promoted");
    assert.equal(proof.client_attestation_state, "not_client_attested");
    assert.equal(proof.rows, 3643);
    assert.equal(proof.source_linked_rows, 3643);
    assert.deepEqual(proof.quality_gate, {
      manifest_quality_state: "warning",
      snapshot_quality_state: "warning",
      row_quality_state: "passed",
      admission_status: "not_applicable",
    });
    // The input hash is the one the manifest holds and has always meant; the
    // output hash is new, and is the hash of the rows that are persisted.
    assert.equal(proof.projection_hash, committed.rows[0].projection_hash);
    assert.equal(proof.projection_hash, PINNED_PROJECTION_HASH);
    const persisted = await admin.query<
      PersistedHomeRow & { quality_state: string }
    >(
      `select page_key, row_key, row_type, section_key, title, summary,
              primary_object_id::text, source_refs_json, source_hash,
              value_state, display_payload_json, quality_state
       from ecl_projection.home_enterprise_landscape where ${scoped}`,
      scope,
    );
    assert.equal(
      proof.projected_rows_hash,
      projectedRowsHash(persisted.rows.map(persistedProjectedRow)),
    );
    assert.equal(proof.projected_rows_hash, PINNED_PROJECTED_ROWS_HASH);
    assert.ok(persisted.rows.every((row) => row.quality_state === "passed"));

    // The connected role owns these tables, so each is analyzed.
    assert.deepEqual(
      report.statistics,
      PROJECTION_TABLES.map((table) => ({
        table,
        analyzed: true,
        detail: null,
      })),
    );
    const analyzed = await admin.query<{ relname: string }>(
      `select relname from pg_stat_user_tables
       where schemaname || '.' || relname = any($1) and last_analyze is not null`,
      [[...PROJECTION_TABLES]],
    );
    assert.equal(analyzed.rows.length, PROJECTION_TABLES.length);
    // A role that does not own them is not refused: the server skips each
    // table with a warning, and the refresh says so table by table.
    await admin.query("create role ecl_statistics_fixture");
    try {
      await admin.query(
        "grant usage on schema ecl_context, ecl_projection to ecl_statistics_fixture",
      );
      const visitor = await connectDatabase(connectionString);
      try {
        await visitor.query("set role ecl_statistics_fixture");
        const skipped = await refreshProjectionStatistics(visitor, jobLimits());
        assert.deepEqual(
          skipped.map((table) => [table.table, table.analyzed]),
          PROJECTION_TABLES.map((table) => [table, false]),
        );
        for (const table of skipped) {
          assert.match(
            table.detail ?? "",
            /permission denied to analyze|only table or database owner can analyze/,
          );
        }
      } finally {
        await visitor.end();
      }
    } finally {
      await admin.query("drop owned by ecl_statistics_fixture");
      await admin.query("drop role ecl_statistics_fixture");
    }

    // The proof is already there: the run reports it and writes nothing.
    const again = await project({
      env: { ECL_SYNTHETIC_RUN_ID: "projection-fixture-3" },
    });
    assert.equal(again.code, 0, again.failure);
    assert.equal(again.report?.outcome, "already_projected");
    assert.equal(again.report?.proof_written, false);
    assert.equal(
      (await store.proofAt(firstProofPath))?.run_id,
      "projection-fixture-2",
      "a proof is never overwritten",
    );

    // Any difference from the projection this run writes is still occupied.
    const occupied = async (
      why: string,
      apply: string[],
      undo: string[],
      env: Record<string, string | undefined> = {},
    ) => {
      const run = (sql: string) =>
        admin.query(sql, sql.includes("$1") ? scope : []);
      for (const sql of apply) await run(sql);
      try {
        const outcome = await project({
          env: { ECL_SYNTHETIC_RUN_ID: "projection-fixture-4", ...env },
        });
        assert.equal(outcome.code, 1, why);
        assert.match(
          outcome.failure,
          /^Refusing occupied Home projection$/,
          why,
        );
        assert.equal(outcome.report, undefined, why);
      } finally {
        for (const sql of undo) await run(sql);
      }
    };
    // Made from another readback, even a passed one of the same load.
    await occupied("another readback", [], [], {
      ECL_SYNTHETIC_READBACK_PROOF_URI: otherReadbackUri,
    });
    const backup = "public.projection_fixture_backup";
    /** One column of the rows `where` selects is changed, and put back. */
    const changed = (
      table: string,
      where: string,
      column: string,
      other: string,
      // The schema ties these ids together, so they are changed the way a
      // replica applies changes.
      unchecked = false,
    ) =>
      occupied(
        `${table}.${column}`,
        [
          `create table ${backup} as select id, ${column} as kept from ${table} where ${where}`,
          ...(unchecked ? ["set session_replication_role = replica"] : []),
          `update ${table} set ${column} = ${other} where ${where}`,
          "set session_replication_role = origin",
        ],
        [
          ...(unchecked ? ["set session_replication_role = replica"] : []),
          `update ${table} t set ${column} = b.kept from ${backup} b
             where t.tenant_key = $1 and t.assessment_id = $2
               and (t.id = b.id or '${column}' = 'id')`,
          "set session_replication_role = origin",
          `drop table ${backup}`,
        ],
      );
    const spareId = "'00000000-0000-4000-8000-00000000beef'";
    const manifestTable = "ecl_projection.projection_manifest";
    const landscape = "ecl_projection.home_enterprise_landscape";
    const oneRow = `${scoped} and row_type = 'enterprise_profile'`;
    // The manifest: its identity, what it was made from and what it states.
    await changed(manifestTable, scoped, "id", spareId, true);
    await changed(manifestTable, scoped, "snapshot_id", spareId, true);
    await changed(manifestTable, scoped, "projection_version", "2");
    await changed(manifestTable, scoped, "source_hash", "repeat('0', 64)");
    await changed(manifestTable, scoped, "projection_hash", "repeat('0', 64)");
    await changed(manifestTable, scoped, "row_count", "row_count - 1");
    await changed(manifestTable, scoped, "quality_state", "'blocked'");
    await changed(manifestTable, scoped, "admission_status", "'admitted'");
    // A proof recorded anywhere but under this source set's runs.
    await changed(
      manifestTable,
      scoped,
      "proof_uri",
      "replace(proof_uri, 'fixturestorage.', 'another.')",
    );
    // The snapshot the manifest was made from.
    const snapshot = `${scoped} and snapshot_type = 'projection_source'`;
    await changed(
      "ecl_context.snapshot",
      snapshot,
      "source_hash",
      "repeat('0', 64)",
    );
    await changed(
      "ecl_context.snapshot",
      snapshot,
      "context_hash",
      "repeat('0', 64)",
    );
    // The rows: what they say, how they are stamped and what they belong to.
    await changed(landscape, oneRow, "title", "title || ' (changed)'");
    await changed(
      landscape,
      oneRow,
      "display_payload_json",
      `display_payload_json || '{"fixture_added": 1}'`,
    );
    await changed(landscape, oneRow, "quality_state", "'warning'");
    await changed(landscape, oneRow, "admission_status", "'admitted'");
    await changed(landscape, oneRow, "projection_version", "2");
    await changed(landscape, oneRow, "projection_manifest_id", spareId, true);
    // A row, an entry or a source link that is no longer there.
    const removed = (table: string, where: string, unchecked = false) =>
      occupied(
        `${table} row removed`,
        [
          `create table ${backup} as select * from ${table} where ${where}`,
          ...(unchecked ? ["set session_replication_role = replica"] : []),
          `delete from ${table} where ${where}`,
          "set session_replication_role = origin",
        ],
        [
          `insert into ${table} select * from ${backup}`,
          `drop table ${backup}`,
        ],
      );
    const profileEntry = `(select projection_entry_id from ${landscape} where ${oneRow})`;
    await removed(landscape, oneRow);
    await removed(
      "ecl_projection.projection_entry_source_record_ref",
      `${scoped} and projection_entry_id = ${profileEntry}`,
    );
    await removed(
      "ecl_projection.projection_entry",
      `${scoped} and id = ${profileEntry}`,
      true,
    );
    // The canonical rows themselves no longer being what was read back.
    await occupied(
      "canonical object changed",
      [
        `update ecl_context.object set display_name = display_name || ' (changed)' where ${scoped} and object_type = 'enterprise'`,
      ],
      [
        `update ecl_context.object set display_name = left(display_name, -10) where ${scoped} and object_type = 'enterprise'`,
      ],
    );
    // Or no longer being as many: the run cannot tell what it would write.
    await occupied(
      "canonical object added",
      [
        `insert into ecl_context.object
         (tenant_key, assessment_id, object_key, object_type, display_name,
          lifecycle_state, source_record_id, basis, value_state, review_state,
          attributes_json)
       select tenant_key, assessment_id, 'FIXTURE-EXTRA', object_type, display_name,
          lifecycle_state, source_record_id, basis, value_state, review_state,
          attributes_json
       from ecl_context.object where ${scoped} and object_type = 'enterprise'`,
      ],
      [
        `delete from ecl_context.object where ${scoped} and object_key = 'FIXTURE-EXTRA'`,
      ],
    );
    // Restored exactly: the untouched projection is this run's own again.
    const restored = await project({
      env: { ECL_SYNTHETIC_RUN_ID: "projection-fixture-5" },
    });
    assert.equal(restored.code, 0, restored.failure);
    assert.equal(restored.report?.outcome, "already_projected");

    // What the projection holds, and what Home's estate makes of it.
    const counts = await admin.query<{
      page_key: string;
      row_type: string;
      n: string;
    }>(
      `
      select page_key, row_type, count(*) as n
      from ecl_projection.home_enterprise_landscape
      where ${scoped}
      group by page_key, row_type
    `,
      scope,
    );
    const count = (page: string, type: string) =>
      Number(
        counts.rows.find(
          (row) => row.page_key === page && row.row_type === type,
        )?.n ?? 0,
      );
    assert.equal(count("applications_systems", "application"), 344);
    assert.equal(count("vendor_contracts", "contract"), 230);
    assert.equal(count("business_unit_profile", "enterprise_profile"), 1);
    assert.equal(count("business_unit_profile", "business_segment"), 3);
    assert.equal(count("business_unit_profile", "business_function"), 14);
    assert.equal(count("business_unit_profile", "workforce_role"), 72);
    assert.equal(count("current_state_data_flow", "data_flow"), 1350);
    assert.deepEqual(
      proof.row_types,
      Object.fromEntries(
        [...new Set(counts.rows.map((row) => row.row_type))].map((type) => [
          type,
          counts.rows
            .filter((row) => row.row_type === type)
            .reduce((sum, row) => sum + Number(row.n), 0),
        ]),
      ),
    );
    const serving = await admin.query<{ n: string }>(
      `
      select count(*) as n from serving.home_applications_systems
      where ${scoped}
    `,
      scope,
    );
    assert.equal(Number(serving.rows[0].n), 344);
    const productRows = await admin.query<HomeProjectionRow>(
      `
      select page_key, row_key, row_type, title, summary, display_payload_json,
        source_hash, source_refs_json, projection_entry_id::text,
        primary_object_id::text, admission_status
      from ecl_projection.home_enterprise_landscape
      where ${scoped}
    `,
      scope,
    );
    const estate = buildTechnologyEstateFromHomeProjectionRows(
      productRows.rows,
    );
    const productCount = (type: string) =>
      estate.recordTypes.find((record) => record.objectType === type)?.rows
        .length ?? 0;
    assert.equal(productCount("application_system"), 344);
    assert.equal(productCount("vendor_contract"), 230);
    assert.equal(productCount("business_segment"), 3);
    assert.equal(productCount("business_function"), 14);
    assert.equal(productCount("data_asset_or_integration"), 1710);
    const links = await admin.query<{ missing: string }>(
      `
      select count(*) as missing
      from ecl_projection.home_enterprise_landscape h
      left join ecl_projection.projection_entry_source_record_ref r
        on r.tenant_key = h.tenant_key and r.assessment_id = h.assessment_id
       and r.projection_entry_id = h.projection_entry_id and r.source_hash = h.source_hash
      where h.tenant_key = $1 and h.assessment_id = $2 and r.source_record_id is null
    `,
      scope,
    );
    assert.equal(Number(links.rows[0].missing), 0);

    assertWorkflowTriggersCover([
      "datasets/tenant-inputs/tenant-input-registry.json",
    ]);
    console.log(
      JSON.stringify({ status: "passed", rows: proof.rows, linked: true }),
    );
  } finally {
    await admin.end();
    await rm(pack.dir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
