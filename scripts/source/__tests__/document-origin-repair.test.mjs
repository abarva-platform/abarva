import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  validateOriginRepairPlan,
  compareOriginBeforeImages,
  originRepairInputs,
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
