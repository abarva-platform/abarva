import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  IMAGE_CONTRACT_PATHS,
  verifyDeployedSchemaAncestor,
} from "../verify-deployed-schema-ancestor.mjs";

function git(root, ...args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function write(root, name, content) {
  mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
  writeFileSync(path.join(root, name), content);
}

function commit(root, message) {
  git(root, "add", ".");
  git(root, "commit", "-qm", message);
  const sha = git(root, "rev-parse", "HEAD");
  git(root, "update-ref", "refs/remotes/origin/main", sha);
  return sha;
}

test("a deployed main ancestor is allowed only while exact Tower contracts stay unchanged", () => {
  const root = mkdtempSync(path.join(os.tmpdir(), "tower-schema-ancestor-"));
  try {
    git(root, "init", "-q");
    git(root, "config", "user.email", "test@example.invalid");
    git(root, "config", "user.name", "Test");
    write(root, ".github/workflows/tower-only-schema-lab.yml", "workflow-v1\n");
    write(root, "scripts/tower/verify-deployed-schema-ancestor.mjs", "guard-v1\n");
    write(root, "scripts/tower/tower-only-schema-lane.ts", "operator-v1\n");
    write(root, "docs/governance/dataset-manifests/tower-registered-intake-source-assertions-20261012.json",
      '{"dataset_id":"tower-registered-intake-source-assertions-20261012"}\n');
    write(root, "docs/governance/dataset-manifests/tower-registered-intake-source-fields-20261012.json",
      '{"dataset_id":"tower-registered-intake-source-fields-20261012"}\n');
    const deployed = commit(root, "deployed");
    assert.equal(verifyDeployedSchemaAncestor({ root, dispatchSha: deployed }).deployed_sha, deployed);

    write(root, "src/unrelated.txt", "unrelated change\n");
    const workflowHead = commit(root, "unrelated main change");
    assert.deepEqual(verifyDeployedSchemaAncestor({ root, dispatchSha: workflowHead,
      deployedShaInput: deployed, explicitAncestor: true }), {
      workflow_head_sha: workflowHead, deployed_sha: deployed,
      current_main_sha: workflowHead, explicit_ancestor: true,
    });
    git(root, "checkout", "-q", "--detach", deployed);
    assert.throws(() => verifyDeployedSchemaAncestor({ root, dispatchSha: deployed }), /current main HEAD/);
    git(root, "checkout", "-q", "--detach", workflowHead);

    write(root, "docs/governance/dataset-manifests/duplicate.json",
      '{"dataset_id":"tower-registered-intake-source-assertions-20261012"}\n');
    const duplicateManifest = commit(root, "duplicate dataset identity");
    assert.throws(() => verifyDeployedSchemaAncestor({ root, dispatchSha: duplicateManifest,
      deployedShaInput: deployed, explicitAncestor: true }), /Dataset manifest identity is absent or duplicated/);
    rmSync(path.join(root, "docs/governance/dataset-manifests/duplicate.json"));
    commit(root, "remove duplicate dataset identity");

    write(root, "scripts/tower/tower-only-schema-lane.ts", "operator-v2\n");
    const changedContract = commit(root, "Tower operator changed");
    assert.throws(() => verifyDeployedSchemaAncestor({ root, dispatchSha: changedContract,
      deployedShaInput: deployed, explicitAncestor: true }), /Tower image contract/);

    write(root, "scripts/tower/tower-only-schema-lane.ts", "operator-v1\n");
    write(root, ".github/workflows/tower-only-schema-lab.yml", "workflow-v2\n");
    commit(root, "runner workflow changed");
    git(root, "checkout", "-q", "--detach", workflowHead);
    assert.throws(() => verifyDeployedSchemaAncestor({ root, dispatchSha: workflowHead,
      deployedShaInput: deployed, explicitAncestor: true }), /Workflow or runner guard changed/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("protected contract list includes approvals, registry, exact SQL, and image-bound operator code", () => {
  for (const path of [
    "datasets/tenant-inputs/tenant-input-registry.json",
    "docs/governance/dataset-manifests/tower-registered-intake-source-assertions-20261012.json",
    "docs/governance/dataset-manifests/tower-registered-intake-source-fields-20261012.json",
    "supabase/migrations/20261011210000_tower_active_lifecycle_fail_closed.sql",
    "supabase/migrations/20261012133000_tower_foundations_page_key.sql",
    "scripts/tower/tower-only-schema-lane.ts",
    "scripts/tower/verify-tower-schema-proof.mjs",
    "scripts/ops/submit-aca-operator-job.mjs",
    "src/scripts/postgres-client-options.ts",
    "package.json",
    "package-lock.json",
  ]) assert.ok(IMAGE_CONTRACT_PATHS.includes(path), `${path} must be protected`);
});
