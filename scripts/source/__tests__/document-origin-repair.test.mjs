import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  validateOriginRepairPlan,
  compareOriginBeforeImages,
  originRepairInputs,
  verifyOriginDelegationBytes,
  originPrivateProofLocation,
  verifyOriginCodeCertificate,
  verifyOriginRuntimeWitness,
  verifyOriginExecutionBinding,
} from "../document-origin-repair.mjs";

const before = {
  dataset_version: "dataset-test",
  synthetic_policy: "synthetic_demo_only_not_client_truth",
  kept: "original",
};
const plan = () => ({
  operation: "metadata_only_origin_repair",
  tenant_key: "tenant-test",
  contract_id: "contract-test",
  dataset_version: "dataset-test",
  expectedUpdatedRows: 1,
  proposedManifestRows: 1,
  proposedManifestSha256: "a".repeat(64),
  mutableRelation: "doc.file",
  mutableColumns: ["metadata_json"],
  fullPackageReload: false,
  targets: [
    {
      tenant_key: "tenant-test",
      contract_ref: "contract-test",
      file_id: "file-test",
      expected_content_sha256: "b".repeat(64),
      expected_load_run_id: "run-test",
      expected_metadata_json: before,
      proposed_metadata_json: {
        ...before,
        source_basis: "declared_synthetic_manifest",
        upstream_source_system: "Synthetic contract register",
        source_manifest_sha256: "a".repeat(64),
        source_origin_review_state: "synthetic_origin_pending_review",
      },
    },
  ],
});
const rows = () => [
  {
    tenant_key: "tenant-test",
    contract_ref: "contract-test",
    file_id: "file-test",
    content_sha256: "b".repeat(64),
    load_run_id: "run-test",
    metadata_json: before,
  },
];

test("accepts only the positively scoped metadata change", () => {
  assert.equal(validateOriginRepairPlan(plan()).targets.length, 1);
  assert.deepEqual(compareOriginBeforeImages(plan(), rows()), []);
});
for (const [label, mutate] of [
  [
    "scope",
    (p) => {
      p.targets[0].contract_ref = "other-contract";
    },
  ],
  [
    "count",
    (p) => {
      p.expectedUpdatedRows = 2;
    },
  ],
  [
    "duplicate identity",
    (p) => {
      p.targets.push(p.targets[0]);
      p.expectedUpdatedRows = 2;
      p.proposedManifestRows = 2;
    },
  ],
  [
    "column expansion",
    (p) => {
      p.mutableColumns.push("content_sha256");
    },
  ],
  [
    "original metadata removal",
    (p) => {
      delete p.targets[0].proposed_metadata_json.kept;
    },
  ],
  [
    "forged reviewed state",
    (p) => {
      p.targets[0].proposed_metadata_json.source_origin_review_state =
        "client_approved";
    },
  ],
  [
    "financial addition",
    (p) => {
      p.targets[0].proposed_metadata_json.annual_value = 100;
    },
  ],
  [
    "connection claim",
    (p) => {
      p.targets[0].proposed_metadata_json.upstream_source_system = "SAP";
    },
  ],
])
  test(`refuses ${label}`, () => {
    const p = plan();
    mutate(p);
    assert.throws(() => validateOriginRepairPlan(p));
  });

test("before-image comparison ignores JSON key order, not value drift", () => {
  const r = rows();
  r[0].metadata_json = {
    kept: "original",
    synthetic_policy: before.synthetic_policy,
    dataset_version: before.dataset_version,
  };
  assert.deepEqual(compareOriginBeforeImages(plan(), r), []);
  r[0].metadata_json.kept = "changed";
  assert.equal(compareOriginBeforeImages(plan(), r).length, 1);
});
test("refuses missing rows, changed content, changed load runs and cross-tenant rows", () => {
  assert.equal(compareOriginBeforeImages(plan(), []).length, 1);
  for (const field of [
    "content_sha256",
    "load_run_id",
    "tenant_key",
    "contract_ref",
  ]) {
    const r = rows();
    r[0][field] = "changed";
    assert.equal(compareOriginBeforeImages(plan(), r).length, 1);
  }
});

function approvedEnv() {
  const hash = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");
  const csv =
    "tenant_key,dataset_version,contract_id,source_file_id,source_system,source_owner\ntenant-test,dataset-test,contract-test,file-test,Synthetic contract register,Contract Ops\n";
  const p = plan();
  p.proposedManifestSha256 = hash(csv);
  Object.assign(p.targets[0].proposed_metadata_json, {
    source_manifest_sha256: hash(csv),
    upstream_source_owner: "Contract Ops",
  });
  const json = JSON.stringify(p);
  const approval = {
    status: "approved_with_execution_conditions",
    decisionId: "delegated-test",
    decisionMaker: "Delegated reviewer",
    authorityFile: "private-authority",
    planSha256: hash(json),
    manifestSha256: hash(csv),
    tenantKey: p.tenant_key,
    contractId: p.contract_id,
    datasetVersion: p.dataset_version,
    expectedUpdatedRows: 1,
    mutableRelation: "doc.file",
    mutableColumns: ["metadata_json"],
    approvedCodeGitSha: "c".repeat(40),
    approvedImageDigest: `sha256:${"d".repeat(64)}`,
  };
  return {
    SOURCE_ORIGIN_MODE: "apply",
    SOURCE_ORIGIN_MODE_TOKEN: "SOURCE_ORIGIN_APPLY",
    SOURCE_ORIGIN_PLAN_SECRET: Buffer.from(json).toString("base64"),
    SOURCE_ORIGIN_MANIFEST_SECRET: Buffer.from(csv).toString("base64"),
    SOURCE_ORIGIN_APPROVAL_SECRET: Buffer.from(
      JSON.stringify(approval),
    ).toString("base64"),
    SOURCE_ORIGIN_RUN_ID: "test-run",
    SOURCE_ORIGIN_JOB_NAME: "test-job",
    ACA_JOB_NAME: "test-job",
    SOURCE_ORIGIN_OPERATOR: "fixture",
    SOURCE_ORIGIN_GIT_SHA: approval.approvedCodeGitSha,
    SOURCE_ORIGIN_IMAGE_DIGEST: approval.approvedImageDigest,
    SOURCE_ORIGIN_BUILD_VERSION: "test-v1",
    SOURCE_ORIGIN_IDEMPOTENCY_KEY: "test-idempotency",
  };
}
test("binds exact approval, manifest declarations and reviewed code/runtime before DB use", () => {
  assert.equal(originRepairInputs(approvedEnv()).plan.targets.length, 1);
});

function certifiedFixture() {
  const hash = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");
  const authorityBytes = Buffer.from(
    JSON.stringify({
      contract_version: "nexus-delegated-approval-authority/v1",
      authority_id: "authority-test",
      status: "active",
      source_message_independently_read: true,
      actor: { kind: "delegated_agent", session_id: "manager-test" },
      human_authorization_reference: {
        thread_id: "manager-test",
        text_sha256: hash("fixture authorization"),
      },
      human_authorization_text: "fixture authorization",
      valid_from: "2026-01-01T00:00:00Z",
      expires_at: null,
      scope: { allowed_operations: ["metadata_repair"] },
    }),
  );
  const decisionBytes = Buffer.from(
    JSON.stringify({
      decisionId: "decision-test",
      status: "approved_with_execution_conditions",
      decidedAt: "2026-01-02T00:00:00Z",
      independentClientOrFinanceAttestation: false,
    }),
  );
  const trust = {
    contract_version: "source-document-origin-trust/v1",
    status: "active",
    authority_id: "authority-test",
    authority_sha256: hash(authorityBytes),
    decision_id: "decision-test",
    decision_sha256: hash(decisionBytes),
  };
  return {
    authorityBytes,
    decisionBytes,
    trust,
    now: Date.parse("2026-01-03T00:00:00Z"),
  };
}
test("verifies exact independently pinned authority and conditional decision bytes", () => {
  const f = certifiedFixture();
  assert.equal(
    verifyOriginDelegationBytes(
      f.authorityBytes,
      f.decisionBytes,
      f.trust,
      f.now,
    ).decision.decisionId,
    "decision-test",
  );
});
test("matching self-issued metadata receipt cannot certify its own authority", () => {
  const f = certifiedFixture();
  assert.throws(
    () => verifyOriginDelegationBytes(f.authorityBytes, f.decisionBytes),
    /byte hash/,
  );
});
for (const field of ["authorityBytes", "decisionBytes"])
  test(`refuses tampered ${field} even when its JSON meaning is unchanged`, () => {
    const f = certifiedFixture();
    f[field] = Buffer.concat([f[field], Buffer.from("\n")]);
    assert.throws(
      () =>
        verifyOriginDelegationBytes(
          f.authorityBytes,
          f.decisionBytes,
          f.trust,
          f.now,
        ),
      /byte hash/,
    );
  });
test("refuses revoked trust and future decisions", () => {
  const f = certifiedFixture();
  assert.throws(
    () =>
      verifyOriginDelegationBytes(
        f.authorityBytes,
        f.decisionBytes,
        { ...f.trust, status: "revoked" },
        f.now,
      ),
    /current/i,
  );
  assert.throws(
    () =>
      verifyOriginDelegationBytes(
        f.authorityBytes,
        f.decisionBytes,
        f.trust,
        Date.parse("2026-01-01T00:00:00Z"),
      ),
    /current/i,
  );
});
test("restricts raw proof reads to authenticated private account/path without inline credentials", () => {
  const base =
    "https://stabarvaprivatedplab001.blob.core.windows.net/ecl-synthetic-intake/operator-proof/source-origin-repair/abc/plan.json";
  assert.ok(originPrivateProofLocation(base, "data").endsWith("plan.json"));
  for (const uri of [
    base + "?sig=secret",
    base.replace("stabarvaprivatedplab001", "otheraccount"),
    base.replace("/source-origin-repair/", "/other/"),
    base.replace("/abc/", "/%2e%2e/"),
    base.replace("https:", "http:"),
  ])
    assert.throws(() => originPrivateProofLocation(uri, "data"));
});

test("code certification is independently pinned and covers every declared helper/dependency fingerprint", () => {
  const hash = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");
  const fingerprints = {
    "operator.mjs": "a".repeat(64),
    "helper.json": "b".repeat(64),
    "package-lock.json": "c".repeat(64),
  };
  const grant = {
    authority_sha256: "d".repeat(64),
    decision_sha256: "e".repeat(64),
  };
  const bytes = Buffer.from(
    JSON.stringify({
      contract_version: "source-origin-code-certificate/v1",
      status: "active",
      review_id: "review-test",
      ...grant,
      runtime_policy: "repo_owned_current_main",
      fingerprints,
    }),
  );
  const trust = {
    contract_version: "source-origin-execution-trust/v1",
    status: "active",
    certificate_sha256: hash(bytes),
  };
  assert.equal(
    verifyOriginCodeCertificate(bytes, trust, fingerprints, grant).review_id,
    "review-test",
  );
  assert.throws(
    () =>
      verifyOriginCodeCertificate(
        bytes,
        { ...trust, status: "not_certified" },
        fingerprints,
        grant,
      ),
    /certification/,
  );
  assert.throws(
    () =>
      verifyOriginCodeCertificate(
        Buffer.concat([bytes, Buffer.from(" ")]),
        trust,
        fingerprints,
        grant,
      ),
    /certification/,
  );
  assert.throws(
    () =>
      verifyOriginCodeCertificate(
        bytes,
        trust,
        { ...fingerprints, "helper.json": "f".repeat(64) },
        grant,
      ),
    /closure/,
  );
});
test("requires actual main template, serving revision, both workers and operator execution at one digest", () => {
  const meta = {
    imageDigest: `sha256:${"a".repeat(64)}`,
    gitSha: "b".repeat(40),
    runId: "run-test",
  };
  const image = `acrabarvalab001.azurecr.io/abarva/web@${meta.imageDigest}`;
  const witness = {
    templateImage: image,
    revisionImage: image,
    operatorImage: image,
    trafficWeight: 100,
    trafficRevisionCount: 1,
    healthState: "Healthy",
    active: true,
    revisionName: "web--mbbbbbbbb",
    mainCommitSha: meta.gitSha,
    mainDeploySucceeded: true,
    operatorExecutionName: "execution-test",
    operatorRunId: meta.runId,
    workerImages: {
      "job-abarva-deliv-worker": image,
      "job-abarva-deliv-worker-event": image,
    },
  };
  assert.equal(verifyOriginRuntimeWitness(witness, meta), witness);
  for (const patch of [
    { templateImage: "tag" },
    { revisionImage: "tag" },
    { operatorImage: "tag" },
    { trafficWeight: 90 },
    { trafficRevisionCount: 2 },
    { healthState: "Unhealthy" },
    { active: false },
    { mainDeploySucceeded: false },
    { mainCommitSha: "f".repeat(40) },
    { operatorRunId: "other" },
    { workerImages: { "job-abarva-deliv-worker": image } },
  ])
    assert.throws(
      () => verifyOriginRuntimeWitness({ ...witness, ...patch }, meta),
      /invariant/,
    );
});
test("sealed execution request cannot change mode, run, idempotency, scope or reviewed code", () => {
  const hash = (value) =>
    crypto.createHash("sha256").update(value).digest("hex");
  const e = approvedEnv();
  const inputs = originRepairInputs(e);
  inputs.delegationProof = {
    authoritySha256: "a".repeat(64),
    decisionSha256: "b".repeat(64),
  };
  const code = { "entry.mjs": "c".repeat(64) };
  const certificateHash = "d".repeat(64);
  const binding = {
    contract_version: "source-origin-execution-binding/v1",
    state: "manager_reviewed",
    decision_sha256: inputs.delegationProof.decisionSha256,
    authority_sha256: inputs.delegationProof.authoritySha256,
    plan_sha256: inputs.planSha256,
    manifest_sha256: inputs.plan.proposedManifestSha256,
    code_certificate_sha256: certificateHash,
    code_fingerprints: code,
    tenant_key: inputs.plan.tenant_key,
    contract_id: inputs.plan.contract_id,
    dataset_version: inputs.plan.dataset_version,
    target_count: 1,
    git_sha: inputs.meta.gitSha,
    image_digest: inputs.meta.imageDigest,
    job_name: inputs.meta.jobName,
    run_id: inputs.meta.runId,
    idempotency_key: inputs.meta.idempotencyKey,
    mode: inputs.mode,
    actor_session_id: "01a11323-f628-7870-95b6-d8c00b50bd27",
    preflight_proof_uri:
      "https://stabarvaprivatedplab001.blob.core.windows.net/ecl-synthetic-intake/operator-proof/source-origin-repair/fixture/preflight.json",
    preflight_proof_sha256: "e".repeat(64),
  };
  const bytes = Buffer.from(JSON.stringify(binding));
  assert.equal(
    verifyOriginExecutionBinding(
      bytes,
      hash(bytes),
      inputs,
      certificateHash,
      code,
    ).target_count,
    1,
  );
  for (const patch of [
    { mode: "restore" },
    { run_id: "other" },
    { idempotency_key: "other" },
    { contract_id: "other" },
    { target_count: 2 },
    { code_fingerprints: {} },
    { image_digest: `sha256:${"f".repeat(64)}` },
  ]) {
    const altered = Buffer.from(JSON.stringify({ ...binding, ...patch }));
    assert.throws(
      () =>
        verifyOriginExecutionBinding(
          altered,
          hash(altered),
          inputs,
          certificateHash,
          code,
        ),
      /binding/,
    );
  }
});
for (const [label, mutate] of [
  [
    "changed plan",
    (e) => {
      e.SOURCE_ORIGIN_PLAN_SECRET = Buffer.from(
        JSON.stringify(plan()),
      ).toString("base64");
    },
  ],
  [
    "changed manifest",
    (e) => {
      e.SOURCE_ORIGIN_MANIFEST_SECRET =
        Buffer.from("altered").toString("base64");
    },
  ],
  [
    "changed runtime",
    (e) => {
      e.SOURCE_ORIGIN_IMAGE_DIGEST = `sha256:${"e".repeat(64)}`;
    },
  ],
  [
    "changed code",
    (e) => {
      e.SOURCE_ORIGIN_GIT_SHA = "e".repeat(40);
    },
  ],
  [
    "missing token",
    (e) => {
      delete e.SOURCE_ORIGIN_MODE_TOKEN;
    },
  ],
  [
    "different job",
    (e) => {
      e.ACA_JOB_NAME = "other-job";
    },
  ],
])
  test(`preflight gates refuse ${label}`, () => {
    const e = approvedEnv();
    mutate(e);
    assert.throws(() => originRepairInputs(e));
  });
