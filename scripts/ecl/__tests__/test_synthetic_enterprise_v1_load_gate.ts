import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { resolveLoadApproval } from "../../../src/lib/governance/dataset-manifest";
import {
  generatePack,
  loadBinding,
  loadIntoNewAssessment,
  readDatasetManifests,
  resolveExecutionBinding,
  runStages,
  type GeneratedPack,
} from "../load_synthetic_enterprise_v1";
import { readSourceVersions } from "../synthetic_source_versions";
import {
  ASSESSMENT,
  HASH,
  OTHER_HASH,
  RELEASE_RECORD,
  approval,
  fixturePack,
  registryManifest,
  startThreeWays,
} from "./synthetic_enterprise_gate_fixtures";

function jobEnv(
  over: Record<string, string | undefined> = {},
): Record<string, string | undefined> {
  return {
    DATABASE_URL: "postgresql://fixture.invalid/none",
    ECL_SYNTHETIC_RUN_ID: "run-fixture-1",
    ECL_SYNTHETIC_OPERATOR_IDENTITY: "fixture-operator",
    ECL_SYNTHETIC_BUILD_VERSION: "build-fixture-1",
    ECL_SYNTHETIC_INPUT_SOURCE_VERSION: HASH,
    ECL_SYNTHETIC_IDEMPOTENCY_KEY: `${ASSESSMENT}:${HASH}`,
    ECL_SYNTHETIC_IMAGE_DIGEST: `registry.invalid/web@sha256:${"e".repeat(64)}`,
    ECL_SYNTHETIC_RELEASE_RECORD: RELEASE_RECORD,
    ECL_SYNTHETIC_LAB_APPROVAL: "accepted_lab",
    AZURE_STORAGE_ACCOUNT_NAME: "fixturestorage",
    ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID:
      "00000000-0000-0000-0000-000000000000",
    ...over,
  };
}

test("a fully bound run with a recorded approval resolves to that approval", () => {
  assert.deepEqual(
    resolveExecutionBinding(fixturePack(), jobEnv(), [registryManifest()]),
    { runId: "run-fixture-1", approval: approval() },
  );
});

test("the job's own bindings cannot stand in for a recorded approval", () => {
  // Every binding the job supplies is present and correct, including the lab
  // approval flag. Only the registry's approval is missing.
  assert.throws(
    () =>
      resolveExecutionBinding(fixturePack(), jobEnv(), [
        registryManifest({ load_approval: undefined }),
      ]),
    /^Error: Load approval gate failed: manifest carries no load_approval$/,
  );
});

test("an approval is refused unless it is for this dataset, version and person", () => {
  const refused = (
    manifests: unknown[],
    pack: GeneratedPack = fixturePack(),
  ): string => {
    try {
      resolveExecutionBinding(pack, jobEnv(), manifests);
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error("expected the run to be refused");
  };
  assert.match(
    refused([]),
    /Load approval gate failed: expected exactly one manifest declaring FIXTURE_ENTERPRISE_V1, found 0/,
  );
  assert.match(
    refused([registryManifest({ dataset_id: "ANOTHER_DATASET_V1" })]),
    /found 0/,
  );
  assert.match(
    refused([
      registryManifest({
        load_approval: approval({
          approved_by: "Synthetic lab reviewer under delegation",
        }),
      }),
    ]),
    /manifest is invalid: load_approval\.approved_by must be a named person/,
  );
  assert.match(
    refused([
      registryManifest({
        load_approval: approval({ source_set_hash: OTHER_HASH }),
      }),
    ]),
    /load_approval is for a different source-set hash/,
  );
  assert.match(
    refused([
      registryManifest({
        load_approval: approval({ assessment_id: "assessment-other" }),
      }),
    ]),
    /load_approval is for a different assessment/,
  );
  assert.match(
    refused([registryManifest()], fixturePack(4)),
    /manifest expects 3 objects, the load has 4/,
  );
  assert.match(
    refused([registryManifest({ ingestion_method: "admin_bulk_loader" })]),
    /manifest declares ingestion_method admin_bulk_loader, not operator_aca_job/,
  );
});

test("the run's release record must be the one the approval names", () => {
  assert.throws(
    () =>
      resolveExecutionBinding(
        fixturePack(),
        jobEnv({
          ECL_SYNTHETIC_RELEASE_RECORD:
            "docs/releases/records/2026-01-01-some-other-record.md",
        }),
        [registryManifest()],
      ),
    /release record bound to this run is not the one the load approval names/,
  );
});

test("each job binding is still required and still checked", () => {
  const refused = (over: Record<string, string | undefined>): string => {
    try {
      resolveExecutionBinding(fixturePack(), jobEnv(over), [
        registryManifest(),
      ]);
    } catch (error) {
      return (error as Error).message;
    }
    throw new Error(`expected ${JSON.stringify(over)} to be refused`);
  };
  for (const key of [
    "DATABASE_URL",
    "ECL_SYNTHETIC_RUN_ID",
    "ECL_SYNTHETIC_OPERATOR_IDENTITY",
    "ECL_SYNTHETIC_BUILD_VERSION",
    "ECL_SYNTHETIC_INPUT_SOURCE_VERSION",
    "ECL_SYNTHETIC_IDEMPOTENCY_KEY",
    "ECL_SYNTHETIC_IMAGE_DIGEST",
    "ECL_SYNTHETIC_RELEASE_RECORD",
  ]) {
    assert.equal(
      refused({ [key]: undefined }),
      `Missing governed job bindings: ${key}`,
    );
  }
  const composite =
    "Synthetic review, source version, idempotency, or digest gate failed";
  assert.equal(refused({ ECL_SYNTHETIC_LAB_APPROVAL: undefined }), composite);
  assert.equal(refused({ ECL_SYNTHETIC_LAB_APPROVAL: "accepted" }), composite);
  assert.equal(
    refused({ ECL_SYNTHETIC_INPUT_SOURCE_VERSION: OTHER_HASH }),
    composite,
  );
  assert.equal(
    refused({ ECL_SYNTHETIC_IDEMPOTENCY_KEY: `${ASSESSMENT}:${OTHER_HASH}` }),
    composite,
  );
  assert.equal(
    refused({ ECL_SYNTHETIC_IMAGE_DIGEST: "registry.invalid/web:latest" }),
    composite,
  );
  assert.equal(refused({ ECL_SYNTHETIC_RUN_ID: "../escape" }), "Unsafe run id");
  assert.match(
    refused({
      AZURE_STORAGE_ACCOUNT_NAME: undefined,
      ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID: undefined,
    }),
    /^Blob storage requires/,
  );
  assert.match(
    refused({ ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID: undefined }),
    /^Blob storage requires/,
  );
  assert.equal(
    refused({ AZURE_STORAGE_ACCOUNT_NAME: "Not_A_Valid_Name" }),
    "Invalid Azure storage account name",
  );
  // A connection string is the other accepted storage binding.
  assert.deepEqual(
    resolveExecutionBinding(
      fixturePack(),
      jobEnv({
        AZURE_STORAGE_ACCOUNT_NAME: undefined,
        ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID: undefined,
        AZURE_STORAGE_CONNECTION_STRING: "UseDevelopmentStorage=true",
      }),
      [registryManifest()],
    ).runId,
    "run-fixture-1",
  );
});

test("the insert path refuses an approval for another version before it reads or connects", async () => {
  for (const mismatched of [
    approval({ source_set_hash: OTHER_HASH }),
    approval({ assessment_id: "assessment-other" }),
  ]) {
    await assert.rejects(
      loadIntoNewAssessment(
        "postgresql://fixture.invalid/none",
        fixturePack(),
        new Map(),
        mismatched,
      ),
      /^Error: Load approval does not bind this assessment and source-set hash$/,
    );
  }
});

test("the registry reader returns every manifest and stops on an unreadable one", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "ecl-load-gate-registry-"));
  try {
    await writeFile(path.join(dir, "b.json"), JSON.stringify({ name: "b" }));
    await writeFile(path.join(dir, "a.json"), JSON.stringify({ name: "a" }));
    await writeFile(path.join(dir, "_draft.json"), "{ not json");
    await writeFile(path.join(dir, "README.md"), "not a manifest");
    assert.deepEqual(await readDatasetManifests(dir), [
      { name: "a" },
      { name: "b" },
    ]);
    await writeFile(path.join(dir, "c.json"), "{ not json");
    await assert.rejects(
      readDatasetManifests(dir),
      /^Error: Unreadable dataset manifest: c\.json$/,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("a failed stage is recorded against the stage it reached, and the cause survives", async () => {
  const reports: string[] = [];
  const report = async (stage: string, status: string) => {
    reports.push(`${stage}:${status}`);
  };
  const cause = new Error("the load failed");
  await assert.rejects(
    runStages(report, async (enter) => {
      await enter("validation");
      await enter("canonical_load");
      throw cause;
    }),
    (error) => error === cause,
  );
  assert.deepEqual(reports, [
    "validation:running",
    "canonical_load:running",
    "canonical_load:failed",
  ]);

  reports.length = 0;
  assert.equal(
    await runStages(report, async (enter) => {
      await enter("validation");
      return "done";
    }),
    "done",
  );
  assert.deepEqual(reports, ["validation:running"]);

  // Recording the failure can itself fail; the original error is still the one thrown.
  await assert.rejects(
    runStages(
      async (_stage, status) => {
        if (status === "failed")
          throw new Error("could not record the failure");
      },
      async (enter) => {
        await enter("validation");
        throw cause;
      },
    ),
    (error) => error === cause,
  );

  // A failure before any stage starts is still recorded.
  reports.length = 0;
  await assert.rejects(
    runStages(report, async () => {
      throw cause;
    }),
    (error) => error === cause,
  );
  assert.deepEqual(reports, ["not_started:failed"]);
});

test("the committed registry describes every source version the loader generates", async () => {
  const manifests = await readDatasetManifests();
  // Every version the source-version registry lists, so a newly registered
  // version without a dataset manifest fails here.
  for (const version of readSourceVersions().keys()) {
    const pack = await generatePack(version);
    try {
      const decision = resolveLoadApproval(manifests, loadBinding(pack));
      // Holds whether or not the load has been approved yet: the one manifest
      // declaring this dataset is valid and agrees with the generated pack on
      // tenant, load method and object count. An approval, once recorded, must
      // be a named person's and must bind this exact assessment and hash.
      assert.deepEqual(
        decision.approved ? [] : decision.reasons,
        decision.approved ? [] : ["manifest carries no load_approval"],
        `source version ${version}`,
      );
    } finally {
      await rm(pack.dir, { recursive: true, force: true });
    }
  }
});

test("the loader runs when invoked directly, through a symlinked root too, and never on import", async () => {
  // With no job binding in the environment, an executing run stops at its first gate.
  const refused = /^Missing governed job bindings: DATABASE_URL/;
  const { imported, direct, throughLink } = await startThreeWays(
    "scripts/ecl/load_synthetic_enterprise_v1.ts",
    ["--execute"],
  );
  assert.equal(imported.status, 0, imported.stderr);
  assert.equal(imported.stdout, "imported without running\n");
  assert.equal(direct.status, 1, direct.stderr);
  assert.match(direct.stderr, refused);
  assert.equal(throughLink.status, 1, throughLink.stderr);
  assert.match(throughLink.stderr, refused);
});
