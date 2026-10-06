import { readFileSync } from "node:fs";
import path from "node:path";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function validateNdaLabContactProof(contract, run) {
  assert(contract && run && ["dry_run", "apply"].includes(contract.mode), "Invalid contact job contract");
  assert(run.status === "Succeeded" && run.ok === true, "Contact operator did not succeed");
  assert(run.restored?.restored === true && run.restored?.idleVerification?.idleVerified === true &&
    run.restored.idleVerification.problems?.length === 0, "Contact operator idle restore is unverified");
  assert(run.proof?.extracted === true && run.proof.extractDir, "Contact proof bundle is missing");
  const summary = JSON.parse(readFileSync(path.join(run.proof.extractDir,
    "source-nda-lab-contact-job", "proof-manifest.json"), "utf8"));
  assert(summary.schemaVersion === 1 && summary.event === "source_nda_lab_contact_intake_proof" &&
    summary.mode === contract.mode && summary.status === "succeeded", "Contact proof identity mismatch");
  assert(summary.contract?.tenantKey === "meridian-health" &&
    summary.contract.inputSha256 === contract.inputSha256 &&
    summary.contract.inputSourceVersion === "v1" &&
    summary.contract.runId === contract.runId &&
    summary.contract.imageDigest === contract.imageDigest,
  "Contact proof scope mismatch");
  assert(summary.expectedCount === 4 && summary.validatedCount === 4 &&
    Number.isInteger(summary.inserted) && summary.inserted >= 0 && summary.inserted <= 4,
  "Contact proof count mismatch");
  assert(summary.authority?.syntheticLabOnly === true &&
    summary.authority.contactApprovalsWritten === false &&
    summary.authority.suppliersContacted === false && summary.authority.emailsSent === false,
  "Contact proof overstates authority");
  if (contract.mode === "dry_run") {
    assert(summary.committed === false && summary.inserted === 0, "Dry run wrote contacts");
  } else {
    assert(summary.committed === true && /^https:\/\//.test(summary.blobProofLocation),
      "Apply lacks committed Blob proof");
  }
  return summary;
}

if (process.argv[1]?.endsWith("validate-nda-lab-contact-proof.mjs")) {
  try {
    assert(process.argv.length === 4, "Expected contract and operator summary paths");
    const contract = JSON.parse(readFileSync(process.argv[2], "utf8"));
    const run = JSON.parse(readFileSync(process.argv[3], "utf8"));
    const summary = validateNdaLabContactProof(contract, run);
    console.log(`Lab contact proof passed: ${summary.mode}, ${summary.validatedCount} synthetic contacts`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Contact proof validation failed");
    process.exitCode = 1;
  }
}
