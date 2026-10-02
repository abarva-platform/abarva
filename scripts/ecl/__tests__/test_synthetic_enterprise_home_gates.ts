import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import ts from "typescript";
import {
  resolveLoadApproval,
  resolveServingApproval,
} from "../../../src/lib/governance/dataset-manifest";
import {
  generatePack,
  loadBinding,
  readDatasetManifests,
} from "../load_synthetic_enterprise_v1";
import {
  assertProjectionApproved,
  assertReadbackProof,
  projectionSettings,
  type ReadbackProof,
} from "../project_synthetic_enterprise_home";
import {
  HOME_SERVING_VIEWS,
  assertReadbackBinding,
  expectedReadbackCounts,
  homeServingDecision,
  promotionMode,
  promotionSettings,
  runPromotionJob,
} from "../promote_synthetic_enterprise_home";
import { retirementSettings } from "../retire_synthetic_enterprise_home";
import {
  CommitNotConfirmed,
  assertRegisteredTenant,
  boundedStore,
  commitTransaction,
  jobLimits,
  jobRecord,
  jobRun,
  pinnedRunBlobPath,
  registeredTenantKeys,
  sqlTimeout,
  withDeadline,
} from "../synthetic_enterprise_home_job";
import {
  ASSESSMENT,
  GIT_SHA,
  HASH,
  IMAGE,
  JOB_RULE_FIELDS,
  OTHER_HASH,
  RELEASE_RECORD,
  REPO_ROOT,
  STORE_ACCOUNT,
  TENANT,
  approval,
  assertWorkflowTriggersCover,
  fileProofStore,
  fixturePack,
  homeJobEnv,
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

test("a projection is authorised only by a passed, content-compared readback taken before any projection", () => {
  const proof = (over: Partial<ReadbackProof> = {}): ReadbackProof => ({
    status: "passed",
    tenant_scope: TENANT,
    assessment_id: ASSESSMENT,
    source_set_hash: HASH,
    client_attestation_state: "not_client_attested",
    expected_home_projection: "absent",
    actual: {
      applications: 3,
      invalid_source_files: 0,
      home_projection_manifests: 0,
    },
    content: { object: { differing_rows: 0 } },
    ...over,
  });
  assert.doesNotThrow(() => assertReadbackProof(proof(), fixturePack()));
  for (const refusedProof of [
    proof({ status: "failed" }),
    proof({ tenant_scope: "another-tenant" }),
    proof({ assessment_id: "assessment-other" }),
    proof({ source_set_hash: OTHER_HASH }),
    proof({ client_attestation_state: "client_attested" }),
    // Taken after a projection already existed, or without saying which.
    proof({ expected_home_projection: "present" }),
    proof({ expected_home_projection: undefined }),
    // A proof that only counted rows carries no content comparison.
    proof({ content: undefined }),
    proof({ content: null as unknown as undefined }),
    proof({ actual: { ...proof().actual, applications: 2 } }),
    proof({ actual: { ...proof().actual, invalid_source_files: 1 } }),
    proof({ actual: { ...proof().actual, home_projection_manifests: 1 } }),
  ]) {
    assert.throws(
      () => assertReadbackProof(refusedProof, fixturePack()),
      /^Error: Admission readback proof did not authorize this projection$/,
      JSON.stringify(refusedProof),
    );
  }
  // The application count is the pack's own, not a constant.
  assert.throws(() => assertReadbackProof(proof(), fixturePack(4)));
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
    // Every binding is present and well formed. The proof URI is on another
    // host, so a run the registry lets through stops at the next check, which
    // needs no network. Whichever state the registry is in, the job has to stop
    // at the gate or straight after it.
    const env = jobProcessEnv({
      ...(homeJobEnv(pack) as Record<string, string>),
      DATABASE_URL: "postgresql://fixture.invalid/none",
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

test("a run that is not told its mode is a check; a mode it does not know is refused", () => {
  assert.equal(promotionMode({}), "check");
  assert.equal(
    promotionMode({ ECL_SYNTHETIC_PROMOTION_MODE: "check" }),
    "check",
  );
  assert.equal(
    promotionMode({ ECL_SYNTHETIC_PROMOTION_MODE: "promote" }),
    "promote",
  );
  for (const stated of ["", "Promote", "promote ", "dry-run", "true", "1"]) {
    assert.throws(
      () => promotionMode({ ECL_SYNTHETIC_PROMOTION_MODE: stated }),
      /^Error: Home admission mode must be check or promote; ".*" is refused$/,
      JSON.stringify(stated),
    );
  }
  // The settings of a run carry the mode, and name the job by it.
  const env = {
    ...homeJobEnv(fixturePack()),
    DATABASE_URL: "postgresql://fixture.invalid/none",
    ECL_SYNTHETIC_PROJECTION_PROOF_URI: "https://fixture.invalid/proof.json",
  };
  assert.deepEqual(
    [promotionSettings(env).mode, promotionSettings(env).run.jobName],
    ["check", "ecl-synthetic-enterprise-v2-check-home"],
  );
  const promoting = promotionSettings({
    ...env,
    ECL_SYNTHETIC_PROMOTION_MODE: "promote",
  });
  assert.deepEqual(
    [promoting.mode, promoting.run.jobName],
    ["promote", "ecl-synthetic-enterprise-v2-promote-home"],
  );
});

test("every Home job is refused for a binding it lacks, before anything is generated", () => {
  const base = {
    ...homeJobEnv(fixturePack()),
    DATABASE_URL: "postgresql://fixture.invalid/none",
  };
  const jobs = {
    promote: {
      settings: promotionSettings,
      env: {
        ...base,
        ECL_SYNTHETIC_PROJECTION_PROOF_URI:
          "https://fixture.invalid/proof.json",
      },
      first:
        /^Error: Home admission requires a pinned, approved private job and projection proof$/,
      required: [
        "DATABASE_URL",
        "AZURE_STORAGE_ACCOUNT_NAME",
        "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID",
        "ECL_SYNTHETIC_RUN_ID",
        "ECL_SYNTHETIC_PROJECTION_PROOF_URI",
        "ECL_SYNTHETIC_LAB_APPROVAL",
        "ECL_SYNTHETIC_IMAGE_DIGEST",
      ],
    },
    project: {
      settings: projectionSettings,
      env: {
        ...base,
        ECL_SYNTHETIC_READBACK_PROOF_URI:
          "https://fixture.invalid/readback.json",
      },
      first:
        /^Error: Projection requires approved synthetic job, pinned image and readback proof bindings$/,
      required: [
        "DATABASE_URL",
        "AZURE_STORAGE_ACCOUNT_NAME",
        "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID",
        "ECL_SYNTHETIC_RUN_ID",
        "ECL_SYNTHETIC_READBACK_PROOF_URI",
        "ECL_SYNTHETIC_LAB_APPROVAL",
        "ECL_SYNTHETIC_IMAGE_DIGEST",
      ],
    },
    retire: {
      settings: retirementSettings,
      env: {
        ...base,
        ECL_SYNTHETIC_ROLLBACK_APPROVAL: "retire_active_home",
        ECL_SYNTHETIC_RETIRE_TENANT: TENANT,
        ECL_SYNTHETIC_RETIRE_ASSESSMENT: ASSESSMENT,
        ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: HASH,
        // A retirement regenerates nothing and reads no registry.
        ECL_SYNTHETIC_LAB_APPROVAL: undefined,
        ECL_SYNTHETIC_INPUT_SOURCE_VERSION: undefined,
        ECL_SYNTHETIC_IDEMPOTENCY_KEY: undefined,
      },
      first:
        /^Error: Home retirement requires a pinned, explicitly approved private job$/,
      required: [
        "DATABASE_URL",
        "AZURE_STORAGE_ACCOUNT_NAME",
        "ECL_SYNTHETIC_STORAGE_IDENTITY_CLIENT_ID",
        "ECL_SYNTHETIC_RUN_ID",
        "ECL_SYNTHETIC_IMAGE_DIGEST",
        "ECL_SYNTHETIC_ROLLBACK_APPROVAL",
      ],
    },
  } as const;
  for (const [name, job] of Object.entries(jobs)) {
    const settings = job.settings as (
      env: Record<string, string | undefined>,
    ) => { run: { runId: string; gitSha: string; gitShaSource: string } };
    assert.equal(settings(job.env).run.runId, "run-fixture-1", name);
    for (const key of job.required) {
      assert.throws(
        () => settings({ ...job.env, [key]: undefined }),
        job.first,
        `${name} without ${key}`,
      );
    }
    // What a run records about itself is required of every job alike.
    const refused = (
      over: Record<string, string | undefined>,
      message: RegExp,
    ) =>
      assert.throws(
        () => settings({ ...job.env, ...over }),
        message,
        `${name} with ${JSON.stringify(over)}`,
      );
    refused({ ECL_SYNTHETIC_RUN_ID: "../run" }, /^Error: Unsafe run ID$/);
    for (const key of [
      "ECL_SYNTHETIC_OPERATOR_IDENTITY",
      "ECL_SYNTHETIC_BUILD_VERSION",
      "ECL_SYNTHETIC_RELEASE_RECORD",
    ]) {
      refused(
        { [key]: undefined },
        new RegExp(`^Error: Missing governed job bindings: ${key}$`),
      );
    }
    // The image gate compares against the image the job actually runs.
    const pinned =
      /^Error: Job image digest must be pinned and be the image the job runs$/;
    refused({ ABARVA_OPERATOR_IMAGE: undefined }, pinned);
    refused(
      {
        ABARVA_OPERATOR_IMAGE: `registry.invalid/web@sha256:${"0".repeat(64)}`,
      },
      pinned,
    );
    const mutable = "registry.invalid/web:main";
    refused(
      { ECL_SYNTHETIC_IMAGE_DIGEST: mutable, ABARVA_OPERATOR_IMAGE: mutable },
      pinned,
    );
    const commit =
      /^Error: Job run must record the full git commit it is run from$/;
    refused({ ABARVA_OPERATOR_BRANCH_COMMIT: undefined }, commit);
    refused({ ABARVA_OPERATOR_BRANCH_COMMIT: GIT_SHA.slice(0, 12) }, commit);
    refused({ ECL_SYNTHETIC_GIT_SHA: "main" }, commit);
    const stated = settings({
      ...job.env,
      ECL_SYNTHETIC_GIT_SHA: "a".repeat(40),
    }).run;
    assert.deepEqual(
      [stated.gitSha, stated.gitShaSource],
      ["a".repeat(40), "ECL_SYNTHETIC_GIT_SHA"],
    );
    assert.deepEqual(
      [settings(job.env).run.gitSha, settings(job.env).run.gitShaSource],
      [GIT_SHA, "ABARVA_OPERATOR_BRANCH_COMMIT"],
    );
    refused(
      { ECL_SYNTHETIC_RELEASE_RECORD: "docs/releases/../../secrets.md" },
      /^Error: Job release record must be a docs\/releases\/records\/\*\.md path$/,
    );
    refused(
      { ECL_SYNTHETIC_RETRY_COUNT: "-1" },
      /^Error: Job retry count must be a whole number$/,
    );
    for (const key of [
      "ECL_SYNTHETIC_STATEMENT_TIMEOUT_MS",
      "ECL_SYNTHETIC_LOCK_TIMEOUT_MS",
      "ECL_SYNTHETIC_PROOF_STORE_TIMEOUT_MS",
    ]) {
      for (const value of ["0", "-5", "1.5", "soon", "36000000"]) {
        refused(
          { [key]: value },
          new RegExp(`^Error: ${key} must be a whole number of milliseconds$`),
        );
      }
    }
  }
  // A job never runs without its limits: unset, they are the defaults.
  assert.deepEqual(jobLimits({}), {
    statementTimeoutMs: 60_000,
    lockTimeoutMs: 15_000,
    proofStoreTimeoutMs: 30_000,
  });
  assert.deepEqual(
    jobLimits({
      ECL_SYNTHETIC_STATEMENT_TIMEOUT_MS: "250",
      ECL_SYNTHETIC_LOCK_TIMEOUT_MS: "100",
      ECL_SYNTHETIC_PROOF_STORE_TIMEOUT_MS: "50",
    }),
    { statementTimeoutMs: 250, lockTimeoutMs: 100, proofStoreTimeoutMs: 50 },
  );
  // A retirement names its declaration in full or is refused.
  const named =
    /^Error: Home retirement must name the declaration it retires: tenant, assessment and projection hash$/;
  for (const over of [
    { ECL_SYNTHETIC_RETIRE_TENANT: undefined },
    { ECL_SYNTHETIC_RETIRE_TENANT: "../other" },
    { ECL_SYNTHETIC_RETIRE_ASSESSMENT: undefined },
    { ECL_SYNTHETIC_RETIRE_ASSESSMENT: "a/b" },
    { ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: undefined },
    { ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: HASH.slice(1) },
    { ECL_SYNTHETIC_RETIRE_PROJECTION_HASH: HASH.toUpperCase() },
  ]) {
    assert.throws(
      () => retirementSettings({ ...jobs.retire.env, ...over }),
      named,
      JSON.stringify(over),
    );
  }
  assert.deepEqual(retirementSettings(jobs.retire.env).target, {
    tenantKey: TENANT,
    assessmentId: ASSESSMENT,
    projectionHash: HASH,
  });
});

test("every proof names the run that wrote it, as the data-build job rule requires", () => {
  const run = jobRun(homeJobEnv(fixturePack()), "fixture-job");
  const proofUri = "https://fixture.invalid/proof.json";
  const record = jobRecord(run, {
    tenantScope: TENANT,
    inputSourceVersion: HASH,
    idempotencyKey: `${ASSESSMENT}:${HASH}`,
    status: "passed",
    proofUri,
    limits: jobLimits({}),
  });
  for (const field of JOB_RULE_FIELDS) {
    assert.ok(typeof record[field] === "string" && record[field] !== "", field);
  }
  assert.deepEqual(
    Object.fromEntries(
      Object.entries(record).filter(
        ([key]) => key !== "started_at" && key !== "finished_at",
      ),
    ),
    {
      job_name: "fixture-job",
      run_id: "run-fixture-1",
      tenant_scope: TENANT,
      build_version: "build-fixture-1",
      input_source_version: HASH,
      idempotency_key: `${ASSESSMENT}:${HASH}`,
      operator_identity: "fixture-operator",
      git_sha: GIT_SHA,
      git_sha_source: "ABARVA_OPERATOR_BRANCH_COMMIT",
      image_digest: IMAGE,
      retry_count: 0,
      statement_timeout_ms: 60_000,
      lock_timeout_ms: 15_000,
      status: "passed",
      blob_proof_bundle: proofUri,
      validation_output: `${proofUri}#/validation`,
      quality_gate_output: `${proofUri}#/quality_gate`,
      release_record: RELEASE_RECORD,
    },
  );
});

test("a proof address is accepted only as a parsed address under the pinned source set", () => {
  const prefix = `${TENANT}/${ASSESSMENT}/${HASH}`;
  const host = `https://${STORE_ACCOUNT}.blob.core.windows.net`;
  const good = `${host}/ecl-synthetic-intake/${prefix}/runs/run-1/readback.json`;
  const pinned = (uri: unknown) =>
    pinnedRunBlobPath(uri, {
      account: STORE_ACCOUNT,
      prefix,
      fileName: "readback.json",
    });
  assert.equal(pinned(good), `${prefix}/runs/run-1/readback.json`);
  for (const [why, uri] of Object.entries({
    "another host": good.replace(STORE_ACCOUNT, "another"),
    "a host that only starts with the account's": good.replace(
      ".windows.net/",
      ".windows.net.invalid/",
    ),
    "the account's host as a path on another": `https://another.invalid/${STORE_ACCOUNT}.blob.core.windows.net/ecl-synthetic-intake/${prefix}/runs/run-1/readback.json`,
    "a port": good.replace(".net/", ".net:8443/"),
    "plain http": good.replace("https://", "http://"),
    credentials: good.replace("https://", "https://user:secret@"),
    "another container": good.replace(
      "ecl-synthetic-intake",
      "another-container",
    ),
    "the pinned prefix further down the path": `${host}/ecl-synthetic-intake/elsewhere/ecl-synthetic-intake/${prefix}/runs/run-1/readback.json`,
    "the pinned prefix in another container": `${host}/another/ecl-synthetic-intake/${prefix}/runs/run-1/readback.json`,
    "another tenant": good.replace(TENANT, "another-tenant"),
    "another assessment": good.replace(ASSESSMENT, "assessment-other"),
    "another source set": good.replace(HASH, OTHER_HASH),
    "no run": `${host}/ecl-synthetic-intake/${prefix}/runs/readback.json`,
    "a path below the run": `${host}/ecl-synthetic-intake/${prefix}/runs/run-1/extra/readback.json`,
    "not under runs": `${host}/ecl-synthetic-intake/${prefix}/sources/run-1/readback.json`,
    "a path below the proof": `${good}/readback.json`,
    "another file": good.replace("readback.json", "projection-proof.json"),
    "a longer file name": `${good}.bak`,
    "an encoded path separator": good.replace(
      "runs/run-1",
      "runs/run-1%2Fextra",
    ),
    "a run id that climbs": good.replace("runs/run-1", "runs/.."),
    "a query": `${good}?sig=fixture`,
    "an empty query": `${good}?`,
    "a fragment": `${good}#/actual`,
    "an empty fragment": `${good}#`,
    "a path that is rewritten when parsed": good.replace(
      "/runs/",
      "/sources/../runs/",
    ),
    "a host in another case": good.replace(
      STORE_ACCOUNT,
      STORE_ACCOUNT.toUpperCase(),
    ),
    "the default port spelled out": good.replace(".net/", ".net:443/"),
    "a broken escape": good.replace("run-1", "run-%E0%A4%A"),
    "not an address": "readback.json",
    nothing: "",
    "not text": { href: good },
    undefined: undefined,
  })) {
    assert.equal(pinned(uri), null, why);
  }
  // The account and the file name are the caller's.
  assert.equal(
    pinnedRunBlobPath(good, {
      account: "another",
      prefix,
      fileName: "readback.json",
    }),
    null,
  );
  assert.equal(
    pinnedRunBlobPath(good, {
      account: STORE_ACCOUNT,
      prefix,
      fileName: "projection-proof.json",
    }),
    null,
  );
});

test("the readback a projection proof names is held to the pack, not to its address", () => {
  const pack = fixturePack();
  assert.deepEqual(expectedReadbackCounts(pack), {
    source_files: 0,
    objects: 3,
    relationships: 0,
    applications: 3,
    application_modules: 0,
    missing_object_lineage: 0,
    missing_edge_lineage: 0,
    invalid_source_files: 0,
    home_projection_manifests: 0,
  });
  const readback = (over: Record<string, unknown> = {}) => ({
    status: "passed",
    tenant_scope: TENANT,
    assessment_id: ASSESSMENT,
    source_set_hash: HASH,
    actual: { ...expectedReadbackCounts(pack), source_records: 12 },
    ...over,
  });
  assert.deepEqual(
    assertReadbackBinding(readback(), pack),
    expectedReadbackCounts(pack),
  );
  const refused: Record<string, unknown>[] = [
    readback({ status: "failed" }),
    readback({ tenant_scope: "another-tenant" }),
    readback({ assessment_id: "assessment-other" }),
    readback({ source_set_hash: OTHER_HASH }),
    readback({ actual: undefined }),
    readback({ actual: null }),
    readback({ actual: "counted" }),
    // Taken once a Home projection already existed.
    readback({
      actual: { ...readback().actual, home_projection_manifests: 1 },
    }),
  ];
  // Each count is held to the pack, one by one.
  for (const key of Object.keys(expectedReadbackCounts(pack))) {
    const actual = readback().actual as Record<string, number>;
    refused.push(readback({ actual: { ...actual, [key]: actual[key] + 1 } }));
    refused.push(
      readback({
        actual: Object.fromEntries(
          Object.entries(actual).filter(([name]) => name !== key),
        ),
      }),
    );
  }
  for (const refusedReadback of refused) {
    assert.throws(
      () => assertReadbackBinding(refusedReadback, pack),
      /^Error: Projection proof is not bound to the independent readback$/,
      JSON.stringify(refusedReadback),
    );
  }
  // The counts are the pack's own.
  assert.throws(() => assertReadbackBinding(readback(), fixturePack(4)));
});

test("a tenant is the one the tenant input registry declares, by its declared key", async () => {
  const registered = await registeredTenantKeys();
  assert.ok(registered.has(TENANT));
  assert.doesNotThrow(() => assertRegisteredTenant(TENANT, registered));
  assert.throws(
    () => assertRegisteredTenant("another-tenant", registered),
    /^Error: Tenant another-tenant is not an active tenant in the tenant input registry$/,
  );
  const scratch = await mkdtemp(path.join(tmpdir(), "ecl-tenant-registry-"));
  try {
    const registry = async (content: unknown) => {
      const file = path.join(scratch, "registry.json");
      await writeFile(file, JSON.stringify(content));
      return registeredTenantKeys(file);
    };
    // Only the declared key counts: not a name, a folder or a retired entry.
    assert.deepEqual(
      [
        ...(await registry({
          activeTenants: [
            {
              tenantKey: "declared-tenant",
              displayName: "named-tenant",
              canonicalInputRoot: "datasets/tenant-inputs/active/folder-tenant",
            },
            { displayName: "keyless-tenant" },
            { tenantKey: "" },
            { tenantKey: 7 },
          ],
          retiredTenants: [{ tenantKey: "retired-tenant" }],
        })),
      ],
      ["declared-tenant"],
    );
    await assert.rejects(
      registry({ retiredTenants: [] }),
      /^Error: Tenant input registry declares no active tenants$/,
    );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }

  // The promotion job asks before it reads the registry's approvals, a proof,
  // storage or the database.
  const pack = fixturePack();
  const touched: string[] = [];
  const failures: string[] = [];
  const code = await runPromotionJob(
    {
      ...homeJobEnv(pack),
      DATABASE_URL: "postgresql://fixture.invalid/none",
      ECL_SYNTHETIC_PROMOTION_MODE: "promote",
      ECL_SYNTHETIC_PROJECTION_PROOF_URI: "https://fixture.invalid/proof.json",
    },
    {
      generate: async () => pack,
      dispose: async () => undefined,
      registeredTenants: async () => new Set(["another-tenant"]),
      manifests: async () => {
        touched.push("manifests");
        return [];
      },
      store: async () => {
        touched.push("store");
        throw new Error("no store");
      },
      connect: async () => {
        touched.push("database");
        throw new Error("no database");
      },
      buildServedHome: async () => {
        touched.push("builder");
        throw new Error("no builder");
      },
      report: (line) => touched.push(line),
      fail: (error) =>
        failures.push(error instanceof Error ? error.message : String(error)),
    },
  );
  assert.equal(code, 1);
  assert.deepEqual(failures, [
    `Tenant ${TENANT} is not an active tenant in the tenant input registry`,
  ]);
  assert.deepEqual(touched, []);
});

test("a store that does not answer is not waited on past its limit", async () => {
  assert.equal(
    await withDeadline(Promise.resolve("done"), 50, "Fixture"),
    "done",
  );
  await assert.rejects(
    withDeadline(Promise.reject(new Error("refused")), 50, "Fixture"),
    /^Error: refused$/,
  );
  const started = Date.now();
  await assert.rejects(
    withDeadline(new Promise(() => undefined), 50, "Fixture wait"),
    /^Error: Fixture wait did not finish within 50ms$/,
  );
  assert.ok(Date.now() - started < 2_000);

  const scratch = await mkdtemp(path.join(tmpdir(), "ecl-proof-store-"));
  try {
    const silent = boundedStore(
      {
        ...fileProofStore(scratch),
        read: () => new Promise<Buffer>(() => undefined),
        writeOnce: () =>
          new Promise<{ uri: string; created: boolean }>(() => undefined),
      },
      jobLimits({ ECL_SYNTHETIC_PROOF_STORE_TIMEOUT_MS: "50" }),
    );
    await assert.rejects(
      silent.read("https://fixture.invalid/proof.json"),
      /^Error: Proof read did not finish within 50ms$/,
    );
    await assert.rejects(
      silent.writeOnce("run/proof.json", Buffer.from("{}")),
      /^Error: Proof write did not finish within 50ms$/,
    );
    // A store that answers is passed through, and never overwrites.
    const store = boundedStore(fileProofStore(scratch), jobLimits({}));
    const first = await store.writeOnce(
      "run/proof.json",
      Buffer.from('{"n":1}'),
    );
    const second = await store.writeOnce(
      "run/proof.json",
      Buffer.from('{"n":2}'),
    );
    assert.deepEqual([first.created, second.created], [true, false]);
    assert.equal(first.uri, store.uriFor("run/proof.json"));
    assert.equal((await store.read(first.uri)).toString("utf8"), '{"n":1}');
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
});

test("a commit the server refuses was rolled back; one it never answered is not known", async () => {
  const database = (answer: () => Promise<{ rows: never[] }>) => ({
    query: (async () => answer()) as Parameters<
      typeof commitTransaction
    >[0]["query"],
  });
  await assert.doesNotReject(
    commitTransaction(
      database(async () => ({ rows: [] })),
      "Fixture",
      "nothing changed",
    ),
  );
  const refusedByServer = Object.assign(
    new Error("could not serialize access"),
    {
      code: "40001",
    },
  );
  await assert.rejects(
    commitTransaction(
      database(async () => {
        throw refusedByServer;
      }),
      "Fixture",
      "nothing changed",
    ),
    (error: Error) => {
      assert.equal(
        error.message,
        "Fixture could not commit and was rolled back; nothing changed: could not serialize access",
      );
      assert.ok(!(error instanceof CommitNotConfirmed));
      assert.equal(error.cause, refusedByServer);
      return true;
    },
  );
  await assert.rejects(
    commitTransaction(
      database(async () => {
        throw new Error("Connection terminated unexpectedly");
      }),
      "Fixture",
      "nothing changed",
    ),
    (error: Error) => {
      assert.ok(error instanceof CommitNotConfirmed);
      assert.equal(
        error.message,
        "Fixture commit was not confirmed and may or may not have taken effect: Connection terminated unexpectedly",
      );
      return true;
    },
  );
  // The two limits a transaction runs under are told apart by their codes.
  assert.equal(sqlTimeout({ code: "57014" }), "statement");
  assert.equal(sqlTimeout({ code: "55P03" }), "lock");
  assert.equal(sqlTimeout({ code: "40001" }), null);
  assert.equal(sqlTimeout(new Error("57014")), null);
  assert.equal(sqlTimeout(null), null);
});

test("the admission gate reads the serving views the Home reader reads", () => {
  // The reader keeps its list private. It is read here from the reader's own
  // source, as syntax, so the copy the gate reads cannot drift from it unseen.
  const readerPath = "src/lib/home/preview/ecl-projection-bundle.ts";
  const source = ts.createSourceFile(
    readerPath,
    readFileSync(path.join(REPO_ROOT, readerPath), "utf8"),
    ts.ScriptTarget.Latest,
    true,
  );
  const lists: string[][] = [];
  const visit = (node: ts.Node): void => {
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.name.text === "HOME_SERVING_VIEWS" &&
      node.initializer
    ) {
      let value: ts.Expression = node.initializer;
      while (ts.isAsExpression(value)) value = value.expression;
      assert.ok(ts.isArrayLiteralExpression(value));
      lists.push(
        value.elements.map((element) => {
          assert.ok(ts.isStringLiteral(element));
          return element.text;
        }),
      );
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  assert.equal(lists.length, 1, "the reader declares its serving views once");
  assert.ok(lists[0].length > 0);
  assert.deepEqual([...HOME_SERVING_VIEWS], lists[0]);
});

test("the admission workflow runs when a file this test loads or reads changes", () => {
  assertWorkflowTriggersCover([
    "datasets/tenant-inputs/tenant-input-registry.json",
    "src/lib/home/preview/ecl-projection-bundle.ts",
  ]);
});
