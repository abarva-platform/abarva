import assert from "node:assert/strict";
import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { after, before, test } from "node:test";
import pg from "pg";
import {
  generatePack,
  type GeneratedPack,
  type SourceFile,
} from "../load_synthetic_enterprise_v1";
import {
  runReadbackJob,
  type ReadbackProof,
  type ReadbackRuntime,
} from "../readback_synthetic_enterprise_v2";

/**
 * Runs the readback job against the disposable admission database, after the
 * versioned load test has loaded the assessment. `before_projection` is the
 * state straight after that load; `after_projection` is the state once the
 * Home projection test has written a projection of it.
 */
const phase = process.env.ECL_READBACK_TEST_PHASE ?? "before_projection";
const projected = phase === "after_projection";
const connectionString = process.env.ECL_ADMISSION_TEST_DATABASE_URL ?? "";
const image = `registry.invalid/web@sha256:${"e".repeat(64)}`;

let pack: GeneratedPack;
let admin: pg.Client;

// The URIs the load test records for the source files of a pack.
const blobUri = (generated: GeneratedPack, file: SourceFile) =>
  `https://synthetic.invalid/${generated.manifest.source_set_hash}/${file.source_room_family}`;

type Outcome = {
  code: number;
  proof: ReadbackProof | undefined;
  failure: string;
  reported: string[];
  /** Every statement the run sent to the database, in order. */
  statements: string[];
};

async function readback(
  options: {
    env?: Record<string, string | undefined>;
    generated?: GeneratedPack;
    blob?: (family: string, bytes: Buffer) => Buffer;
  } = {},
): Promise<Outcome> {
  const proofs: ReadbackProof[] = [];
  const failures: string[] = [];
  const reported: string[] = [];
  const statements: string[] = [];
  const runtime: ReadbackRuntime = {
    generate: async () => options.generated ?? pack,
    dispose: async () => undefined,
    connect: async (databaseUrl) => {
      const client = new pg.Client({ connectionString: databaseUrl });
      await client.connect();
      return {
        query: (sql, params) => {
          statements.push(sql.trim().replace(/\s+/g, " "));
          return client.query(sql, params);
        },
        end: () => client.end(),
      };
    },
    storage: (_settings, generated) => {
      const byUri = new Map(
        generated.manifest.files.map((file) => [
          blobUri(generated, file),
          file,
        ]),
      );
      return {
        blobUriFor: (file) => blobUri(generated, file),
        fetchBlob: async (uri) => {
          const file = byUri.get(uri);
          if (!file) throw new Error(`no such blob: ${uri}`);
          const bytes = await readFile(
            path.join(generated.dir, "pack", file.file_path),
          );
          return options.blob
            ? options.blob(file.source_room_family, bytes)
            : bytes;
        },
        writeProof: async (proof) => {
          proofs.push(proof);
          return "https://synthetic.invalid/readback.json";
        },
      };
    },
    report: (line) => reported.push(line),
    fail: (error) =>
      failures.push(error instanceof Error ? error.message : String(error)),
  };
  const code = await runReadbackJob(
    {
      DATABASE_URL: connectionString,
      ECL_SYNTHETIC_RUN_ID: "readback-fixture-1",
      AZURE_STORAGE_ACCOUNT_NAME: "fixturestorage",
      ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID:
        "00000000-0000-0000-0000-000000000000",
      ECL_SYNTHETIC_OPERATOR_IDENTITY: "fixture-operator",
      ECL_SYNTHETIC_BUILD_VERSION: "build-fixture-1",
      ECL_SYNTHETIC_INPUT_SOURCE_VERSION: pack.manifest.source_set_hash,
      ECL_SYNTHETIC_IMAGE_DIGEST: image,
      ABARVA_OPERATOR_IMAGE: image,
      ECL_SYNTHETIC_RELEASE_RECORD:
        "docs/releases/records/2026-01-01-fixture-load.md",
      ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: projected
        ? "present"
        : "absent",
      ...options.env,
    },
    runtime,
  );
  return {
    code,
    proof: proofs[0],
    failure: failures.join("\n"),
    reported,
    statements,
  };
}

/** A failed comparison: non-zero exit, a written proof that says failed. */
function failedProof(outcome: Outcome): ReadbackProof {
  assert.equal(outcome.code, 1);
  assert.equal(outcome.failure, "");
  assert.ok(outcome.proof, "a failed comparison still writes its proof");
  assert.equal(outcome.proof.status, "failed");
  assert.equal(JSON.parse(outcome.reported[0]).status, "failed");
  return outcome.proof;
}

/** Changes committed rows, runs the check, then puts the rows back. */
async function tampered(
  apply: string[],
  undo: string[],
  check: () => Promise<void>,
): Promise<void> {
  const scope = [pack.manifest.tenant_key, pack.manifest.assessment_id];
  for (const sql of apply)
    await admin.query(sql, sql.includes("$1") ? scope : []);
  try {
    await check();
  } finally {
    for (const sql of undo)
      await admin.query(sql, sql.includes("$1") ? scope : []);
  }
}

const scoped = "tenant_key = $1 and assessment_id = $2";
const backup = "public.readback_fixture_backup";

before(async () => {
  const url = new URL(connectionString);
  assert.ok(["127.0.0.1", "localhost"].includes(url.hostname));
  assert.equal(url.pathname, "/ecl_admission_test");
  pack = await generatePack("v2");
  admin = new pg.Client({ connectionString });
  await admin.connect();
  const state = await admin.query<{ objects: string; projections: string }>(
    `select
       (select count(*) from ecl_context.object where ${scoped}) as objects,
       (select count(*) from ecl_projection.projection_manifest where ${scoped}) as projections`,
    [pack.manifest.tenant_key, pack.manifest.assessment_id],
  );
  // Each phase names the database state it was written for; a run in the wrong
  // state would pass or fail for the wrong reason.
  assert.equal(
    Number(state.rows[0].objects),
    pack.normalized.objects.length,
    "the versioned load test must have loaded this assessment first",
  );
  assert.equal(
    Number(state.rows[0].projections),
    projected ? 1 : 0,
    `phase ${phase} does not match the Home projection state of the database`,
  );
});

after(async () => {
  await admin?.end();
  if (pack) await rm(pack.dir, { recursive: true, force: true });
});

test(
  "an untouched load passes, and the proof records the run",
  { skip: projected },
  async () => {
    const outcome = await readback();
    assert.equal(outcome.failure, "");
    assert.deepEqual(outcome.proof?.issues, []);
    assert.equal(outcome.code, 0);
    const proof = outcome.proof!;
    assert.equal(proof.status, "passed");
    assert.deepEqual(
      {
        job_name: proof.job_name,
        run_id: proof.run_id,
        tenant_scope: proof.tenant_scope,
        assessment_id: proof.assessment_id,
        source_set_hash: proof.source_set_hash,
        input_source_version: proof.input_source_version,
        client_attestation_state: proof.client_attestation_state,
        operator_identity: proof.operator_identity,
        build_version: proof.build_version,
        image_digest: proof.image_digest,
        release_record: proof.release_record,
        expected_home_projection: proof.expected_home_projection,
      },
      {
        job_name: "ecl-synthetic-enterprise-v2-readback",
        run_id: "readback-fixture-1",
        tenant_scope: pack.manifest.tenant_key,
        assessment_id: pack.manifest.assessment_id,
        source_set_hash: pack.manifest.source_set_hash,
        input_source_version: pack.manifest.source_set_hash,
        client_attestation_state: "not_client_attested",
        operator_identity: "fixture-operator",
        build_version: "build-fixture-1",
        image_digest: image,
        release_record: "docs/releases/records/2026-01-01-fixture-load.md",
        expected_home_projection: "absent",
      },
    );
    assert.ok(proof.started_at <= proof.finished_at);
    const whole = (rows: number) => ({
      expected_rows: rows,
      read_rows: rows,
      missing_rows: 0,
      unexpected_rows: 0,
      differing_rows: 0,
      differing_fields: {},
    });
    assert.deepEqual(proof.content, {
      source_file: whole(22),
      source_record: whole(17844),
      object: whole(6079),
      relationship: whole(11727),
      source_blobs: { expected: 22, opened: 22, matching: 22 },
    });
    // The keys the projection job reads from this proof.
    assert.equal(proof.actual.applications, 344);
    assert.equal(proof.actual.invalid_source_files, 0);
    assert.equal(proof.actual.home_projection_manifests, 0);
    assert.deepEqual(proof.actual, proof.expected);
    assert.equal(
      JSON.parse(outcome.reported[0]).proof_uri,
      "https://synthetic.invalid/readback.json",
    );
    // The whole run is one read-only snapshot: a count select and one select per
    // loaded table, and nothing else.
    assert.deepEqual(
      outcome.statements.map((sql) => {
        const table =
          /^select [a-z_:, ]+ from (ecl_[a-z_.]+) where tenant_key = \$1 and assessment_id = \$2$/.exec(
            sql,
          )?.[1];
        if (table) return `select ${table}`;
        return sql.startsWith("select (select count(*) from ")
          ? "select counts"
          : sql;
      }),
      [
        "begin transaction isolation level repeatable read read only",
        "select counts",
        "select ecl_source.source_file",
        "select ecl_source.source_record",
        "select ecl_context.object",
        "select ecl_context.relationship",
        "commit",
      ],
    );
  },
);

test(
  "renamed applications with emptied attributes fail the readback",
  { skip: projected },
  async () => {
    await tampered(
      [
        `create table ${backup} as select id, display_name, attributes_json from ecl_context.object where ${scoped} and object_type = 'application'`,
        `update ecl_context.object set display_name = 'renamed', attributes_json = '{}'::jsonb where ${scoped} and object_type = 'application'`,
      ],
      [
        `update ecl_context.object o set display_name = b.display_name, attributes_json = b.attributes_json from ${backup} b where o.id = b.id`,
        `drop table ${backup}`,
      ],
      async () => {
        const proof = failedProof(await readback());
        // Every count still matches: only the content comparison can see this.
        assert.deepEqual(proof.actual, proof.expected);
        assert.equal(proof.content.object.differing_rows, 344);
        assert.deepEqual(proof.content.object.differing_fields, {
          display_name: 344,
          attributes_json: 344,
        });
        assert.match(
          proof.issues.join("\n"),
          /^object\.display_name: 344 rows differ from the pack/m,
        );
        assert.match(
          proof.issues.join("\n"),
          /^object\.attributes_json: 344 rows differ from the pack/m,
        );
      },
    );
  },
);

test(
  "supplier edges pointed at one vendor fail the readback",
  { skip: projected },
  async () => {
    const moved = pack.normalized.relationships.filter(
      (edge) => edge.type === "SUPPLIED_BY" && edge.to_object_id !== "VEN-0001",
    ).length;
    assert.ok(moved > 1000);
    await tampered(
      [
        `create table ${backup} as select id, to_object_id from ecl_context.relationship where ${scoped} and relationship_type = 'SUPPLIED_BY'`,
        `update ecl_context.relationship set to_object_id = (select id from ecl_context.object where ${scoped} and object_key = 'VEN-0001') where ${scoped} and relationship_type = 'SUPPLIED_BY'`,
      ],
      [
        `update ecl_context.relationship r set to_object_id = b.to_object_id from ${backup} b where r.id = b.id`,
        `drop table ${backup}`,
      ],
      async () => {
        const proof = failedProof(await readback());
        assert.deepEqual(proof.actual, proof.expected);
        assert.deepEqual(proof.content.relationship.differing_fields, {
          to_object_id: moved,
        });
      },
    );
  },
);

test(
  "emptied source payloads fail the readback",
  { skip: projected },
  async () => {
    await tampered(
      [
        `create table ${backup} as select id, payload_json from ecl_source.source_record where ${scoped}`,
        `update ecl_source.source_record set payload_json = '{}'::jsonb where ${scoped}`,
      ],
      [
        `update ecl_source.source_record r set payload_json = b.payload_json from ${backup} b where r.id = b.id`,
        `drop table ${backup}`,
      ],
      async () => {
        const proof = failedProof(await readback());
        assert.deepEqual(proof.actual, proof.expected);
        assert.deepEqual(proof.content.source_record.differing_fields, {
          payload_json: 17844,
        });
      },
    );
  },
);

test(
  "a source blob whose bytes do not match, or that cannot be opened, fails the readback",
  { skip: projected },
  async () => {
    const drifted = failedProof(
      await readback({
        blob: (family, bytes) =>
          family === "SP03_CMDB"
            ? Buffer.concat([bytes, Buffer.from("\n")])
            : bytes,
      }),
    );
    // The row that records the hash is untouched; only the bytes differ.
    assert.equal(drifted.content.source_file.differing_rows, 0);
    assert.deepEqual(drifted.content.source_blobs, {
      expected: 22,
      opened: 22,
      matching: 21,
    });
    assert.deepEqual(drifted.issues, ["source blob content drift: SP03_CMDB"]);

    const unopened = failedProof(
      await readback({
        blob: (family, bytes) => {
          if (family === "SP08_Vendor_Contract")
            throw new Error("blob not found");
          return bytes;
        },
      }),
    );
    assert.deepEqual(unopened.content.source_blobs, {
      expected: 22,
      opened: 21,
      matching: 21,
    });
    assert.deepEqual(unopened.issues, [
      "source blob could not be opened: SP08_Vendor_Contract: blob not found",
    ]);
  },
);

test(
  "a source file recorded at another blob path fails the readback",
  { skip: projected },
  async () => {
    await tampered(
      [
        `update ecl_source.source_file set blob_uri = 'https://synthetic.invalid/elsewhere' where ${scoped} and source_owner = 'SP03_CMDB'`,
      ],
      [
        `update ecl_source.source_file set blob_uri = 'https://synthetic.invalid/${pack.manifest.source_set_hash}/SP03_CMDB' where ${scoped} and source_owner = 'SP03_CMDB'`,
      ],
      async () => {
        const proof = failedProof(await readback());
        assert.deepEqual(proof.content.source_file.differing_fields, {
          blob_uri: 1,
        });
      },
    );
  },
);

test(
  "one module retyped as an application fails the readback",
  { skip: projected },
  async () => {
    await tampered(
      [
        `update ecl_context.object set object_type = 'application' where ${scoped} and object_key = 'APP-0025'`,
      ],
      [
        `update ecl_context.object set object_type = 'application_module' where ${scoped} and object_key = 'APP-0025'`,
      ],
      async () => {
        const proof = failedProof(await readback());
        assert.ok(
          proof.issues.includes("applications: expected 344, read 345"),
        );
        assert.ok(
          proof.issues.includes("application_modules: expected 726, read 725"),
        );
        assert.deepEqual(proof.content.object.differing_fields, {
          object_type: 1,
        });
      },
    );
  },
);

test(
  "one changed recorded file hash fails the readback",
  { skip: projected },
  async () => {
    const cmdb = pack.manifest.files.find(
      (file) => file.source_room_family === "SP03_CMDB",
    )!;
    await tampered(
      [
        `update ecl_source.source_file set file_hash = repeat('0', 64) where ${scoped} and source_owner = 'SP03_CMDB'`,
      ],
      [
        `update ecl_source.source_file set file_hash = '${cmdb.sha256}' where ${scoped} and source_owner = 'SP03_CMDB'`,
      ],
      async () => {
        const proof = failedProof(await readback());
        assert.deepEqual(proof.content.source_file.differing_fields, {
          file_hash: 1,
        });
        // The blob itself still matches the pack.
        assert.equal(proof.content.source_blobs.matching, 22);
      },
    );
  },
);

test(
  "an assessment that was never loaded fails the readback",
  { skip: projected },
  async () => {
    const unloaded: GeneratedPack = {
      ...pack,
      manifest: {
        ...pack.manifest,
        assessment_id: "assessment-readback-fixture-not-loaded",
      },
    };
    const proof = failedProof(await readback({ generated: unloaded }));
    assert.ok(proof.issues.includes("objects: expected 6079, read 0"));
    assert.deepEqual(
      [
        proof.content.source_file.missing_rows,
        proof.content.source_record.missing_rows,
        proof.content.object.missing_rows,
        proof.content.relationship.missing_rows,
      ],
      [22, 17844, 6079, 11727],
    );
  },
);

test(
  "each loaded state column and each relationship end is compared",
  { skip: projected },
  async () => {
    const object = `${scoped} and object_key = 'APP-0751'`;
    const edge = `${scoped} and attributes_json->>'native_relationship_id' = 'REL-00001'`;
    for (const [table, where, column, changed] of [
      ["object", object, "display_name", "'renamed'"],
      ["object", object, "lifecycle_state", "'retired'"],
      ["object", object, "basis", "'owner_confirmed'"],
      ["object", object, "value_state", "'estimated'"],
      ["object", object, "review_state", "'confirmed'"],
      ["object", object, "object_key", "'APP-9999'"],
      [
        "object",
        object,
        "source_record_id",
        `(select id from ecl_source.source_record where ${scoped} and native_id = 'APP-0001')`,
      ],
      ["relationship", edge, "relationship_type", "'DEPENDS_ON'"],
      ["relationship", edge, "basis", "'calculated'"],
      ["relationship", edge, "review_state", "'confirmed'"],
      [
        "relationship",
        edge,
        "from_object_id",
        `(select id from ecl_context.object where ${scoped} and object_key = 'APP-0001')`,
      ],
    ] as const) {
      const store =
        table === "object" ? "ecl_context.object" : "ecl_context.relationship";
      await tampered(
        [
          `create table ${backup} as select id, ${column} from ${store} where ${where}`,
          `update ${store} set ${column} = ${changed} where ${where}`,
        ],
        [
          `update ${store} t set ${column} = b.${column} from ${backup} b where t.id = b.id`,
          `drop table ${backup}`,
        ],
        async () => {
          const proof = failedProof(await readback());
          assert.deepEqual(
            proof.content[table].differing_fields,
            { [column]: 1 },
            `${table}.${column}`,
          );
        },
      );
    }
  },
);

test(
  "a persisted row the pack does not contain fails the readback",
  { skip: projected },
  async () => {
    await tampered(
      [
        `insert into ecl_context.object
         (tenant_key, assessment_id, object_key, object_type, display_name,
          lifecycle_state, basis, value_state, review_state)
       values ($1, $2, 'APP-EXTRA', 'vendor', 'Not in the pack',
          'current', 'source_recorded', 'known', 'not_reviewed')`,
      ],
      [
        `delete from ecl_context.object where ${scoped} and object_key = 'APP-EXTRA'`,
      ],
      async () => {
        const proof = failedProof(await readback());
        assert.equal(proof.content.object.unexpected_rows, 1);
        assert.ok(proof.issues.includes("objects: expected 6079, read 6080"));
        assert.match(
          proof.issues.join("\n"),
          /^object: 1 persisted rows are not in the pack \(e\.g\. APP-EXTRA\)$/m,
        );
      },
    );
  },
);

test("the expected Home projection state is stated, never assumed", async () => {
  // In either database state, the stated state must be the one that is there.
  const wrong = failedProof(
    await readback({
      env: {
        ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: projected
          ? "absent"
          : "present",
      },
    }),
  );
  assert.deepEqual(wrong.issues, [
    projected
      ? "home_projection_manifests: expected 0, read 1"
      : "home_projection_manifests: expected 1, read 0",
  ]);
  assert.equal(
    wrong.expected_home_projection,
    projected ? "absent" : "present",
  );

  const right = await readback();
  assert.deepEqual(right.proof?.issues, []);
  assert.equal(right.code, 0);
  assert.equal(right.proof?.status, "passed");
  assert.equal(
    right.proof?.expected_home_projection,
    projected ? "present" : "absent",
  );
  assert.equal(
    right.proof?.actual.home_projection_manifests,
    projected ? 1 : 0,
  );

  for (const [value, refusal] of [
    [
      undefined,
      /^Missing governed readback bindings: ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION$/,
    ],
    [
      "maybe",
      /^Readback must be told whether a Home projection is expected: absent or present$/,
    ],
  ] as const) {
    const refused = await readback({
      env: { ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: value },
    });
    assert.equal(refused.code, 1);
    assert.equal(refused.proof, undefined);
    assert.match(refused.failure, refusal);
  }
});

test(
  "a run whose source version is not the pack's is refused before it reads",
  { skip: projected },
  async () => {
    const refused = await readback({
      env: { ECL_SYNTHETIC_INPUT_SOURCE_VERSION: "0".repeat(64) },
    });
    assert.equal(refused.code, 1);
    assert.equal(refused.proof, undefined);
    assert.equal(refused.failure, "Readback source version is not pinned");
  },
);
