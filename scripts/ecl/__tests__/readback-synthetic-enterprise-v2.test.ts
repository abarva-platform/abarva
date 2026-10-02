import assert from "node:assert/strict";
import { test } from "node:test";
import {
  admissionIssues,
  compareTable,
  exitCodeFor,
  readbackSettings,
  runReadbackJob,
  type ReadbackRuntime,
} from "../readback_synthetic_enterprise_v2";

test("the count comparison rejects missing, drifted and unexpected families", () => {
  assert.deepEqual(
    admissionIssues(
      { applications: 344, modules: 726 },
      {
        applications: 344,
        modules: 726,
      },
    ),
    [],
  );
  assert.deepEqual(
    admissionIssues(
      { applications: 24, modules: 726 },
      {
        applications: 344,
        modules: 726,
      },
    ),
    ["applications: expected 344, read 24"],
  );
  assert.deepEqual(
    admissionIssues(
      { applications: 344, extra: 1 },
      {
        applications: 344,
        modules: 726,
      },
    ),
    [
      "modules: expected 726, read missing",
      "extra: expected undefined, read 1",
    ],
  );
});

const image = `registry.invalid/web@sha256:${"e".repeat(64)}`;
const hash = "c".repeat(64);
const jobEnv = (
  over: Record<string, string | undefined> = {},
): Record<string, string | undefined> => ({
  DATABASE_URL: "postgresql://fixture.invalid/none",
  ECL_SYNTHETIC_RUN_ID: "readback-fixture-1",
  AZURE_STORAGE_ACCOUNT_NAME: "fixturestorage",
  ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID:
    "00000000-0000-0000-0000-000000000000",
  ECL_SYNTHETIC_OPERATOR_IDENTITY: "fixture-operator",
  ECL_SYNTHETIC_BUILD_VERSION: "build-fixture-1",
  ECL_SYNTHETIC_INPUT_SOURCE_VERSION: hash,
  ECL_SYNTHETIC_IMAGE_DIGEST: image,
  ABARVA_OPERATOR_IMAGE: image,
  ECL_SYNTHETIC_RELEASE_RECORD:
    "docs/releases/records/2026-01-01-fixture-load.md",
  ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: "absent",
  ...over,
});

test("a run records who ran which build of which image under which release record", () => {
  assert.deepEqual(readbackSettings(jobEnv()), {
    databaseUrl: "postgresql://fixture.invalid/none",
    account: "fixturestorage",
    identity: "00000000-0000-0000-0000-000000000000",
    inputSourceVersion: hash,
    binding: {
      runId: "readback-fixture-1",
      operatorIdentity: "fixture-operator",
      buildVersion: "build-fixture-1",
      imageDigest: image,
      releaseRecord: "docs/releases/records/2026-01-01-fixture-load.md",
      expectHomeProjection: "absent",
    },
  });
  assert.equal(
    readbackSettings(
      jobEnv({ ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: "present" }),
    ).binding.expectHomeProjection,
    "present",
  );
});

test("each readback binding is required and checked before anything is generated", async () => {
  const refused = (over: Record<string, string | undefined>): string => {
    try {
      readbackSettings(jobEnv(over));
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error(`expected ${JSON.stringify(over)} to be refused`);
  };
  for (const key of [
    "DATABASE_URL",
    "ECL_SYNTHETIC_RUN_ID",
    "AZURE_STORAGE_ACCOUNT_NAME",
    "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID",
  ]) {
    assert.equal(
      refused({ [key]: undefined }),
      "Readback requires database, run ID, storage account and managed identity",
    );
  }
  for (const key of [
    "ECL_SYNTHETIC_OPERATOR_IDENTITY",
    "ECL_SYNTHETIC_BUILD_VERSION",
    "ECL_SYNTHETIC_INPUT_SOURCE_VERSION",
    "ECL_SYNTHETIC_IMAGE_DIGEST",
    "ECL_SYNTHETIC_RELEASE_RECORD",
    "ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION",
  ]) {
    assert.equal(
      refused({ [key]: undefined }),
      `Missing governed readback bindings: ${key}`,
    );
  }
  assert.equal(refused({ ECL_SYNTHETIC_RUN_ID: "../escape" }), "Unsafe run ID");
  assert.equal(
    refused({ AZURE_STORAGE_ACCOUNT_NAME: "Not_A_Valid_Name" }),
    "Invalid Azure storage account name",
  );
  const pinned =
    "Readback image digest must be pinned and be the image the job runs";
  const mutable = "registry.invalid/web:latest";
  assert.equal(
    refused({
      ECL_SYNTHETIC_IMAGE_DIGEST: mutable,
      ABARVA_OPERATOR_IMAGE: mutable,
    }),
    pinned,
  );
  assert.equal(refused({ ABARVA_OPERATOR_IMAGE: undefined }), pinned);
  assert.equal(
    refused({
      ABARVA_OPERATOR_IMAGE: `registry.invalid/web@sha256:${"f".repeat(64)}`,
    }),
    pinned,
  );
  assert.equal(
    refused({ ECL_SYNTHETIC_RELEASE_RECORD: "a release record" }),
    "Readback release record must be a docs/releases/records/*.md path",
  );
  assert.equal(
    refused({ ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: "0" }),
    "Readback must be told whether a Home projection is expected: absent or present",
  );

  // A refused run generates nothing, opens nothing, and exits non-zero.
  const touched: string[] = [];
  const failures: string[] = [];
  const untouched = (name: string) => () => {
    touched.push(name);
    throw new Error(`${name} must not be reached`);
  };
  const runtime: ReadbackRuntime = {
    generate: untouched("generate"),
    dispose: untouched("dispose"),
    connect: untouched("connect"),
    storage: untouched("storage"),
    report: untouched("report"),
    fail: (error) => failures.push((error as Error).message),
  };
  assert.equal(
    await runReadbackJob(
      jobEnv({ ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION: undefined }),
      runtime,
    ),
    1,
  );
  assert.deepEqual(touched, []);
  assert.deepEqual(failures, [
    "Missing governed readback bindings: ECL_SYNTHETIC_READBACK_EXPECT_HOME_PROJECTION",
  ]);
});

test("only a passed proof exits zero", () => {
  assert.equal(exitCodeFor({ status: "passed" }), 0);
  assert.equal(exitCodeFor({ status: "failed" }), 1);
});

test("rows are compared by id and then column by column", () => {
  const row = (id: string, over: Record<string, unknown> = {}) => ({
    id,
    object_key: `KEY-${id}`,
    object_type: "application",
    display_name: `Name ${id}`,
    lifecycle_state: "current",
    source_record_id: `record-${id}`,
    basis: "source_recorded",
    value_state: "known",
    review_state: "not_reviewed",
    attributes_json: { owner: "a", nested: { b: 1, a: [1, 2] } },
    ...over,
  });
  const whole = (rows: number) => ({
    expected_rows: rows,
    read_rows: rows,
    missing_rows: 0,
    unexpected_rows: 0,
    differing_rows: 0,
    differing_fields: {},
  });

  // The same content, with JSON keys in another order and rows in another order.
  assert.deepEqual(
    compareTable(
      "object",
      [row("1"), row("2")],
      [
        row("2", {
          attributes_json: { nested: { a: [1, 2], b: 1 }, owner: "a" },
        }),
        row("1"),
      ],
    ),
    { comparison: whole(2), issues: [] },
  );

  const drifted = compareTable(
    "object",
    [row("1"), row("2"), row("3")],
    [
      row("1", { review_state: "confirmed", basis: "owner_confirmed" }),
      row("2", {
        attributes_json: { owner: "a", nested: { b: 1, a: [2, 1] } },
      }),
      row("9"),
    ],
  );
  assert.deepEqual(drifted.comparison, {
    expected_rows: 3,
    read_rows: 3,
    missing_rows: 1,
    unexpected_rows: 1,
    differing_rows: 2,
    differing_fields: { basis: 1, review_state: 1, attributes_json: 1 },
  });
  assert.deepEqual(drifted.issues, [
    "object: 1 of 3 expected rows are not persisted (e.g. KEY-3)",
    "object: 1 persisted rows are not in the pack (e.g. KEY-9)",
    'object.basis: 1 rows differ from the pack (e.g. KEY-1: expected "source_recorded", read "owner_confirmed")',
    'object.review_state: 1 rows differ from the pack (e.g. KEY-1: expected "not_reviewed", read "confirmed")',
    'object.attributes_json: 1 rows differ from the pack (e.g. KEY-2: expected {"nested":{"a":[1,2],"b":1},"owner":"a"}, read {"nested":{"a":[2,1],"b":1},"owner":"a"})',
  ]);

  // A column the loader writes that the persisted row lacks is a difference.
  assert.deepEqual(
    compareTable("object", [row("1")], [{ ...row("1"), value_state: null }])
      .comparison.differing_fields,
    { value_state: 1 },
  );
});

test("the load approval a source file carries is not part of the pack comparison; the rest of its metadata is", () => {
  const file = (metadata: Record<string, unknown>) => ({
    id: "file-1",
    source_type: "synthetic_source_room",
    origin: "synthetic_generator",
    source_owner: "SP03_CMDB",
    file_name: "applications.csv",
    blob_uri: "https://synthetic.invalid/file-1",
    file_hash: hash,
    source_date: "2026-01-01",
    access_class: "internal",
    quality_state: "accepted",
    metadata_json: metadata,
  });
  const metadata = {
    dataset_id: "FIXTURE_ENTERPRISE_V1",
    source_set_hash: hash,
  };
  assert.deepEqual(
    compareTable(
      "source_file",
      [file(metadata)],
      [file({ ...metadata, load_approval: { approved_by: "Jordan Rivera" } })],
    ).issues,
    [],
  );
  assert.deepEqual(
    compareTable(
      "source_file",
      [file(metadata)],
      [file({ ...metadata, source_set_hash: "d".repeat(64) })],
    ).comparison.differing_fields,
    { metadata_json: 1 },
  );
  // Only a source file's metadata has that exemption.
  assert.deepEqual(
    compareTable(
      "object",
      [{ id: "1", attributes_json: {} }],
      [{ id: "1", attributes_json: { load_approval: {} } }],
    ).comparison.differing_fields,
    { attributes_json: 1 },
  );
});
