#!/usr/bin/env node
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function verifyDeployedRunEvidence({ run, artifacts, proof, runId, deployedSha, image, repository }) {
  assert.match(String(runId), /^[1-9][0-9]*$/, "Deploy run ID must be numeric");
  assert.match(deployedSha, /^[a-f0-9]{40}$/, "Deployed SHA must be complete");
  assert.match(image, /^[^\s@]+@sha256:[a-f0-9]{64}$/, "Selected image must be digest pinned");
  assert.equal(run.id, Number(runId), "Deploy run ID differs from fetched run");
  assert.equal(run.repository?.full_name, repository, "Deploy run repository differs");
  assert.equal(run.head_repository?.full_name, repository, "Deploy head repository differs");
  assert.equal(run.path, ".github/workflows/aca-main-deploy.yml", "Deploy is not the repo-owned workflow");
  assert.equal(run.head_sha, deployedSha, "Deploy head differs from selected image source");
  assert.equal(run.head_branch, "main", "Deploy did not target main");
  assert(["push", "workflow_dispatch"].includes(run.event), "Deploy event is not a main release event");
  assert.equal(run.status, "completed", "Deploy run is incomplete");
  assert.equal(run.conclusion, "success", "Deploy run did not succeed");

  assert(Array.isArray(artifacts.artifacts), "Deploy artifact response is invalid");
  assert.equal(artifacts.total_count, artifacts.artifacts.length,
    "Deploy artifact list is incomplete; refusing ambiguous evidence");
  const matches = artifacts.artifacts.filter((artifact) => artifact.name === "aca-main-deploy" &&
    artifact.expired === false && artifact.workflow_run?.id === Number(runId));
  assert.equal(matches.length, 1, "Successful deploy lacks one retained evidence artifact");
  assert(Number.isSafeInteger(matches[0].id) && matches[0].id > 0, "Deploy artifact ID is invalid");

  const digest = image.split("@")[1];
  assert.equal(proof.passed, true, "Runtime invariant proof did not pass");
  assert.deepEqual(proof.errors, [], "Runtime invariant proof contains errors");
  for (const field of ["expectedImage", "activeImage", "templateImage"]) {
    assert.equal(proof[field], image, `Runtime invariant ${field} differs`);
  }
  assert.equal(proof.activeDigest, digest, "Runtime invariant digest differs");
  assert.equal(proof.traffic?.length, 1, "Deploy proof has no sole traffic revision");
  assert.equal(proof.traffic[0].weight, 100, "Deploy proof traffic is not 100 percent");
  assert.equal(proof.traffic[0].revisionName, proof.activeRevisionName, "Deploy proof revision differs");
  assert.deepEqual(proof.workerJobs?.filter((worker) => worker.image === image && worker.passed === true)
    .map((worker) => worker.name).sort(),
  ["job-abarva-deliv-worker", "job-abarva-deliv-worker-event"], "Deploy proof workers differ");
  assert.equal(proof.workerJobs.length, 2, "Deploy proof includes an unexpected worker");
  return { deploy_run_id: String(runId), deploy_artifact_id: matches[0].id, image };
}

function cli() {
  const [runPath, artifactsPath, proofPath, runId, deployedSha, image, repository] = process.argv.slice(2);
  assert(process.argv.length === 9, "Expected run, artifacts, proof, run ID, SHA, image, repository");
  const readJson = (file) => JSON.parse(readFileSync(file, "utf8"));
  console.log(JSON.stringify(verifyDeployedRunEvidence({
    run: readJson(runPath), artifacts: readJson(artifactsPath), proof: readJson(proofPath),
    runId, deployedSha, image, repository,
  })));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(); } catch (error) {
    console.error(`TOWER_DEPLOY_EVIDENCE_FAIL\t${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
