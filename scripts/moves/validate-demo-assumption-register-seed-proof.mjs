// Validates the proof a demo assumption register seed run left behind, against
// the contract the dispatching workflow recorded before the run started.
//
//   node scripts/moves/validate-demo-assumption-register-seed-proof.mjs \
//     <workflow-contract.json> <operator summary.json>
//
// The operator summary is the one `npm run ops:aca-job` writes; the proof
// manifest is read from the bundle it extracted. Plain Node, no dependencies:
// the workflow runs it without installing the repository.

import { readFileSync } from "node:fs";
import path from "node:path";

export const PROOF_DIR_NAME = "moves-demo-assumption-register-seed-job";
export const PROOF_EVENT = "moves_demo_assumption_register_seed_proof";
export const DEMO_TENANT_CANONICAL_KEY = "meridian-health";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

/** Check one proof manifest against the workflow contract. */
export function validateDemoRegisterSeedProofManifest(contract, manifest) {
  assert(
    contract && ["dry_run", "apply"].includes(contract.mode),
    "Invalid seed workflow contract",
  );
  assert(
    manifest && manifest.schemaVersion === 1 && manifest.event === PROOF_EVENT,
    "Seed proof identity mismatch",
  );
  assert(
    manifest.mode === contract.mode,
    "Seed proof mode differs from the dispatch",
  );
  assert(
    manifest.status === "succeeded",
    `Seed run did not succeed: ${manifest.error ?? "unknown"}`,
  );
  const run = manifest.contract ?? {};
  assert(
    run.tenantScope === DEMO_TENANT_CANONICAL_KEY,
    "Seed proof is not scoped to the demo tenant",
  );
  assert(
    run.inputSourceVersion === contract.inputSha256 &&
      run.inputSha256 === contract.inputSha256,
    "Seed proof input hash differs from the dispatch",
  );
  assert(
    run.runId === contract.runId,
    "Seed proof run id differs from the dispatch",
  );
  assert(
    run.moveId === contract.moveId,
    "Seed proof Move differs from the seed's declared Move",
  );
  assert(
    run.imageDigest === contract.imageDigest,
    "Seed proof image digest differs from the deployed image",
  );
  assert(
    manifest.seed &&
      Number.isInteger(manifest.seed.rowCount) &&
      manifest.seed.rowCount > 0 &&
      Array.isArray(manifest.plan) &&
      manifest.plan.length === manifest.seed.rowCount,
    "Seed proof plan does not cover every seed row",
  );
  const planned = manifest.plan.reduce((sum, item) => sum + item.writes, 0);
  assert(
    manifest.qualityGate?.passed === true &&
      manifest.qualityGate.plannedWrites === planned,
    "Seed quality gate did not pass",
  );
  const writes = manifest.writes ?? {};
  assert(
    Number.isInteger(writes.total) &&
      writes.total === writes.created + writes.confirmed,
    "Seed proof write counts are inconsistent",
  );
  if (contract.mode === "dry_run") {
    assert(
      writes.total === 0 && manifest.committed === false,
      "Dry run wrote to the register",
    );
  } else {
    assert(
      writes.total === planned,
      "Apply wrote a different number of rows than it planned",
    );
    assert(
      manifest.committed === planned > 0,
      "Apply commit flag differs from its writes",
    );
    assert(
      manifest.loadApproval?.approved === true,
      "Apply ran without a load approval",
    );
    assert(manifest.validation?.passed === true, "Apply readback did not pass");
    assert(
      /^https:\/\//.test(manifest.blobProofLocation),
      "Apply lacks a Blob proof location",
    );
  }
  return manifest;
}

/** Check the operator run, then the proof manifest its bundle carried. */
export function validateDemoRegisterSeedProof(
  contract,
  run,
  readText = (file) => readFileSync(file, "utf8"),
) {
  assert(
    run && run.status === "Succeeded" && run.ok === true,
    "Seed operator job did not succeed",
  );
  assert(
    run.restored?.restored === true &&
      run.restored?.idleVerification?.idleVerified === true &&
      run.restored.idleVerification.problems?.length === 0,
    "Seed operator idle restore is unverified",
  );
  assert(
    run.proof?.extracted === true && run.proof.extractDir,
    "Seed proof bundle is missing",
  );
  const manifest = JSON.parse(
    readText(
      path.join(run.proof.extractDir, PROOF_DIR_NAME, "proof-manifest.json"),
    ),
  );
  return validateDemoRegisterSeedProofManifest(contract, manifest);
}

if (
  process.argv[1]?.endsWith("validate-demo-assumption-register-seed-proof.mjs")
) {
  try {
    assert(
      process.argv.length === 4,
      "Expected the workflow contract and the operator summary paths",
    );
    const contract = JSON.parse(readFileSync(process.argv[2], "utf8"));
    const run = JSON.parse(readFileSync(process.argv[3], "utf8"));
    const manifest = validateDemoRegisterSeedProof(contract, run);
    console.log(
      `Demo register seed proof passed: ${manifest.mode}, ${manifest.writes.total} register writes`,
    );
  } catch (error) {
    console.error(
      error instanceof Error
        ? error.message
        : "Demo register seed proof validation failed",
    );
    process.exitCode = 1;
  }
}
