#!/usr/bin/env node
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Every file that determines what the deployed Tower schema job executes or
// which approved candidate and current Tower pages it may inspect.
export const IMAGE_CONTRACT_PATHS = [
  "scripts/tower/tower-only-schema-lane.ts",
  "scripts/tower/verify-tower-schema-proof.mjs",
  "scripts/tower/operator-nonterminal-executions.jq",
  "scripts/tower/stage-registered-intake-partial.mjs",
  "scripts/tower/registered-intake-identity-contract.json",
  "scripts/ops/submit-aca-operator-job.mjs",
  "src/scripts/postgres-client-options.ts",
  "docs/governance/dataset-manifests/tower-registered-intake-source-assertions-20261012.json",
  "docs/governance/dataset-manifests/tower-registered-intake-source-fields-20261012.json",
  "docs/governance/NEW_DATASET_ONBOARDING_POLICY.md",
  "docs/architecture/ENTERPRISE_INFORMATION_ARCHITECTURE.md",
  "docs/architecture/CLIENT_DATA_PLANE_ARCHITECTURE.md",
  "docs/releases/records/2026-10-12-tower-only-schema-lane.md",
  "docs/releases/records/2026-10-12-tower-source-assertions-candidate.md",
  "datasets/tenant-inputs/tenant-input-registry.json",
  "supabase/migrations/20261011173000_tower_value_chain_unknown_amounts.sql",
  "supabase/migrations/20261011210000_tower_active_lifecycle_fail_closed.sql",
  "supabase/migrations/20261012133000_tower_foundations_page_key.sql",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
];

// The workflow and this guard run on the GitHub runner, not in the deployed
// image. A queued dispatch may follow unrelated main commits only if these
// runner-side controls remain unchanged from its dispatch commit.
export const RUNNER_GUARD_PATHS = [
  ".github/workflows/tower-only-schema-lab.yml",
  "scripts/tower/verify-deployed-schema-ancestor.mjs",
  "scripts/tower/verify-deployed-run-evidence.mjs",
];

const MANIFEST_IDENTITIES = [
  {
    path: "docs/governance/dataset-manifests/tower-registered-intake-source-assertions-20261012.json",
    datasetId: "tower-registered-intake-source-assertions-20261012",
  },
  {
    path: "docs/governance/dataset-manifests/tower-registered-intake-source-fields-20261012.json",
    datasetId: "tower-registered-intake-source-fields-20261012",
  },
];

function git(root, args) {
  return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
}

function gitPasses(root, args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8" });
  if (result.error) throw result.error;
  return result.status === 0;
}

function assertSha(sha, label) {
  assert.match(sha, /^[a-f0-9]{40}$/, `${label} must be a complete commit SHA`);
}

function assertUniqueManifestIdentities(root, currentMainSha) {
  const paths = git(root, ["ls-tree", "-r", "--name-only", currentMainSha, "--",
    "docs/governance/dataset-manifests"]).split("\n").filter((name) => name.endsWith(".json"));
  const byId = new Map(MANIFEST_IDENTITIES.map(({ datasetId }) => [datasetId, []]));
  for (const manifestPath of paths) {
    const manifest = JSON.parse(git(root, ["show", `${currentMainSha}:${manifestPath}`]));
    if (byId.has(manifest.dataset_id)) byId.get(manifest.dataset_id).push(manifestPath);
  }
  for (const { path: expectedPath, datasetId } of MANIFEST_IDENTITIES) {
    assert.deepEqual(byId.get(datasetId), [expectedPath],
      `Dataset manifest identity is absent or duplicated: ${datasetId}`);
  }
}

export function verifyDeployedSchemaAncestor({ root, dispatchSha, deployedShaInput = "", explicitAncestor = false }) {
  assertSha(dispatchSha, "Workflow head");
  const deployedSha = deployedShaInput || dispatchSha;
  assertSha(deployedSha, "Deployed image source");
  assert(explicitAncestor === Boolean(deployedShaInput), "Explicit ancestor mode and deployed SHA must agree");
  const currentMainSha = git(root, ["rev-parse", "refs/remotes/origin/main"]);
  assert(git(root, ["rev-parse", "HEAD"]) === dispatchSha, "Checkout differs from workflow head");
  assert(gitPasses(root, ["cat-file", "-e", `${dispatchSha}^{commit}`]) &&
    gitPasses(root, ["cat-file", "-e", `${deployedSha}^{commit}`]),
  "Workflow head or deployed SHA is not a commit");
  assert(gitPasses(root, ["merge-base", "--is-ancestor", dispatchSha, currentMainSha]),
    "Workflow head is not on current main ancestry");
  if (!explicitAncestor) {
    assert(dispatchSha === currentMainSha, "Default mode requires the current main HEAD");
  }
  assert(gitPasses(root, ["merge-base", "--is-ancestor", deployedSha, currentMainSha]),
    "Deployed SHA is not on current main ancestry");
  assert(gitPasses(root, ["diff", "--quiet", dispatchSha, currentMainSha, "--", ...RUNNER_GUARD_PATHS]),
    "Workflow or runner guard changed since dispatch");
  assert(gitPasses(root, ["diff", "--quiet", dispatchSha, currentMainSha, "--", ...IMAGE_CONTRACT_PATHS]),
    "Tower operator contract changed since workflow dispatch");
  assert(gitPasses(root, ["diff", "--quiet", deployedSha, currentMainSha, "--", ...IMAGE_CONTRACT_PATHS]),
    "Tower image contract, manifest, migration, or operator code changed since deployed SHA");
  assertUniqueManifestIdentities(root, currentMainSha);
  return { workflow_head_sha: dispatchSha, deployed_sha: deployedSha,
    current_main_sha: currentMainSha, explicit_ancestor: explicitAncestor };
}

function cli() {
  const args = new Map(process.argv.slice(2).map((arg) => {
    const match = arg.match(/^--([a-z-]+)=(.*)$/);
    assert(match, "Arguments must use --key=value");
    return [match[1], match[2]];
  }));
  assert(args.size === process.argv.length - 2, "Duplicate arguments are not allowed");
  const dispatchSha = args.get("dispatch-sha") ?? "";
  const deployedShaInput = args.get("deployed-sha") ?? "";
  const explicitAncestor = args.get("explicit-ancestor") === "true";
  assert(args.get("explicit-ancestor") === "true" || args.get("explicit-ancestor") === "false",
    "Explicit ancestor flag must be true or false");
  const result = verifyDeployedSchemaAncestor({ root: process.cwd(), dispatchSha, deployedShaInput, explicitAncestor });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { cli(); } catch (error) {
    console.error(`TOWER_DEPLOYED_ANCESTOR_FAIL\t${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}
