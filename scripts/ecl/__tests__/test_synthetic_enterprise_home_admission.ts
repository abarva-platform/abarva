import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import pg from "pg";
import {
  generatePack,
  readDatasetManifests,
} from "../load_synthetic_enterprise_v1";
import {
  buildServedHome,
  runPromotionJob,
  type AdmissionDeps,
  type PromotionRuntime,
  type ServedHome,
  type ServedHomeSummary,
} from "../promote_synthetic_enterprise_home";
import { runRetirementJob } from "../retire_synthetic_enterprise_home";
import {
  connectDatabase,
  registeredTenantKeys,
  type JobClient,
} from "../synthetic_enterprise_home_job";
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
 * Runs the Home admission and retirement jobs against the disposable admission
 * database, after the projection test has projected the versioned assessment
 * and left its proofs in the proof directory.
 *
 * The steps run in order and each starts from the state the one before left,
 * so the first failure stops the run. Every run uses the Home reader's own
 * builder unless a step says it stands in for it.
 */

type Outcome = {
  code: number;
  report: Record<string, unknown> | undefined;
  failure: string;
  /** How many database connections the run opened. */
  connections: number;
};

type Declaration = {
  assessment_id: string;
  projection_manifest_id: string;
  source_set_hash: string;
  projection_hash: string;
  projection_proof_uri: string;
  state: string;
  activated_at: string;
  retired_at: string | null;
  tenant_key: string;
};

const scoped = "tenant_key = $1 and assessment_id = $2";
const landscape = "ecl_projection.home_enterprise_landscape";
const manifestTable = "ecl_projection.projection_manifest";
const declarations = "ecl_projection.home_active_assessment";
const backup = "public.admission_fixture_backup";

/** A connection whose first `commit` is answered as `answer` decides. */
function commitAnswered(
  answer: (client: JobClient) => Promise<{ rows: never[] }>,
): (databaseUrl: string) => Promise<JobClient> {
  return async (databaseUrl) => {
    const client = await connectDatabase(databaseUrl);
    let answered = false;
    return {
      query: ((sql: string, params?: unknown[]) => {
        if (sql !== "commit" || answered) return client.query(sql, params);
        answered = true;
        return answer(client);
      }) as JobClient["query"],
      on: (event, listener) => client.on(event, listener),
      removeListener: (event, listener) =>
        client.removeListener(event, listener),
      end: () => client.end(),
    };
  };
}

async function main(): Promise<void> {
  const connectionString = disposableDatabaseUrl();
  const pack = await generatePack("v2");
  const { manifest, normalized } = pack;
  const scope = [manifest.tenant_key, manifest.assessment_id];
  const prefix = `${manifest.tenant_key}/${manifest.assessment_id}/${manifest.source_set_hash}`;
  const store = fileProofStore(proofDirectory());
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  let steps = 0;
  const step = async (name: string, work: () => Promise<void>) => {
    try {
      await work();
      steps += 1;
    } catch (error) {
      console.error(`step failed: ${name}`);
      throw error;
    }
  };
  // Run ids are this process's own, so a second run of this test against the
  // same proof directory never meets a proof the first one wrote.
  const tag = `adm${Date.now().toString(36)}`;
  const runId = (name: string) => `${tag}-${name}`;
  const runPath = (name: string, file: string) =>
    `${prefix}/runs/${runId(name)}/${file}`;
  try {
    const projection = await admin.query<{
      id: string;
      proof_uri: string;
      projection_hash: string;
    }>(
      `select id::text, proof_uri, projection_hash from ${manifestTable} where ${scoped}`,
      scope,
    );
    assert.equal(
      projection.rows.length,
      1,
      "the projection test must have projected this assessment first",
    );
    const projectionProofUri = projection.rows[0].proof_uri;
    const projectionHash = projection.rows[0].projection_hash;
    const manifestId = projection.rows[0].id;
    const projectionProof = JSON.parse(
      (await store.read(projectionProofUri)).toString("utf8"),
    ) as Record<string, unknown>;
    await admin.query(`delete from ${declarations} where tenant_key = $1`, [
      manifest.tenant_key,
    ]);

    const registry = await readDatasetManifests();
    const loadApproved = registryWithApprovals(registry, pack, {
      serving: false,
    });
    const servingApproved = registryWithApprovals(registry, pack, {
      serving: true,
    });
    const objects = (type: string) =>
      normalized.objects.filter((object) => object.type === type).length;
    const spine = {
      segments: objects("business_segment"),
      functions: objects("business_function"),
      priorities: objects("strategic_priority"),
    };
    assert.deepEqual(spine, { segments: 3, functions: 14, priorities: 5 });

    type RunOptions = {
      run: string;
      mode?: string;
      env?: Record<string, string | undefined>;
      store?: FileProofStore;
      manifests?: unknown[];
      tenants?: ReadonlySet<string>;
      connect?: (databaseUrl: string) => Promise<JobClient>;
      build?: AdmissionDeps["buildServedHome"];
    };
    const admit = async (options: RunOptions): Promise<Outcome> => {
      const reported: string[] = [];
      const failures: string[] = [];
      let connections = 0;
      const runtime: PromotionRuntime = {
        generate: async () => pack,
        dispose: async () => undefined,
        manifests: async () => options.manifests ?? servingApproved,
        registeredTenants: async () =>
          options.tenants ?? (await registeredTenantKeys()),
        connect: (databaseUrl) => {
          connections += 1;
          return (options.connect ?? connectDatabase)(databaseUrl);
        },
        store: async () => options.store ?? store,
        buildServedHome: options.build ?? buildServedHome,
        report: (line) => reported.push(line),
        fail: (error) =>
          failures.push(error instanceof Error ? error.message : String(error)),
      };
      const code = await runPromotionJob(
        homeJobEnv(pack, {
          ECL_SYNTHETIC_RUN_ID: runId(options.run),
          ECL_SYNTHETIC_PROJECTION_PROOF_URI: projectionProofUri,
          ...(options.mode === undefined
            ? {}
            : { ECL_SYNTHETIC_PROMOTION_MODE: options.mode }),
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
    const retire = async (
      options: Pick<RunOptions, "run" | "env" | "store" | "connect">,
    ): Promise<Outcome> => {
      const reported: string[] = [];
      const failures: string[] = [];
      let connections = 0;
      const env = homeJobEnv(pack, {
        ECL_SYNTHETIC_RUN_ID: runId(options.run),
        ECL_SYNTHETIC_ROLLBACK_APPROVAL: "retire_active_home",
        ECL_SYNTHETIC_RETIRE_TENANT: manifest.tenant_key,
        ECL_SYNTHETIC_RETIRE_ASSESSMENT: manifest.assessment_id,
        ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: projectionHash,
        // A retirement regenerates nothing and reads no registry: none of
        // these is needed, and none is present.
        ECL_SYNTHETIC_LAB_APPROVAL: undefined,
        ECL_SYNTHETIC_INPUT_SOURCE_VERSION: undefined,
        ECL_SYNTHETIC_IDEMPOTENCY_KEY: undefined,
        ...options.env,
      });
      const code = await runRetirementJob(env, {
        connect: (databaseUrl) => {
          connections += 1;
          return (options.connect ?? connectDatabase)(databaseUrl);
        },
        store: async () => options.store ?? store,
        report: (line) => reported.push(line),
        fail: (error) =>
          failures.push(error instanceof Error ? error.message : String(error)),
      });
      assert.ok(reported.length <= 1, "a run reports once");
      return {
        code,
        report: reported[0] ? JSON.parse(reported[0]) : undefined,
        failure: failures.join("\n"),
        connections,
      };
    };

    /** The tenant's declarations as the table holds them, read by this test and not by a job. */
    const table = async (): Promise<Declaration[]> =>
      (
        await admin.query<Declaration>(
          `select tenant_key, assessment_id, projection_manifest_id::text,
                  source_set_hash, projection_hash, projection_proof_uri, state,
                  to_char(activated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as activated_at,
                  to_char(retired_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as retired_at
           from ${declarations} where tenant_key = $1 order by assessment_id`,
          [manifest.tenant_key],
        )
      ).rows;
    const only = async (): Promise<Declaration> => {
      const rows = await table();
      assert.equal(rows.length, 1);
      return rows[0];
    };
    const proofAt = (name: string, file: string) =>
      store.proofAt(runPath(name, file));
    const without = (
      report: Record<string, unknown> | undefined,
      ...fields: string[]
    ) =>
      Object.fromEntries(
        Object.entries(report ?? {}).filter(([key]) => !fields.includes(key)),
      );

    /** Changes committed rows, runs the check, then puts the rows back. */
    const tampered = async (
      apply: string[],
      undo: string[],
      check: () => Promise<void>,
    ) => {
      for (const sql of apply)
        await admin.query(sql, sql.includes("$1") ? scope : []);
      try {
        await check();
      } finally {
        for (const sql of undo)
          await admin.query(sql, sql.includes("$1") ? scope : []);
      }
    };
    /** A run that is refused changes no declaration and writes no proof. */
    const refused = async (
      name: string,
      message: RegExp,
      options: Omit<RunOptions, "run">,
      opensDatabase: boolean,
    ) => {
      const before = await table();
      const outcome = await admit({ run: name, ...options });
      assert.equal(outcome.code, 1, `${name}: ${outcome.failure}`);
      assert.match(outcome.failure, message, name);
      assert.equal(outcome.report, undefined, name);
      assert.equal(outcome.connections, opensDatabase ? 1 : 0, name);
      assert.deepEqual(await table(), before, name);
      assert.equal(await proofAt(name, "home-preflight-proof.json"), null);
      assert.equal(await proofAt(name, "home-admission-proof.json"), null);
    };

    /**
     * A second manifest of the same assessment, so a declaration can be made to
     * name a manifest other than the proved one. It is removed afterwards.
     */
    const withSpareManifest = async (
      check: (spareId: string) => Promise<void>,
    ) => {
      const spare = "00000000-0000-4000-8000-000000000001";
      await admin.query(
        `insert into ${manifestTable}
           (id, tenant_key, assessment_id, snapshot_id, projection_key, projection_version,
            rebuild_command, source_hash, projection_hash, row_count, quality_state,
            admission_status, proof_uri)
         select '${spare}', tenant_key, assessment_id, snapshot_id,
            projection_key, 3, rebuild_command, source_hash, projection_hash, row_count,
            quality_state, admission_status, proof_uri
         from ${manifestTable} where ${scoped}`,
        scope,
      );
      try {
        await check(spare);
      } finally {
        await admin.query(`delete from ${manifestTable} where id = '${spare}'`);
      }
    };

    await step(
      "a run that is not told its mode checks, and switches nothing",
      async () => {
        const outcome = await admit({
          run: "check-1",
          manifests: loadApproved,
        });
        assert.equal(outcome.failure, "");
        assert.equal(outcome.code, 0);
        const report = outcome.report!;
        assert.deepEqual(
          {
            serving_state: report.serving_state,
            outcome: report.outcome,
            home_switch: report.home_switch,
            manifest_quality_state: report.manifest_quality_state,
            serving_approval: report.serving_approval,
            serving_approval_reasons: report.serving_approval_reasons,
            declaration_before: report.declaration_before,
            declaration_after: report.declaration_after,
            pending_proof_uri: report.pending_proof_uri,
            projection_hash: report.projection_hash,
            projected_rows_hash: report.projected_rows_hash,
            projection_manifest_id: report.projection_manifest_id,
            proof_written: report.proof_written,
          },
          {
            serving_state: "shadow_verified",
            outcome: "checked",
            home_switch: "not_switched",
            manifest_quality_state: "warning",
            // A check needs no serving approval, and reports that there is none.
            serving_approval: null,
            serving_approval_reasons: ["manifest carries no serving_approval"],
            declaration_before: null,
            declaration_after: null,
            pending_proof_uri: null,
            projection_hash: projectionHash,
            projected_rows_hash: projectionProof.projected_rows_hash,
            projection_manifest_id: manifestId,
            proof_written: true,
          },
        );
        const validation = report.validation as Record<string, unknown>;
        assert.deepEqual(
          {
            projected_rows: validation.projected_rows,
            served_rows: validation.served_rows,
            serving_views_read: validation.serving_views_read,
            absent_serving_views: validation.absent_serving_views,
            compared: validation.projected_rows_hash_compared_with_proof,
            readback_proof_uri: validation.readback_proof_uri,
          },
          {
            projected_rows: 3989,
            served_rows: 3989,
            serving_views_read: 26,
            absent_serving_views: [],
            compared: true,
            readback_proof_uri: projectionProof.readback_proof_uri,
          },
        );
        const gate = report.quality_gate as Record<string, unknown>;
        assert.deepEqual(
          without(
            gate.home_enterprise_context as Record<string, unknown>,
            "businessModel",
          ),
          { ...spine, excludedUncitedRows: 0, dependencyLinks: 346 },
        );
        assert.deepEqual(gate.home_estate, {
          application_system: 344,
          vendor_contract: 230,
        });
        const proof = await proofAt("check-1", "home-preflight-proof.json");
        assert.deepEqual(proof, without(report, "proof_uri", "proof_written"));
        assertJobRuleFields(proof, {
          job_name: "ecl-synthetic-enterprise-v2-check-home",
          run_id: runId("check-1"),
          status: "passed",
        });
        assert.equal(report.proof_uri, proof?.blob_proof_bundle);
        assert.equal(
          await proofAt("check-1", "home-admission-pending.json"),
          null,
        );
        assert.equal(
          await proofAt("check-1", "home-admission-proof.json"),
          null,
        );
        assert.deepEqual(await table(), []);
      },
    );

    await step(
      "a mode that is not recognised is refused, never read as check or promote",
      async () => {
        for (const [name, mode] of [
          ["mode-empty", ""],
          ["mode-case", "Promote"],
          ["mode-other", "dry-run"],
        ]) {
          await refused(
            name,
            /^Home admission mode must be check or promote; ".*" is refused$/,
            { mode },
            false,
          );
        }
      },
    );

    await step(
      "a run is refused before the database for its bindings, tenant, approval, proof and readback",
      async () => {
        await refused(
          "no-serving-approval",
          /^Home admission gate failed: manifest carries no serving_approval$/,
          { mode: "promote", manifests: loadApproved },
          false,
        );
        await refused(
          "no-load-approval",
          /^Home admission gate failed: manifest carries no load_approval$/,
          { mode: "promote", manifests: registry },
          false,
        );
        // The tenant is the one the tenant input registry declares, in either mode.
        for (const mode of ["check", "promote"]) {
          await refused(
            `tenant-${mode}`,
            /is not an active tenant in the tenant input registry$/,
            { mode, tenants: new Set(["another-tenant"]) },
            false,
          );
        }
        await refused(
          "source-version",
          /^Home admission source version is not pinned$/,
          { env: { ECL_SYNTHETIC_INPUT_SOURCE_VERSION: "0".repeat(64) } },
          false,
        );
        await refused(
          "idempotency",
          /^Home admission idempotency key does not name this assessment and source set$/,
          { env: { ECL_SYNTHETIC_IDEMPOTENCY_KEY: manifest.source_set_hash } },
          false,
        );
        for (const [name, uri] of [
          [
            "uri-host",
            projectionProofUri.replace("fixturestorage.", "another."),
          ],
          [
            "uri-set",
            projectionProofUri.replace(
              manifest.source_set_hash,
              "0".repeat(64),
            ),
          ],
          ["uri-query", `${projectionProofUri}?sig=fixture`],
          [
            "uri-file",
            projectionProofUri.replace("projection-proof", "readback"),
          ],
        ]) {
          await refused(
            name,
            /^Projection proof URI is outside the pinned source set$/,
            { env: { ECL_SYNTHETIC_PROJECTION_PROOF_URI: uri } },
            false,
          );
        }
        // A proof under the pinned source set that is not a passed projection proof.
        const stray = async (name: string, proof: Record<string, unknown>) =>
          (
            await store.writeOnce(
              runPath(name, "projection-proof.json"),
              Buffer.from(JSON.stringify(proof)),
            )
          ).uri;
        await refused(
          "proof-contract",
          /^Projection proof does not meet the Home admission contract$/,
          {
            env: {
              ECL_SYNTHETIC_PROJECTION_PROOF_URI: await stray("proof-failed", {
                ...projectionProof,
                status: "failed",
              }),
            },
          },
          false,
        );
        // A readback address that merely contains the pinned prefix is not under it.
        await refused(
          "readback-elsewhere",
          /^Projection proof is not bound to the independent readback$/,
          {
            env: {
              ECL_SYNTHETIC_PROJECTION_PROOF_URI: await stray(
                "proof-elsewhere",
                {
                  ...projectionProof,
                  readback_proof_uri: `https://another.invalid/ecl-synthetic-intake/${prefix}/runs/readback-fixture-1/readback.json`,
                },
              ),
            },
          },
          false,
        );
        // A readback under the pinned prefix that did not count what the pack holds.
        const readback = JSON.parse(
          (
            await store.read(String(projectionProof.readback_proof_uri))
          ).toString("utf8"),
        ) as { actual: Record<string, number> };
        const miscounted = await store.writeOnce(
          runPath("readback-miscounted", "readback.json"),
          Buffer.from(
            JSON.stringify({
              ...readback,
              actual: {
                ...readback.actual,
                objects: readback.actual.objects - 1,
              },
            }),
          ),
        );
        await refused(
          "readback-content",
          /^Projection proof is not bound to the independent readback$/,
          {
            env: {
              ECL_SYNTHETIC_PROJECTION_PROOF_URI: await stray(
                "proof-miscounted",
                {
                  ...projectionProof,
                  readback_proof_uri: miscounted.uri,
                },
              ),
            },
          },
          false,
        );
      },
    );

    await step(
      "a manifest that is not the one the proof was written for is refused, and so is a blocked one",
      async () => {
        for (const [name, apply, undo] of [
          [
            "manifest-rows",
            "row_count = row_count - 1",
            "row_count = row_count + 1",
          ],
          [
            "manifest-hash",
            "projection_hash = repeat('0', 64)",
            `projection_hash = '${projectionHash}'`,
          ],
          [
            "manifest-proof",
            "proof_uri = proof_uri || 'x'",
            "proof_uri = left(proof_uri, -1)",
          ],
        ]) {
          await tampered(
            [`update ${manifestTable} set ${apply} where ${scoped}`],
            [`update ${manifestTable} set ${undo} where ${scoped}`],
            () =>
              refused(
                name,
                /^Projection manifest does not match the independent proof$/,
                {},
                true,
              ),
          );
        }
        await tampered(
          [
            `update ${manifestTable} set quality_state = 'blocked' where ${scoped}`,
          ],
          [
            `update ${manifestTable} set quality_state = 'warning' where ${scoped}`,
          ],
          () =>
            refused(
              "manifest-blocked",
              /^Projection manifest is blocked and cannot be served$/,
              {},
              true,
            ),
        );
      },
    );

    const profile = `${scoped} and row_type = 'enterprise_profile'`;
    const drift = (issue: string) =>
      new RegExp(
        `^Canonical Home rows or source links drifted before admission: ${issue}$`,
      );
    await step(
      "rows, links and stamps that drifted from the proof are refused, each by name",
      async () => {
        await tampered(
          [
            `create table ${backup} as select * from ${landscape} where ${profile}`,
            `delete from ${landscape} where ${profile}`,
          ],
          [
            `insert into ${landscape} select * from ${backup}`,
            `drop table ${backup}`,
          ],
          () =>
            refused(
              "drift-row-missing",
              drift(
                "3988 projected rows, the proof states 3989; 0 enterprise_profile rows, the proof states 1",
              ),
              {},
              true,
            ),
        );
        await tampered(
          [
            `update ${landscape} set quality_state = 'warning' where ${profile}`,
          ],
          [`update ${landscape} set quality_state = 'passed' where ${profile}`],
          () =>
            refused(
              "drift-quality",
              drift("1 rows are not quality-passed"),
              {},
              true,
            ),
        );
        await tampered(
          [
            `update ${landscape} set admission_status = 'refused', admission_gate_key = 'fixture',
             admission_result_json = '{"fixture": true}' where ${profile}`,
          ],
          [
            `update ${landscape} set admission_status = 'not_applicable', admission_gate_key = null,
             admission_result_json = '{}' where ${profile}`,
          ],
          () => refused("drift-refused", drift("1 rows are refused"), {}, true),
        );
        await tampered(
          [`update ${landscape} set projection_version = 1 where ${profile}`],
          [`update ${landscape} set projection_version = 2 where ${profile}`],
          () =>
            refused(
              "drift-version",
              drift("3988 projected rows, the proof states 3989; 0 enterprise_profile rows, the proof states 1"),
              {},
              true,
            ),
        );
        await tampered(
          [
            `update ${landscape} set row_type = 'risk' where ${scoped} and row_key = (
            select min(row_key) from ${landscape} where ${scoped} and row_type = 'metric')
            and row_type = 'metric'`,
          ],
          [
            `update ${landscape} set row_type = 'metric' where ${scoped} and page_key = 'metrics_outcomes'`,
          ],
          () =>
            refused(
              "drift-types",
              drift(
                "35 metric rows, the proof states 36; 201 risk rows, the proof states 200",
              ),
              {},
              true,
            ),
        );
        const unlinked = drift(
          "1 rows do not have their required verified source links",
        );
        const links = "ecl_projection.projection_entry_source_record_ref";
        const profileEntry = `(select projection_entry_id from ${landscape} where ${profile})`;
        await tampered(
          [
            `create table ${backup} as select * from ${links} where ${scoped} and projection_entry_id = ${profileEntry}`,
            `delete from ${links} where ${scoped} and projection_entry_id = ${profileEntry}`,
          ],
          [
            `insert into ${links} select * from ${backup}`,
            `drop table ${backup}`,
          ],
          () => refused("drift-link-missing", unlinked, {}, true),
        );
        // A link counts only while its entry carries the link's own source hash.
        await tampered(
          [
            `update ecl_projection.projection_entry set source_hash = source_hash || 'x' where ${scoped} and id = ${profileEntry}`,
          ],
          [
            `update ecl_projection.projection_entry set source_hash = left(source_hash, -1) where ${scoped} and id = ${profileEntry}`,
          ],
          () => refused("drift-entry-hash", unlinked, {}, true),
        );
        // And only while the source record it names exists. The schema forbids
        // removing one, so the removal is made as a replica would apply it.
        const record = `${scoped} and id = (select source_record_id from ${links} where ${scoped} and projection_entry_id = ${profileEntry})`;
        await tampered(
          [
            `create table ${backup} as select * from ecl_source.source_record where ${record}`,
            "set session_replication_role = replica",
            `delete from ecl_source.source_record where ${scoped} and id in (select id from ${backup})`,
            "set session_replication_role = origin",
          ],
          [
            `insert into ecl_source.source_record select * from ${backup}`,
            `drop table ${backup}`,
          ],
          () => refused("drift-record-missing", unlinked, {}, true),
        );
        // A row needs exactly one link: a second verified link to another real
        // source record is as much a drift as none, and the spine, which only
        // asks whether a row is cited at all, would not notice it.
        await tampered(
          [
            `insert into ${links}
               (tenant_key, assessment_id, projection_entry_id, source_record_id, ref_role, sort_order, source_hash)
             select tenant_key, assessment_id, projection_entry_id,
               (select id from ecl_source.source_record where ${scoped}
                  and id <> ref.source_record_id order by id limit 1),
               'fixture_secondary', 2, source_hash
             from ${links} ref where ${scoped} and projection_entry_id = ${profileEntry}
               and ref_role = 'primary_source'`,
          ],
          [
            `delete from ${links} where ${scoped} and ref_role = 'fixture_secondary'`,
          ],
          () => refused("drift-two-links", unlinked, {}, true),
        );
        const edgeEntry = `(select projection_entry_id from ${landscape}
          where ${scoped} and row_type = 'relationship' order by row_key limit 1)`;
        await tampered(
          [
            `create table ${backup} as select source_record_id from ${links}
              where ${scoped} and projection_entry_id = ${edgeEntry} and sort_order = 2`,
            `update ${links} set source_record_id = (
              select id from ecl_source.source_record where ${scoped}
                and id not in (select source_record_id from ${links} where projection_entry_id = ${edgeEntry})
              order by id limit 1)
              where ${scoped} and projection_entry_id = ${edgeEntry} and sort_order = 2`,
          ],
          [
            `update ${links} set source_record_id = (select source_record_id from ${backup})
              where ${scoped} and projection_entry_id = ${edgeEntry} and sort_order = 2`,
            `drop table ${backup}`,
          ],
          () => refused("drift-edge-endpoint-source", unlinked, {}, true),
        );
      },
    );

    // A proof written before the projection job recorded the hash of its rows.
    const legacyUri = (
      await store.writeOnce(
        runPath("legacy", "projection-proof.json"),
        Buffer.from(
          JSON.stringify(without(projectionProof, "projected_rows_hash")),
        ),
      )
    ).uri;
    const withLegacyProof = (check: () => Promise<void>) =>
      tampered(
        [
          `update ${manifestTable} set proof_uri = '${legacyUri}' where ${scoped}`,
        ],
        [
          `update ${manifestTable} set proof_uri = '${projectionProofUri}' where ${scoped}`,
        ],
        check,
      );
    const legacy = { env: { ECL_SYNTHETIC_PROJECTION_PROOF_URI: legacyUri } };

    await step(
      "rows changed after the proof was written are refused by the hash the proof carries",
      async () => {
        await tampered(
          [
            `update ${landscape} set title = title || ' (changed)' where ${profile}`,
          ],
          [`update ${landscape} set title = left(title, -10) where ${profile}`],
          () =>
            refused(
              "rows-hash",
              /^Projected Home rows are not the rows the projection proof was written for$/,
              {},
              true,
            ),
        );
        // A proof that carries no such hash is admitted on the other gates, and says so.
        await withLegacyProof(async () => {
          const outcome = await admit({ run: "check-legacy", ...legacy });
          assert.equal(outcome.code, 0, outcome.failure);
          const validation = outcome.report?.validation as Record<
            string,
            unknown
          >;
          assert.equal(
            validation.projected_rows_hash_compared_with_proof,
            false,
          );
          assert.equal(
            outcome.report?.projected_rows_hash,
            projectionProof.projected_rows_hash,
          );
        });
      },
    );

    await step(
      "a projection Home is not served in full is refused",
      async () => {
        const view = "serving.home_metrics_outcomes";
        const definition = (
          await admin.query<{ definition: string }>(
            `select pg_get_viewdef('${view}'::regclass) as definition`,
          )
        ).rows[0].definition;
        await tampered(
          [`drop view ${view}`],
          [`create view ${view} as ${definition}`],
          () =>
            refused(
              "served-view-absent",
              /^Home serving views do not serve the proved projection: 3953 of 3989 rows are served; no serving view for serving\.home_metrics_outcomes$/,
              {},
              true,
            ),
        );
        // As many rows as were proved, but not the proved rows: seven served
        // twice and seven not served at all.
        const risks = "serving.home_risks_controls";
        const spare = "serving.home_kpi_register";
        const definitions = (
          await admin.query<{ risks: string; spare: string }>(
            `select pg_get_viewdef('${risks}'::regclass) as risks,
                  pg_get_viewdef('${spare}'::regclass) as spare`,
          )
        ).rows[0];
        await tampered(
          [
            `create or replace view ${risks} as select * from serving.home_surface_rows('home_risks_controls', 'risks_controls') served
             where served.row_key not in (select row_key from ${landscape} where row_type = 'risk' order by row_key limit 7)`,
            `create or replace view ${spare} as select * from serving.home_surface_rows('home_kpi_register', 'org_ownership')`,
          ],
          [
            `create or replace view ${risks} as ${definitions.risks}`,
            `create or replace view ${spare} as ${definitions.spare}`,
          ],
          () =>
            refused(
              "served-twice",
              /^Home serving views do not serve the proved projection: 3989 of 3989 rows are served$/,
              {},
              true,
            ),
        );
        // The served read is restricted to the proved manifest and projection
        // version, as the reader restricts a declared assessment (#8856). Within
        // this job that predicate is belt-and-braces: the drift gate above reads
        // the same landscape table and already refuses any row outside the
        // proved manifest and version (see "drift-version"), so a loosened
        // served predicate cannot admit a row the drift gate would pass. It is
        // kept so the gate reads exactly what the reader reads.
      },
    );

    await step(
      "the gate is Home's own builder: what it cannot build is refused",
      async () => {
        // What the gate hands the builder is what Home is served and cites.
        let served: ServedHome | undefined;
        const outcome = await admit({
          run: "check-builder",
          build: async (input) => {
            served = input;
            return buildServedHome(input);
          },
        });
        assert.equal(outcome.code, 0, outcome.failure);
        assert.ok(served);
        assert.deepEqual(
          {
            tenantKey: served.tenantKey,
            assessmentId: served.assessmentId,
            rows: served.rows.length,
            cited: served.verifiedSourceRefs.size,
            sourceFiles: served.sourceCatalogRows.length,
          },
          {
            tenantKey: manifest.tenant_key,
            assessmentId: manifest.assessment_id,
            rows: 3989,
            cited: 3989,
            sourceFiles: manifest.files.length,
          },
        );
        // The served row is the serving view's row, not the landscape row.
        assert.equal(
          typeof served.rows[0].display_payload_json?.display_payload_json,
          "object",
        );

        const built = await buildServedHome(served);
        assert.equal(built.baseBundle, true);
        const standIn =
          (change: (summary: ServedHomeSummary) => ServedHomeSummary) =>
          async () =>
            change(structuredClone(built));
        const context = (
          over: Partial<NonNullable<ServedHomeSummary["enterpriseContext"]>>,
        ) =>
          standIn((summary) => ({
            ...summary,
            enterpriseContext: { ...summary.enterpriseContext!, ...over },
          }));
        for (const [name, build] of [
          [
            "spine-no-base",
            standIn((summary) => ({ ...summary, baseBundle: false })),
          ],
          [
            "spine-no-context",
            standIn((summary) => ({ ...summary, enterpriseContext: null })),
          ],
          ["spine-segments", context({ segments: spine.segments - 1 })],
          ["spine-functions", context({ functions: spine.functions - 1 })],
          ["spine-priorities", context({ priorities: spine.priorities + 1 })],
          ["spine-uncited", context({ excludedUncitedRows: 1 })],
        ] as const) {
          await refused(
            name,
            /^Home business spine cannot be built from the served projection$/,
            { build },
            true,
          );
        }
        for (const [name, type] of [
          ["estate-applications", "application_system"],
          ["estate-contracts", "vendor_contract"],
        ] as const) {
          await refused(
            name,
            /^Home does not show the proved applications and contracts$/,
            {
              build: standIn((summary) => ({
                ...summary,
                estate: { ...summary.estate, [type]: summary.estate[type] - 1 },
              })),
            },
            true,
          );
        }

        // With the real builder: a profile row Home's reader does not accept
        // leaves Home with no enterprise context, whatever the row counts say.
        // The proof here carries no row hash, so nothing else stands in the way.
        await withLegacyProof(() =>
          tampered(
            [
              `create table ${backup} as select display_payload_json from ${landscape} where ${profile}`,
              `update ${landscape} set display_payload_json = display_payload_json - 'business_model_basis' where ${profile}`,
            ],
            [
              `update ${landscape} set display_payload_json = (select display_payload_json from ${backup}) where ${profile}`,
              `drop table ${backup}`,
            ],
            () =>
              refused(
                "spine-real",
                /^Home business spine cannot be built from the served projection$/,
                legacy,
                true,
              ),
          ),
        );
      },
    );

    await step(
      "a tenant already serving another declaration is refused",
      async () => {
        const row = `($1, $2, '${manifestId}', '${manifest.source_set_hash}', '${projectionHash}', '${projectionProofUri}', 'active')`;
        const insert = `insert into ${declarations} (tenant_key, assessment_id, projection_manifest_id, source_set_hash, projection_hash, projection_proof_uri, state) values ${row}`;
        const remove = `delete from ${declarations} where tenant_key = $1`;
        const different = /^A different Home assessment is already active$/;
        const check = (name: string) => async () => {
          const outcome = await admit({ run: name });
          assert.equal(outcome.code, 1);
          assert.match(outcome.failure, different);
          assert.equal(outcome.report, undefined);
        };
        // Another assessment of the same tenant.
        await admin.query(insert.replace("$2", "'assessment-fixture-other'"), [
          manifest.tenant_key,
        ]);
        try {
          await check("active-other-assessment")();
        } finally {
          await admin.query(remove, [manifest.tenant_key]);
        }
        // This assessment, declared under any other binding.
        await withSpareManifest(async (spare) => {
          for (const [name, change] of [
            ["active-other-manifest", `projection_manifest_id = '${spare}'`],
            ["active-other-source", "source_set_hash = repeat('0', 64)"],
            ["active-other-hash", "projection_hash = repeat('0', 64)"],
            [
              "active-other-proof",
              "projection_proof_uri = projection_proof_uri || 'x'",
            ],
          ]) {
            await admin.query(insert, scope);
            try {
              await admin.query(
                `update ${declarations} set ${change} where ${scoped}`,
                scope,
              );
              await check(name)();
            } finally {
              await admin.query(remove, [manifest.tenant_key]);
            }
          }
        });
        assert.deepEqual(await table(), []);
      },
    );

    const lockKey = `home-assessment:${manifest.tenant_key}`;
    const whileLocked = async (check: () => Promise<void>) => {
      await admin.query("select pg_advisory_lock(hashtext($1))", [lockKey]);
      try {
        await check();
      } finally {
        await admin.query("select pg_advisory_unlock(hashtext($1))", [lockKey]);
      }
    };

    await step(
      "a promotion that cannot record its evidence, or runs out of time, switches nothing",
      async () => {
        const unreachable = (file: string) =>
          fileProofStore(proofDirectory(), async (blobPath) => {
            if (blobPath.endsWith(file)) throw new Error("store unreachable");
          });
        await refused(
          "pending-refused",
          /^Home admission could not record its pending proof; nothing was switched: store unreachable$/,
          {
            mode: "promote",
            store: unreachable("home-admission-pending.json"),
          },
          true,
        );
        // A store that never answers is not waited on past its limit.
        await refused(
          "pending-silent",
          /^Home admission could not record its pending proof; nothing was switched: Proof write did not finish within 200ms$/,
          {
            mode: "promote",
            env: { ECL_SYNTHETIC_PROOF_STORE_TIMEOUT_MS: "200" },
            store: fileProofStore(proofDirectory(), (blobPath) =>
              blobPath.endsWith("home-admission-pending.json")
                ? new Promise<void>(() => undefined)
                : Promise.resolve(),
            ),
          },
          true,
        );
        await refused(
          "statement-timeout",
          /^Home admission stopped at its statement timeout; nothing was switched$/,
          { mode: "promote", env: { ECL_SYNTHETIC_STATEMENT_TIMEOUT_MS: "1" } },
          true,
        );
        await whileLocked(() =>
          refused(
            "lock-timeout",
            /^Home admission stopped at its lock timeout; nothing was switched$/,
            { mode: "promote", env: { ECL_SYNTHETIC_LOCK_TIMEOUT_MS: "200" } },
            true,
          ),
        );
        // A commit the server answers with an error was rolled back.
        await refused(
          "commit-refused",
          /^Home admission could not commit and was rolled back; nothing was switched: could not serialize$/,
          {
            mode: "promote",
            connect: commitAnswered(async (client) => {
              await client.query("rollback");
              throw Object.assign(new Error("could not serialize"), {
                code: "40001",
              });
            }),
          },
          true,
        );
        assert.equal(
          (await proofAt("commit-refused", "home-admission-pending.json"))
            ?.status,
          "pending",
          "a pending proof is evidence of an attempt, never of a switch",
        );
        // A commit that returns and did not take effect is not reported as a switch.
        const vanished = await admit({
          run: "commit-vanished",
          mode: "promote",
          connect: commitAnswered(async (client) => client.query("rollback")),
        });
        assert.equal(vanished.code, 1);
        assert.deepEqual(
          {
            status: vanished.report?.status,
            home_switch: vanished.report?.home_switch,
            final_proof: vanished.report?.final_proof,
            declaration_after: vanished.report?.declaration_after,
            reason: vanished.report?.reason,
          },
          {
            status: "failed",
            home_switch: "not_confirmed",
            final_proof: "missing",
            declaration_after: null,
            reason:
              "the declaration read back after commit is not the active declaration this run reports",
          },
        );
        assert.equal(
          await proofAt("commit-vanished", "home-admission-proof.json"),
          null,
        );
        assert.deepEqual(await table(), []);
      },
    );

    let firstActive: Declaration;
    await step(
      "a switch whose final proof cannot be written is reported as committed with its proof missing",
      async () => {
        const outcome = await admit({
          run: "promote-1",
          mode: "promote",
          store: fileProofStore(proofDirectory(), async (blobPath) => {
            if (blobPath.endsWith("home-admission-proof.json")) {
              throw new Error("store unreachable");
            }
          }),
        });
        assert.equal(outcome.code, 1);
        firstActive = await only();
        assert.deepEqual(without(firstActive, "activated_at"), {
          tenant_key: manifest.tenant_key,
          assessment_id: manifest.assessment_id,
          projection_manifest_id: manifestId,
          source_set_hash: manifest.source_set_hash,
          projection_hash: projectionHash,
          projection_proof_uri: projectionProofUri,
          state: "active",
          retired_at: null,
        });
        assert.deepEqual(without(outcome.report, "recovery"), {
          job_name: "ecl-synthetic-enterprise-v2-promote-home",
          run_id: runId("promote-1"),
          tenant_scope: manifest.tenant_key,
          assessment_id: manifest.assessment_id,
          status: "failed",
          outcome: "promoted",
          home_switch: "committed_by_this_run",
          final_proof: "missing",
          final_proof_uri: store.uriFor(
            runPath("promote-1", "home-admission-proof.json"),
          ),
          pending_proof_uri: store.uriFor(
            runPath("promote-1", "home-admission-pending.json"),
          ),
          declaration_before: null,
          declaration_after: firstActive,
          reason: "the final proof could not be written: store unreachable",
        });
        assert.match(
          String(outcome.report?.recovery),
          /^the switch is committed; /,
        );
        assert.equal(
          await proofAt("promote-1", "home-admission-proof.json"),
          null,
        );
        // The evidence written before the switch is there.
        const pending = await proofAt(
          "promote-1",
          "home-admission-pending.json",
        );
        assertJobRuleFields(pending, {
          job_name: "ecl-synthetic-enterprise-v2-promote-home",
          run_id: runId("promote-1"),
          status: "pending",
        });
        assert.deepEqual(
          {
            outcome: pending?.outcome,
            serving_state: pending?.serving_state,
            declaration_before: pending?.declaration_before,
            declaration_after: pending?.declaration_after,
            manifest_quality_state: pending?.manifest_quality_state,
            serving_approval: (
              pending?.serving_approval as Record<string, unknown>
            )?.surface,
          },
          {
            outcome: "pending",
            serving_state: "home_active_pending_commit",
            declaration_before: null,
            declaration_after: firstActive,
            manifest_quality_state: "warning",
            serving_approval: "home",
          },
        );
      },
    );

    await step(
      "a later run finds the declaration active, writes the final proof and touches nothing",
      async () => {
        // The same run id, whose final proof is the one that is missing.
        const sameRun = await admit({ run: "promote-1", mode: "promote" });
        assert.equal(sameRun.failure, "");
        assert.equal(sameRun.code, 0);
        assert.deepEqual(await only(), firstActive);
        const proof = await proofAt("promote-1", "home-admission-proof.json");
        assert.deepEqual(
          proof,
          without(sameRun.report, "proof_uri", "proof_written"),
        );
        assert.equal(sameRun.report?.proof_written, true);
        assertJobRuleFields(proof, {
          job_name: "ecl-synthetic-enterprise-v2-promote-home",
          run_id: runId("promote-1"),
          status: "passed",
        });
        // It does not claim a switch it did not make.
        assert.deepEqual(
          {
            outcome: proof?.outcome,
            home_switch: proof?.home_switch,
            serving_state: proof?.serving_state,
            declaration_before: proof?.declaration_before,
            declaration_after: proof?.declaration_after,
            pending_proof_uri: proof?.pending_proof_uri,
          },
          {
            outcome: "already_active",
            home_switch: "committed_before_this_run",
            serving_state: "home_active",
            declaration_before: firstActive,
            declaration_after: firstActive,
            pending_proof_uri: null,
          },
        );
        // Again: the proof is there, so nothing at all is written.
        const again = await admit({ run: "promote-1", mode: "promote" });
        assert.equal(again.code, 0, again.failure);
        assert.equal(again.report?.outcome, "already_active");
        assert.equal(again.report?.proof_written, false);
        assert.deepEqual(
          await proofAt("promote-1", "home-admission-proof.json"),
          proof,
        );
        // A new run id writes its own proof, and no pending one.
        const newRun = await admit({ run: "promote-2", mode: "promote" });
        assert.equal(newRun.code, 0, newRun.failure);
        assert.equal(newRun.report?.outcome, "already_active");
        assert.equal(newRun.report?.proof_written, true);
        assert.equal(
          (await proofAt("promote-2", "home-admission-proof.json"))?.outcome,
          "already_active",
        );
        assert.equal(
          await proofAt("promote-2", "home-admission-pending.json"),
          null,
        );
        assert.deepEqual(await only(), firstActive);
        // A promoting run is held to the serving approval even when nothing would change.
        await refused(
          "active-no-approval",
          /^Home admission gate failed: manifest carries no serving_approval$/,
          { mode: "promote", manifests: loadApproved },
          false,
        );
      },
    );

    await step(
      "a check of an active declaration reports it as active",
      async () => {
        const outcome = await admit({
          run: "check-2",
          manifests: loadApproved,
        });
        assert.equal(outcome.code, 0, outcome.failure);
        assert.deepEqual(
          {
            serving_state: outcome.report?.serving_state,
            outcome: outcome.report?.outcome,
            home_switch: outcome.report?.home_switch,
            declaration_before: outcome.report?.declaration_before,
            declaration_after: outcome.report?.declaration_after,
          },
          {
            serving_state: "home_active",
            outcome: "checked",
            home_switch: "committed_before_this_run",
            declaration_before: firstActive,
            declaration_after: firstActive,
          },
        );
        assert.equal(
          (await proofAt("check-2", "home-preflight-proof.json"))
            ?.serving_state,
          "home_active",
        );
        assert.equal(
          await proofAt("check-2", "home-admission-proof.json"),
          null,
        );
        assert.deepEqual(await only(), firstActive);
      },
    );

    const notRetired = async (
      name: string,
      message: RegExp,
      env: Record<string, string | undefined>,
      opensDatabase: boolean,
    ) => {
      const before = await table();
      const outcome = await retire({ run: name, env });
      assert.equal(outcome.code, 1, name);
      assert.match(outcome.failure, message, name);
      assert.equal(outcome.report, undefined, name);
      assert.equal(outcome.connections, opensDatabase ? 1 : 0, name);
      assert.deepEqual(await table(), before, name);
      assert.equal(await proofAt(name, "home-retirement-proof.json"), null);
    };

    await step(
      "a retirement retires only the declaration it names",
      async () => {
        await notRetired(
          "retire-unapproved",
          /^Home retirement requires a pinned, explicitly approved private job$/,
          { ECL_SYNTHETIC_ROLLBACK_APPROVAL: "retire" },
          false,
        );
        for (const [name, env] of [
          ["retire-no-tenant", { ECL_SYNTHETIC_RETIRE_TENANT: undefined }],
          ["retire-no-assessment", { ECL_SYNTHETIC_RETIRE_ASSESSMENT: "" }],
          [
            "retire-short-hash",
            { ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: projectionHash.slice(1) },
          ],
        ] as const) {
          await notRetired(
            name,
            /^Home retirement must name the declaration it retires: tenant, assessment and projection hash$/,
            env,
            false,
          );
        }
        for (const [name, env] of [
          [
            "retire-other-hash",
            { ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: "0".repeat(64) },
          ],
          [
            "retire-other-assessment",
            { ECL_SYNTHETIC_RETIRE_ASSESSMENT: "assessment-fixture-other" },
          ],
          [
            "retire-other-tenant",
            { ECL_SYNTHETIC_RETIRE_TENANT: "another-tenant" },
          ],
        ] as const) {
          await notRetired(
            name,
            /^No matching Home declaration to retire$/,
            env,
            true,
          );
        }
        await whileLocked(() =>
          notRetired(
            "retire-locked",
            /^Home retirement stopped at its lock timeout; nothing was retired$/,
            { ECL_SYNTHETIC_LOCK_TIMEOUT_MS: "200" },
            true,
          ),
        );
        assert.deepEqual(await only(), firstActive);
      },
    );

    let firstRetired: Declaration;
    await step(
      "a retirement is committed even when its proof cannot be written, and says so",
      async () => {
        // A commit the server refuses retires nothing.
        const refusedCommit = await retire({
          run: "retire-commit-refused",
          connect: commitAnswered(async (client) => {
            await client.query("rollback");
            throw Object.assign(new Error("could not serialize"), {
              code: "40001",
            });
          }),
        });
        assert.equal(refusedCommit.code, 1);
        assert.match(
          refusedCommit.failure,
          /^Home retirement could not commit and was rolled back; nothing was retired: could not serialize$/,
        );
        assert.deepEqual(await only(), firstActive);
        // A commit that returns and did not take effect is not reported as a retirement.
        const vanished = await retire({
          run: "retire-commit-vanished",
          connect: commitAnswered(async (client) => client.query("rollback")),
        });
        assert.equal(vanished.code, 1);
        assert.equal(vanished.report?.status, "failed");
        assert.equal(
          vanished.report?.reason,
          "the declaration read back after commit is not the retired declaration this run reports",
        );
        assert.equal(vanished.report?.retirement, "not_confirmed");
        assert.deepEqual(vanished.report?.declaration_after, firstActive);
        assert.equal(
          await proofAt("retire-commit-vanished", "home-retirement-proof.json"),
          null,
        );
        assert.deepEqual(await only(), firstActive);

        // Nor is a run whose retiring statement left the row active.
        const untouched = await retire({
          run: "retire-nothing",
          connect: async (databaseUrl) => {
            const client = await connectDatabase(databaseUrl);
            return {
              query: ((sql: string, params?: unknown[]) =>
                client.query(
                  sql.replace(
                    "set state = 'retired', retired_at = now()",
                    "set projection_hash = projection_hash",
                  ),
                  params,
                )) as JobClient["query"],
              on: (event, listener) => client.on(event, listener),
              removeListener: (event, listener) =>
                client.removeListener(event, listener),
              end: () => client.end(),
            };
          },
        });
        assert.equal(untouched.code, 1);
        assert.deepEqual(
          {
            status: untouched.report?.status,
            retirement: untouched.report?.retirement,
            declaration_after: untouched.report?.declaration_after,
          },
          {
            status: "failed",
            retirement: "not_confirmed",
            declaration_after: firstActive,
          },
        );
        assert.equal(
          await proofAt("retire-nothing", "home-retirement-proof.json"),
          null,
        );
        assert.deepEqual(await only(), firstActive);

        const outcome = await retire({
          run: "retire-1",
          store: fileProofStore(proofDirectory(), async () => {
            throw new Error("store unreachable");
          }),
        });
        assert.equal(outcome.code, 1);
        assert.match(outcome.failure, /^store unreachable$/);
        firstRetired = await only();
        assert.equal(firstRetired.state, "retired");
        assert.ok(
          firstRetired.retired_at &&
            firstRetired.retired_at > firstActive.activated_at,
        );
        assert.deepEqual(
          without(firstRetired, "state", "retired_at"),
          without(firstActive, "state", "retired_at"),
          "retiring changes the state and the retirement time, and nothing else",
        );
        assert.deepEqual(without(outcome.report, "recovery"), {
          job_name: "ecl-synthetic-enterprise-v2-retire-home",
          run_id: runId("retire-1"),
          tenant_scope: manifest.tenant_key,
          assessment_id: manifest.assessment_id,
          status: "failed",
          outcome: "retired",
          retirement: "committed_by_this_run",
          proof: "missing",
          proof_uri: store.uriFor(
            runPath("retire-1", "home-retirement-proof.json"),
          ),
          declaration_before: firstActive,
          declaration_after: firstRetired,
          reason: "the proof could not be written: store unreachable",
        });
        assert.equal(
          await proofAt("retire-1", "home-retirement-proof.json"),
          null,
        );
      },
    );

    await step(
      "a later retirement run finds the declaration retired, writes the proof and touches nothing",
      async () => {
        const sameRun = await retire({ run: "retire-1" });
        assert.equal(sameRun.failure, "");
        assert.equal(sameRun.code, 0);
        assert.deepEqual(await only(), firstRetired);
        const proof = await proofAt("retire-1", "home-retirement-proof.json");
        assert.deepEqual(
          proof,
          without(sameRun.report, "proof_uri", "proof_written"),
        );
        assert.equal(sameRun.report?.proof_written, true);
        assertJobRuleFields(proof, {
          job_name: "ecl-synthetic-enterprise-v2-retire-home",
          run_id: runId("retire-1"),
          status: "passed",
        });
        assert.deepEqual(
          {
            outcome: proof?.outcome,
            serving_state: proof?.serving_state,
            declaration_before: proof?.declaration_before,
            declaration_after: proof?.declaration_after,
            tenant_scope: proof?.tenant_scope,
            // What was retired is what the declaration itself names.
            input_source_version: proof?.input_source_version,
            idempotency_key: proof?.idempotency_key,
            projection_proof_uri: proof?.projection_proof_uri,
            projection_manifest_id: proof?.projection_manifest_id,
          },
          {
            outcome: "already_retired",
            serving_state: "retired",
            declaration_before: firstRetired,
            declaration_after: firstRetired,
            tenant_scope: manifest.tenant_key,
            input_source_version: manifest.source_set_hash,
            idempotency_key: `${manifest.assessment_id}:${projectionHash}`,
            projection_proof_uri: projectionProofUri,
            projection_manifest_id: manifestId,
          },
        );
        const again = await retire({ run: "retire-1" });
        assert.equal(again.code, 0, again.failure);
        assert.equal(again.report?.outcome, "already_retired");
        assert.equal(again.report?.proof_written, false);
        const newRun = await retire({ run: "retire-2" });
        assert.equal(newRun.code, 0, newRun.failure);
        assert.equal(newRun.report?.outcome, "already_retired");
        assert.equal(newRun.report?.proof_written, true);
        assert.deepEqual(await only(), firstRetired);
        // A run that names a different, well-formed projection hash does not
        // match this retired declaration: it is refused, not reported as
        // already retired. The row read first is the only thing that enforces
        // this; the retiring UPDATE never runs for an already-retired row.
        const wrongHash = await retire({
          run: "retire-wrong-hash",
          env: { ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: "f".repeat(64) },
        });
        assert.equal(wrongHash.code, 1, wrongHash.failure);
        assert.match(
          wrongHash.failure,
          /^No matching Home declaration to retire$/,
        );
        assert.equal(wrongHash.report, undefined);
        assert.equal(
          await proofAt("retire-wrong-hash", "home-retirement-proof.json"),
          null,
        );
        assert.deepEqual(await only(), firstRetired);
        // Nothing is active: a check reports the shadow state and the retired row.
        const check = await admit({ run: "check-3", manifests: loadApproved });
        assert.equal(check.code, 0, check.failure);
        assert.equal(check.report?.serving_state, "shadow_verified");
        assert.equal(check.report?.home_switch, "not_switched");
        assert.deepEqual(check.report?.declaration_before, firstRetired);
        assert.deepEqual(await only(), firstRetired);
      },
    );

    let secondActive: Declaration;
    await step(
      "a retired declaration is promoted again only under a new run id and its own proof",
      async () => {
        // The first promotion's run id recorded a switch from no declaration.
        const reused = await admit({ run: "promote-1", mode: "promote" });
        assert.equal(reused.code, 1);
        assert.match(
          reused.failure,
          /^Home admission could not record its pending proof; nothing was switched: This run id already recorded a different pending admission; use a new run id$/,
        );
        assert.deepEqual(await only(), firstRetired);
        // A retired declaration is brought back only under the binding it was
        // retired with: any other is another declaration.
        await withSpareManifest(async (spare) => {
          for (const [name, column, other] of [
            ["retired-other-manifest", "projection_manifest_id", `'${spare}'`],
            ["retired-other-source", "source_set_hash", "repeat('0', 64)"],
            ["retired-other-hash", "projection_hash", "repeat('0', 64)"],
            [
              "retired-other-proof",
              "projection_proof_uri",
              "projection_proof_uri || 'x'",
            ],
          ]) {
            await tampered(
              [
                `create table ${backup} as select ${column} as kept from ${declarations} where ${scoped}`,
                `update ${declarations} set ${column} = ${other} where ${scoped}`,
              ],
              [
                `update ${declarations} set ${column} = (select kept from ${backup}) where ${scoped}`,
                `drop table ${backup}`,
              ],
              () =>
                refused(
                  name,
                  /^Existing retired Home declaration has a different proof$/,
                  { mode: "promote" },
                  true,
                ),
            );
          }
        });
        assert.deepEqual(await only(), firstRetired);

        // The switch commits and the connection is lost before the answer.
        const lost = await admit({
          run: "promote-3",
          mode: "promote",
          connect: commitAnswered(async (client) => {
            await client.query("commit");
            throw new Error("connection terminated");
          }),
        });
        assert.equal(lost.code, 1);
        assert.match(
          lost.failure,
          /^Home admission commit was not confirmed and may or may not have taken effect: connection terminated$/,
        );
        assert.equal(lost.report, undefined);
        secondActive = await only();
        assert.equal(secondActive.state, "active");
        assert.equal(secondActive.retired_at, null);
        assert.ok(secondActive.activated_at > firstRetired.retired_at!);
        assert.deepEqual(
          without(secondActive, "state", "retired_at", "activated_at"),
          without(firstActive, "state", "retired_at", "activated_at"),
        );
        const pending = await proofAt(
          "promote-3",
          "home-admission-pending.json",
        );
        assert.deepEqual(pending?.declaration_before, firstRetired);
        assert.deepEqual(pending?.declaration_after, secondActive);
        assert.equal(
          await proofAt("promote-3", "home-admission-proof.json"),
          null,
        );
        // Running it again reconciles: the switch happened, and is now proved.
        const reconciled = await admit({ run: "promote-3", mode: "promote" });
        assert.equal(reconciled.code, 0, reconciled.failure);
        assert.equal(reconciled.report?.outcome, "already_active");
        assert.equal(reconciled.report?.proof_written, true);
        assert.deepEqual(await only(), secondActive);
      },
    );

    await step(
      "a run id that already holds a proof cannot stand for a later retirement or promotion",
      async () => {
        // retire-2 holds the proof of the first retirement.
        const reused = await retire({ run: "retire-2" });
        assert.equal(reused.code, 1);
        const retiredAgain = await only();
        assert.equal(retiredAgain.state, "retired");
        assert.ok(retiredAgain.retired_at! > firstRetired.retired_at!);
        assert.equal(retiredAgain.activated_at, secondActive.activated_at);
        assert.deepEqual(
          {
            status: reused.report?.status,
            retirement: reused.report?.retirement,
            proof: reused.report?.proof,
            reason: reused.report?.reason,
            declaration_after: reused.report?.declaration_after,
          },
          {
            status: "failed",
            retirement: "committed_by_this_run",
            proof: "missing",
            reason:
              "a proof already exists at this run's path and was not written by this run",
            declaration_after: retiredAgain,
          },
        );
        // Nor for a retirement that is already made: its proof describes another.
        const stale = await retire({ run: "retire-1" });
        assert.equal(stale.code, 1);
        assert.equal(stale.report?.retirement, "committed_before_this_run");
        assert.equal(
          stale.report?.reason,
          "a proof already exists at this run's path and was not written by this run",
        );
        // A new run id proves it.
        const proved = await retire({ run: "retire-3" });
        assert.equal(proved.code, 0, proved.failure);
        assert.equal(proved.report?.outcome, "already_retired");
        assert.deepEqual(await only(), retiredAgain);
        // promote-2 holds a proof that reports the first activation as already made.
        const promoted = await admit({ run: "promote-2", mode: "promote" });
        assert.equal(promoted.code, 1);
        assert.deepEqual(
          {
            home_switch: promoted.report?.home_switch,
            final_proof: promoted.report?.final_proof,
            reason: promoted.report?.reason,
          },
          {
            home_switch: "committed_by_this_run",
            final_proof: "missing",
            reason:
              "a proof already exists at this run's path and was not written by this run",
          },
        );
        const thirdActive = await only();
        assert.equal(thirdActive.state, "active");
        // promote-3 holds the proof of the second activation, which is over.
        const stalePromotion = await admit({
          run: "promote-3",
          mode: "promote",
        });
        assert.equal(stalePromotion.code, 1);
        assert.equal(
          stalePromotion.report?.home_switch,
          "committed_before_this_run",
        );
        assert.equal(
          stalePromotion.report?.reason,
          "a proof already exists at this run's path and was not written by this run",
        );
        assert.deepEqual(await only(), thirdActive);
      },
    );

    await step(
      "a clean retirement and a clean promotion each write one proof of what they did",
      async () => {
        const active = await only();
        const retired = await retire({ run: "retire-4" });
        assert.equal(retired.failure, "");
        assert.equal(retired.code, 0);
        const retiredRow = await only();
        assert.equal(retiredRow.state, "retired");
        const retirement = await proofAt(
          "retire-4",
          "home-retirement-proof.json",
        );
        assert.deepEqual(
          retirement,
          without(retired.report, "proof_uri", "proof_written"),
        );
        assert.deepEqual(
          {
            outcome: retirement?.outcome,
            declaration_before: retirement?.declaration_before,
            declaration_after: retirement?.declaration_after,
            validation: retirement?.validation,
            proof_written: retired.report?.proof_written,
          },
          {
            outcome: "retired",
            declaration_before: active,
            declaration_after: retiredRow,
            validation: {
              named_tenant: manifest.tenant_key,
              named_assessment: manifest.assessment_id,
              named_projection_hash: projectionHash,
              declaration_matched: true,
            },
            proof_written: true,
          },
        );

        const promoted = await admit({ run: "promote-4", mode: "promote" });
        assert.equal(promoted.failure, "");
        assert.equal(promoted.code, 0);
        const activeRow = await only();
        assert.equal(activeRow.state, "active");
        assert.equal(activeRow.retired_at, null);
        assert.ok(activeRow.activated_at > retiredRow.retired_at!);
        const admission = await proofAt(
          "promote-4",
          "home-admission-proof.json",
        );
        assert.deepEqual(
          admission,
          without(promoted.report, "proof_uri", "proof_written"),
        );
        assertJobRuleFields(admission, {
          job_name: "ecl-synthetic-enterprise-v2-promote-home",
          run_id: runId("promote-4"),
          status: "passed",
        });
        assert.deepEqual(
          {
            outcome: admission?.outcome,
            home_switch: admission?.home_switch,
            serving_state: admission?.serving_state,
            declaration_before: admission?.declaration_before,
            declaration_after: admission?.declaration_after,
            pending_proof_uri: admission?.pending_proof_uri,
            manifest_quality_state: admission?.manifest_quality_state,
            projected_rows_hash: admission?.projected_rows_hash,
            serving_approved: (
              admission?.quality_gate as Record<string, unknown>
            ).serving_approved,
            proof_written: promoted.report?.proof_written,
          },
          {
            outcome: "promoted",
            home_switch: "committed_by_this_run",
            serving_state: "home_active",
            declaration_before: retiredRow,
            declaration_after: activeRow,
            pending_proof_uri: store.uriFor(
              runPath("promote-4", "home-admission-pending.json"),
            ),
            manifest_quality_state: "warning",
            projected_rows_hash: projectionProof.projected_rows_hash,
            serving_approved: true,
            proof_written: true,
          },
        );
        const pending = await proofAt(
          "promote-4",
          "home-admission-pending.json",
        );
        assert.deepEqual(pending?.declaration_after, activeRow);
        assert.equal(pending?.status, "pending");
      },
    );

    await step(
      "an active version-one declaration is replaced only under its exact prior binding",
      async () => {
        const priorId = "00000000-0000-4000-8000-000000000011";
        const priorHash = "1".repeat(64);
        const priorProof = "https://fixturestorage.invalid/previous-projection.json";
        await admin.query(
          `insert into ${manifestTable}
           (id, tenant_key, assessment_id, snapshot_id, projection_key, projection_version,
            rebuild_command, source_hash, projection_hash, row_count, quality_state,
            admission_status, proof_uri)
           select $3, tenant_key, assessment_id, snapshot_id, projection_key, 1,
             rebuild_command, source_hash, $4, 3643, quality_state,
             admission_status, $5
           from ${manifestTable} where ${scoped} and projection_version = 2`,
          [...scope, priorId, priorHash, priorProof],
        );
        try {
          await admin.query(
            `update ${declarations} set projection_manifest_id = $3,
               projection_hash = $4, projection_proof_uri = $5
             where ${scoped} and state = 'active'`,
            [...scope, priorId, priorHash, priorProof],
          );
          const old = await only();
          const check = await admit({ run: "check-active-v1", manifests: loadApproved });
          assert.equal(check.code, 0, check.failure);
          assert.deepEqual(await only(), old);
          await admin.query(
            `update ${manifestTable} set row_count = 3642 where id = $1`,
            [priorId],
          );
          await refused(
            "replace-unproved-v1",
            /^A different Home assessment is already active$/,
            { mode: "promote" },
            true,
          );
          await admin.query(
            `update ${manifestTable} set row_count = 3643 where id = $1`,
            [priorId],
          );
          const promoted = await admit({ run: "replace-active-v1", mode: "promote" });
          assert.equal(promoted.code, 0, promoted.failure);
          assert.equal(promoted.report?.outcome, "promoted");
          assert.deepEqual(promoted.report?.declaration_before, old);
          assert.equal((await only()).projection_manifest_id, manifestId);
        } finally {
          await admin.query(`delete from ${manifestTable} where id = $1`, [priorId]);
        }
      },
    );

    assertWorkflowTriggersCover([
      "datasets/tenant-inputs/tenant-input-registry.json",
      `src/lib/home/preview/golden-snapshots/${manifest.tenant_key}.json`,
    ]);
    console.log(JSON.stringify({ status: "passed", steps }));
  } finally {
    await admin.end();
    await rm(pack.dir, { recursive: true, force: true });
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error);
    process.exit(1);
  },
);
