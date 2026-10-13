import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyDeployedRunEvidence } from "../verify-deployed-run-evidence.mjs";

const runId = "38321937251";
const deployedSha = "4ee61f816c6fa702b86c13d1e9531c0bd5c9397f";
const image = `acr.example.invalid/abarva/web@sha256:${"a".repeat(64)}`;
const repository = "abarva-platform/abarva";
const run = {
  id: Number(runId), repository: { full_name: repository }, head_repository: { full_name: repository },
  path: ".github/workflows/aca-main-deploy.yml", head_sha: deployedSha, head_branch: "main",
  event: "push", status: "completed", conclusion: "success",
};
const artifacts = {
  total_count: 1,
  artifacts: [{ id: 123, name: "aca-main-deploy", expired: false, workflow_run: { id: Number(runId) } }],
};
const proof = {
  passed: true, errors: [], expectedImage: image, activeImage: image, templateImage: image,
  activeDigest: image.split("@")[1], activeRevisionName: "main-revision",
  traffic: [{ revisionName: "main-revision", weight: 100 }],
  workerJobs: ["job-abarva-deliv-worker", "job-abarva-deliv-worker-event"]
    .map((name) => ({ name, image, passed: true })),
};

function check(overrides = {}) {
  return verifyDeployedRunEvidence({ run: structuredClone(run), artifacts: structuredClone(artifacts),
    proof: structuredClone(proof), runId, deployedSha, image, repository, ...overrides });
}

test("successful repo-owned main deploy artifact binds the deployed SHA and digest", () => {
  assert.deepEqual(check(), { deploy_run_id: runId, deploy_artifact_id: 123, image });
  assert.deepEqual(check({ run: { ...run, event: "workflow_dispatch" } }),
    { deploy_run_id: runId, deploy_artifact_id: 123, image });
});

test("deploy evidence rejects wrong head, unrelated workflow, and failed run", () => {
  assert.throws(() => check({ run: { ...run, head_sha: "b".repeat(40) } }), /head differs/);
  assert.throws(() => check({ run: { ...run, path: ".github/workflows/other.yml" } }), /repo-owned workflow/);
  assert.throws(() => check({ run: { ...run, conclusion: "failure" } }), /did not succeed/);
  assert.throws(() => check({ run: { ...run, repository: { full_name: "other/repo" } } }), /repository differs/);
});

test("deploy evidence rejects missing, expired, incomplete, or unrelated artifacts", () => {
  assert.throws(() => check({ artifacts: { ...artifacts, artifacts: [] } }), /incomplete/);
  assert.throws(() => check({ artifacts: { total_count: 1,
    artifacts: [{ ...artifacts.artifacts[0], expired: true }] } }), /retained evidence/);
  assert.throws(() => check({ artifacts: { total_count: 1,
    artifacts: [{ ...artifacts.artifacts[0], workflow_run: { id: 1 } }] } }), /retained evidence/);
});

test("deploy evidence rejects a mismatched digest or traffic and worker proof", () => {
  assert.throws(() => check({ proof: { ...proof, expectedImage: "other" } }), /expectedImage differs/);
  assert.throws(() => check({ proof: { ...proof, activeDigest: "sha256:deadbeef" } }), /digest differs/);
  assert.throws(() => check({ proof: { ...proof, traffic: [{ revisionName: "main-revision", weight: 90 }] } }), /100 percent/);
  assert.throws(() => check({ proof: { ...proof, workerJobs: [proof.workerJobs[0]] } }), /workers differ/);
});
