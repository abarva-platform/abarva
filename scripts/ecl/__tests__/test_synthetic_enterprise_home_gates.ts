import assert from "node:assert/strict";
import { rm } from "node:fs/promises";
import { test } from "node:test";
import {
  resolveLoadApproval,
  resolveServingApproval,
} from "../../../src/lib/governance/dataset-manifest";
import {
  generatePack,
  loadBinding,
  readDatasetManifests,
} from "../load_synthetic_enterprise_v1";
import { assertProjectionApproved } from "../project_synthetic_enterprise_home";
import { homeServingDecision } from "../promote_synthetic_enterprise_home";
import {
  OTHER_HASH,
  REPO_ROOT,
  approval,
  fixturePack,
  jobProcessEnv,
  registryManifest,
  runScript,
  servingApproval,
  startThreeWays,
} from "./synthetic_enterprise_gate_fixtures";

const servable = (over: Record<string, unknown> = {}) =>
  registryManifest({ serving_approval: servingApproval(), ...over });

test("a promoting run needs the registry's serving approval; a check run only reports it", () => {
  assert.deepEqual(
    homeServingDecision("promote", [servable()], fixturePack()),
    {
      approved: true,
      approval: servingApproval(),
    },
  );

  // Loaded and load-approved, but nobody approved serving it.
  assert.throws(
    () => homeServingDecision("promote", [registryManifest()], fixturePack()),
    /^Error: Home admission gate failed: manifest carries no serving_approval$/,
  );
  assert.deepEqual(
    homeServingDecision("check", [registryManifest()], fixturePack()),
    { approved: false, reasons: ["manifest carries no serving_approval"] },
  );

  // A serving approval cannot stand in for the load approval it sits on.
  assert.throws(
    () =>
      homeServingDecision(
        "promote",
        [registryManifest({ load_approval: undefined })],
        fixturePack(),
      ),
    /^Error: Home admission gate failed: manifest carries no load_approval$/,
  );
  assert.throws(
    () =>
      homeServingDecision(
        "promote",
        [servable({ load_approval: undefined })],
        fixturePack(),
      ),
    /Home admission gate failed: manifest is invalid: serving_approval requires a load_approval/,
  );

  // Nor for another version, another dataset, or a signer who is not a person.
  assert.throws(
    () => homeServingDecision("promote", [servable()], fixturePack(4)),
    /Home admission gate failed: manifest expects 3 objects, the load has 4/,
  );
  assert.throws(
    () =>
      homeServingDecision(
        "promote",
        [
          servable({
            load_approval: approval({ source_set_hash: OTHER_HASH }),
            serving_approval: servingApproval({ source_set_hash: OTHER_HASH }),
          }),
        ],
        fixturePack(),
      ),
    /Home admission gate failed: load_approval is for a different source-set hash/,
  );
  assert.throws(
    () => homeServingDecision("promote", [], fixturePack()),
    /Home admission gate failed: expected exactly one manifest declaring FIXTURE_ENTERPRISE_V1, found 0/,
  );
  assert.throws(
    () =>
      homeServingDecision(
        "promote",
        [
          servable({
            serving_approval: servingApproval({
              approved_by: "Synthetic lab reviewer under delegation",
            }),
          }),
        ],
        fixturePack(),
      ),
    /Home admission gate failed: manifest is invalid: serving_approval\.approved_by must be a named person/,
  );

  // Any mode other than the non-mutating check is held to the approval.
  assert.throws(
    () => homeServingDecision("", [registryManifest()], fixturePack()),
    /Home admission gate failed/,
  );
});

test("a projection is written only for a version whose load is approved", () => {
  assert.doesNotThrow(() =>
    assertProjectionApproved([registryManifest()], fixturePack()),
  );
  assert.throws(
    () =>
      assertProjectionApproved(
        [registryManifest({ load_approval: undefined })],
        fixturePack(),
      ),
    /^Error: Projection gate failed: manifest carries no load_approval$/,
  );
  assert.throws(
    () =>
      assertProjectionApproved(
        [
          registryManifest({
            load_approval: approval({ source_set_hash: OTHER_HASH }),
          }),
        ],
        fixturePack(),
      ),
    /^Error: Projection gate failed: load_approval is for a different source-set hash$/,
  );
  assert.throws(
    () => assertProjectionApproved([], fixturePack()),
    /Projection gate failed: expected exactly one manifest/,
  );
});

test("each job runs when invoked directly, through a symlinked root too, and never on import", async () => {
  // With no binding in the environment, each job stops at its first precondition.
  for (const [script, precondition] of [
    [
      "scripts/ecl/promote_synthetic_enterprise_home.ts",
      /Home admission requires a pinned, approved private job and projection proof/,
    ],
    [
      "scripts/ecl/project_synthetic_enterprise_home.ts",
      /Projection requires approved synthetic job, pinned image and readback proof bindings/,
    ],
    [
      "scripts/ecl/retire_synthetic_enterprise_home.ts",
      /Home retirement requires a pinned, explicitly approved private job/,
    ],
    [
      "scripts/ecl/readback_synthetic_enterprise_v2.ts",
      /Readback requires database, run ID, storage account and managed identity/,
    ],
  ] as const) {
    const { imported, direct, throughLink } = await startThreeWays(script);
    assert.equal(imported.status, 0, `${script}: ${imported.stderr}`);
    assert.equal(imported.stdout, "imported without running\n", script);
    assert.equal(direct.status, 1, `${script}: ${direct.stderr}`);
    assert.match(direct.stderr, precondition, script);
    assert.equal(throughLink.status, 1, `${script}: ${throughLink.stderr}`);
    assert.match(throughLink.stderr, precondition, script);
  }
});

test("each job consults the registry before it touches a proof, storage or the database", async () => {
  const pack = await generatePack("v2");
  try {
    const manifests = await readDatasetManifests();
    const binding = loadBinding(pack);
    const image = `registry.invalid/web@sha256:${"e".repeat(64)}`;
    // Every binding is present and well formed. The proof URI is on another
    // host, so a run the registry lets through stops at the next check, which
    // needs no network. Whichever state the registry is in, the job has to stop
    // at the gate or straight after it.
    const env = jobProcessEnv({
      DATABASE_URL: "postgresql://fixture.invalid/none",
      AZURE_STORAGE_ACCOUNT_NAME: "fixturestorage",
      ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID:
        "00000000-0000-0000-0000-000000000000",
      ECL_SYNTHETIC_RUN_ID: "run-fixture-1",
      ECL_SYNTHETIC_LAB_APPROVAL: "accepted_lab",
      ECL_SYNTHETIC_IMAGE_DIGEST: image,
      ABARVA_OPERATOR_IMAGE: image,
      ECL_SYNTHETIC_INPUT_SOURCE_VERSION: pack.manifest.source_set_hash,
      ECL_SYNTHETIC_PROMOTION_MODE: "promote",
      ECL_SYNTHETIC_PROJECTION_PROOF_URI:
        "https://another-host.invalid/projection-proof.json",
      ECL_SYNTHETIC_READBACK_PROOF_URI:
        "https://another-host.invalid/readback.json",
    });

    const serving = resolveServingApproval(manifests, {
      ...binding,
      surface: "home",
    });
    const promote = runScript(
      REPO_ROOT,
      ["scripts/ecl/promote_synthetic_enterprise_home.ts"],
      env,
    );
    assert.equal(promote.status, 1, promote.stderr);
    assert.match(
      promote.stderr,
      serving.approved
        ? /Projection proof URI is outside the pinned source set/
        : /Home admission gate failed: /,
    );

    const load = resolveLoadApproval(manifests, binding);
    const project = runScript(
      REPO_ROOT,
      ["scripts/ecl/project_synthetic_enterprise_home.ts"],
      env,
    );
    assert.equal(project.status, 1, project.stderr);
    assert.match(
      project.stderr,
      load.approved
        ? /Readback proof URI is outside the pinned source set/
        : /Projection gate failed: /,
    );
  } finally {
    await rm(pack.dir, { recursive: true, force: true });
  }
});
